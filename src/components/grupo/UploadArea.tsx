import React, { useRef } from 'react';
import { FileSpreadsheet, Upload } from 'lucide-react';

interface UploadAreaProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      <div
        className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <FileSpreadsheet size={64} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Arraste e solte sua planilha aqui</h2>
        <p className="text-gray-500 mb-6">ou</p>
        <button
          onClick={triggerFileInput}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
        >
          <Upload size={20} />
          <span>Selecionar arquivo</span>
        </button>
        <p className="mt-4 text-sm text-gray-500">
          Formatos aceitos: .xlsx, .xls, .csv
        </p>
      </div>
    </>
  );
};

export default UploadArea;