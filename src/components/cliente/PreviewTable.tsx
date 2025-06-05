import React from 'react';
import { Eye } from 'lucide-react';

interface PreviewTableProps {
  data: any[];
  onValidate: () => void;
}

const PreviewTable: React.FC<PreviewTableProps> = ({ data, onValidate }) => {
  return (
    <div className="text-center">
      <Eye size={64} className="mx-auto text-blue-500 mb-4" />
      <h2 className="text-xl font-semibold mb-4 text-blue-700">
        {data.length} registros carregados
      </h2>
      <div className="mb-6 max-h-60 overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razão Social</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome Fantasia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ativo</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.slice(0, 5).map((row, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.razao_social}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.nome_fantasia}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.cnpj}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.empresa_cnpj}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {String(row.ativo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 5 && (
          <p className="text-sm text-gray-500 mt-2">
            Mostrando 5 de {data.length} registros
          </p>
        )}
      </div>
      <button
        onClick={onValidate}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
      >
        <Eye size={20} />
        <span>Validar Dados</span>
      </button>
    </div>
  );
};

export default PreviewTable;