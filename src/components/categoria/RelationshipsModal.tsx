import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Group {
  id: string;
  nome: string;
}

interface Category {
  id: string;
  codigo: string;
  nome: string;
  grupo_id: string | null;
}

interface RelationshipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RelationshipsModal: React.FC<RelationshipsModalProps> = ({ isOpen, onClose }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [unassignedCategories, setUnassignedCategories] = useState<Category[]>([]);
  const [groupCategories, setGroupCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedGroup) {
      loadCategories();
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_grupo')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  };

  const loadCategories = async () => {
    if (!selectedGroup) return;

    setLoading(true);
    try {
      // Buscar categorias não associadas
      const { data: unassigned, error: unassignedError } = await supabase
        .from('categorias')
        .select('id, codigo, nome, grupo_id')
        .is('grupo_id', null)
        .order('nome');

      if (unassignedError) throw unassignedError;
      setUnassignedCategories(unassigned || []);

      // Buscar categorias do grupo selecionado
      const { data: assigned, error: assignedError } = await supabase
        .from('categorias')
        .select('id, codigo, nome, grupo_id')
        .eq('grupo_id', selectedGroup.id)
        .order('nome');

      if (assignedError) throw assignedError;
      setGroupCategories(assigned || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
  };

  const handleCategoryAssign = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categorias')
        .update({ grupo_id: selectedGroup?.id })
        .eq('id', category.id);

      if (error) throw error;

      // Atualizar as listas localmente
      setUnassignedCategories(prev => prev.filter(c => c.id !== category.id));
      setGroupCategories(prev => [...prev, { ...category, grupo_id: selectedGroup?.id }]);
    } catch (error) {
      console.error('Erro ao associar categoria:', error);
    }
  };

  const handleCategoryUnassign = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categorias')
        .update({ grupo_id: null })
        .eq('id', category.id);

      if (error) throw error;

      // Atualizar as listas localmente
      setGroupCategories(prev => prev.filter(c => c.id !== category.id));
      setUnassignedCategories(prev => [...prev, { ...category, grupo_id: null }]);
    } catch (error) {
      console.error('Erro ao desassociar categoria:', error);
    }
  };

  const filteredUnassignedCategories = unassignedCategories.filter(category =>
    category.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gerenciar Relacionamentos</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lista de Grupos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Grupos</h3>
            <div className="border rounded-lg p-4 h-96 overflow-y-auto">
              {groups.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">
                  Nenhum grupo encontrado
                </p>
              ) : (
                <div className="space-y-2">
                  {groups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => handleGroupSelect(group)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        selectedGroup?.id === group.id
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {group.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Categorias não associadas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categorias Disponíveis</h3>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar categorias..."
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
              ) : filteredUnassignedCategories.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">
                  Nenhuma categoria disponível
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredUnassignedCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryAssign(category)}
                      disabled={!selectedGroup}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        !selectedGroup
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{category.nome}</div>
                          <div className="text-sm text-gray-500">Código: {category.codigo}</div>
                        </div>
                        <ArrowRight size={20} className="text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Categorias do grupo */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Categorias do Grupo
              {selectedGroup && <span className="text-gray-500 ml-2">({selectedGroup.nome})</span>}
            </h3>
            <div className="border rounded-lg p-4 h-96 overflow-y-auto">
              {!selectedGroup ? (
                <p className="text-gray-500 text-center mt-8">
                  Selecione um grupo para ver suas categorias
                </p>
              ) : loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : groupCategories.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">
                  Nenhuma categoria associada
                </p>
              ) : (
                <div className="space-y-2">
                  {groupCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryUnassign(category)}
                      className="w-full text-left px-4 py-2 rounded-lg transition-colors hover:bg-gray-100"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{category.nome}</div>
                          <div className="text-sm text-gray-500">Código: {category.codigo}</div>
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

export default RelationshipsModal;