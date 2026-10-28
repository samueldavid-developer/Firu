import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Propietario } from '../types/database';
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Phone,
  Mail,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import Modal from '../components/Modal';
import OwnerForm from '../components/OwnerForm';

const Propietarios: React.FC = () => {
  const [owners, setOwners] = useState<Propietario[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<Propietario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Propietario | undefined>();

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('propietarios')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setOwners(data || []);
      setFilteredOwners(data || []);
    } catch (error) {
      console.error('Error fetching owners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  useEffect(() => {
    const results = owners.filter(owner =>
      owner.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOwners(results);
  }, [searchTerm, owners]);

  const handleAddClick = () => {
    setSelectedOwner(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (owner: Propietario) => {
    setSelectedOwner(owner);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este propietario?')) return;

    try {
      const { error } = await supabase
        .from('propietarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchOwners();
    } catch (error) {
      console.error('Error deleting owner:', error);
      alert('Error al eliminar el propietario');
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
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Propietarios</h2>
          <p className="text-gray-500 mt-1">{owners.length} propietarios registrados</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-border-card text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-sm font-bold">Nuevo propietario</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-bg-card border border-border-card rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand transition-all shadow-sm focus:shadow-[0_0_20px_rgba(251,191,36,0.05)]"
        />
      </div>

      {/* Table Section */}
      <div className="bg-bg-card border border-border-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-border-card bg-bg-sidebar/50">
                <th className="px-6 py-5">Propietario</th>
                <th className="px-6 py-5">CUIT / DNI</th>
                <th className="px-6 py-5">Teléfono</th>
                <th className="px-6 py-5">Email</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-brand" size={32} />
                      <span className="text-sm text-gray-500 font-medium">Cargando propietarios...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron propietarios que coincidan con la búsqueda' : 'No hay propietarios registrados'}
                  </td>
                </tr>
              ) : (
                filteredOwners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold text-sm border border-brand/20 shadow-inner">
                          {getInitials(owner.nombre)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-brand transition-colors">
                            {owner.nombre}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-tighter mt-0.5">ID: {owner.id.split('-')[0]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {owner.cuit_dni || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {owner.telefono || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {owner.email || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(owner)}
                          className="p-2 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(owner.id)}
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
        title={selectedOwner ? 'Editar propietario' : 'Nuevo propietario'}
      >
        <OwnerForm
          initialData={selectedOwner}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchOwners();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Propietarios;
