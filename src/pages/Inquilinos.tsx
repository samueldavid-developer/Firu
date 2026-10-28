import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Inquilino } from '../types/database';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  UserCircle,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import Modal from '../components/Modal';
import TenantForm from '../components/TenantForm';

const Inquilinos: React.FC = () => {
  const [tenants, setTenants] = useState<Inquilino[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Inquilino[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Inquilino | undefined>();

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inquilinos')
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      setTenants(data || []);
      setFilteredTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    const results = tenants.filter(tenant => 
      tenant.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.dni?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTenants(results);
  }, [searchTerm, tenants]);

  const handleAddClick = () => {
    setSelectedTenant(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (tenant: Inquilino) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este inquilino?')) return;
    
    try {
      const { error } = await supabase
        .from('inquilinos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchTenants();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert('Error al eliminar el inquilino');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Inquilinos</h2>
          <p className="text-gray-500 mt-1">{tenants.length} inquilinos registrados</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-border-card text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-sm font-bold">Nuevo inquilino</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={20} />
        <input 
          type="text"
          placeholder="Buscar por nombre, DNI o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-bg-card border border-border-card rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand transition-all shadow-sm focus:shadow-[0_0_20px_rgba(251,191,36,0.05)]"
        />
      </div>

      {/* Table Section */}
      <div className="bg-bg-card border border-border-card rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-border-card bg-bg-sidebar/50">
                <th className="px-6 py-5">Inquilino</th>
                <th className="px-6 py-5">DNI</th>
                <th className="px-6 py-5">Teléfono</th>
                <th className="px-6 py-5">Email</th>
                <th className="px-6 py-5">Garante</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-brand" size={32} />
                      <span className="text-sm text-gray-500 font-medium">Cargando inquilinos...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron inquilinos que coincidan con la búsqueda' : 'No hay inquilinos registrados'}
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold text-sm border border-brand/20 shadow-inner">
                          {getInitials(tenant.nombre)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-brand transition-colors">
                            {tenant.nombre}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-tighter mt-0.5">ID: {tenant.id.split('-')[0]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-medium">
                      {tenant.dni || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Phone size={14} className="text-gray-600" />
                        {tenant.telefono || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Mail size={14} className="text-gray-600" />
                        {tenant.email || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <ShieldCheck size={14} className="text-gray-600" />
                        {tenant.garante || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(tenant)}
                          className="p-2 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(tenant.id)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Eliminar"
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

      {/* Modal for adding/editing */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedTenant ? 'Editar inquilino' : 'Nuevo inquilino'}
      >
        <TenantForm 
          initialData={selectedTenant}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchTenants();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Inquilinos;
