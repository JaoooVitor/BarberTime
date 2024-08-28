import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import './styles.css';

import Header from './components/Header';
import Sidebar from './components/Sidebar';

import Agendamentos from './pages/Agendamentos';
import Clientes from './pages/Clientes';
import Colaboradores from './pages/Colaboradores';
import Servicos from './pages/ServicosProdutos';
import Horarios from './pages/Horarios';

const AppRoutes = () => {
  return (
    <>
      <Header />
      <div className="container-fluid h-100">
        <div className="row h-100">
          <Router>
            <Sidebar />

            <Routes>
              <Route path="/" element={<Agendamentos />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/colaboradores" element={<Colaboradores />} />
              <Route path="/servicos" element={<Servicos />} />
              <Route path="/horarios" element={<Horarios />} />
              

            </Routes>
          </Router>
        </div>
      </div>
    </>
  );
};

export default AppRoutes;
