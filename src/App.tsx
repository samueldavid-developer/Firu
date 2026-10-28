import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="propietarios" element={<div className="p-8"><h2 className="text-2xl font-bold">Propietarios</h2><p className="text-gray-500 mt-2">Próximamente...</p></div>} />
          <Route path="propiedades" element={<div className="p-8"><h2 className="text-2xl font-bold">Propiedades</h2><p className="text-gray-500 mt-2">Próximamente...</p></div>} />
          <Route path="inquilinos" element={<div className="p-8"><h2 className="text-2xl font-bold">Inquilinos</h2><p className="text-gray-500 mt-2">Próximamente...</p></div>} />
          <Route path="contratos" element={<div className="p-8"><h2 className="text-2xl font-bold">Contratos</h2><p className="text-gray-500 mt-2">Próximamente...</p></div>} />
          <Route path="pagos" element={<div className="p-8"><h2 className="text-2xl font-bold">Pagos</h2><p className="text-gray-500 mt-2">Próximamente...</p></div>} />
          <Route path="servicios" element={<div className="p-8"><h2 className="text-2xl font-bold">Servicios</h2><p className="text-gray-500 mt-2">Próximamente...</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}