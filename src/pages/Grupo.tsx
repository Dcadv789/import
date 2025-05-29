import React, { useState } from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import UploadArea from '../components/grupo/UploadArea';
import PreviewTable from '../components/grupo/PreviewTable';
import ValidationResults from '../components/grupo/ValidationResults';
import StructureTable from '../components/grupo/StructureTable';

interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

type ImportStatus = 'idle' | 'preview' | 'validating' | 'validated' | 'uploading' | 'success' | 'error';

const Grupo: React.FC = () => {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    const exampleData = [
      {
        nome: 'Grupo Financeiro',
        descricao: 'Grupo para categorias financeiras',
        ativo: 'TRUE'
      },
      {
        nome: 'Grupo Operacional',
        descricao: '',
        ativo: 'FALSE'
      }
    ];

    const instructions = [
      ['Instruções para preenchimento:'],
      [''],
      ['1. nome: Nome do grupo'],
      ['2. descricao: Descrição do grupo (opcional)'],
      ['3. ativo: Deve ser "TRUE" ou "FALSE"'],
      [''],
      ['Exemplos de dados:']
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

    const wsData = XLSX.utils.json_to_sheet(exampleData);
    XLSX.utils.book_append_sheet(wb, wsData, 'Modelo');

    XLSX.writeFile(wb, 'modelo_grupos.xlsx');
  };

  const validateData = (data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2;

      if (!row.nome) {
        errors.push({
          row: rowNumber,
          field: 'nome',
          value: '',
          message: 'Nome é obrigatório'
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

  // ... (resto das funções similares às da página Categoria)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Importação de Grupos</h1>
        <p className="text-gray-600">
          Faça upload de uma planilha Excel ou CSV para importar dados de grupos em massa.
        </p>
        <button
          onClick={downloadTemplate}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
        >
          <Download size={20} />
          <span>Baixar Planilha Modelo</span>
        </button>
      </div>

      {/* ... (resto do JSX similar ao da página Categoria) */}
    </div>
  );
};

export default Grupo;