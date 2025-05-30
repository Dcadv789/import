import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Empresa {
  id: string;
  razao_social: string;
}

interface Indicador {
  id: string;
  codigo: string;
  nome: string;
}

interface EmpresaRelationshipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmpresaRelationshipsModal: React.FC<EmpresaRelationshipsModalProps> = ({ isOpen, onClose }) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [unassignedIndicadores, setUnassignedIndicadores] = useState<Indicador[]>([]);
  const [empresaIndicadores, setEmpresaIndicadores] = useState<Indicador[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEmpresas();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedEmpresa) {
      loadIndicadores();
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

  const loadIndicadores = async () => {
    if (!selectedEmpresa) return;

    setLoading(true);
    try {
      // Buscar indicadores associados à empresa selecionada
      const { data: assigned, error: assignedError } = await supabase
        .from('indicadores_empresas')
        .select(`
          indicador:indicador_id (
            id,
            codigo,
            nome
          )
        `)
        .eq('empresa_id', selectedEmpresa.id);

      if (assignedError) throw assignedError;

      const assignedIndicadores = assigned
        ?.map(item => item.indicador)
        .filter((item): item is Indicador => item !== null) || [];

      setEmpresaIndicadores(assignedIndicadores);

      // Buscar todos os indicadores
      const { data: allIndicadores, error: allError } = await supabase
        .from('indicadores')
        .select('id, codigo, nome')
        .order('nome');

      if (allError) throw allError;

      // Filtrar indicadores não associados
      const assignedIds = new Set(assignedIndicadores.map(i => i.id));
      const unassigned = (allIndicadores || []).filter(
        indicador => !assignedIds.has(indicador.id)
      );

      setUnassignedIndicadores(unassigned);
    } catch (error) {
      console.error('Erro ao carregar indicadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmpresaSelect = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
  };

  const handleIndicadorAssign = async (indicador: Indicador) => {
    if (!selectedEmpresa) return;

    try {
      const { error } = await supabase
        .from('indicadores_empresas')
        .insert({
          indicador_id: indicador.id,
          empresa_id: selectedEmpresa.id
        });

      if (error) throw error;

      setUnassignedIndicadores(prev => prev.filter(i => i.id !== indicador.id));
      setEmpresaIndicadores(prev => [...prev, indicador]);
    } catch (error) {
      console.error('Erro ao associar indicador:', error);
    }
  };

  const handleIndicadorUnassign = async (indicador: Indicador) => {
    if (!selectedEmpresa) return;

    try {
      const { error } = await supabase
        .from('indicadores_empresas')
        .delete()
        .eq('indicador_id', indicador.id)
        .eq('empresa_id', selectedEmpresa.id);

      if (error) throw error;

      setEmpresaIndicadores(prev => prev.filter(i => i.id !== indicador.id));
      setUnassignedIndicadores(prev => [...prev, indicador]);
    } catch (error) {
      console.error('Erro ao desassociar indicador:', error);
    }
  };

  const filteredUnassignedIndicadores = unassignedIndicadores.filter(indicador =>
    indicador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    indicador.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Relacionar Indicadores com Empresas</h2>
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

          {/* Indicadores não associados */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Indicadores Disponíveis</h3>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar indicadores..."
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
              ) : filteredUnassignedIndicadores.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">
                  Nenhum indicador disponível
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredUnassignedIndicadores.map(indicador => (
                    <button
                      key={indicador.id}
                      onClick={() => handleIndicadorAssign(indicador)}
                      disabled={!selectedEmpresa}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        !selectedEmpresa
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

          {/* Indicadores da empresa */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Indicadores da Empresa
              {selectedEmpresa && <span className="text-gray-500 ml-2">({selectedEmpresa.razao_social})</span>}
            </h3>
            <div className="border rounded-lg p-4 h-96 overflow-y-auto">
              {!selectedEmpresa ? (
                <p className="text-gray-500 text-center mt-8">
                  Selecione uma empresa para ver seus indicadores
                </p>
              ) : loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : empresaIndicadores.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">
                  Nenhum indicador associado
                </p>
              ) : (
                <div className="space-y-2">
                  {empresaIndicadores.map(indicador => (
                    <button
                      key={indicador.id}
                      onClick={() => handleIndicadorUnassign(indicador)}
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

export default EmpresaRelationshipsModal;