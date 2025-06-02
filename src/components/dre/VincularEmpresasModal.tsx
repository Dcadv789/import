import React, { useState, useEffect } from 'react';
import { X, Search, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Empresa {
  id: string;
  razao_social: string;
}

interface VincularEmpresasModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccounts?: string[];
}

const VincularEmpresasModal: React.FC<VincularEmpresasModalProps> = ({
  isOpen,
  onClose,
  selectedAccounts = [],
}) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresas, setSelectedEmpresas] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEmpresas();
    }
  }, [isOpen]);

  const loadEmpresas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, razao_social')
        .order('razao_social');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmpresa = (empresaId: string) => {
    setSelectedEmpresas(prev => {
      const next = new Set(prev);
      if (next.has(empresaId)) {
        next.delete(empresaId);
      } else {
        next.add(empresaId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      // TODO: Implement save logic
      onClose();
    } catch (error) {
      console.error('Erro ao salvar vínculos:', error);
    }
  };

  if (!isOpen) return null;

  const filteredEmpresas = empresas.filter(empresa =>
    empresa.razao_social.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Vincular Empresas</h2>
            <p className="text-sm text-gray-600">
              {selectedAccounts.length === 0
                ? 'Selecione as empresas para vincular'
                : `${selectedAccounts.length} conta(s) selecionada(s)`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar empresas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto mb-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredEmpresas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma empresa encontrada
            </p>
          ) : (
            <div className="space-y-2">
              {filteredEmpresas.map(empresa => (
                <button
                  key={empresa.id}
                  onClick={() => toggleEmpresa(empresa.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedEmpresas.has(empresa.id)
                      ? 'bg-blue-50 border-blue-500'
                      : 'hover:bg-gray-50 border-gray-200'
                  } border`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{empresa.razao_social}</span>
                    {selectedEmpresas.has(empresa.id) && (
                      <ArrowRight className="text-blue-500" size={20} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={selectedEmpresas.size === 0}
            className={`px-6 py-2 rounded-lg transition-colors ${
              selectedEmpresas.size === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Vincular ({selectedEmpresas.size})
          </button>
        </div>
      </div>
    </div>
  );
};

export default VincularEmpresasModal;