import React from 'react';
import { Link } from 'react-router-dom';
import { Database, Home } from 'lucide-react';

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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;