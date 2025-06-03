import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Link as LinkIcon, Search, ChevronRight, ChevronDown, Building2, Upload, FolderTree } from 'lucide-react';
import NovaContaModal from '../components/dre/NovaContaModal';
import VincularEmpresasModal from '../components/dre/VincularEmpresasModal';
import ComponentesModal from '../components/dre/ComponentesModal';
import UploadContasModal from '../components/dre/UploadContasModal';
import EditarContaModal from '../components/dre/EditarContaModal';
import GerenciarRaizModal from '../components/dre/GerenciarRaizModal';
import { supabase } from '../lib/supabase';

interface DreConta {
  id: string;
  nome: string;
  ordem: number;
  simbolo: string;
  conta_pai: string | null;
  ativo: boolean;
  visivel: boolean;
}

interface Empresa {
  id: string;
  razao_social: string;
}

const DreConfig: React.FC = () => {
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [isNovaContaModalOpen, setIsNovaContaModalOpen] = useState(false);
  const [isVincularEmpresasModalOpen, setIsVincularEmpresasModalOpen] = useState(false);
  const [isComponentesModalOpen, setIsComponentesModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGerenciarRaizModalOpen, setIsGerenciarRaizModalOpen] = useState(false);
  const [selectedParentAccount, setSelectedParentAccount] = useState<DreConta | null>(null);
  const [selectedEditAccount, setSelectedEditAccount] = useState<DreConta | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [contas, setContas] = useState<DreConta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmpresas();
    loadContas();
  }, []);

  const loadEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, razao_social')
        .eq('ativo', true)
        .order('razao_social');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const loadContas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dre_contas')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

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
    return contas.filter(conta => conta.conta_pai === parentId);
  };

  const handleAddSubAccount = (parentAccount: DreConta) => {
    setSelectedParentAccount(parentAccount);
    setIsNovaContaModalOpen(true);
  };

  const handleEditAccount = (account: DreConta) => {
    setSelectedEditAccount(account);
    setIsEditModalOpen(true);
  };

  const renderAccounts = (parentId: string | null = null, level: number = 0) => {
    const accounts = getChildAccounts(parentId);
    
    return accounts
      .filter(conta =>
        searchTerm === '' ||
        conta.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((conta) => {
        const hasChildren = contas.some(c => c.conta_pai === conta.id);
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
                  {conta.ordem}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{conta.nome}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  conta.simbolo === '+' ? 'bg-green-100 text-green-800' : 
                  conta.simbolo === '-' ? 'bg-red-100 text-red-800' : 
                  'bg-blue-100 text-blue-800'
                }`}>
                  {conta.simbolo}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {level + 1}
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
                    onClick={() => handleEditAccount(conta)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Editar conta"
                  >
                    <Edit2 size={18} />
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
            onClick={() => setIsGerenciarRaizModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <FolderTree size={20} />
            <span>Gerenciar Raiz</span>
          </button>
          <button
            onClick={() => setIsComponentesModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <LinkIcon size={20} />
            <span>Gerenciar Componentes</span>
          </button>
          <button
            onClick={() => setIsVincularEmpresasModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <Building2 size={20} />
            <span>Vincular Empresas</span>
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <Upload size={20} />
            <span>Upload em Massa</span>
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
                  {empresa.razao_social}
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
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Símbolo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {renderAccounts()}
              </tbody>
            </table>
          )}
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

      <ComponentesModal
        isOpen={isComponentesModalOpen}
        onClose={() => setIsComponentesModalOpen(false)}
      />

      <UploadContasModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      <EditarContaModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEditAccount(null);
        }}
        conta={selectedEditAccount}
      />

      <GerenciarRaizModal
        isOpen={isGerenciarRaizModalOpen}
        onClose={() => setIsGerenciarRaizModalOpen(false)}
      />
    </div>
  );
};

export default DreConfig;