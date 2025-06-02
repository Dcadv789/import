import React, { useState } from 'react';
import { Plus, Edit2, Link as LinkIcon, Search, ChevronRight, ChevronDown, Building2 } from 'lucide-react';
import NovaContaModal from '../components/dre/NovaContaModal';
import VincularEmpresasModal from '../components/dre/VincularEmpresasModal';

interface DreConta {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  nivel: number;
  parentId: string | null;
  expanded?: boolean;
}

const DreConfig: React.FC = () => {
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [isNovaContaModalOpen, setIsNovaContaModalOpen] = useState(false);
  const [isVincularEmpresasModalOpen, setIsVincularEmpresasModalOpen] = useState(false);
  const [selectedParentAccount, setSelectedParentAccount] = useState<DreConta | null>(null);
  
  // Mock data - replace with actual data from Supabase
  const empresas = [
    { id: '1', nome: 'Empresa A' },
    { id: '2', nome: 'Empresa B' },
    { id: '3', nome: 'Empresa C' },
  ];

  const contas: DreConta[] = [
    { id: '1', codigo: '1', nome: 'Receita Bruta', tipo: 'Receita', nivel: 1, parentId: null },
    { id: '2', codigo: '1.1', nome: 'Vendas de Produtos', tipo: 'Receita', nivel: 2, parentId: '1' },
    { id: '3', codigo: '1.2', nome: 'Vendas de Serviços', tipo: 'Receita', nivel: 2, parentId: '1' },
    { id: '4', codigo: '2', nome: 'Custos', tipo: 'Custo', nivel: 1, parentId: null },
    { id: '5', codigo: '2.1', nome: 'Custos Diretos', tipo: 'Custo', nivel: 2, parentId: '4' },
    { id: '6', codigo: '2.1.1', nome: 'Matéria Prima', tipo: 'Custo', nivel: 3, parentId: '5' },
  ];

  const toggleExpand = (accountId: string) => {
    setExpandedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const getChildAccounts = (parentId: string | null): DreConta[] => {
    return contas.filter(conta => conta.parentId === parentId);
  };

  const handleAddSubAccount = (parentAccount: DreConta) => {
    setSelectedParentAccount(parentAccount);
    setIsNovaContaModalOpen(true);
  };

  const renderAccounts = (parentId: string | null = null, level: number = 0) => {
    const accounts = getChildAccounts(parentId);
    
    return accounts
      .filter(conta =>
        searchTerm === '' ||
        conta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conta.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((conta) => {
        const hasChildren = contas.some(c => c.parentId === conta.id);
        const isExpanded = expandedAccounts.has(conta.id);

        return (
          <React.Fragment key={conta.id}>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm font-medium text-gray-900" style={{ paddingLeft: `${level * 24}px` }}>
                  {hasChildren && (
                    <button
                      onClick={() => toggleExpand(conta.id)}
                      className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  )}
                  {!hasChildren && <span className="w-[26px]" />}
                  {conta.codigo}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{conta.nome}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  conta.tipo === 'Receita' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {conta.tipo}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {conta.nivel}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddSubAccount(conta)}
                    className="text-green-600 hover:text-green-800 transition-colors"
                    title="Adicionar subconta"
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Editar conta"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => setIsVincularEmpresasModalOpen(true)}
                    className="text-purple-600 hover:text-purple-800 transition-colors"
                    title="Relacionar com empresas"
                  >
                    <LinkIcon size={18} />
                  </button>
                </div>
              </td>
            </tr>
            {isExpanded && renderAccounts(conta.id, level + 1)}
          </React.Fragment>
        );
      });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Configuração do DRE</h1>
          <p className="text-gray-600">
            Gerencie as contas do DRE e seus relacionamentos com empresas
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setIsVincularEmpresasModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <Building2 size={20} />
            <span>Vincular Empresas</span>
          </button>
          <button
            onClick={() => {
              setSelectedParentAccount(null);
              setIsNovaContaModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Nova Conta</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Empresa
            </label>
            <select
              id="empresa"
              value={selectedEmpresa}
              onChange={(e) => setSelectedEmpresa(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todas as empresas</option>
              {empresas.map(empresa => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar Contas
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Buscar por código ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {renderAccounts()}
            </tbody>
          </table>
        </div>
      </div>

      <NovaContaModal
        isOpen={isNovaContaModalOpen}
        onClose={() => {
          setIsNovaContaModalOpen(false);
          setSelectedParentAccount(null);
        }}
        parentAccount={selectedParentAccount}
      />

      <VincularEmpresasModal
        isOpen={isVincularEmpresasModalOpen}
        onClose={() => setIsVincularEmpresasModalOpen(false)}
      />
    </div>
  );
};

export default DreConfig;