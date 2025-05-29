import React, { useState } from 'react';
import { X } from 'lucide-react';

interface RelationshipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RelationshipsModal: React.FC<RelationshipsModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gerenciar Relacionamentos</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Grupos</h3>
            <div className="border rounded-lg p-4 h-64 overflow-y-auto">
              <p className="text-gray-500 text-center mt-8">
                Selecione um grupo para relacionar
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Categorias</h3>
            <div className="border rounded-lg p-4 h-64 overflow-y-auto">
              <p className="text-gray-500 text-center mt-8">
                Selecione as categorias que deseja relacionar
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            onClick={() => {
              onClose();
            }}
          >
            Salvar Relacionamentos
          </button>
        </div>
      </div>
    </div>
  );
};

export default RelationshipsModal;