import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Contrato, Propiedad, Inquilino } from '../types/database';
import { 
  Plus, 
  Search, 
  Edit2, 
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  MoreVertical,
  Ban
} from 'lucide-react';
import Modal from '../components/Modal';
import ContractForm from '../components/ContractForm';

interface ContratoWithDetails extends Contrato {
  propiedad: Propiedad;
  inquilino: Inquilino;
}

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
      const { data, error } = await supabase
        .from('contratos')
        .select(`
          *,
          propiedad:propiedades(*),
          inquilino:inquilinos(*)
        `)
        .order('fecha_inicio', { ascending: false });
      
      if (error) throw error;
      setContracts(data as any || []);
      setFilteredContracts(data as any || []);
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
    const results = contracts.filter(c => 
      c.propiedad.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.inquilino.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContracts(results);
  }, [searchTerm, contracts]);

  const handleAddClick = () => {
    setSelectedContract(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (contract: Contrato) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const handleFinalizeClick = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres marcar este contrato como Finalizado?')) return;
    try {
      const { error } = await supabase
        .from('contratos')
        .update({ estado: 'Finalizado' })
        .eq('id', id);
      if (error) throw error;
      fetchContracts();
    } catch (error) {
      console.error('Error finalizing contract:', error);
      alert('Error al finalizar el contrato');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Contratos</h2>
          <p className="text-gray-500 mt-1">{contracts.length} contratos registrados</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-border-card text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 group"
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
          placeholder="Buscar por propiedad o inquilino..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-bg-card border border-border-card rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand transition-all shadow-sm"
        />
      </div>

      {/* Table Section */}
      <div className="bg-bg-card border border-border-card rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-border-card bg-bg-sidebar/50">
                <th className="px-6 py-5">Propiedad</th>
                <th className="px-6 py-5">Inquilino</th>
                <th className="px-6 py-5">Monto Mensual</th>
                <th className="px-6 py-5">Ajuste</th>
                <th className="px-6 py-5">Vencimiento</th>
                <th className="px-6 py-5">Estado</th>
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
                        {contract.propiedad.direccion}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-tighter mt-0.5">{contract.propiedad.tipo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 font-medium">{contract.inquilino.nombre}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{formatCurrency(contract.monto_mensual)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20">
                          {contract.tipo_ajuste}
                        </span>
                        <span className="text-[10px] text-gray-500 italic">cada {contract.frecuencia_ajuste_meses}m</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar size={14} className="text-gray-600" />
                        {formatDate(contract.fecha_fin)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest ${
                        contract.estado === 'Activo' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : contract.estado === 'Finalizado'
                          ? 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {contract.estado}
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
                          className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </button>
                        {contract.estado === 'Activo' && (
                          <button 
                            onClick={() => handleFinalizeClick(contract.id)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Finalizar contrato"
                          >
                            <Ban size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
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
