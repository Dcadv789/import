import React from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Bem-vindo ao ImportaData
        </h1>
        <p className="text-xl text-gray-600">
          Plataforma simples para importação de dados em massa para o Supabase
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Como funciona
        </h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800">Prepare sua planilha</h3>
              <p className="text-gray-600">
                Organize seus dados em uma planilha Excel ou CSV com as colunas apropriadas.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800">Acesse a página de categoria</h3>
              <p className="text-gray-600">
                Navegue até a página de categoria onde você encontrará a opção de upload.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800">Faça o upload</h3>
              <p className="text-gray-600">
                Carregue sua planilha e aguarde enquanto os dados são processados e importados.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link 
          to="/categoria" 
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors text-lg"
        >
          <FileSpreadsheet size={20} />
          <span>Ir para Importação de Dados</span>
          <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
};

export default Home;