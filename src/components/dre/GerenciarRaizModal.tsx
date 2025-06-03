import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface GerenciarRaizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DreConta {
  id: string;
  nome: string;
  ordem: number;
  conta_pai: string | null;
}

const GerenciarRaizModal: React.FC<GerenciarRaizModalProps> = ({ isOpen, onClose }) => {
  const [contas, setContas] = useState<DreConta[]>([]);
  const [selectedConta, setSelectedConta] = useState<DreConta | null>(null);
  const [contasDisponiveis, setContasDisponiveis] = useState<DreConta[]>([]);
  const [contasFilhas, setContasFilhas] = useState<DreConta[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadContas();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedConta) {
      loadContasFilhas();
    }
  }, [selectedConta]);

  const loadContas = async () => {
    try {
      const { data, error } = await supabase
        .from('dre_contas')
        .select('id, nome, ordem, conta_pai')
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const loadContasFilhas = async () => {
    if (!selectedConta) return;

    setLoading(true);
    try {
      // Carregar contas filhas
      const { data: filhas, error: filhasError } = await supabase
        .from('dre_contas')
        .select('id, nome, ordem, conta_pai')
        .eq('conta_pai', selectedConta.id)
        .eq('ativo', true)
        .order('ordem');

      if (filhasError) throw filhasError;
      setContasFilhas(filhas || []);

      // Carregar contas disponíveis (que não são filhas da conta selecionada)
      const { data: disponiveis, error: disponiveisError } = await supabase
        .from('dre_contas')
        .select('id, nome, ordem, conta_pai')
        .eq('ativo', true)
        .neq('id', selectedConta.id)
        .order('ordem');

      if (disponiveisError) throw disponiveisError;

      // Filtrar contas que já são filhas de outras contas
      const contasSemPai = disponiveis?.filter(conta => 
        !conta.conta_pai && !filhas?.some(filha => filha.id === conta.id)
      ) || [];

      setContasDisponiveis(contasSemPai);
    } catch (error) {
      console.error('Erro ao carregar contas filhas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContaSelect = (conta: DreConta) => {
    setSelectedConta(conta);
    setSearchTerm('');
  };

  const handleContaAdd = async (conta: DreConta) => {
    try {
      const { error } = await supabase
        .from('dre_contas')
        .update({ conta_pai: selectedConta?.id })
        .eq('id', conta.id);

      if (error) throw error;

      setContasDisponiveis(prev => prev.filter(c => c.id !== conta.id));
      setContasFilhas(prev => [...prev, { ...conta, conta_pai: selectedConta?.id }]);
    } catch (error) {
      console.error('Erro ao adicionar conta filha:', error);
    }
  };

  const handleContaRemove = async (conta: DreConta) => {
    try {
      const { error } = await supabase
        .from('dre_contas')
        .update({ conta_pai: null })
        .eq('id', conta.id);

      if (error) throw error;

      setContasFilhas(prev => prev.filter(c => c.id !== conta.id));
      setContasDisponiveis(prev => [...prev, { ...conta, conta_pai: null }]);
    } catch (error) {
      console.error('Erro ao remover conta filha:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gerenciar Hierarquia de Contas</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lista de Contas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contas</h3>
            <div className="border rounded-lg p-4 h-[calc(100vh-300px)] overflow-y-auto">
              {contas.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">
                  Nenhuma conta encontrada
                </p>
              ) : (
                <div className="space-y-2">
                  {contas.map(conta => (
                    <button
                      key={conta.id}
                      onClick={() => handleContaSelect(conta)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        selectedConta?.id === conta.id
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{conta.nome}</div>
                      <div className="text-sm text-gray-500">Ordem: {conta.ordem}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contas Disponíveis */}
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
            <div className="border rounded-lg p-4 h-[calc(100vh-380px)] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : contasDisponiveis.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">
                  Nenhuma conta disponível
                </p>
              ) : (
                <div className="space-y-2">
                  {contasDisponiveis
                    .filter(conta =>
                      conta.nome.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(conta => (
                      <button
                        key={conta.id}
                        onClick={() => handleContaAdd(conta)}
                        disabled={!selectedConta}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                          !selectedConta
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

          {/* Contas Filhas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Contas Filhas
              {selectedConta && <span className="text-gray-500 ml-2">({selectedConta.nome})</span>}
            </h3>
            <div className="border rounded-lg p-4 h-[calc(100vh-300px)] overflow-y-auto">
              {!selectedConta ? (
                <p className="text-gray-500 text-center mt-8">
                  Selecione uma conta para ver suas contas filhas
                </p>
              ) : loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : contasFilhas.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">
                  Nenhuma conta filha associada
                </p>
              ) : (
                <div className="space-y-2">
                  {contasFilhas.map(conta => (
                    <button
                      key={conta.id}
                      onClick={() => handleContaRemove(conta)}
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

export default GerenciarRaizModal;