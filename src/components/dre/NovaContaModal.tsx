import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NovaContaModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentAccount?: {
    id: string;
    codigo: string;
    nome: string;
  } | null;
}

const NovaContaModal: React.FC<NovaContaModalProps> = ({ isOpen, onClose, parentAccount }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    tipo: 'Receita',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement account creation logic
    onClose();
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
                <p className="text-sm text-gray-500">Código: {parentAccount.codigo}</p>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-1">
              Código
            </label>
            <input
              type="text"
              id="codigo"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
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
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              id="tipo"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="Receita">Receita</option>
              <option value="Custo">Custo</option>
              <option value="Despesa">Despesa</option>
            </select>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovaContaModal;