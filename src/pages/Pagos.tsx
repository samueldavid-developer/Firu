import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Pago, Contrato, Propiedad, Inquilino } from '../types/database';
import {
  Plus,
  Search,
  CheckCircle2,
  FileDown,
  RefreshCw,
  Calendar,
  DollarSign
} from 'lucide-react';
import Modal from '../components/Modal';
import PaymentForm from '../components/PaymentForm';

interface ContratoWithDetails extends Contrato {
  propiedad: Propiedad;
  inquilino: Inquilino;
}

interface PagoWithDetails extends Pago {
  contrato: ContratoWithDetails;
}

const Pagos: React.FC = () => {
  const [payments, setPayments] = useState<PagoWithDetails[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PagoWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pendiente' | 'Cobrado'>('Todos');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pagos')
        .select(`
          *,
          contrato:contratos (
            *,
            propiedad:propiedades (*),
            inquilino:inquilinos (*)
          )
        `)
        .order('anio', { ascending: false })
        .order('mes', { ascending: false });

      if (error) throw error;
      setPayments(data as any || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    let results = payments;

    // Filter by status
    if (statusFilter !== 'Todos') {
      results = results.filter(p => p.estado === statusFilter);
    }

    // Filter by search term (property address or tenant name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(p =>
        p.contrato.propiedad.direccion.toLowerCase().includes(term) ||
        p.contrato.inquilino.nombre.toLowerCase().includes(term)
      );
    }

    setFilteredPayments(results);
  }, [searchTerm, statusFilter, payments]);

  const handleMarkAsPaid = async (paymentId: string) => {
    const now = new Date().toISOString().split('T')[0];
    try {
      const { error } = await supabase
        .from('pagos')
        .update({ estado: 'Cobrado', fecha_cobro: now })
        .eq('id', paymentId);
      if (error) throw error;
      fetchPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const meses = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const stats = {
    pagados: payments.filter(p => p.estado === 'Cobrado').length,
    pendientes: payments.filter(p => p.estado === 'Pendiente').length,
    totalCobrado: payments.filter(p => p.estado === 'Cobrado').reduce((acc, p) => acc + p.monto, 0)
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 w-full min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Control de Pagos</h2>
          <p className="text-gray-500 mt-1">Seguimiento de pagos mensuales de todas las propiedades</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-border-card text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-sm font-bold">Registrar Pago</span>
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.pagados}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pagos Cobrados</div>
            </div>
          </div>
        </div>
        <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.pendientes}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pagos Pendientes</div>
            </div>
          </div>
        </div>
        <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalCobrado)}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Recaudado</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar por propiedad o inquilino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-card border border-border-card rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-brand transition-all shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="flex p-1 bg-bg-card border border-border-card rounded-2xl">
            {(['Todos', 'Pendiente', 'Cobrado'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === status
                  ? 'bg-brand text-bg-dark'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {status === 'Todos' ? 'Todos' : status === 'Pendiente' ? 'Pendientes' : 'Cobrados'}
              </button>
            ))}
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-bg-card border border-border-card rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-border-card bg-bg-sidebar/50">
                  <th className="px-6 py-5">Contrato / Propiedad</th>
                  <th className="px-6 py-5">Período</th>
                  <th className="px-6 py-5">Monto</th>
                  <th className="px-6 py-5">Fecha de Cobro</th>
                  <th className="px-6 py-5">Estado</th>
                  <th className="px-6 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-card">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="animate-spin text-brand" size={32} />
                        <span className="text-sm text-gray-500 font-medium">Cargando pagos...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                      No se encontraron pagos
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-brand transition-colors">
                            {p.contrato.propiedad.direccion}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {p.contrato.inquilino.nombre}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300 font-medium">
                          {meses[p.mes]} {p.anio}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white">
                          {formatCurrency(p.monto)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {p.fecha_cobro ? new Date(p.fecha_cobro).toLocaleDateString('es-AR') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.estado === 'Cobrado'
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                          {p.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.estado === 'Pendiente' ? (
                          <button
                            onClick={() => handleMarkAsPaid(p.id)}
                            className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 hover:bg-green-500/20 transition-all active:scale-95"
                          >
                            Marcar Cobrado
                          </button>
                        ) : (
                          <button
                            className="p-2 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                            title="Descargar Recibo"
                          >
                            <FileDown size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Pago"
      >
        <PaymentForm
          onSuccess={() => {
            setIsModalOpen(false);
            fetchPayments();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Pagos;
