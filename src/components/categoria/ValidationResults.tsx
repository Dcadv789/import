import React from 'react';
import { Check, AlertCircle, Save } from 'lucide-react';

interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

interface ValidationResultsProps {
  errors: ValidationError[];
  data: any[];
  onUpload: () => void;
  onReset: () => void;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({
  errors,
  data,
  onUpload,
  onReset,
}) => {
  if (errors.length === 0) {
    return (
      <div className="text-center">
        <Check size={64} className="mx-auto text-green-500 mb-4" />
        <h2 className="text-xl font-semibold mb-4 text-green-700">
          Validação concluída com sucesso! {data.length} registros prontos para importação.
        </h2>
        <button
          onClick={onUpload}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
        >
          <Save size={20} />
          <span>Confirmar e Importar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-4 text-red-700">
        Encontrados {errors.length} erros na validação
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
            {errors.map((error, index) => (
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
        onClick={onReset}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
};

export default ValidationResults;