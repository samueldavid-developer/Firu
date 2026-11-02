import React, { useEffect, useMemo, useState } from 'react';
import { db, collection, getDocs, doc, deleteDoc, mapDocs } from '../lib/fire';
import type { Gasto } from '../types/database';
import Modal from '../components/Modal';
import GastoForm from '../components/GastoForm';
import MetricCard from '../components/MetricCard';
import { MESES, formatCurrency, formatDate } from '../lib/payments';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Receipt,
  TrendingDown,
  Wallet,
  CalendarDays
} from 'lucide-react';

interface Periodo {
  clave: string;
  etiqueta: string;
  anio: number;
  mes: number;
  total: number;
  cantidad: number;
}

const etiquetaPeriodo = (anio: number, mes: number) => `${MESES[mes - 1]} ${anio}`;

const claveDeGasto = (gasto: Gasto) => {
  const [anio, mes] = gasto.fecha.split('T')[0].split('-').map(Number);
  return `${anio}-${String(mes).padStart(2, '0')}`;
};

const Gastos: React.FC = () => {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<Gasto | undefined>();

  const fetchGastos = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'gastos'));
      const data = mapDocs<Gasto>(snapshot).sort((a, b) =>
        (b.fecha || '').localeCompare(a.fecha || '')
      );
      setGastos(data);
    } catch (error) {
      console.error('Error fetching gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGastos();
  }, []);

  const resumen = useMemo(() => {
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    const porPeriodo = new Map<string, Periodo>();

    gastos.forEach(gasto => {
      const [anio, mes] = gasto.fecha.split('T')[0].split('-').map(Number);
      const clave = claveDeGasto(gasto);
      const existente = porPeriodo.get(clave);

      if (existente) {
        existente.total += gasto.monto;
        existente.cantidad += 1;
      } else {
        porPeriodo.set(clave, {
          clave,
          etiqueta: etiquetaPeriodo(anio, mes),
          anio,
          mes,
          total: gasto.monto,
          cantidad: 1
        });
      }
    });

    const periodos = Array.from(porPeriodo.values()).sort((a, b) => b.clave.localeCompare(a.clave));

    return {
      periodos,
      totalMesActual: porPeriodo.get(`${anioActual}-${String(mesActual).padStart(2, '0')}`)?.total || 0,
      totalAnioActual: gastos
        .filter(g => Number(g.fecha.split('T')[0].split('-')[0]) === anioActual)
        .reduce((acc, g) => acc + g.monto, 0),
      totalHistorico: gastos.reduce((acc, g) => acc + g.monto, 0)
    };
  }, [gastos]);

  const gastosFiltrados = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return gastos.filter(gasto => {
      const coincidePeriodo =
        periodoSeleccionado === 'todos' || claveDeGasto(gasto) === periodoSeleccionado;
      const coincideBusqueda = gasto.descripcion.toLowerCase().includes(term);
      return coincidePeriodo && coincideBusqueda;
    });
  }, [gastos, periodoSeleccionado, searchTerm]);

  const totalFiltrado = gastosFiltrados.reduce((acc, g) => acc + g.monto, 0);

  const handleAddClick = () => {
    setSelectedGasto(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (gasto: Gasto) => {
    setSelectedGasto(gasto);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (gasto: Gasto) => {
    if (!confirm(`¿Eliminar el gasto "${gasto.descripcion}"? Esta acción no se puede deshacer.`)) return;

    try {
      await deleteDoc(doc(db, 'gastos', gasto.id));
      fetchGastos();
    } catch (error) {
      console.error('Error deleting gasto:', error);
      alert('Error al eliminar el gasto');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">Gastos</h2>
          <p className="text-gray-500 mt-1 truncate">{gastos.length} gastos registrados</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-border-card text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 group shrink-0"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-sm font-bold">Nuevo gasto</span>
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Gastos este mes"
          value={formatCurrency(resumen.totalMesActual)}
          subtitle={etiquetaPeriodo(new Date().getFullYear(), new Date().getMonth() + 1)}
          icon={Receipt}
          iconBgColor="bg-red-500/10"
          iconColor="text-red-500"
        />
        <MetricCard
          title="Gastos este año"
          value={formatCurrency(resumen.totalAnioActual)}
          subtitle={String(new Date().getFullYear())}
          icon={TrendingDown}
          iconBgColor="bg-orange-500/10"
          iconColor="text-orange-500"
        />
        <MetricCard
          title="Total histórico"
          value={formatCurrency(resumen.totalHistorico)}
          subtitle={`${resumen.periodos.length} meses con movimiento`}
          icon={Wallet}
          iconBgColor="bg-blue-500/10"
          iconColor="text-blue-500"
        />
        <MetricCard
          title="Registros"
          value={gastos.length}
          subtitle="egresos cargados"
          icon={CalendarDays}
          iconBgColor="bg-yellow-500/10"
          iconColor="text-yellow-500"
        />
      </div>

      {/* Desglose por período */}
      {resumen.periodos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Desglose por período</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {resumen.periodos.map(periodo => {
              const activo = periodoSeleccionado === periodo.clave;
              return (
                <button
                  key={periodo.clave}
                  onClick={() => setPeriodoSeleccionado(activo ? 'todos' : periodo.clave)}
                  className={`text-left bg-bg-card border rounded-2xl p-5 transition-all ${activo ? 'border-brand/60' : 'border-border-card hover:border-brand/30'
                    }`}
                >
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{periodo.etiqueta}</div>
                  <div className="text-xl font-bold text-red-500 mt-2">{formatCurrency(periodo.total)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {periodo.cantidad} gasto{periodo.cantidad === 1 ? '' : 's'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-card border border-border-card rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand transition-all shadow-sm"
          />
        </div>
        <select
          value={periodoSeleccionado}
          onChange={(e) => setPeriodoSeleccionado(e.target.value)}
          className="bg-bg-card border border-border-card rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand transition-all appearance-none cursor-pointer md:w-64"
        >
          <option value="todos">Todos los períodos</option>
          {resumen.periodos.map(periodo => (
            <option key={periodo.clave} value={periodo.clave}>{periodo.etiqueta}</option>
          ))}
        </select>
      </div>

      {/* Lista móvil (tarjetas) */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="bg-bg-card border border-border-card rounded-2xl p-8 flex flex-col items-center gap-3">
            <RefreshCw className="animate-spin text-brand" size={28} />
            <span className="text-sm text-gray-500 font-medium">Cargando gastos...</span>
          </div>
        ) : gastosFiltrados.length === 0 ? (
          <div className="bg-bg-card border border-border-card rounded-2xl p-8 text-center text-sm text-gray-500">
            No hay gastos para mostrar
          </div>
        ) : (
          <>
            {gastosFiltrados.map(gasto => (
              <div key={gasto.id} className="bg-bg-card border border-border-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white truncate">{gasto.descripcion}</div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {formatDate(gasto.fecha)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditClick(gasto)}
                      className="p-2 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(gasto)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Eliminar gasto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-border-card">
                  <span className="text-xs text-gray-500 truncate">
                    Registrado {gasto.createdAt ? formatDate(gasto.createdAt) : '—'}
                  </span>
                  <span className="text-base font-bold text-red-500 shrink-0">
                    -{formatCurrency(gasto.monto)}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 bg-bg-sidebar/50 border border-border-card rounded-2xl p-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider truncate">
                Total ({gastosFiltrados.length})
              </span>
              <span className="text-sm font-bold text-red-500 shrink-0">-{formatCurrency(totalFiltrado)}</span>
            </div>
          </>
        )}
      </div>

      {/* Tabla (desktop) */}
      <div className="hidden sm:block bg-bg-card border border-border-card rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-border-card bg-bg-sidebar/50">
                <th className="px-6 py-5">Descripción</th>
                <th className="px-6 py-5">Fecha del gasto</th>
                <th className="px-6 py-5">Monto</th>
                <th className="px-6 py-5">Registrado</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-brand" size={32} />
                      <span className="text-sm text-gray-500 font-medium">Cargando gastos...</span>
                    </div>
                  </td>
                </tr>
              ) : gastosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                    No hay gastos para mostrar
                  </td>
                </tr>
              ) : (
                gastosFiltrados.map(gasto => (
                  <tr key={gasto.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white group-hover:text-brand transition-colors">
                        {gasto.descripcion}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(gasto.fecha)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-red-500">-{formatCurrency(gasto.monto)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {gasto.createdAt ? formatDate(gasto.createdAt) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(gasto)}
                          className="p-2 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(gasto)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Eliminar gasto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && gastosFiltrados.length > 0 && (
              <tfoot>
                <tr className="border-t border-border-card bg-bg-sidebar/50">
                  <td colSpan={2} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total ({gastosFiltrados.length})
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-red-500">-{formatCurrency(totalFiltrado)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal de alta/edición */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedGasto ? 'Editar gasto' : 'Nuevo gasto'}
      >
        <GastoForm
          initialData={selectedGasto}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchGastos();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Gastos;
