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
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">categoria_codigo</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Código da categoria (opcional)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">CAT001</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">indicador_codigo</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Código do indicador (opcional)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">IND001</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">cliente_codigo</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Código do cliente (opcional)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">CLI001</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">empresa_cnpj</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">CNPJ da empresa</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12345678000190</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">tipo</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Tipo do lançamento</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Receita</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">valor</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Valor do lançamento</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1500.50</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">mes</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mês do lançamento (1-12)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">ano</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Ano do lançamento</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2025</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StructureTable;