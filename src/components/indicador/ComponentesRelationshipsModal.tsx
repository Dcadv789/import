import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Indicador {
  id: string;
  codigo: string;
  nome: string;
}

interface Categoria {
  id: string;
  codigo: string;
  nome: string;
}

interface ComponentesRelationshipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ComponentesRelationshipsModal: React.FC<ComponentesRelationshipsModalProps> = ({ isOpen, onClose }) => {
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [selectedIndicador, setSelectedIndicador] = useState<Indicador | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [indicadoresDisponiveis, setIndicadoresDisponiveis] = useState<Indicador[]>([]);
  const [componentesCategorias, setComponentesCategorias] = useState<Categoria[]>([]);
  const [componentesIndicadores, setComponentesIndicadores] = useState<Indicador[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadIndicadores();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedIndicador) {
      loadComponentes();
    }
  }, [selectedIndicador]);

  const loadIndicadores = async () => {
    try {
      const { data, error } = await supabase
        .from('indicadores')
        .select('id, codigo, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setIndicadores(data || []);
    } catch (error) {
      console.error('Erro ao carregar indicadores:', error);
    }
  };

  const loadComponentes = async () => {
    if (!selectedIndicador) return;

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

      // Carregar indicadores disponíveis (exceto o selecionado)
      const { data: indicadoresData, error: indicadoresError } = await supabase
        .from('indicadores')
        .select('id, codigo, nome')
        .eq('ativo', true)
        .neq('id', selectedIndicador.id)
        .order('nome');

      if (indicadoresError) throw indicadoresError;
      setIndicadoresDisponiveis(indicadoresData || []);

      // Carregar componentes já associados
      const { data: composicaoData, error: composicaoError } = await supabase
        .from('indicadores_composicao')
        .select(`
          componente_categoria_id,
          componente_indicador_id,
          categorias:componente_categoria_id (id, codigo, nome),
          indicadores:componente_indicador_id (id, codigo, nome)
        `)
        .eq('indicador_base_id', selectedIndicador.id);

      if (composicaoError) throw composicaoError;

      const categoriasAssociadas = composicaoData
        ?.filter(item => item.categorias)
        .map(item => item.categorias) as Categoria[];
      
      const indicadoresAssociados = composicaoData
        ?.filter(item => item.indicadores)
        .map(item => item.indicadores) as Indicador[];

      setComponentesCategorias(categoriasAssociadas || []);
      setComponentesIndicadores(indicadoresAssociados || []);
    } catch (error) {
      console.error('Erro ao carregar componentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIndicadorSelect = (indicador: Indicador) => {
    setSelectedIndicador(indicador);
    setSearchTerm('');
  };

  const handleCategoriaAdd = async (categoria: Categoria) => {
    try {
      const { error } = await supabase
        .from('indicadores_composicao')
        .insert({
          indicador_base_id: selectedIndicador?.id,
          componente_categoria_id: categoria.id,
          componente_indicador_id: null
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
        .from('indicadores_composicao')
        .insert({
          indicador_base_id: selectedIndicador?.id,
          componente_categoria_id: null,
          componente_indicador_id: indicador.id
        });

      if (error) throw error;

      setComponentesIndicadores(prev => [...prev, indicador]);
    } catch (error) {
      console.error('Erro ao adicionar indicador:', error);
    }
  };

  const handleCategoriaRemove = async (categoria: Categoria) => {
    try {
      const { error } = await supabase
        .from('indicadores_composicao')
        .delete()
        .eq('indicador_base_id', selectedIndicador?.id)
        .eq('componente_categoria_id', categoria.id);

      if (error) throw error;

      setComponentesCategorias(prev => prev.filter(c => c.id !== categoria.id));
    } catch (error) {
      console.error('Erro ao remover categoria:', error);
    }
  };

  const handleIndicadorRemove = async (indicador: Indicador) => {
    try {
      const { error } = await supabase
        .from('indicadores_composicao')
        .delete()
        .eq('indicador_base_id', selectedIndicador?.id)
        .eq('componente_indicador_id', indicador.id);

      if (error) throw error;

      setComponentesIndicadores(prev => prev.filter(i => i.id !== indicador.id));
    } catch (error) {
      console.error('Erro ao remover indicador:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gerenciar Componentes do Indicador</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Lista de Indicadores */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Indicadores Base</h3>
            <div className="border rounded-lg p-4 h-[calc(100vh-300px)] overflow-y-auto">
              {indicadores.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">
                  Nenhum indicador encontrado
                </p>
              ) : (
                <div className="space-y-2">
                  {indicadores.map(indicador => (
                    <button
                      key={indicador.id}
                      onClick={() => handleIndicadorSelect(indicador)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        selectedIndicador?.id === indicador.id
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{indicador.nome}</div>
                      <div className="text-sm text-gray-500">Código: {indicador.codigo}</div>
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
                <h3 className="text-lg font-semibold mb-4">Categorias Disponíveis</h3>
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
                            disabled={!selectedIndicador}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                              !selectedIndicador
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

              {/* Indicadores Disponíveis */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Indicadores Disponíveis</h3>
                <div className="border rounded-lg p-4 h-[calc(100vh-380px)] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : indicadoresDisponiveis.length === 0 ? (
                    <p className="text-gray-500 text-center mt-8">
                      Nenhum indicador disponível
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {indicadoresDisponiveis
                        .filter(indicador =>
                          indicador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          indicador.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .filter(indicador => !componentesIndicadores.some(i => i.id === indicador.id))
                        .map(indicador => (
                          <button
                            key={indicador.id}
                            onClick={() => handleIndicadorAdd(indicador)}
                            disabled={!selectedIndicador}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                              !selectedIndicador
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Componentes Associados */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Componentes do Indicador
              {selectedIndicador && (
                <div className="text-sm text-gray-500 mt-1">{selectedIndicador.nome}</div>
              )}
            </h3>
            <div className="space-y-4">
              {/* Categorias Associadas */}
              <div>
                <h4 className="text-md font-medium mb-2">Categorias</h4>
                <div className="border rounded-lg p-4 h-[calc((100vh-380px)/2)] overflow-y-auto">
                  {!selectedIndicador ? (
                    <p className="text-gray-500 text-center mt-2">
                      Selecione um indicador
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
                <div className="border rounded-lg p-4 h-[calc((100vh-380px)/2)] overflow-y-auto">
                  {!selectedIndicador ? (
                    <p className="text-gray-500 text-center mt-2">
                      Selecione um indicador
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

export default ComponentesRelationshipsModal;