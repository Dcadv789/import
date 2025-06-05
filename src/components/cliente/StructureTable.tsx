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
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">razao_social</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Razão social do cliente</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Empresa LTDA</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">nome_fantasia</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Nome fantasia do cliente</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Empresa</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">cnpj</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">CNPJ do cliente</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12345678000190</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">empresa_cnpj</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">CNPJ da empresa relacionada</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">98765432000121</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">ativo</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Status do cliente</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">TRUE</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StructureTable;