import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EditarContaModalProps {
  isOpen: boolean;
  onClose: () => void;
  conta: {
    id: string;
    nome: string;
    conta_pai: string | null;
  } | null;
}

interface DreConta {
  id: string;
  nome: string;
  ordem: number;
}

const EditarContaModal: React.FC<EditarContaModalProps> = ({ isOpen, onClose, conta }) => {
  const [formData, setFormData] = useState({
    nome: '',
    conta_pai: ''
  });
  const [contas, setContas] = useState<DreConta[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && conta) {
      setFormData({
        nome: conta.nome,
        conta_pai: conta.conta_pai || ''
      });
      loadContas();
    }
  }, [isOpen, conta]);

  const loadContas = async () => {
    try {
      const { data, error } = await supabase
        .from('dre_contas')
        .select('id, nome, ordem')
        .eq('ativo', true)
        .neq('id', conta?.id) // Exclui a conta atual das opções
        .order('ordem');

      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conta) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('dre_contas')
        .update({
          nome: formData.nome,
          conta_pai: formData.conta_pai || null
        })
        .eq('id', conta.id);

      if (error) throw error;
      
      onClose();
      // Recarregar a página para atualizar a lista
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      alert('Erro ao atualizar conta. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !conta) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Editar Conta</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="conta_pai" className="block text-sm font-medium text-gray-700 mb-1">
              Conta Pai
            </label>
            <select
              id="conta_pai"
              value={formData.conta_pai}
              onChange={(e) => setFormData({ ...formData, conta_pai: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Nenhuma (conta raiz)</option>
              {contas.map(conta => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome} (ordem: {conta.ordem})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarContaModal;