import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ComponentesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DreConta {
  id: string;
  nome: string;
  ordem: number;
}

interface Categoria {
  id: string;
  codigo: string;
  nome: string;
}

interface Indicador {
  id: string;
  codigo: string;
  nome: string;
}

const ComponentesModal: React.FC<ComponentesModalProps> = ({ isOpen, onClose }) => {
  const [contas, setContas] = useState<DreConta[]>([]);
  const [selectedConta, setSelectedConta] = useState<DreConta | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [contasDisponiveis, setContasDisponiveis] = useState<DreConta[]>([]);
  const [componentesCategorias, setComponentesCategorias] = useState<Categoria[]>([]);
  const [componentesIndicadores, setComponentesIndicadores] = useState<Indicador[]>([]);
  const [componentesContas, setComponentesContas] = useState<DreConta[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadContas();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedConta) {
      loadComponentes();
    }
  }, [selectedConta]);

  const loadContas = async () => {
    try {
      const { data, error } = await supabase
        .from('dre_contas')
        .select('id, nome, ordem')
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const loadComponentes = async () => {
    if (!selectedConta) return;

    setLoading(true);
    try {
      // Carregar categorias disponíveis
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias')
        .select('id, codigo, nome')
        .eq('ativo', true)
        .order('nome');

      if (categoriasError) throw categoriasError;
      setCategorias(categoriasData || []);

      // Carregar indicadores disponíveis
      const { data: indicadoresData, error: indicadoresError } = await supabase
        .from('indicadores')
        .select('id, codigo, nome')
        .eq('ativo', true)
        .order('nome');

      if (indicadoresError) throw indicadoresError;
      setIndicadores(indicadoresData || []);

      // Carregar contas disponíveis (exceto a selecionada)
      const { data: contasData, error: contasError } = await supabase
        .from('dre_contas')
        .select('id, nome, ordem')
        .eq('ativo', true)
        .neq('id', selectedConta.id)
        .order('ordem');

      if (contasError) throw contasError;
      setContasDisponiveis(contasData || []);

      // Carregar componentes já associados
      const { data: componentesData, error: componentesError } = await supabase
        .from('dre_componentes')
        .select(`
          categoria:categoria_id (id, codigo, nome),
          indicador:indicador_id (id, codigo, nome),
          conta:conta_id (id, nome, ordem)
        `)
        .eq('dre_conta_id', selectedConta.id)
        .eq('ativo', true);

      if (componentesError) throw componentesError;

      const categoriasAssociadas = componentesData
        ?.filter(item => item.categoria)
        .map(item => item.categoria) as Categoria[];
      
      const indicadoresAssociados = componentesData
        ?.filter(item => item.indicador)
        .map(item => item.indicador) as Indicador[];

      const contasAssociadas = componentesData
        ?.filter(item => item.conta)
        .map(item => item.conta) as DreConta[];

      setComponentesCategorias(categoriasAssociadas || []);
      setComponentesIndicadores(indicadoresAssociados || []);
      setComponentesContas(contasAssociadas || []);
    } catch (error) {
      console.error('Erro ao carregar componentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContaSelect = (conta: DreConta) => {
    setSelectedConta(conta);
    setSearchTerm('');
  };

  const handleCategoriaAdd = async (categoria: Categoria) => {
    try {
      const { error } = await supabase
        .from('dre_componentes')
        .insert({
          dre_conta_id: selectedConta?.id,
          categoria_id: categoria.id,
          indicador_id: null,
          conta_id: null,
          simbolo: '+',
          ordem: componentesCategorias.length + 1,
          ativo: true,
          visivel: true
        });

      if (error) throw error;

      setComponentesCategorias(prev => [...prev, categoria]);
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
    }
  };

  const handleIndicadorAdd = async (indicador: Indicador) => {
    try {
      const { error } = await supabase
        .from('dre_componentes')
        .insert({
          dre_conta_id: selectedConta?.id,
          categoria_id: null,
          indicador_id: indicador.id,
          conta_id: null,
          simbolo: '+',
          ordem: componentesIndicadores.length + 1,
          ativo: true,
          visivel: true
        });

      if (error) throw error;

      setComponentesIndicadores(prev => [...prev, indicador]);
    } catch (error) {
      console.error('Erro ao adicionar indicador:', error);
    }
  };

  const handleContaAdd = async (conta: DreConta) => {
    try {
      const { error } = await supabase
        .from('dre_componentes')
        .insert({
          dre_conta_id: selectedConta?.id,
          categoria_id: null,
          indicador_id: null,
          conta_id: conta.id,
          simbolo: '+',
          ordem: componentesContas.length + 1,
          ativo: true,
          visivel: true
        });

      if (error) throw error;

      setComponentesContas(prev => [...prev, conta]);
    } catch (error) {
      console.error('Erro ao adicionar conta:', error);
    }
  };

  const handleCategoriaRemove = async (categoria: Categoria) => {
    try {
      const { error } = await supabase
        .from('dre_componentes')
        .delete()
        .eq('dre_conta_id', selectedConta?.id)
        .eq('categoria_id', categoria.id);

      if (error) throw error;

      setComponentesCategorias(prev => prev.filter(c => c.id !== categoria.id));
    } catch (error) {
      console.error('Erro ao remover categoria:', error);
    }
  };

  const handleIndicadorRemove = async (indicador: Indicador) => {
    try {
      const { error } = await supabase
        .from('dre_componentes')
        .delete()
        .eq('dre_conta_id', selectedConta?.id)
        .eq('indicador_id', indicador.id);

      if (error) throw error;

      setComponentesIndicadores(prev => prev.filter(i => i.id !== indicador.id));
    } catch (error) {
      console.error('Erro ao remover indicador:', error);
    }
  };

  const handleContaRemove = async (conta: DreConta) => {
    try {
      const { error } = await supabase
        .from('dre_componentes')
        .delete()
        .eq('dre_conta_id', selectedConta?.id)
        .eq('conta_id', conta.id);

      if (error) throw error;

      setComponentesContas(prev => prev.filter(c => c.id !== conta.id));
    } catch (error) {
      console.error('Erro ao remover conta:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gerenciar Componentes da Conta</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

          {/* Componentes Disponíveis */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar componentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Categorias Disponíveis */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Categorias</h3>
                <div className="border rounded-lg p-4 h-[calc(100vh-380px)] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : categorias.length === 0 ? (
                    <p className="text-gray-500 text-center mt-8">
                      Nenhuma categoria disponível
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {categorias
                        .filter(categoria =>
                          categoria.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          categoria.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .filter(categoria => !componentesCategorias.some(c => c.id === categoria.id))
                        .map(categoria => (
                          <button
                            key={categoria.id}
                            onClick={() => handleCategoriaAdd(categoria)}
                            disabled={!selectedConta}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                              !selectedConta
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{categoria.nome}</div>
                                <div className="text-sm text-gray-500">Código: {categoria.codigo}</div>
                              </div>
                              <ArrowRight size={20} className="text-gray-400" />
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Indicadores e Contas Disponíveis */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Indicadores e Contas</h3>
                <div className="border rounded-lg p-4 h-[calc(100vh-380px)] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : indicadores.length === 0 && contasDisponiveis.length === 0 ? (
                    <p className="text-gray-500 text-center mt-8">
                      Nenhum indicador ou conta disponível
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {/* Indicadores */}
                      {indicadores
                        .filter(indicador =>
                          indicador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          indicador.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .filter(indicador => !componentesIndicadores.some(i => i.id === indicador.id))
                        .map(indicador => (
                          <button
                            key={indicador.id}
                            onClick={() => handleIndicadorAdd(indicador)}
                            disabled={!selectedConta}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                              !selectedConta
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{indicador.nome}</div>
                                <div className="text-sm text-gray-500">Código: {indicador.codigo}</div>
                              </div>
                              <ArrowRight size={20} className="text-gray-400" />
                            </div>
                          </button>
                        ))}

                      {/* Contas */}
                      {contasDisponiveis
                        .filter(conta =>
                          conta.nome.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .filter(conta => !componentesContas.some(c => c.id === conta.id))
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
            </div>
          </div>

          {/* Componentes Associados */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Componentes da Conta
              {selectedConta && (
                <div className="text-sm text-gray-500 mt-1">{selectedConta.nome}</div>
              )}
            </h3>
            <div className="space-y-4">
              {/* Categorias Associadas */}
              <div>
                <h4 className="text-md font-medium mb-2">Categorias</h4>
                <div className="border rounded-lg p-4 h-[calc((100vh-380px)/3)] overflow-y-auto">
                  {!selectedConta ? (
                    <p className="text-gray-500 text-center mt-2">
                      Selecione uma conta
                    </p>
                  ) : loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : componentesCategorias.length === 0 ? (
                    <p className="text-gray-500 text-center mt-2">
                      Nenhuma categoria associada
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {componentesCategorias.map(categoria => (
                        <button
                          key={categoria.id}
                          onClick={() => handleCategoriaRemove(categoria)}
                          className="w-full text-left px-4 py-2 rounded-lg transition-colors hover:bg-gray-100"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{categoria.nome}</div>
                              <div className="text-sm text-gray-500">Código: {categoria.codigo}</div>
                            </div>
                            <X size={20} className="text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Indicadores Associados */}
              <div>
                <h4 className="text-md font-medium mb-2">Indicadores</h4>
                <div className="border rounded-lg p-4 h-[calc((100vh-380px)/3)] overflow-y-auto">
                  {!selectedConta ? (
                    <p className="text-gray-500 text-center mt-2">
                      Selecione uma conta
                    </p>
                  ) : loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : componentesIndicadores.length === 0 ? (
                    <p className="text-gray-500 text-center mt-2">
                      Nenhum indicador associado
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {componentesIndicadores.map(indicador => (
                        <button
                          key={indicador.id}
                          onClick={() => handleIndicadorRemove(indicador)}
                          className="w-full text-left px-4 py-2 rounded-lg transition-colors hover:bg-gray-100"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{indicador.nome}</div>
                              <div className="text-sm text-gray-500">Código: {indicador.codigo}</div>
                            </div>
                            <X size={20} className="text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Contas Associadas */}
              <div>
                <h4 className="text-md font-medium mb-2">Contas</h4>
                <div className="border rounded-lg p-4 h-[calc((100vh-380px)/3)] overflow-y-auto">
                  {!selectedConta ? (
                    <p className="text-gray-500 text-center mt-2">
                      Selecione uma conta
                    </p>
                  ) : loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : componentesContas.length === 0 ? (
                    <p className="text-gray-500 text-center mt-2">
                      Nenhuma conta associada
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {componentesContas.map(conta => (
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

export default ComponentesModal;