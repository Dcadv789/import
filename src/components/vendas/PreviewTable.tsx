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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.slice(0, 5).map((row, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.empresa_cnpj}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.cliente_cnpj}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.vendedor_codigo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.servico_codigo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.valor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.data_venda}</td>
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