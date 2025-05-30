import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, Download, Eye, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import StructureTable from '../components/lancamento/StructureTable';
import PreviewTable from '../components/lancamento/PreviewTable';
import ValidationResults from '../components/lancamento/ValidationResults';

interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

type ImportStatus = 'idle' | 'preview' | 'validating' | 'validated' | 'uploading' | 'success' | 'error';

const Lancamento: React.FC = () => {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    const exampleData = [
      {
        categoria_codigo: 'CAT001',
        indicador_codigo: '',
        cliente_codigo: '',
        empresa_cnpj: '12345678000190',
        tipo: 'Receita',
        valor: 1500.50,
        mes: 3,
        ano: 2025
      },
      {
        categoria_codigo: '',
        indicador_codigo: 'IND001',
        cliente_codigo: '',
        empresa_cnpj: '98765432000121',
        tipo: 'Despesa',
        valor: 750.25,
        mes: 4,
        ano: 2025
      }
    ];

    const instructions = [
      ['Instruções para preenchimento:'],
      [''],
      ['1. Preencha apenas UM dos seguintes campos:'],
      ['   - categoria_codigo: Código da categoria'],
      ['   - indicador_codigo: Código do indicador'],
      ['   - cliente_codigo: Código do cliente'],
      ['2. empresa_cnpj: CNPJ da empresa (obrigatório)'],
      ['3. tipo: Deve ser "Receita" ou "Despesa"'],
      ['4. valor: Valor numérico do lançamento'],
      ['5. mes: Número do mês (1-12)'],
      ['6. ano: Ano com 4 dígitos'],
      [''],
      ['Exemplos de dados:']
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

    const wsData = XLSX.utils.json_to_sheet(exampleData);
    XLSX.utils.book_append_sheet(wb, wsData, 'Modelo');

    XLSX.writeFile(wb, 'modelo_lancamentos.xlsx');
  };

  const validateData = async (data: any[]): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];

    for (const [index, row] of data.entries()) {
      const rowNumber = index + 2;

      // Validar que apenas um dos códigos está preenchido
      const codigoCount = [
        row.categoria_codigo,
        row.indicador_codigo,
        row.cliente_codigo
      ].filter(Boolean).length;

      if (codigoCount === 0) {
        errors.push({
          row: rowNumber,
          field: 'codigo',
          value: '',
          message: 'É necessário preencher um código (categoria, indicador ou cliente)'
        });
      } else if (codigoCount > 1) {
        errors.push({
          row: rowNumber,
          field: 'codigo',
          value: '',
          message: 'Apenas um código deve ser preenchido (categoria, indicador ou cliente)'
        });
      }

      if (!row.empresa_cnpj) {
        errors.push({
          row: rowNumber,
          field: 'empresa_cnpj',
          value: '',
          message: 'CNPJ da empresa é obrigatório'
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

      if (!row.valor || isNaN(row.valor)) {
        errors.push({
          row: rowNumber,
          field: 'valor',
          value: row.valor || '',
          message: 'Valor deve ser um número válido'
        });
      }

      const mes = Number(row.mes);
      if (!mes || mes < 1 || mes > 12 || !Number.isInteger(mes)) {
        errors.push({
          row: rowNumber,
          field: 'mes',
          value: row.mes || '',
          message: 'Mês deve ser um número inteiro entre 1 e 12'
        });
      }

      const ano = Number(row.ano);
      if (!ano || ano.toString().length !== 4 || !Number.isInteger(ano)) {
        errors.push({
          row: rowNumber,
          field: 'ano',
          value: row.ano || '',
          message: 'Ano deve ser um número inteiro com 4 dígitos'
        });
      }

      // Validar existência dos códigos nas respectivas tabelas
      if (row.categoria_codigo) {
        const { data: categoria } = await supabase
          .from('categorias')
          .select('id')
          .eq('codigo', row.categoria_codigo)
          .single();

        if (!categoria) {
          errors.push({
            row: rowNumber,
            field: 'categoria_codigo',
            value: row.categoria_codigo,
            message: 'Categoria não encontrada'
          });
        }
      }

      if (row.indicador_codigo) {
        const { data: indicador } = await supabase
          .from('indicadores')
          .select('id')
          .eq('codigo', row.indicador_codigo)
          .single();

        if (!indicador) {
          errors.push({
            row: rowNumber,
            field: 'indicador_codigo',
            value: row.indicador_codigo,
            message: 'Indicador não encontrado'
          });
        }
      }

      if (row.cliente_codigo) {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('id')
          .eq('codigo', row.cliente_codigo)
          .single();

        if (!cliente) {
          errors.push({
            row: rowNumber,
            field: 'cliente_codigo',
            value: row.cliente_codigo,
            message: 'Cliente não encontrado'
          });
        }
      }

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
    setUploadProgress({ current: 0, total: previewData.length });

    try {
      for (const [index, row] of previewData.entries()) {
        // Buscar IDs correspondentes
        let categoriaId = null;
        let indicadorId = null;
        let clienteId = null;
        let empresaId = null;

        if (row.categoria_codigo) {
          const { data: categoria } = await supabase
            .from('categorias')
            .select('id')
            .eq('codigo', row.categoria_codigo)
            .single();
          categoriaId = categoria?.id;
        }

        if (row.indicador_codigo) {
          const { data: indicador } = await supabase
            .from('indicadores')
            .select('id')
            .eq('codigo', row.indicador_codigo)
            .single();
          indicadorId = indicador?.id;
        }

        if (row.cliente_codigo) {
          const { data: cliente } = await supabase
            .from('clientes')
            .select('id')
            .eq('codigo', row.cliente_codigo)
            .single();
          clienteId = cliente?.id;
        }

        const { data: empresa } = await supabase
          .from('empresas')
          .select('id')
          .eq('cnpj', row.empresa_cnpj)
          .single();
        empresaId = empresa?.id;

        const { error } = await supabase
          .from('lancamentos')
          .insert({
            categoria_id: categoriaId,
            indicador_id: indicadorId,
            cliente_id: clienteId,
            empresa_id: empresaId,
            tipo: row.tipo,
            valor: row.valor,
            mes: row.mes,
            ano: row.ano
          });

        if (error) throw error;

        setUploadProgress(prev => ({ ...prev, current: index + 1 }));
      }

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
    setUploadProgress({ current: 0, total: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Importação de Lançamentos</h1>
          <p className="text-gray-600">
            Faça upload de uma planilha Excel ou CSV para importar lançamentos em massa.
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
          <ValidationResults
            errors={validationErrors}
            data={previewData}
            onUpload={handleUpload}
            onReset={resetForm}
          />
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

      <StructureTable />
    </div>
  );
};

export default Lancamento;