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
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">empresa_cnpj</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">CNPJ da empresa</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12345678000190</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">cliente_cnpj</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">CNPJ do cliente</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">98765432000121</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">vendedor_codigo</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Código do vendedor</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">VEND001</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">sdr_codigo</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Código do SDR</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">SDR001</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">servico_codigo</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Código do serviço</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">SERV001</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">valor</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Valor da venda</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1500.50</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">origem</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">País de origem da venda</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Brasil</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">registro_venda</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Descrição da venda</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Venda de serviço de consultoria</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">data_venda</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Data da venda (YYYY-MM-DD)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2025-01-15</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StructureTable;