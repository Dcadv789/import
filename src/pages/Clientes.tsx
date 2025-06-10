import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, Download, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import StructureTable from '../components/cliente/StructureTable';
import PreviewTable from '../components/cliente/PreviewTable';

interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

interface ValidationResult {
  errors: ValidationError[];
  duplicates: any[];
  validRecords: any[];
}

type ImportStatus = 'idle' | 'preview' | 'validating' | 'validated' | 'uploading' | 'success' | 'error';

const Clientes: React.FC = () => {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({ errors: [], duplicates: [], validRecords: [] });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    const exampleData = [
      {
        razao_social: 'Empresa Exemplo LTDA',
        nome_fantasia: 'Empresa Exemplo',
        cnpj: '12345678000190',
        empresa_cnpj: '98765432000121',
        ativo: 'TRUE'
      }
    ];

    const instructions = [
      ['Instruções para preenchimento:'],
      [''],
      ['1. razao_social: Razão social do cliente'],
      ['2. nome_fantasia: Nome fantasia do cliente'],
      ['3. cnpj: CNPJ do cliente'],
      ['4. empresa_cnpj: CNPJ da empresa relacionada'],
      ['5. ativo: Deve ser "TRUE" ou "FALSE"'],
      [''],
      ['Exemplos de dados:']
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

    const wsData = XLSX.utils.json_to_sheet(exampleData);
    XLSX.utils.book_append_sheet(wb, wsData, 'Modelo');

    XLSX.writeFile(wb, 'modelo_clientes.xlsx');
  };

  const generateClientCode = async (): Promise<string> => {
    const { data: lastClient } = await supabase
      .from('clientes')
      .select('codigo')
      .order('codigo', { ascending: false })
      .limit(1)
      .single();

    if (!lastClient) {
      return 'C0001';
    }

    const lastNumber = parseInt(lastClient.codigo.substring(1));
    const newNumber = lastNumber + 1;
    return `C${String(newNumber).padStart(4, '0')}`;
  };

  const validateData = async (data: any[]): Promise<ValidationResult> => {
    const errors: ValidationError[] = [];
    const duplicates: any[] = [];
    const validRecords: any[] = [];
    const processedCnpjs = new Set<string>();

    // Primeiro, buscar todos os CNPJs já cadastrados no banco
    const { data: existingClients } = await supabase
      .from('clientes')
      .select('cnpj, razao_social');

    const existingCnpjs = new Set(existingClients?.map(client => client.cnpj) || []);

    for (const [index, row] of data.entries()) {
      const rowNumber = index + 2;
      let hasErrors = false;

      // Validações básicas
      if (!row.razao_social) {
        errors.push({
          row: rowNumber,
          field: 'razao_social',
          value: '',
          message: 'Razão social é obrigatória'
        });
        hasErrors = true;
      }

      if (!row.cnpj) {
        errors.push({
          row: rowNumber,
          field: 'cnpj',
          value: '',
          message: 'CNPJ do cliente é obrigatório'
        });
        hasErrors = true;
      }

      if (!row.empresa_cnpj) {
        errors.push({
          row: rowNumber,
          field: 'empresa_cnpj',
          value: '',
          message: 'CNPJ da empresa é obrigatório'
        });
        hasErrors = true;
      }

      const ativo = String(row.ativo || '').trim().toLowerCase();
      if (ativo !== 'true' && ativo !== 'false') {
        errors.push({
          row: rowNumber,
          field: 'ativo',
          value: row.ativo || '',
          message: 'Ativo deve ser "TRUE" ou "FALSE"'
        });
        hasErrors = true;
      }

      // Validar se a empresa existe (apenas se não há erros básicos)
      if (!hasErrors && row.empresa_cnpj) {
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id')
          .eq('cnpj', row.empresa_cnpj)
          .single();

        if (!empresa) {
          errors.push({
            row: rowNumber,
            field: 'empresa_cnpj',
            value: row.empresa_cnpj,
            message: 'Empresa não encontrada'
          });
          hasErrors = true;
        }
      }

      // Verificar duplicatas
      if (!hasErrors && row.cnpj) {
        // Verificar se já existe no banco de dados
        if (existingCnpjs.has(row.cnpj)) {
          const existingClient = existingClients?.find(client => client.cnpj === row.cnpj);
          duplicates.push({
            ...row,
            rowNumber,
            existingRazaoSocial: existingClient?.razao_social
          });
        }
        // Verificar duplicatas na própria planilha
        else if (processedCnpjs.has(row.cnpj)) {
          errors.push({
            row: rowNumber,
            field: 'cnpj',
            value: row.cnpj,
            message: 'CNPJ duplicado na planilha'
          });
          hasErrors = true;
        }
        // Se não há duplicatas e não há erros, é um registro válido
        else {
          processedCnpjs.add(row.cnpj);
          validRecords.push({ ...row, rowNumber });
        }
      }
    }

    return { errors, duplicates, validRecords };
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
      setValidationResult({ 
        errors: [{
          row: 0,
          field: 'file',
          value: file.type,
          message: 'Formato de arquivo inválido. Por favor, envie uma planilha Excel ou CSV.'
        }],
        duplicates: [],
        validRecords: []
      });
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        setStatus('error');
        setValidationResult({
          errors: [{
            row: 0,
            field: 'file',
            value: '',
            message: 'A planilha está vazia. Por favor, verifique o arquivo e tente novamente.'
          }],
          duplicates: [],
          validRecords: []
        });
        return;
      }

      setPreviewData(jsonData);
      setStatus('preview');
    } catch (error) {
      setStatus('error');
      setValidationResult({
        errors: [{
          row: 0,
          field: 'file',
          value: '',
          message: `Erro ao processar arquivo: ${(error as Error).message}`
        }],
        duplicates: [],
        validRecords: []
      });
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
    const result = await validateData(previewData);
    setValidationResult(result);
    setStatus('validated');
  };

  const handleUpload = async () => {
    setStatus('uploading');
    setUploadProgress({ current: 0, total: validationResult.validRecords.length });

    try {
      for (const [index, row] of validationResult.validRecords.entries()) {
        // Gerar código único para o cliente
        const codigo = await generateClientCode();

        // Buscar ID da empresa
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id')
          .eq('cnpj', row.empresa_cnpj)
          .single();

        const { error } = await supabase
          .from('clientes')
          .insert({
            codigo,
            razao_social: row.razao_social,
            nome_fantasia: row.nome_fantasia || null,
            cnpj: row.cnpj,
            empresa_id: empresa?.id,
            ativo: String(row.ativo).trim().toLowerCase() === 'true'
          });

        if (error) throw error;

        setUploadProgress(prev => ({ ...prev, current: index + 1 }));
      }

      setStatus('success');
    } catch (error) {
      setStatus('error');
      setValidationResult({
        ...validationResult,
        errors: [{
          row: 0,
          field: 'upload',
          value: '',
          message: `Erro ao fazer upload: ${(error as Error).message}`
        }]
      });
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setValidationResult({ errors: [], duplicates: [], validRecords: [] });
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Importação de Clientes</h1>
          <p className="text-gray-600">
            Faça upload de uma planilha Excel ou CSV para importar dados de clientes em massa.
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
        >
          <Download size={20} />
          <span>Baixar Planilha Modelo</span>
        </button>
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
          <PreviewTable
            data={previewData}
            onValidate={handleValidate}
          />
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
          <>
            {/* Mostrar informações sobre duplicatas */}
            {validationResult.duplicates.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <Info size={20} className="text-yellow-600 mr-2" />
                  <h3 className="text-lg font-semibold text-yellow-800">
                    Clientes já cadastrados encontrados
                  </h3>
                </div>
                <p className="text-yellow-700 mb-4">
                  {validationResult.duplicates.length} cliente(s) já estão cadastrados no sistema e serão ignorados na importação:
                </p>
                <div className="max-h-40 overflow-y-auto">
                  <table className="min-w-full divide-y divide-yellow-200">
                    <thead className="bg-yellow-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-yellow-700 uppercase">Linha</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-yellow-700 uppercase">CNPJ</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-yellow-700 uppercase">Razão Social (Planilha)</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-yellow-700 uppercase">Razão Social (Cadastrado)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-yellow-200">
                      {validationResult.duplicates.map((duplicate, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-yellow-800">{duplicate.rowNumber}</td>
                          <td className="px-4 py-2 text-sm text-yellow-800">{duplicate.cnpj}</td>
                          <td className="px-4 py-2 text-sm text-yellow-800">{duplicate.razao_social}</td>
                          <td className="px-4 py-2 text-sm text-yellow-800">{duplicate.existingRazaoSocial}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Mostrar erros se houver */}
            {validationResult.errors.length > 0 && (
              <div className="mb-6">
                <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-semibold mb-4 text-red-700">
                  Encontrados {validationResult.errors.length} erros na validação
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
                      {validationResult.errors.map((error, index) => (
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
                  Corrigir erros e tentar novamente
                </button>
              </div>
            )}

            {/* Mostrar resumo e botão de importação se há registros válidos */}
            {validationResult.errors.length === 0 && validationResult.validRecords.length > 0 && (
              <div className="text-center">
                <Check size={64} className="mx-auto text-green-500 mb-4" />
                <h2 className="text-xl font-semibold mb-4 text-green-700">
                  Validação concluída com sucesso!
                </h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="text-green-800">
                    <p className="text-lg font-semibold mb-2">Resumo da importação:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white rounded p-3">
                        <p className="font-medium">Total na planilha:</p>
                        <p className="text-2xl font-bold text-blue-600">{previewData.length}</p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="font-medium">Já cadastrados:</p>
                        <p className="text-2xl font-bold text-yellow-600">{validationResult.duplicates.length}</p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="font-medium">Serão importados:</p>
                        <p className="text-2xl font-bold text-green-600">{validationResult.validRecords.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleUpload}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
                >
                  <Upload size={20} />
                  <span>Importar {validationResult.validRecords.length} novos clientes</span>
                </button>
              </div>
            )}

            {/* Caso não há registros válidos para importar */}
            {validationResult.errors.length === 0 && validationResult.validRecords.length === 0 && (
              <div className="text-center">
                <Info size={64} className="mx-auto text-blue-500 mb-4" />
                <h2 className="text-xl font-semibold mb-4 text-blue-700">
                  Nenhum cliente novo para importar
                </h2>
                <p className="text-gray-600 mb-6">
                  Todos os clientes da planilha já estão cadastrados no sistema.
                </p>
                <button
                  onClick={resetForm}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Tentar com outra planilha
                </button>
              </div>
            )}
          </>
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
            <p className="text-gray-600">
              Importando {uploadProgress.current} de {uploadProgress.total} clientes...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <Check size={64} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-4 text-green-700">
              Importação concluída com sucesso!
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                {validationResult.validRecords.length} novos clientes foram importados com sucesso.
              </p>
              {validationResult.duplicates.length > 0 && (
                <p className="text-green-700 mt-2">
                  {validationResult.duplicates.length} clientes já cadastrados foram ignorados.
                </p>
              )}
            </div>
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
              {validationResult.errors[0]?.message || 'Ocorreu um erro durante o processamento.'}
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

      <StructureTable />
    </div>
  );
};

export default Clientes;