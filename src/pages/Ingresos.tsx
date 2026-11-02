import React, { useEffect, useMemo, useState } from 'react';
import { db, collection, getDocs, query, where, mapDocs, fetchLookup } from '../lib/fire';
import type { Contrato, Inquilino, Pago, Gasto } from '../types/database';
import MetricCard from '../components/MetricCard';
import { MESES, formatCurrency, formatDate } from '../lib/payments';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Receipt,
  RefreshCw,
  Search,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';

interface Movimiento {
  id: string;
  tipo: 'ingreso' | 'gasto';
  concepto: string;
  /** Concepto contable: 'Alquiler', 'Condominio' o 'Gasto'. */
  categoria: string;
  anio: number;
  mes: number;
  monto: number;
  /** Fecha real del movimiento (cobro o gasto). */
  fecha: string;
  registrado: string;
}

interface ResumenPeriodo {
  clave: string;
  etiqueta: string;
  anio: number;
  mes: number;
  ingresos: number;
  gastos: number;
  balance: number;
}

type TipoFiltro = 'todos' | 'ingreso' | 'gasto';

const etiquetaPeriodo = (anio: number, mes: number) => `${MESES[mes - 1]} ${anio}`;

const Ingresos: React.FC = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('todos');
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('todos');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pagosSnap, gastosSnap, contratos, inquilinos] = await Promise.all([
        getDocs(query(collection(db, 'pagos'), where('estado', '==', 'Cobrado'))),
        getDocs(collection(db, 'gastos')),
        fetchLookup<Contrato>('contratos'),
        fetchLookup<Inquilino>('inquilinos')
      ]);

      const ingresos: Movimiento[] = mapDocs<Pago>(pagosSnap).map(pago => {
        const contrato = contratos[pago.contrato_id];
        return {
          id: `ingreso-${pago.id}`,
          tipo: 'ingreso',
          // El nombre congelado en el pago garantiza el historial aunque el contrato
          // o el inquilino se hayan eliminado; el lookup queda como respaldo.
          concepto: pago.inquilino_nombre || inquilinos[contrato?.inquilino_id || '']?.nombre || 'Sin inquilino',
          categoria: pago.concepto || 'Alquiler',
          anio: pago.anio,
          mes: pago.mes,
          monto: pago.monto,
          fecha: pago.fecha_cobro || pago.created_at || '',
          registrado: pago.created_at || ''
        };
      });

      const egresos: Movimiento[] = mapDocs<Gasto>(gastosSnap).map(gasto => {
        const [anio, mes] = gasto.fecha.split('T')[0].split('-').map(Number);
        return {
          id: `gasto-${gasto.id}`,
          tipo: 'gasto',
          concepto: gasto.descripcion,
          categoria: 'Gasto',
          anio,
          mes,
          monto: gasto.monto,
          fecha: gasto.fecha,
          registrado: gasto.createdAt || ''
        };
      });

      setMovimientos(
        [...ingresos, ...egresos].sort((a, b) =>
          (b.fecha || b.registrado || '').localeCompare(a.fecha || a.registrado || '')
        )
      );
    } catch (error) {
      console.error('Error fetching ingresos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resumen = useMemo(() => {
    const porPeriodo = new Map<string, ResumenPeriodo>();

    movimientos.forEach(mov => {
      const clave = `${mov.anio}-${String(mov.mes).padStart(2, '0')}`;
      const existente = porPeriodo.get(clave) || {
        clave,
        etiqueta: etiquetaPeriodo(mov.anio, mov.mes),
        anio: mov.anio,
        mes: mov.mes,
        ingresos: 0,
        gastos: 0,
        balance: 0
      };

      if (mov.tipo === 'ingreso') existente.ingresos += mov.monto;
      else existente.gastos += mov.monto;

      existente.balance = existente.ingresos - existente.gastos;
      porPeriodo.set(clave, existente);
    });

    const periodos = Array.from(porPeriodo.values()).sort((a, b) => b.clave.localeCompare(a.clave));

    return { porPeriodo, periodos };
  }, [movimientos]);

  // Totales del período seleccionado (resumen contable)
  const totales = useMemo(() => {
    const base = movimientos.filter(
      mov => periodoSeleccionado === 'todos' || `${mov.anio}-${String(mov.mes).padStart(2, '0')}` === periodoSeleccionado
    );
    const ingresos = base.filter(m => m.tipo === 'ingreso').reduce((acc, m) => acc + m.monto, 0);
    const gastos = base.filter(m => m.tipo === 'gasto').reduce((acc, m) => acc + m.monto, 0);
    return { ingresos, gastos, balance: ingresos - gastos, cantidad: base.length };
  }, [movimientos, periodoSeleccionado]);

  const movimientosFiltrados = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return movimientos.filter(mov => {
      const coincidePeriodo =
        periodoSeleccionado === 'todos' || `${mov.anio}-${String(mov.mes).padStart(2, '0')}` === periodoSeleccionado;
      const coincideTipo = tipoFiltro === 'todos' || mov.tipo === tipoFiltro;
      const coincideBusqueda =
        mov.concepto.toLowerCase().includes(term) || mov.categoria.toLowerCase().includes(term);
      return coincidePeriodo && coincideTipo && coincideBusqueda;
    });
  }, [movimientos, periodoSeleccionado, tipoFiltro, searchTerm]);

  const totalFiltrado = movimientosFiltrados.reduce(
    (acc, mov) => acc + (mov.tipo === 'ingreso' ? mov.monto : -mov.monto),
    0
  );

  const etiquetaPeriodoSeleccionado =
    periodoSeleccionado === 'todos'
      ? 'Histórico completo'
      : etiquetaPeriodo(Number(periodoSeleccionado.split('-')[0]), Number(periodoSeleccionado.split('-')[1]));

  const balancePositivo = totales.balance >= 0;

  const tipoBotones: { valor: TipoFiltro; label: string }[] = [
    { valor: 'todos', label: 'Todo' },
    { valor: 'ingreso', label: 'Ingresos' },
    { valor: 'gasto', label: 'Gastos' }
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Ingresos y Contabilidad</h2>
          <p className="text-gray-500 mt-1">{movimientos.length} movimientos registrados</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-border-card text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span className="text-sm font-medium">Actualizar</span>
        </button>
      </div>

      {/* Resumen contable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Ingresos"
          value={formatCurrency(totales.ingresos)}
          subtitle={etiquetaPeriodoSeleccionado}
          icon={TrendingUp}
          iconBgColor="bg-green-500/10"
          iconColor="text-green-500"
        />
        <MetricCard
          title="Total Gastos"
          value={formatCurrency(totales.gastos)}
          subtitle={etiquetaPeriodoSeleccionado}
          icon={TrendingDown}
          iconBgColor="bg-red-500/10"
          iconColor="text-red-500"
        />
        <MetricCard
          title="Balance Neto"
          value={formatCurrency(totales.balance)}
          subtitle={balancePositivo ? 'Resultado positivo' : 'Resultado negativo'}
          icon={Scale}
          iconBgColor={balancePositivo ? 'bg-green-500/10' : 'bg-red-500/10'}
          iconColor={balancePositivo ? 'text-green-500' : 'text-red-500'}
        />
        <MetricCard
          title="Movimientos"
          value={totales.cantidad}
          subtitle="cobros y gastos"
          icon={Receipt}
          iconBgColor="bg-brand/10"
          iconColor="text-brand"
        />
      </div>

      {/* Desglose por período */}
      {resumen.periodos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Desglose por período</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {resumen.periodos.map(periodo => {
              const activo = periodoSeleccionado === periodo.clave;
              const positivo = periodo.balance >= 0;
              return (
                <button
                  key={periodo.clave}
                  onClick={() => setPeriodoSeleccionado(activo ? 'todos' : periodo.clave)}
                  className={`text-left bg-bg-card border rounded-2xl p-5 transition-all ${activo ? 'border-brand/60' : 'border-border-card hover:border-brand/30'
                    }`}
                >
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{periodo.etiqueta}</div>
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <ArrowUpCircle size={14} className="text-green-500" />
                    <span className="text-green-500 font-bold">{formatCurrency(periodo.ingresos)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <ArrowDownCircle size={14} className="text-red-500" />
                    <span className="text-red-500 font-bold">{formatCurrency(periodo.gastos)}</span>
                  </div>
                  <div className={`mt-3 pt-3 border-t border-border-card text-sm font-bold ${positivo ? 'text-green-500' : 'text-red-500'}`}>
                    Balance {formatCurrency(periodo.balance)}
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
            placeholder="Buscar por inquilino o concepto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-card border border-border-card rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand transition-all shadow-sm"
          />
        </div>
        <select
          value={periodoSeleccionado}
          onChange={(e) => setPeriodoSeleccionado(e.target.value)}
          className="bg-bg-card border border-border-card rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand transition-all appearance-none cursor-pointer md:w-56"
        >
          <option value="todos">Todos los períodos</option>
          {resumen.periodos.map(periodo => (
            <option key={periodo.clave} value={periodo.clave}>{periodo.etiqueta}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 bg-bg-card border border-border-card rounded-2xl p-1">
          {tipoBotones.map(boton => (
            <button
              key={boton.valor}
              onClick={() => setTipoFiltro(boton.valor)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${tipoFiltro === boton.valor
                ? 'bg-brand text-bg-dark'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {boton.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista móvil (tarjetas) */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="bg-bg-card border border-border-card rounded-2xl p-8 flex flex-col items-center gap-3">
            <RefreshCw className="animate-spin text-brand" size={28} />
            <span className="text-sm text-gray-500 font-medium">Cargando movimientos...</span>
          </div>
        ) : movimientosFiltrados.length === 0 ? (
          <div className="bg-bg-card border border-border-card rounded-2xl p-8 text-center text-sm text-gray-500">
            No hay movimientos para mostrar
          </div>
        ) : (
          <>
            {movimientosFiltrados.map(mov => (
              <div key={mov.id} className="bg-bg-card border border-border-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-bold text-white truncate">{mov.concepto}</span>
                      {mov.categoria !== 'Gasto' && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-widest shrink-0 ${mov.categoria === 'Condominio'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-white/5 text-gray-400 border-border-card'
                          }`}>
                          {mov.categoria}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {etiquetaPeriodo(mov.anio, mov.mes)}{mov.fecha ? ` • ${formatDate(mov.fecha)}` : ''}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest shrink-0 ${mov.tipo === 'ingreso'
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                    {mov.tipo === 'ingreso' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                    {mov.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-border-card">
                  <span className="text-xs text-gray-500">Monto</span>
                  <span className={`text-base font-bold truncate ${mov.tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                    {mov.tipo === 'ingreso' ? '' : '-'}{formatCurrency(mov.monto)}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 bg-bg-sidebar/50 border border-border-card rounded-2xl p-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider truncate">
                Balance del filtro ({movimientosFiltrados.length})
              </span>
              <span className={`text-sm font-bold shrink-0 ${totalFiltrado >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(totalFiltrado)}
              </span>
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
                <th className="px-6 py-5">Tipo</th>
                <th className="px-6 py-5">Concepto / Inquilino</th>
                <th className="px-6 py-5">Período</th>
                <th className="px-6 py-5">Fecha</th>
                <th className="px-6 py-5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-brand" size={32} />
                      <span className="text-sm text-gray-500 font-medium">Cargando movimientos...</span>
                    </div>
                  </td>
                </tr>
              ) : movimientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                    No hay movimientos para mostrar
                  </td>
                </tr>
              ) : (
                movimientosFiltrados.map(mov => (
                  <tr key={mov.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest ${mov.tipo === 'ingreso'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                        {mov.tipo === 'ingreso' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                        {mov.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-brand transition-colors">
                          {mov.concepto}
                        </span>
                        {mov.categoria !== 'Gasto' && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-widest ${mov.categoria === 'Condominio'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-white/5 text-gray-400 border-border-card'
                            }`}>
                            {mov.categoria}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {etiquetaPeriodo(mov.anio, mov.mes)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {mov.fecha ? formatDate(mov.fecha) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`text-sm font-bold ${mov.tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                        {mov.tipo === 'ingreso' ? '' : '-'}{formatCurrency(mov.monto)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && movimientosFiltrados.length > 0 && (
              <tfoot>
                <tr className="border-t border-border-card bg-bg-sidebar/50">
                  <td colSpan={4} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Balance del filtro ({movimientosFiltrados.length})
                  </td>
                  <td className={`px-6 py-4 text-right text-sm font-bold ${totalFiltrado >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(totalFiltrado)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default Ingresos;
