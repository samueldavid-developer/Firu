import React, { useEffect, useState } from 'react';
import { db, collection, getDocs, query, where, mapDocs, fetchLookup } from '../lib/fire';
import { deleteContratoCascade } from '../lib/cascade';
import type { Contrato, Inquilino, Pago } from '../types/database';
import { fechaDeCobro, diasHastaCobro, clasificarCobro, formatDate, formatCurrency, type EstadoCobro } from '../lib/payments';
import {
  Plus,
  Search,
  Edit2,
  Calendar,
  RefreshCw,
  Trash2,
  CalendarClock
} from 'lucide-react';
import Modal from '../components/Modal';
import ContractForm from '../components/ContractForm';

interface ContratoWithDetails extends Contrato {
  inquilino?: Inquilino;
  estadoCobro: EstadoCobro;
  diasCobro: number;
}

const ESTILOS_COBRO: Record<EstadoCobro, { label: (dias: number) => string; clases: string }> = {
  cobrado: { label: () => 'Cobrado', clases: 'bg-green-500/10 text-green-500 border-green-500/20' },
  atrasado: { label: dias => `Atrasado ${Math.abs(dias)}d`, clases: 'bg-red-500/10 text-red-500 border-red-500/20' },
  hoy: { label: () => 'Vence hoy', clases: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  proximo: { label: () => 'Vence mañana', clases: 'bg-brand/10 text-brand border-brand/20' },
  pendiente: { label: () => 'Pendiente', clases: 'bg-white/5 text-gray-400 border-border-card' }
};

const Contratos: React.FC = () => {
  const [contracts, setContracts] = useState<ContratoWithDetails[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContratoWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contrato | undefined>();

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const hoy = new Date();
      const mes = hoy.getMonth() + 1;
      const anio = hoy.getFullYear();

      const [contractsSnap, tenants, pagosSnap] = await Promise.all([
        getDocs(collection(db, 'contratos')),
        fetchLookup<Inquilino>('inquilinos'),
        getDocs(
          query(collection(db, 'pagos'), where('mes', '==', mes), where('anio', '==', anio))
        )
      ]);

      const pagoPorContrato = new Map<string, Pago>();
      mapDocs<Pago>(pagosSnap).forEach(pago => {
        // El "Cobro del mes" refleja el alquiler; el condominio se gestiona aparte desde el Dashboard.
        if ((pago.concepto || 'Alquiler') === 'Alquiler') pagoPorContrato.set(pago.contrato_id, pago);
      });

      const data = mapDocs<Contrato>(contractsSnap)
        .map(contract => {
          const pago = pagoPorContrato.get(contract.id);
          const dias = diasHastaCobro(fechaDeCobro(anio, mes, contract.dia_cobro), hoy);
          const estadoCobro: EstadoCobro = pago?.estado === 'Cobrado'
            ? 'cobrado'
            : clasificarCobro(dias) || 'pendiente';

          return {
            ...contract,
            inquilino: tenants[contract.inquilino_id],
            estadoCobro,
            diasCobro: dias
          };
        })
        .sort((a, b) => (b.fecha_inicio || '').localeCompare(a.fecha_inicio || ''));

      setContracts(data);
      setFilteredContracts(data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredContracts(
      contracts.filter(c =>
        (c.inquilino?.nombre || '').toLowerCase().includes(term) ||
        (c.inquilino?.dni || '').toLowerCase().includes(term)
      )
    );
  }, [searchTerm, contracts]);

  const handleAddClick = () => {
    setSelectedContract(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (contract: Contrato) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (contract: ContratoWithDetails) => {
    const nombre = contract.inquilino?.nombre || 'este inquilino';
    if (!confirm(`¿Eliminar el contrato de ${nombre} junto con sus pagos registrados? Esta acción no se puede deshacer.`)) return;

    try {
      await deleteContratoCascade(contract.id);
      fetchContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert('Error al eliminar el contrato');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">Contratos</h2>
          <p className="text-gray-500 mt-1 truncate">{contracts.length} contratos registrados</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-border-card text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 group shrink-0"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-sm font-bold">Nuevo contrato</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={20} />
        <input
          type="text"
          placeholder="Buscar por inquilino o DNI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-bg-card border border-border-card rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand transition-all shadow-sm"
        />
      </div>

      {/* Lista móvil (tarjetas) */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="bg-bg-card border border-border-card rounded-2xl p-8 flex flex-col items-center gap-3">
            <RefreshCw className="animate-spin text-brand" size={28} />
            <span className="text-sm text-gray-500 font-medium">Cargando contratos...</span>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="bg-bg-card border border-border-card rounded-2xl p-8 text-center text-sm text-gray-500">
            No se encontraron contratos registrados
          </div>
        ) : (
          filteredContracts.map((contract) => (
            <div key={contract.id} className="bg-bg-card border border-border-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {contract.inquilino?.nombre || 'Sin inquilino'}
                  </div>
                  {contract.inquilino?.dni && (
                    <div className="text-[10px] text-gray-500 uppercase tracking-tighter mt-0.5 truncate">
                      DNI {contract.inquilino.dni}
                    </div>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest whitespace-nowrap shrink-0 ${ESTILOS_COBRO[contract.estadoCobro].clases}`}>
                  {ESTILOS_COBRO[contract.estadoCobro].label(contract.diasCobro)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-gray-400">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest ${contract.estado === 'Activo'
                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                  : 'bg-brand/10 text-brand border-brand/20'
                  }`}>
                  {contract.estado}
                </span>
                <span className="flex items-center gap-2">
                  <CalendarClock size={14} className="text-gray-600 shrink-0" />
                  Día {contract.dia_cobro}
                </span>
                <span className="flex items-center gap-2 min-w-0">
                  <Calendar size={14} className="text-gray-600 shrink-0" />
                  <span className="truncate">
                    {formatDate(contract.fecha_inicio)}
                    {contract.fecha_fin ? ` → ${formatDate(contract.fecha_fin)}` : ' → Indefinido'}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-border-card">
                <div className="min-w-0">
                  <div className="text-base font-bold text-white truncate">{formatCurrency(contract.monto_mensual)}</div>
                  {(contract.monto_condominio || 0) > 0 && (
                    <div className="text-[10px] text-blue-400 truncate">
                      + {formatCurrency(contract.monto_condominio || 0)} condominio
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEditClick(contract)}
                    className="p-2 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(contract)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Eliminar contrato"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabla (desktop) */}
      <div className="hidden sm:block bg-bg-card border border-border-card rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-border-card bg-bg-sidebar/50">
                <th className="px-6 py-5">Inquilino</th>
                <th className="px-6 py-5">Monto Mensual</th>
                <th className="px-6 py-5">Día de Cobro</th>
                <th className="px-6 py-5">Período</th>
                <th className="px-6 py-5">Estado</th>
                <th className="px-6 py-5">Cobro del mes</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-brand" size={32} />
                      <span className="text-sm text-gray-500 font-medium">Cargando contratos...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                    No se encontraron contratos registrados
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white group-hover:text-brand transition-colors">
                        {contract.inquilino?.nombre || 'Sin inquilino'}
                      </div>
                      {contract.inquilino?.dni && (
                        <div className="text-[10px] text-gray-500 uppercase tracking-tighter mt-0.5">
                          DNI {contract.inquilino.dni}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{formatCurrency(contract.monto_mensual)}</div>
                      {(contract.monto_condominio || 0) > 0 && (
                        <div className="text-[10px] text-blue-400 mt-0.5">
                          + {formatCurrency(contract.monto_condominio || 0)} condominio
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <CalendarClock size={14} className="text-gray-600" />
                        Día {contract.dia_cobro}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar size={14} className="text-gray-600" />
                        {formatDate(contract.fecha_inicio)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 pl-6">
                        {contract.fecha_fin ? `hasta ${formatDate(contract.fecha_fin)}` : 'Indefinido'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest ${contract.estado === 'Activo'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-brand/10 text-brand border-brand/20'
                        }`}>
                        {contract.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest ${ESTILOS_COBRO[contract.estadoCobro].clases}`}>
                        {ESTILOS_COBRO[contract.estadoCobro].label(contract.diasCobro)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(contract)}
                          className="p-2 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(contract)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Eliminar contrato"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de alta/edición */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedContract ? 'Editar contrato' : 'Nuevo contrato'}
      >
        <ContractForm
          initialData={selectedContract}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchContracts();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Contratos;
