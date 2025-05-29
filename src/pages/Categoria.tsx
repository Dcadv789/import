import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, Download, Eye, Save, Link as LinkIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import RelationshipsModal from '../components/categoria/RelationshipsModal';

interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

type ImportStatus = 'idle' | 'preview' | 'validating' | 'validated' | 'uploading' | 'success' | 'error';

const Categoria: React.FC = () => {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isRelationshipsModalOpen, setIsRelationshipsModalOpen] = useState(false);
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
      ['3. descricao: Descrição detalhada da categoria (opcional)'],
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
      const rowNumber = index + 2;

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type)) {
      setStatus('error');
      setValidationErrors([{
        row: 0,
        field: 'file',
        value: file.type,
        message: 'Formato de arquivo inválido. Por favor, envie uma planilha Excel ou CSV.'
      }]);
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        setStatus('error');
        setValidationErrors([{
          row: 0,
          field: 'file',
          value: '',
          message: 'A planilha está vazia. Por favor, verifique o arquivo e tente novamente.'
        }]);
        return;
      }

      setPreviewData(jsonData);
      setStatus('preview');
    } catch (error) {
      setStatus('error');
      setValidationErrors([{
        row: 0,
        field: 'file',
        value: '',
        message: `Erro ao processar arquivo: ${(error as Error).message}`
      }]);
    }
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

  const handleValidate = () => {
    setStatus('validating');
    const errors = validateData(previewData);
    setValidationErrors(errors);
    setStatus('validated');
  };

  const handleUpload = async () => {
    setStatus('uploading');
    setUploadProgress({ current: 0, total: previewData.length });

    try {
      const formattedData = previewData.map(row => ({
        ...row,
        tipo: String(row.tipo).trim(),
        ativo: String(row.ativo).trim().toLowerCase() === 'true',
        grupo_id: null // Campo grupo_id sempre vazio
      }));

      const { error } = await supabase
        .from('categorias')
        .insert(formattedData);

      if (error) throw error;

      setStatus('success');
      setUploadProgress({ current: previewData.length, total: previewData.length });
    } catch (error) {
      setStatus('error');
      setValidationErrors([{
        row: 0,
        field: 'upload',
        value: '',
        message: `Erro ao fazer upload: ${(error as Error).message}`
      }]);
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setValidationErrors([]);
    setPreviewData([]);
    setUploadProgress({ current: 0, total: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Importação de Categorias</h1>
          <p className="text-gray-600">
            Faça upload de uma planilha Excel ou CSV para importar dados de categorias em massa.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsRelationshipsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <LinkIcon size={20} />
            <span>Relacionamentos</span>
          </button>
          <button
            onClick={downloadTemplate}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <Download size={20} />
            <span>Baixar Planilha Modelo</span>
          </button>
        </div>
      </div>

      <div 
        className={`border-2 border-dashed rounded-lg p-10 text-center mb-8 transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          ${status === 'uploading' ? 'bg-blue-50' : ''}
          ${status === 'success' ? 'bg-green-50 border-green-500' : ''}
          ${status === 'error' ? 'bg-red-50 border-red-500' : ''}`}
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

        {status === 'idle' && (
          <>
            <FileSpreadsheet size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Arraste e solte sua planilha aqui</h2>
            <p className="text-gray-500 mb-6">ou</p>
            <button
              onClick={() => fileInputRef.current?.click()}
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

        {status === 'preview' && (
          <div className="text-center">
            <Eye size={64} className="mx-auto text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold mb-4 text-blue-700">
              {previewData.length} registros carregados
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
              onClick={handleValidate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
            >
              <Eye size={20} />
              <span>Validar Dados</span>
            </button>
          </div>
        )}

        {status === 'validating' && (
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            </div>
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Validando dados...</h2>
          </div>
        )}

        {status === 'validated' && (
          validationErrors.length === 0 ? (
            <div className="text-center">
              <Check size={64} className="mx-auto text-green-500 mb-4" />
              <h2 className="text-xl font-semibold mb-4 text-green-700">
                Validação concluída com sucesso! {previewData.length} registros prontos para importação.
              </h2>
              <button
                onClick={handleUpload}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
              >
                <Save size={20} />
                <span>Confirmar e Importar</span>
              </button>
            </div>
          ) : (
            <div className="text-center">
              <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-4 text-red-700">
                Encontrados {validationErrors.length} erros na validação
              </h2>
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
              <button
                onClick={resetForm}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )
        )}

        {status === 'uploading' && (
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            </div>
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Importando dados...</h2>
            <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` }}
              ></div>
            </div>
            <p className="text-gray-600">Por favor, não feche esta janela durante o processamento.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <Check size={64} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-4 text-green-700">
              Importação concluída com sucesso! {previewData.length} registros foram importados.
            </h2>
            <button
              onClick={resetForm}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Importar mais dados
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-4 text-red-700">
              {validationErrors[0]?.message || 'Ocorreu um erro durante o processamento.'}
            </h2>
            <button
              onClick={resetForm}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Descrição detalhada (opcional)</td>
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

      <RelationshipsModal
        isOpen={isRelationshipsModalOpen}
        onClose={() => setIsRelationshipsModalOpen(false)}
      />
    </div>
  );
};

export default Categoria;