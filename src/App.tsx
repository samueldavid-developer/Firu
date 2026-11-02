import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inquilinos from './pages/Inquilinos';
import Contratos from './pages/Contratos';
import Ingresos from './pages/Ingresos';
import Gastos from './pages/Gastos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="inquilinos" element={<Inquilinos />} />
          <Route path="contratos" element={<Contratos />} />
          <Route path="ingresos" element={<Ingresos />} />
          <Route path="gastos" element={<Gastos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
