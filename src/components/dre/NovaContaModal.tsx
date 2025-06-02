import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface NovaContaModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentAccount?: {
    id: string;
    nome: string;
    ordem: number;
  } | null;
}

const NovaContaModal: React.FC<NovaContaModalProps> = ({ isOpen, onClose, parentAccount }) => {
  const [formData, setFormData] = useState({
    nome: '',
    ordem: '',
    simbolo: '+',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('dre_contas')
        .insert({
          nome: formData.nome,
          ordem: parseInt(formData.ordem),
          simbolo: formData.simbolo,
          conta_pai: parentAccount?.id || null,
          ativo: true,
          visivel: true
        });

      if (error) throw error;
      
      onClose();
      // Recarregar a página para atualizar a lista
      window.location.reload();
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      alert('Erro ao criar conta. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {parentAccount ? 'Nova Subconta' : 'Nova Conta'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {parentAccount && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conta Pai
              </label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">{parentAccount.nome}</p>
                <p className="text-sm text-gray-500">Ordem: {parentAccount.ordem}</p>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="ordem" className="block text-sm font-medium text-gray-700 mb-1">
              Ordem
            </label>
            <input
              type="number"
              id="ordem"
              value={formData.ordem}
              onChange={(e) => setFormData({ ...formData, ordem: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

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
            <label htmlFor="simbolo" className="block text-sm font-medium text-gray-700 mb-1">
              Símbolo
            </label>
            <select
              id="simbolo"
              value={formData.simbolo}
              onChange={(e) => setFormData({ ...formData, simbolo: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="+">+ (Adição)</option>
              <option value="-">- (Subtração)</option>
              <option value="=">=  (Resultado)</option>
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

export default NovaContaModal;