import React from 'react';
import { Link } from 'react-router-dom';
import { Database, Home, FolderTree, LineChart, Receipt, Calculator, DollarSign, Users } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gray-800 text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 text-xl font-semibold">
          <Database size={24} />
          <span>ImportaData</span>
        </Link>
        
        <div className="flex space-x-6">
          <Link 
            to="/" 
            className="flex items-center space-x-1 hover:text-blue-300 transition-colors"
          >
            <Home size={18} />
            <span>Início</span>
          </Link>
          <Link 
            to="/categoria" 
            className="flex items-center space-x-1 hover:text-blue-300 transition-colors"
          >
            <Database size={18} />
            <span>Categoria</span>
          </Link>
          <Link 
            to="/grupo" 
            className="flex items-center space-x-1 hover:text-blue-300 transition-colors"
          >
            <FolderTree size={18} />
            <span>Grupo</span>
          </Link>
          <Link 
            to="/indicador" 
            className="flex items-center space-x-1 hover:text-blue-300 transition-colors"
          >
            <LineChart size={18} />
            <span>Indicador</span>
          </Link>
          <Link 
            to="/lancamento" 
            className="flex items-center space-x-1 hover:text-blue-300 transition-colors"
          >
            <Receipt size={18} />
            <span>Lançamento</span>
          </Link>
          <Link 
            to="/dre-config" 
            className="flex items-center space-x-1 hover:text-blue-300 transition-colors"
          >
            <Calculator size={18} />
            <span>DRE Config</span>
          </Link>
          <Link 
            to="/vendas" 
            className="flex items-center space-x-1 hover:text-blue-300 transition-colors"
          >
            <DollarSign size={18} />
            <span>Vendas</span>
          </Link>
          <Link 
            to="/clientes" 
            className="flex items-center space-x-1 hover:text-blue-300 transition-colors"
          >
            <Users size={18} />
            <span>Clientes</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;