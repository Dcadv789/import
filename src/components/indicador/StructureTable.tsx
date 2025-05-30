import React from 'react';

const StructureTable: React.FC = () => {
  return (
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Código único do indicador</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">IND001</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">nome</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Nome do indicador</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Taxa de Conversão</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">descricao</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Descrição detalhada (opcional)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mede a taxa de conversão de leads</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">tipo_estrutura</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Tipo de estrutura do indicador</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Percentual</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">tipo_dado</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Tipo de dado do indicador</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Numérico</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">ativo</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Status do indicador</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">TRUE</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StructureTable;