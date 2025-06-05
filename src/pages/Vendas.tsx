import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import StructureTable from '../components/vendas/StructureTable';
import PreviewTable from '../components/vendas/PreviewTable';

interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

type ImportStatus = 'idle' | 'preview' | 'validating' | 'validated' | 'uploading' | 'success' | 'error';

const Vendas: React.FC = () => {
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
        empresa_cnpj: '12345678000190',
        cliente_cnpj: '98765432000121',
        vendedor_codigo: 'VEND001',
        sdr_codigo: 'SDR001',
        servico_codigo: 'SERV001',
        valor: 1500.50,
        origem: 'Brasil',
        registro_venda: 'Venda de serviço de consultoria',
        data_venda: '2025-01-15'
      }
    ];

    const instructions = [
      ['Instruções para preenchimento:'],
      [''],
      ['1. empresa_cnpj: CNPJ da empresa'],
      ['2. cliente_cnpj: CNPJ do cliente'],
      ['3. vendedor_codigo: Código do vendedor'],
      ['4. sdr_codigo: Código do SDR'],
      ['5. servico_codigo: Código do serviço'],
      ['6. valor: Valor da venda'],
      ['7. origem: País de origem da venda'],
      ['8. registro_venda: Descrição da venda'],
      ['9. data_venda: Data da venda (YYYY-MM-DD)'],
      [''],
      ['Exemplos de dados:']
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

    const wsData = XLSX.utils.json_to_sheet(exampleData);
    XLSX.utils.book_append_sheet(wb, wsData, 'Modelo');

    XLSX.writeFile(wb, 'modelo_vendas.xlsx');
  };

  const validateData = async (data: any[]): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];

    for (const [index, row] of data.entries()) {
      const rowNumber = index + 2;

      // Validar campos obrigatórios
      if (!row.empresa_cnpj) {
        errors.push({
          row: rowNumber,
          field: 'empresa_cnpj',
          value: '',
          message: 'CNPJ da empresa é obrigatório'
        });
      }

      if (!row.cliente_cnpj) {
        errors.push({
          row: rowNumber,
          field: 'cliente_cnpj',
          value: '',
          message: 'CNPJ do cliente é obrigatório'
        });
      }

      if (!row.vendedor_codigo) {
        errors.push({
          row: rowNumber,
          field: 'vendedor_codigo',
          value: '',
          message: 'Código do vendedor é obrigatório'
        });
      }

      if (!row.servico_codigo) {
        errors.push({
          row: rowNumber,
          field: 'servico_codigo',
          value: '',
          message: 'Código do serviço é obrigatório'
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

      if (!row.origem) {
        errors.push({
          row: rowNumber,
          field: 'origem',
          value: '',
          message: 'Origem é obrigatória'
        });
      }

      if (!row.registro_venda) {
        errors.push({
          row: rowNumber,
          field: 'registro_venda',
          value: '',
          message: 'Registro da venda é obrigatório'
        });
      }

      if (!row.data_venda) {
        errors.push({
          row: rowNumber,
          field: 'data_venda',
          value: '',
          message: 'Data da venda é obrigatória'
        });
      }

      // Validar existência dos relacionamentos
      try {
        // Validar empresa
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

        // Validar cliente
        const { data: cliente } = await supabase
          .from('clientes')
          .select('id')
          .eq('cnpj', row.cliente_cnpj)
          .single();

        if (!cliente) {
          errors.push({
            row: rowNumber,
            field: 'cliente_cnpj',
            value: row.cliente_cnpj,
            message: 'Cliente não encontrado'
          });
        }

        // Validar vendedor
        const { data: vendedor } = await supabase
          .from('pessoas')
          .select('id')
          .eq('codigo', row.vendedor_codigo)
          .single();

        if (!vendedor) {
          errors.push({
            row: rowNumber,
            field: 'vendedor_codigo',
            value: row.vendedor_codigo,
            message: 'Vendedor não encontrado'
          });
        }

        // Validar SDR (se fornecido)
        if (row.sdr_codigo) {
          const { data: sdr } = await supabase
            .from('pessoas')
            .select('id')
            .eq('codigo', row.sdr_codigo)
            .single();

          if (!sdr) {
            errors.push({
              row: rowNumber,
              field: 'sdr_codigo',
              value: row.sdr_codigo,
              message: 'SDR não encontrado'
            });
          }
        }

        // Validar serviço
        const { data: servico } = await supabase
          .from('servicos')
          .select('id')
          .eq('codigo', row.servico_codigo)
          .single();

        if (!servico) {
          errors.push({
            row: rowNumber,
            field: 'servico_codigo',
            value: row.servico_codigo,
            message: 'Serviço não encontrado'
          });
        }
      } catch (error) {
        console.error('Erro ao validar relacionamentos:', error);
        errors.push({
          row: rowNumber,
          field: 'validacao',
          value: '',
          message: 'Erro ao validar relacionamentos'
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
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id')
          .eq('cnpj', row.empresa_cnpj)
          .single();

        const { data: cliente } = await supabase
          .from('clientes')
          .select('id')
          .eq('cnpj', row.cliente_cnpj)
          .single();

        const { data: vendedor } = await supabase
          .from('pessoas')
          .select('id')
          .eq('codigo', row.vendedor_codigo)
          .single();

        let sdrId = null;
        if (row.sdr_codigo) {
          const { data: sdr } = await supabase
            .from('pessoas')
            .select('id')
            .eq('codigo', row.sdr_codigo)
            .single();
          sdrId = sdr?.id;
        }

        const { data: servico } = await supabase
          .from('servicos')
          .select('id')
          .eq('codigo', row.servico_codigo)
          .single();

        const { error } = await supabase
          .from('registro_de_vendas')
          .insert({
            empresa_id: empresa?.id,
            cliente_id: cliente?.id,
            vendedor_id: vendedor?.id,
            sdr_id: sdrId,
            servico_id: servico?.id,
            valor: row.valor,
            origem: row.origem,
            nome_cliente: null,
            registro_venda: row.registro_venda,
            data_venda: row.data_venda
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Importação de Vendas</h1>
          <p className="text-gray-600">
            Faça upload de uma planilha Excel ou CSV para importar vendas em massa.
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

export default Vendas;