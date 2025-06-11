import React, { useState, useEffect } from 'react';
import { Target, Edit2, Save, X, Plus, Search, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Empresa {
  id: string;
  razao_social: string;
}

interface Vendedor {
  id: string;
  codigo: string;
  nome: string;
  empresa_id: string;
}

interface Meta {
  id?: string;
  pessoa_id: string;
  mes: number;
  ano: number;
  valor_meta: number;
  observacao?: string;
  ativo: boolean;
}

interface EditingMeta {
  pessoa_id: string;
  mes: number;
  ano: number;
  valor_meta: string;
  observacao: string;
}

const MetaVendas: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [selectedMes, setSelectedMes] = useState<number>(new Date().getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState<number>(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingMeta, setEditingMeta] = useState<EditingMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const anos = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    loadEmpresas();
  }, []);

  useEffect(() => {
    if (selectedEmpresa) {
      loadVendedores();
    } else {
      setVendedores([]);
      setMetas([]);
    }
  }, [selectedEmpresa]);

  useEffect(() => {
    if (selectedEmpresa && vendedores.length > 0) {
      loadMetas();
    }
  }, [selectedEmpresa, vendedores, selectedMes, selectedAno]);

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
    } finally {
      setLoading(false);
    }
  };

  const loadVendedores = async () => {
    if (!selectedEmpresa) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pessoas')
        .select('id, codigo, nome, empresa_id')
        .eq('empresa_id', selectedEmpresa)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setVendedores(data || []);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetas = async () => {
    if (!selectedEmpresa || vendedores.length === 0) return;

    try {
      const vendedorIds = vendedores.map(v => v.id);
      
      const { data, error } = await supabase
        .from('metas_vendas')
        .select('*')
        .in('pessoa_id', vendedorIds)
        .eq('mes', selectedMes)
        .eq('ano', selectedAno)
        .eq('ativo', true);

      if (error) throw error;
      setMetas(data || []);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    }
  };

  const getMetaForVendedor = (vendedorId: string): Meta | undefined => {
    return metas.find(meta => meta.pessoa_id === vendedorId);
  };

  const handleEditMeta = (vendedor: Vendedor) => {
    const metaExistente = getMetaForVendedor(vendedor.id);
    
    setEditingMeta({
      pessoa_id: vendedor.id,
      mes: selectedMes,
      ano: selectedAno,
      valor_meta: metaExistente?.valor_meta?.toString() || '',
      observacao: metaExistente?.observacao || ''
    });
  };

  const handleSaveMeta = async () => {
    if (!editingMeta) return;

    setSaving(true);
    try {
      const valorMeta = parseFloat(editingMeta.valor_meta);
      if (isNaN(valorMeta) || valorMeta < 0) {
        alert('Por favor, insira um valor válido para a meta.');
        return;
      }

      const metaExistente = getMetaForVendedor(editingMeta.pessoa_id);

      if (metaExistente) {
        // Atualizar meta existente
        const { error } = await supabase
          .from('metas_vendas')
          .update({
            valor_meta: valorMeta,
            observacao: editingMeta.observacao || null
          })
          .eq('id', metaExistente.id);

        if (error) throw error;
      } else {
        // Criar nova meta
        const { error } = await supabase
          .from('metas_vendas')
          .insert({
            pessoa_id: editingMeta.pessoa_id,
            mes: editingMeta.mes,
            ano: editingMeta.ano,
            valor_meta: valorMeta,
            observacao: editingMeta.observacao || null,
            ativo: true
          });

        if (error) throw error;
      }

      await loadMetas();
      setEditingMeta(null);
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      alert('Erro ao salvar meta. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingMeta(null);
  };

  const filteredVendedores = vendedores.filter(vendedor =>
    vendedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendedor.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Metas de Vendas</h1>
        <p className="text-gray-600">
          Configure e gerencie as metas mensais de vendas para cada vendedor.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
            </label>
            <select
              id="empresa"
              value={selectedEmpresa}
              onChange={(e) => setSelectedEmpresa(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map(empresa => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.razao_social}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mes" className="block text-sm font-medium text-gray-700 mb-1">
              Mês
            </label>
            <select
              id="mes"
              value={selectedMes}
              onChange={(e) => setSelectedMes(Number(e.target.value))}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {meses.map(mes => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ano" className="block text-sm font-medium text-gray-700 mb-1">
              Ano
            </label>
            <select
              id="ano"
              value={selectedAno}
              onChange={(e) => setSelectedAno(Number(e.target.value))}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {anos.map(ano => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar Vendedor
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>
        </div>

        {selectedEmpresa && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>
              Configurando metas para: {meses.find(m => m.value === selectedMes)?.label} de {selectedAno}
            </span>
          </div>
        )}
      </div>

      {/* Lista de Vendedores */}
      {selectedEmpresa && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Target className="mr-2" size={20} />
              Vendedores e Metas
            </h2>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredVendedores.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {vendedores.length === 0 
                    ? 'Nenhum vendedor encontrado para esta empresa.'
                    : 'Nenhum vendedor encontrado com os filtros aplicados.'
                  }
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meta Atual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVendedores.map((vendedor) => {
                    const meta = getMetaForVendedor(vendedor.id);
                    const isEditing = editingMeta?.pessoa_id === vendedor.id;

                    return (
                      <tr key={vendedor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {vendedor.nome}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {vendedor.codigo}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center space-x-2">
                              <DollarSign size={16} className="text-gray-400" />
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingMeta.valor_meta}
                                onChange={(e) => setEditingMeta({
                                  ...editingMeta,
                                  valor_meta: e.target.value
                                })}
                                className="w-32 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0,00"
                              />
                            </div>
                          ) : (
                            <div className="text-sm text-gray-900">
                              {meta ? formatCurrency(meta.valor_meta) : (
                                <span className="text-gray-400 italic">Não definida</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <textarea
                              value={editingMeta.observacao}
                              onChange={(e) => setEditingMeta({
                                ...editingMeta,
                                observacao: e.target.value
                              })}
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Observações sobre a meta..."
                              rows={2}
                            />
                          ) : (
                            <div className="text-sm text-gray-500 max-w-xs">
                              {meta?.observacao || (
                                <span className="text-gray-400 italic">Sem observações</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {isEditing ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={handleSaveMeta}
                                disabled={saving}
                                className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                                title="Salvar meta"
                              >
                                <Save size={18} />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={saving}
                                className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                title="Cancelar edição"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditMeta(vendedor)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title={meta ? "Editar meta" : "Definir meta"}
                            >
                              {meta ? <Edit2 size={18} /> : <Plus size={18} />}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {!selectedEmpresa && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Target size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecione uma empresa
          </h3>
          <p className="text-gray-500">
            Escolha uma empresa para visualizar e configurar as metas de vendas dos vendedores.
          </p>
        </div>
      )}
    </div>
  );
};

export default MetaVendas;