import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, Download, Eye, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface UploadStatus {
  status: 'idle' | 'validating' | 'preview' | 'uploading' | 'success' | 'error';
  message: string;
  totalRows?: number;
  processedRows?: number;
}

interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

const Categoria: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ 
    status: 'idle', 
    message: '' 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    const exampleData = [
      {
        codigo: '001',
        nome: 'Exemplo Receita',
        descricao: 'Descrição detalhada da categoria',
        tipo: 'Receita',
        ativo: 'TRUE'
      },
      {
        codigo: '002',
        nome: 'Exemplo Despesa',
        descricao: 'Outra descrição de exemplo',
        tipo: 'Despesa',
        ativo: 'FALSE'
      }
    ];

    const instructions = [
      ['Instruções para preenchimento:'],
      [''],
      ['1. codigo: Código único da categoria (ex: 001, 002, etc)'],
      ['2. nome: Nome da categoria'],
      ['3. descricao: Descrição detalhada da categoria'],
      ['4. tipo: Deve ser "Receita" ou "Despesa"'],
      ['5. ativo: Deve ser "TRUE" ou "FALSE"'],
      [''],
      ['Exemplos de dados:']
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

    const wsData = XLSX.utils.json_to_sheet(exampleData);
    XLSX.utils.book_append_sheet(wb, wsData, 'Modelo');

    XLSX.writeFile(wb, 'modelo_categorias.xlsx');
  };

  const validateData = (data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque a primeira linha é cabeçalho e Excel começa em 1

      if (!row.codigo) {
        errors.push({
          row: rowNumber,
          field: 'codigo',
          value: '',
          message: 'Código é obrigatório'
        });
      }

      if (!row.nome) {
        errors.push({
          row: rowNumber,
          field: 'nome',
          value: '',
          message: 'Nome é obrigatório'
        });
      }

      if (!row.descricao) {
        errors.push({
          row: rowNumber,
          field: 'descricao',
          value: '',
          message: 'Descrição é obrigatória'
        });
      }

      const tipo = String(row.tipo || '').trim().toLowerCase();
      if (tipo !== 'receita' && tipo !== 'despesa') {
        errors.push({
          row: rowNumber,
          field: 'tipo',
          value: row.tipo || '',
          message: 'Tipo deve ser "Receita" ou "Despesa"'
        });
      }

      const ativo = String(row.ativo || '').trim().toLowerCase();
      if (ativo !== 'true' && ativo !== 'false') {
        errors.push({
          row: rowNumber,
          field: 'ativo',
          value: row.ativo || '',
          message: 'Ativo deve ser "TRUE" ou "FALSE"'
        });
      }
    });

    return errors;
  };

  const processFile = async (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type)) {
      setUploadStatus({
        status: 'error',
        message: 'Formato de arquivo inválido. Por favor, envie uma planilha Excel ou CSV.'
      });
      return;
    }

    setUploadStatus({
      status: 'validating',
      message: 'Validando dados...'
    });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        setUploadStatus({
          status: 'error',
          message: 'A planilha está vazia. Por favor, verifique o arquivo e tente novamente.'
        });
        return;
      }

      const errors = validateData(jsonData);
      setValidationErrors(errors);

      if (errors.length > 0) {
        setUploadStatus({
          status: 'error',
          message: `Encontrados ${errors.length} erros na planilha. Por favor, corrija os erros e tente novamente.`
        });
        return;
      }

      const formattedData = jsonData.map(row => ({
        ...row,
        tipo: String(row.tipo).trim(),
        ativo: String(row.ativo).trim().toLowerCase() === 'true'
      }));

      setPreviewData(formattedData);
      setUploadStatus({
        status: 'preview',
        message: 'Dados validados com sucesso! Revise os dados antes de fazer o upload.',
        totalRows: formattedData.length
      });
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setUploadStatus({
        status: 'error',
        message: `Erro ao processar arquivo: ${(error as Error).message}`
      });
    }
  };

  const handleUpload = async () => {
    setUploadStatus({
      status: 'uploading',
      message: 'Importando dados para o Supabase...',
      totalRows: previewData.length,
      processedRows: 0
    });

    try {
      const { error } = await supabase
        .from('categorias')
        .insert(previewData);

      if (error) throw error;

      setUploadStatus({
        status: 'success',
        message: `Importação concluída com sucesso! ${previewData.length} registros foram importados.`,
        totalRows: previewData.length,
        processedRows: previewData.length
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setUploadStatus({
        status: 'error',
        message: `Erro ao fazer upload: ${(error as Error).message}`
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Importação de Categorias</h1>
        <p className="text-gray-600">
          Faça upload de uma planilha Excel ou CSV para importar dados de categorias em massa.
        </p>
        <button
          onClick={downloadTemplate}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
        >
          <Download size={20} />
          <span>Baixar Planilha Modelo</span>
        </button>
      </div>

      <div 
        className={`border-2 border-dashed rounded-lg p-10 text-center mb-8 transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          ${uploadStatus.status === 'uploading' ? 'bg-blue-50' : ''}
          ${uploadStatus.status === 'success' ? 'bg-green-50 border-green-500' : ''}
          ${uploadStatus.status === 'error' ? 'bg-red-50 border-red-500' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv"
          className="hidden"
        />

        {uploadStatus.status === 'idle' && (
          <>
            <FileSpreadsheet size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Arraste e solte sua planilha aqui</h2>
            <p className="text-gray-500 mb-6">ou</p>
            <button
              onClick={triggerFileInput}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
            >
              <Upload size={20} />
              <span>Selecionar arquivo</span>
            </button>
            <p className="mt-4 text-sm text-gray-500">
              Formatos aceitos: .xlsx, .xls, .csv
            </p>
          </>
        )}

        {uploadStatus.status === 'validating' && (
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            </div>
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Validando dados...</h2>
          </div>
        )}

        {uploadStatus.status === 'preview' && (
          <div className="text-center">
            <Eye size={64} className="mx-auto text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold mb-4 text-blue-700">
              {previewData.length} registros prontos para importação
            </h2>
            <div className="mb-6 max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ativo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.codigo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.nome}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.tipo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {String(row.ativo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 5 && (
                <p className="text-sm text-gray-500 mt-2">
                  Mostrando 5 de {previewData.length} registros
                </p>
              )}
            </div>
            <button
              onClick={handleUpload}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
            >
              <Save size={20} />
              <span>Confirmar e Importar</span>
            </button>
          </div>
        )}

        {uploadStatus.status === 'uploading' && (
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            </div>
            <h2 className="text-xl font-semibold mb-4 text-blue-700">{uploadStatus.message}</h2>
            {uploadStatus.totalRows && (
              <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ 
                    width: `${Math.round((uploadStatus.processedRows || 0) / uploadStatus.totalRows * 100)}%` 
                  }}
                ></div>
              </div>
            )}
            <p className="text-gray-600">Por favor, não feche esta janela durante o processamento.</p>
          </div>
        )}

        {uploadStatus.status === 'success' && (
          <div className="text-center">
            <Check size={64} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-4 text-green-700">{uploadStatus.message}</h2>
            <button
              onClick={() => setUploadStatus({ status: 'idle', message: '' })}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Importar mais dados
            </button>
          </div>
        )}

        {uploadStatus.status === 'error' && (
          <div className="text-center">
            <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-4 text-red-700">{uploadStatus.message}</h2>
            {validationErrors.length > 0 && (
              <div className="mb-6 max-h-60 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Erro</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {validationErrors.map((error, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{error.row}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{error.field}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{error.value}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              onClick={() => setUploadStatus({ status: 'idle', message: '' })}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Estrutura da Planilha</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coluna</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exemplo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">codigo</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Código único da categoria</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">001</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">nome</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Nome da categoria</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Vendas</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">descricao</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Descrição detalhada</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Receitas com vendas</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">tipo</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Receita ou Despesa</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Receita</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">ativo</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Status da categoria</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">TRUE</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Categoria;