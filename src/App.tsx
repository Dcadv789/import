import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Categoria from './pages/Categoria';
import Grupo from './pages/Grupo';
import Indicador from './pages/Indicador';
import Lancamento from './pages/Lancamento';

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
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;