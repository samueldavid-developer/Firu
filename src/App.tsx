import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Propietarios from './pages/Propietarios';
import Propiedades from './pages/Propiedades';
import Inquilinos from './pages/Inquilinos';
import Contratos from './pages/Contratos';
import Pagos from './pages/Pagos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="propietarios" element={<Propietarios />} />
          <Route path="propiedades" element={<Propiedades />} />
          <Route path="inquilinos" element={<Inquilinos />} />
          <Route path="contratos" element={<Contratos />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="servicios" element={<div className="p-8"><h2 className="text-2xl font-bold">Servicios</h2><p className="text-gray-500 mt-2">Próximamente...</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}