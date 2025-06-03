import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

interface UploadContasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

const UploadContasModal: React.FC<UploadContasModalProps> = ({ isOpen, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'preview' | 'validating' | 'validated' | 'uploading' | 'success' | 'error'>('idle');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    const exampleData = [
      {
        nome: 'Receita Bruta',
        ordem: 1,
        simbolo: '+',
        conta_pai: null,
        ativo: 'TRUE',
        visivel: 'TRUE'
      },
      {
        nome: 'Deduções',
        ordem: 2,
        simbolo: '-',
        conta_pai: null,
        ativo: 'TRUE',
        visivel: 'TRUE'
      }
    ];

    const instructions = [
      ['Instruções para preenchimento:'],
      [''],
      ['1. nome: Nome da conta (obrigatório)'],
      ['2. ordem: Número que define a ordem de exibição (obrigatório)'],
      ['3. simbolo: Operador matemático (+, - ou =)'],
      ['4. conta_pai: ID da conta pai (opcional)'],
      ['5. ativo: Status da conta (TRUE ou FALSE)'],
      ['6. visivel: Visibilidade da conta (TRUE ou FALSE)'],
      [''],
      ['Exemplos de dados:']
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

    const wsData = XLSX.utils.json_to_sheet(exampleData);
    XLSX.utils.book_append_sheet(wb, wsData, 'Modelo');

    XLSX.writeFile(wb, 'modelo_contas_dre.xlsx');
  };

  const validateData = async (data: any[]): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];

    for (const [index, row] of data.entries()) {
      const rowNumber = index + 2;

      if (!row.nome) {
        errors.push({
          row: rowNumber,
          field: 'nome',
          value: '',
          message: 'Nome é obrigatório'
        });
      }

      if (!row.ordem || isNaN(row.ordem)) {
        errors.push({
          row: rowNumber,
          field: 'ordem',
          value: row.ordem || '',
          message: 'Ordem deve ser um número válido'
        });
      }

      if (!row.simbolo || !['+', '-', '='].includes(row.simbolo)) {
        errors.push({
          row: rowNumber,
          field: 'simbolo',
          value: row.simbolo || '',
          message: 'Símbolo deve ser +, - ou ='
        });
      }

      if (row.conta_pai) {
        const { data: contaPai } = await supabase
          .from('dre_contas')
          .select('id')
          .eq('id', row.conta_pai)
          .single();

        if (!contaPai) {
          errors.push({
            row: rowNumber,
            field: 'conta_pai',
            value: row.conta_pai,
            message: 'Conta pai não encontrada'
          });
        }
      }

      const ativo = String(row.ativo || '').trim().toLowerCase();
      if (ativo !== 'true' && ativo !== 'false') {
        errors.push({
          row: rowNumber,
          field: 'ativo',
          value: row.ativo || '',
          message: 'Ativo deve ser TRUE ou FALSE'
        });
      }

      const visivel = String(row.visivel || '').trim().toLowerCase();
      if (visivel !== 'true' && visivel !== 'false') {
        errors.push({
          row: rowNumber,
          field: 'visivel',
          value: row.visivel || '',
          message: 'Visível deve ser TRUE ou FALSE'
        });
      }
    }

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

  const handleValidate = async () => {
    setStatus('validating');
    const errors = await validateData(previewData);
    setValidationErrors(errors);
    setStatus('validated');
  };

  const handleUpload = async () => {
    setStatus('uploading');

    try {
      const formattedData = previewData.map(row => ({
        nome: row.nome,
        ordem: parseInt(row.ordem),
        simbolo: row.simbolo,
        conta_pai: row.conta_pai || null,
        ativo: String(row.ativo).trim().toLowerCase() === 'true',
        visivel: String(row.visivel).trim().toLowerCase() === 'true'
      }));

      const { error } = await supabase
        .from('dre_contas')
        .insert(formattedData);

      if (error) throw error;

      setStatus('success');
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Upload de Contas</h2>
            <p className="text-gray-600">Importe contas do DRE em massa através de uma planilha</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={downloadTemplate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
            >
              <Download size={20} />
              <span>Baixar Modelo</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
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
              <FileSpreadsheet size={64} className="mx-auto text-blue-500 mb-4" />
              <h2 className="text-xl font-semibold mb-4 text-blue-700">
                {previewData.length} registros carregados
              </h2>
              <div className="mb-6 max-h-60 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordem</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Símbolo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conta Pai</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ativo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visível</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.nome}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.ordem}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.simbolo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.conta_pai || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{String(row.ativo)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{String(row.visivel)}</td>
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
                <Check size={20} />
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
                  <Upload size={20} />
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
              <p className="text-gray-600">Por favor, não feche esta janela durante o processamento.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <Check size={64} className="mx-auto text-green-500 mb-4" />
              <h2 className="text-xl font-semibold mb-4 text-green-700">
                Importação concluída com sucesso! {previewData.length} registros foram importados.
              </h2>
              <div className="space-x-4">
                <button
                  onClick={resetForm}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Importar mais dados
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
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
      </div>
    </div>
  );
};

export default UploadContasModal;