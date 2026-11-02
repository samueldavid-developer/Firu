import React, { useEffect, useState } from 'react';
import { db, collection, getDocs, query, where, mapDocs, fetchLookup } from '../lib/fire';
import type { Contrato, Inquilino } from '../types/database';
import MetricCard from '../components/MetricCard';
import ContractsTable from '../components/ContractsTable';
import PaymentReceiptModal from '../components/PaymentReceiptModal';
import Toast from '../components/Toast';
import { useAlerts, ESTADOS_VIGENTES } from '../hooks/useAlerts';
import { usePaymentAlerts, type PaymentAlert } from '../hooks/usePaymentAlerts';
import { formatCurrency, formatDate } from '../lib/payments';
import { Link } from 'react-router-dom';
import {
  FileText,
  UserCircle,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  Bell,
  Calendar,
  ChevronRight,
  Check,
  Loader2
} from 'lucide-react';

interface ContratoWithDetails extends Contrato {
  inquilino?: Inquilino;
}

const ESTILOS_COBRO: Record<PaymentAlert['estado'], { label: string; detalle: (dias: number) => string; color: string; barra: string }> = {
  atrasado: {
    label: 'Pago atrasado',
    detalle: dias => `${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'} de atraso`,
    color: 'text-red-500 bg-red-500/10 border-red-500/20',
    barra: 'bg-red-500'
  },
  hoy: {
    label: 'Vence hoy',
    detalle: () => 'Cobra hoy',
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    barra: 'bg-orange-500'
  },
  proximo: {
    label: 'Próximo a vencer',
    detalle: () => 'Vence mañana',
    color: 'text-brand bg-brand/10 border-brand/20',
    barra: 'bg-brand'
  }
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string; variant: 'success' | 'error' } | null>(null);

  const { alerts, refreshAlerts } = useAlerts();
  const { alerts: paymentAlerts, resumen, loading: loadingCobros, refreshAlerts: refreshCobros, registerPayment } = usePaymentAlerts();

  const [stats, setStats] = useState({ activeContractsCount: 0, tenantsCount: 0 });
  const [recentContracts, setRecentContracts] = useState<ContratoWithDetails[]>([]);
  const [receiptContract, setReceiptContract] = useState<ContratoWithDetails | null>(null);

  const showToast = (message: string, variant: 'success' | 'error' = 'success') =>
    setToast({ id: Date.now(), message, variant });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchData = async (conSpinner = true) => {
    if (conSpinner) setLoading(true);
    try {
      const [contractsSnap, tenants] = await Promise.all([
        getDocs(query(collection(db, 'contratos'), where('estado', 'in', ESTADOS_VIGENTES))),
        fetchLookup<Inquilino>('inquilinos')
      ]);

      const recentContracts = mapDocs<Contrato>(contractsSnap)
        .map(contract => ({ ...contract, inquilino: tenants[contract.inquilino_id] }))
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        .slice(0, 5);

      setStats({
        activeContractsCount: contractsSnap.size,
        tenantsCount: Object.keys(tenants).length
      });
      setRecentContracts(recentContracts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      if (conSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleActualizar = () => {
    fetchData();
    refreshAlerts();
    refreshCobros();
  };

  const handlePagar = async (alert: PaymentAlert) => {
    setProcesando(alert.id);
    try {
      await registerPayment(alert);
      showToast(alert.concepto === 'Condominio' ? 'Pago de condominio registrado exitosamente' : 'Pago registrado exitosamente');
      // Refresca las métricas y la tabla sin recargar la página ni volver a mostrar el spinner
      fetchData(false);
    } catch (error) {
      console.error('Error registering payment:', error);
      showToast('No se pudo registrar el pago', 'error');
    } finally {
      setProcesando(null);
    }
  };

  const alertasVencimiento = alerts.filter(alert => alert.type === 'expiry');

  const currentDate = new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">Dashboard</h2>
          <p className="text-gray-500 mt-1 capitalize truncate">{currentDate} • Resumen general</p>
        </div>
        <button
          onClick={handleActualizar}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-border-card text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span className="text-sm font-medium">Actualizar</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Contratos vigentes"
          value={stats.activeContractsCount}
          subtitle="activos y permanentes"
          icon={FileText}
          iconBgColor="bg-yellow-500/10"
          iconColor="text-yellow-500"
        />
        <MetricCard
          title="Inquilinos"
          value={stats.tenantsCount}
          subtitle="registrados"
          icon={UserCircle}
          iconBgColor="bg-blue-500/10"
          iconColor="text-blue-500"
        />
        <MetricCard
          title="Cobros pendientes"
          value={resumen.pendientes}
          subtitle={`${formatCurrency(resumen.montoPendiente)} sin cobrar`}
          icon={CreditCard}
          iconBgColor="bg-red-500/10"
          iconColor="text-red-500"
        />
        <MetricCard
          title="Por atender"
          value={paymentAlerts.length}
          subtitle="próximos o atrasados"
          icon={AlertTriangle}
          iconBgColor="bg-orange-500/10"
          iconColor="text-orange-500"
        />
      </div>

      {/* Arrendamiento */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
            <CreditCard size={18} />
          </div>
          <h3 className="text-lg font-bold text-white">Arrendamiento</h3>
          {paymentAlerts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-bold border border-brand/20">
              {paymentAlerts.length}
            </span>
          )}
        </div>

        {loadingCobros ? (
          <div className="bg-bg-card border border-border-card rounded-2xl p-10 flex items-center justify-center gap-3">
            <Loader2 className="animate-spin text-brand" size={22} />
            <span className="text-sm text-gray-500 font-medium">Revisando cobros...</span>
          </div>
        ) : paymentAlerts.length === 0 ? (
          <div className="bg-bg-card border border-border-card rounded-2xl p-10 text-center">
            <Check size={28} className="text-green-500 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">No hay cobros por atender por ahora</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {paymentAlerts.map(alert => {
              const estilo = ESTILOS_COBRO[alert.estado];
              const procesandoEste = procesando === alert.id;

              return (
                <div
                  key={alert.id}
                  className="bg-bg-card border border-border-card rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${estilo.barra}`} />

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{alert.inquilinoNombre}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-widest whitespace-nowrap ${alert.concepto === 'Condominio'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-white/5 text-gray-400 border-border-card'
                          }`}>
                          {alert.concepto}
                        </span>
                        <p className="text-xs text-gray-500 truncate">
                          Cobro el día {alert.diaCobro} • {formatDate(alert.vencimiento.toISOString())}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest whitespace-nowrap ${estilo.color}`}>
                      {estilo.label}
                    </span>
                  </div>

                  <div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(alert.monto)}</div>
                    <div className="text-xs text-gray-500 mt-1">{estilo.detalle(alert.dias)}</div>
                    {alert.concepto === 'Condominio' && (alert.periodosPendientes?.length || 0) > 1 && (
                      <div className="text-xs text-blue-400 mt-1">
                        Incluye {alert.periodosPendientes?.length} meses adeudados
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handlePagar(alert)}
                    disabled={procesandoEste}
                    className="w-full py-3 rounded-xl bg-brand text-bg-dark font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-hover transition-all active:scale-95 disabled:opacity-50"
                  >
                    {procesandoEste ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    Sí pagó{alert.concepto === 'Condominio' ? ' Condominio' : ''}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alertas de vencimiento */}
      {alertasVencimiento.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
              <Bell size={18} />
            </div>
            <h3 className="text-lg font-bold text-white">Contratos por vencer</h3>
            <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-bold border border-brand/20">
              {alertasVencimiento.length}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {alertasVencimiento.map(alert => (
              <Link
                key={alert.id}
                to={alert.link}
                className="bg-bg-card border border-border-card rounded-2xl p-6 flex items-start gap-4 hover:border-brand/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-500/10 text-red-500">
                  <Calendar size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-red-500">{alert.title}</h4>
                  <p className="text-sm text-gray-300 mt-0.5 truncate">{alert.description}</p>
                  {alert.daysRemaining !== undefined && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-md text-[10px] font-bold border bg-red-500/10 text-red-500 border-red-500/20">
                      en {alert.daysRemaining} días
                    </span>
                  )}
                </div>
                <ChevronRight size={18} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="w-full">
        <ContractsTable contracts={recentContracts} onViewReceipt={setReceiptContract} />
      </div>

      <PaymentReceiptModal
        isOpen={!!receiptContract}
        onClose={() => setReceiptContract(null)}
        contract={receiptContract}
      />

      {toast && <Toast message={toast.message} variant={toast.variant} />}
    </div>
  );
};

export default Dashboard;
