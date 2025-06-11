import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Categoria from './pages/Categoria';
import Grupo from './pages/Grupo';
import Indicador from './pages/Indicador';
import Lancamento from './pages/Lancamento';
import DreConfig from './pages/DreConfig';
import Vendas from './pages/Vendas';
import Clientes from './pages/Clientes';
import DespesasVendedores from './pages/DespesasVendedores';
import MetaVendas from './pages/MetaVendas';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categoria" element={<Categoria />} />
          <Route path="/grupo" element={<Grupo />} />
          <Route path="/indicador" element={<Indicador />} />
          <Route path="/lancamento" element={<Lancamento />} />
          <Route path="/dre-config" element={<DreConfig />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/despesas-vendedores" element={<DespesasVendedores />} />
          <Route path="/meta-vendas" element={<MetaVendas />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App