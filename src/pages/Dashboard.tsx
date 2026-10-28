import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Contrato, Propiedad, Inquilino, Pago } from '../types/database';
import MetricCard from '../components/MetricCard';
import ContractsTable from '../components/ContractsTable';
import { 
  Building2, 
  FileText, 
  CreditCard, 
  AlertTriangle,
  RefreshCw,
  Bell,
  Calendar,
  TrendingUp,
  Calculator,
  ExternalLink
} from 'lucide-react';

interface ContratoWithDetails extends Contrato {
  propiedad: Propiedad;
  inquilino: Inquilino;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    propertiesCount: 0,
    activeContractsCount: 0,
    pendingPaymentsCount: 0,
    alertsCount: 0
  });
  const [recentContracts, setRecentContracts] = useState<ContratoWithDetails[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch properties count
      const { count: propCount } = await supabase
        .from('propiedades')
        .select('*', { count: 'exact', head: true });

      // Fetch active contracts count
      const { count: contractCount } = await supabase
        .from('contratos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Activo');

      // Fetch pending payments count for current month
      const now = new Date();
      const { count: paymentsCount } = await supabase
        .from('pagos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Pendiente')
        .eq('mes', now.getMonth() + 1)
        .eq('anio', now.getFullYear());

      // Fetch alerts (contracts expiring soon - next 60 days)
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
      const { count: alertsCount } = await supabase
        .from('contratos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Activo')
        .lte('fecha_fin', sixtyDaysFromNow.toISOString().split('T')[0]);

      // Fetch recent contracts with details
      const { data: contractsData } = await supabase
        .from('contratos')
        .select(`
          *,
          propiedad:propiedades(*),
          inquilino:inquilinos(*)
        `)
        .eq('estado', 'Activo')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        propertiesCount: propCount || 0,
        activeContractsCount: contractCount || 0,
        pendingPaymentsCount: paymentsCount || 0,
        alertsCount: alertsCount || 0
      });

      if (contractsData) {
        setRecentContracts(contractsData as any);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentDate = new Intl.DateTimeFormat('es-AR', { 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date());

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard</h2>
          <p className="text-gray-500 mt-1 capitalize">{currentDate} • Resumen general</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Propiedades"
          value={stats.propertiesCount}
          subtitle="registradas"
          icon={Building2}
          iconBgColor="bg-blue-500/10"
          iconColor="text-blue-500"
        />
        <MetricCard
          title="Contratos activos"
          value={stats.activeContractsCount}
          subtitle="en curso"
          icon={FileText}
          iconBgColor="bg-yellow-500/10"
          iconColor="text-yellow-500"
        />
        <MetricCard
          title="Pagos pendientes"
          value={stats.pendingPaymentsCount}
          subtitle="este mes"
          icon={CreditCard}
          iconBgColor="bg-red-500/10"
          iconColor="text-red-500"
        />
        <MetricCard
          title="Por vencer"
          value={stats.alertsCount}
          subtitle="en 60 días"
          icon={AlertTriangle}
          iconBgColor="bg-orange-500/10"
          iconColor="text-orange-500"
        />
      </div>

      {/* Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
            <Bell size={18} />
          </div>
          <h3 className="text-lg font-bold text-white">Alertas</h3>
          <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-bold border border-brand/20">
            3
          </span>
          <button className="ml-auto text-xs font-medium text-gray-500 hover:text-gray-300">Ocultar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mock Alerts to match image */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4 hover:bg-red-500/10 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-500">Contrato vence pronto</h4>
              <p className="text-sm text-gray-300 mt-0.5">Colón 890</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/20">
                en 18 días
              </span>
            </div>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6 flex items-start gap-4 hover:bg-orange-500/10 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-orange-500">Pagos pendientes este mes</h4>
              <p className="text-sm text-gray-300 mt-0.5">5 contratos sin cobrar</p>
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 flex items-start gap-4 hover:bg-blue-500/10 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-500">Aumento próximo (ICL)</h4>
              <p className="text-sm text-gray-300 mt-0.5">Av. San Martín 1234</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20">
                en 12 días
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <ContractsTable contracts={recentContracts} />
        </div>
        
        {/* Calculator Widget */}
        <div className="lg:col-span-1">
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand mb-4">
                <Calculator size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Calculadora de ajuste</h3>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">ICL · IPC · Índices oficiales</p>
              <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                Calculá el nuevo valor del alquiler con los índices actualizados del BCRA e INDEC.
              </p>
              <button className="w-full mt-6 py-3 rounded-xl bg-brand text-bg-dark font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-hover transition-all active:scale-95 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                <ExternalLink size={16} />
                Abrir calculadora
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
