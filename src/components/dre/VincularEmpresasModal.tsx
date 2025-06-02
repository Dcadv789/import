import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VincularEmpresasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Empresa {
  id: string;
  razao_social: string;
}

interface DreConta {
  id: string;
  nome: string;
  ordem: number;
}

const VincularEmpresasModal: React.FC<VincularEmpresasModalProps> = ({ isOpen, onClose }) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [unassignedContas, setUnassignedContas] = useState<DreConta[]>([]);
  const [empresaContas, setEmpresaContas] = useState<DreConta[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEmpresas();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedEmpresa) {
      loadContas();
    }
  }, [selectedEmpresa]);

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
    if (!selectedEmpresa) return;

    setLoading(true);
    try {
      // Buscar contas associadas à empresa selecionada
      const { data: assigned, error: assignedError } = await supabase
        .from('dre_empresas')
        .select(`
          conta:dre_conta_id (
            id,
            nome,
            ordem
          )
        `)
        .eq('empresa_id', selectedEmpresa.id)
        .eq('ativo', true);

      if (assignedError) throw assignedError;

      const assignedContas = assigned
        ?.map(item => item.conta)
        .filter((item): item is DreConta => item !== null) || [];

      setEmpresaContas(assignedContas);

      // Buscar todas as contas
      const { data: allContas, error: allError } = await supabase
        .from('dre_contas')
        .select('id, nome, ordem')
        .eq('ativo', true)
        .order('ordem');

      if (allError) throw allError;

      // Filtrar contas não associadas
      const assignedIds = new Set(assignedContas.map(c => c.id));
      const unassigned = (allContas || []).filter(
        conta => !assignedIds.has(conta.id)
      );

      setUnassignedContas(unassigned);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmpresaSelect = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setSearchTerm('');
  };

  const handleContaAssign = async (conta: DreConta) => {
    if (!selectedEmpresa) return;

    try {
      const { error } = await supabase
        .from('dre_empresas')
        .insert({
          empresa_id: selectedEmpresa.id,
          dre_conta_id: conta.id,
          ativo: true
        });

      if (error) throw error;

      setUnassignedContas(prev => prev.filter(c => c.id !== conta.id));
      setEmpresaContas(prev => [...prev, conta]);
    } catch (error) {
      console.error('Erro ao associar conta:', error);
    }
  };

  const handleContaUnassign = async (conta: DreConta) => {
    if (!selectedEmpresa) return;

    try {
      const { error } = await supabase
        .from('dre_empresas')
        .delete()
        .eq('empresa_id', selectedEmpresa.id)
        .eq('dre_conta_id', conta.id);

      if (error) throw error;

      setEmpresaContas(prev => prev.filter(c => c.id !== conta.id));
      setUnassignedContas(prev => [...prev, conta]);
    } catch (error) {
      console.error('Erro ao desassociar conta:', error);
    }
  };

  const filteredUnassignedContas = unassignedContas.filter(conta =>
    conta.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Vincular Contas com Empresas</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lista de Empresas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Empresas</h3>
            <div className="border rounded-lg p-4 h-96 overflow-y-auto">
              {empresas.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">
                  Nenhuma empresa encontrada
                </p>
              ) : (
                <div className="space-y-2">
                  {empresas.map(empresa => (
                    <button
                      key={empresa.id}
                      onClick={() => handleEmpresaSelect(empresa)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        selectedEmpresa?.id === empresa.id
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {empresa.razao_social}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contas não associadas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contas Disponíveis</h3>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar contas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="border rounded-lg p-4 h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredUnassignedContas.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">
                  Nenhuma conta disponível
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredUnassignedContas.map(conta => (
                    <button
                      key={conta.id}
                      onClick={() => handleContaAssign(conta)}
                      disabled={!selectedEmpresa}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        !selectedEmpresa
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{conta.nome}</div>
                          <div className="text-sm text-gray-500">Ordem: {conta.ordem}</div>
                        </div>
                        <ArrowRight size={20} className="text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contas da empresa */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Contas da Empresa
              {selectedEmpresa && <span className="text-gray-500 ml-2">({selectedEmpresa.razao_social})</span>}
            </h3>
            <div className="border rounded-lg p-4 h-96 overflow-y-auto">
              {!selectedEmpresa ? (
                <p className="text-gray-500 text-center mt-8">
                  Selecione uma empresa para ver suas contas
                </p>
              ) : loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : empresaContas.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">
                  Nenhuma conta associada
                </p>
              ) : (
                <div className="space-y-2">
                  {empresaContas.map(conta => (
                    <button
                      key={conta.id}
                      onClick={() => handleContaUnassign(conta)}
                      className="w-full text-left px-4 py-2 rounded-lg transition-colors hover:bg-gray-100"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{conta.nome}</div>
                          <div className="text-sm text-gray-500">Ordem: {conta.ordem}</div>
                        </div>
                        <X size={20} className="text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VincularEmpresasModal;