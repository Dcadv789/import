import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, Download, Eye, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

type ImportStatus = 'idle' | 'preview' | 'validating' | 'validated' | 'uploading' | 'success' | 'error';

const DespesasVendedores: React.FC = () => {
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
        codigo: 'VEND001',
        mes: 1,
        ano: 2025,
        combustivel: 500.00,
        alimentacao: 800.00,
        hospedagem: 1200.00,
        comissao: 2500.00,
        salario: 5000.00,
        outras_despesas: 300.00
      },
      {
        codigo: 'VEND002',
        mes: 1,
        ano: 2025,
        combustivel: 450.00,
        alimentacao: 750.00,
        hospedagem: 1100.00,
        comissao: 2200.00,
        salario: 4800.00,
        outras_despesas: 250.00
      }
    ];

    const instructions = [
      ['Instruções para preenchimento:'],
      [''],
      ['1. codigo: Código do vendedor (deve existir na tabela pessoas)'],
      ['2. mes: Mês de referência (1-12)'],
      ['3. ano: Ano de referência (4 dígitos)'],
      ['4. combustivel: Valor gasto com combustível'],
      ['5. alimentacao: Valor gasto com alimentação'],
      ['6. hospedagem: Valor gasto com hospedagem'],
      ['7. comissao: Valor da comissão do vendedor'],
      ['8. salario: Valor do salário do vendedor'],
      ['9. outras_despesas: Outras despesas diversas'],
      [''],
      ['Observações:'],
      ['- Todos os valores devem ser numéricos'],
      ['- O código do vendedor deve existir na base de dados'],
      ['- Não pode haver duplicatas para o mesmo vendedor/mês/ano'],
      [''],
      ['Exemplos de dados:']
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

    const wsData = XLSX.utils.json_to_sheet(exampleData);
    XLSX.utils.book_append_sheet(wb, wsData, 'Modelo');

    XLSX.writeFile(wb, 'modelo_despesas_vendedores.xlsx');
  };

  const validateData = async (data: any[]): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];

    for (const [index, row] of data.entries()) {
      const rowNumber = index + 2;

      // Validar código do vendedor
      if (!row.codigo) {
        errors.push({
          row: rowNumber,
          field: 'codigo',
          value: '',
          message: 'Código do vendedor é obrigatório'
        });
      } else {
        // Verificar se o vendedor existe
        const { data: pessoa } = await supabase
          .from('pessoas')
          .select('id')
          .eq('codigo', row.codigo)
          .single();

        if (!pessoa) {
          errors.push({
            row: rowNumber,
            field: 'codigo',
            value: row.codigo,
            message: 'Vendedor não encontrado'
          });
        }
      }

      // Validar mês
      const mes = Number(row.mes);
      if (!mes || mes < 1 || mes > 12 || !Number.isInteger(mes)) {
        errors.push({
          row: rowNumber,
          field: 'mes',
          value: row.mes || '',
          message: 'Mês deve ser um número inteiro entre 1 e 12'
        });
      }

      // Validar ano
      const ano = Number(row.ano);
      if (!ano || ano < 1900 || ano > 9999 || !Number.isInteger(ano)) {
        errors.push({
          row: rowNumber,
          field: 'ano',
          value: row.ano || '',
          message: 'Ano deve ser um número inteiro entre 1900 e 9999'
        });
      }

      // Validar valores numéricos
      const campos = ['combustivel', 'alimentacao', 'hospedagem', 'comissao', 'salario', 'outras_despesas'];
      campos.forEach(campo => {
        const valor = row[campo];
        if (valor !== undefined && valor !== '' && (isNaN(valor) || valor < 0)) {
          errors.push({
            row: rowNumber,
            field: campo,
            value: valor,
            message: `${campo} deve ser um valor numérico positivo`
          });
        }
      });

      // Verificar duplicatas na planilha
      const duplicates = data.filter((item, i) => 
        i !== index && 
        item.codigo === row.codigo && 
        Number(item.mes) === mes && 
        Number(item.ano) === ano
      );

      if (duplicates.length > 0) {
        errors.push({
          row: rowNumber,
          field: 'duplicata',
          value: `${row.codigo}-${mes}-${ano}`,
          message: 'Registro duplicado na planilha para o mesmo vendedor/mês/ano'
        });
      }

      // Verificar se já existe no banco de dados
      if (row.codigo && mes && ano) {
        const { data: pessoa } = await supabase
          .from('pessoas')
          .select('id')
          .eq('codigo', row.codigo)
          .single();

        if (pessoa) {
          const { data: existingRecord } = await supabase
            .from('despesas_vendedor')
            .select('id')
            .eq('pessoa_id', pessoa.id)
            .eq('mes', mes)
            .eq('ano', ano)
            .single();

          if (existingRecord) {
            errors.push({
              row: rowNumber,
              field: 'existente',
              value: `${row.codigo}-${mes}-${ano}`,
              message: 'Já existe registro para este vendedor/mês/ano no banco de dados'
            });
          }
        }
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
        // Buscar ID da pessoa pelo código
        const { data: pessoa } = await supabase
          .from('pessoas')
          .select('id')
          .eq('codigo', row.codigo)
          .single();

        if (!pessoa) {
          throw new Error(`Vendedor com código ${row.codigo} não encontrado`);
        }

        const { error } = await supabase
          .from('despesas_vendedor')
          .insert({
            pessoa_id: pessoa.id,
            mes: Number(row.mes),
            ano: Number(row.ano),
            combustivel: Number(row.combustivel) || 0,
            alimentacao: Number(row.alimentacao) || 0,
            hospedagem: Number(row.hospedagem) || 0,
            comissao: Number(row.comissao) || 0,
            salario: Number(row.salario) || 0,
            outras_despesas: Number(row.outras_despesas) || 0
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Importação de Despesas dos Vendedores</h1>
          <p className="text-gray-600">
            Faça upload de uma planilha Excel ou CSV para importar despesas dos vendedores em massa.
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês/Ano</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Combustível</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alimentação</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospedagem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comissão</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salário</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.codigo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.mes}/{row.ano}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {Number(row.combustivel || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {Number(row.alimentacao || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {Number(row.hospedagem || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {Number(row.comissao || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {Number(row.salario || 0).toFixed(2)}</td>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Código do vendedor (deve existir na tabela pessoas)</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">VEND001</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">mes</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mês de referência (1-12)</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">ano</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Ano de referência (4 dígitos)</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2025</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">combustivel</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Valor gasto com combustível</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">500.00</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">alimentacao</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Valor gasto com alimentação</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">800.00</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">hospedagem</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Valor gasto com hospedagem</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1200.00</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">comissao</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Valor da comissão do vendedor</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2500.00</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">salario</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Valor do salário do vendedor</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5000.00</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">outras_despesas</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Outras despesas diversas</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">300.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DespesasVendedores;