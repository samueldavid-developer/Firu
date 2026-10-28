import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Propiedad, Propietario } from '../types/database';
import { 
  Plus, 
  Search, 
  Home, 
  Building2, 
  Building, 
  MapPin, 
  User, 
  Layers,
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import Modal from '../components/Modal';
import PropertyForm from '../components/PropertyForm';

interface PropertyWithDetails extends Propiedad {
  propietario: Propietario;
}

const Propiedades: React.FC = () => {
  const [properties, setProperties] = useState<PropertyWithDetails[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Propiedad | undefined>();

  const tabs = ['Todos', 'Departamento', 'Casa', 'Local', 'Oficina'];

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('propiedades')
        .select(`
          *,
          propietario:propietarios(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProperties(data as any || []);
      setFilteredProperties(data as any || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    let results = properties.filter(prop => 
      prop.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.ciudad?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeTab !== 'Todos') {
      results = results.filter(prop => prop.tipo === activeTab);
    }

    setFilteredProperties(results);
  }, [searchTerm, activeTab, properties]);

  const handleAddClick = () => {
    setSelectedProperty(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (prop: Propiedad) => {
    setSelectedProperty(prop);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) return;
    try {
      const { error } = await supabase.from('propiedades').delete().eq('id', id);
      if (error) throw error;
      fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Error al eliminar la propiedad');
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'Departamento': return <Building2 size={18} />;
      case 'Casa': return <Home size={18} />;
      case 'Local': return <Building size={18} />;
      default: return <Layers size={18} />;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Propiedades</h2>
          <p className="text-gray-500 mt-1">{properties.length} propiedades registradas</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-border-card text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-sm font-bold">Nueva propiedad</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
        <div className="relative group flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Buscar por dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-card border border-border-card rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand transition-all shadow-sm"
          />
        </div>
        
        <div className="flex bg-bg-card border border-border-card p-1.5 rounded-2xl shrink-0 overflow-x-auto max-w-full">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-brand text-bg-dark shadow-[0_0_15px_rgba(251,191,36,0.3)]' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="animate-spin text-brand" size={32} />
          <span className="text-sm text-gray-500 font-medium">Cargando propiedades...</span>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-bg-card border border-border-card rounded-3xl py-20 text-center text-gray-500">
          No se encontraron propiedades
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
          {filteredProperties.map((prop) => (
            <div key={prop.id} className="bg-bg-card border border-border-card rounded-3xl p-6 flex flex-col gap-6 group hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all hover:border-brand/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                    {getIcon(prop.tipo)}
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{prop.tipo}</span>
                </div>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest ${
                  prop.estado === 'Alquilada' 
                    ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                    : prop.estado === 'Mantenimiento'
                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                    : 'bg-brand/10 text-brand border-brand/20'
                }`}>
                  {prop.estado}
                </span>
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white group-hover:text-brand transition-colors truncate">{prop.direccion}</h3>
                <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                  <MapPin size={14} />
                  <span>{prop.ciudad || 'Sin ciudad'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-border-card relative z-10">
                <div className="flex items-center gap-2 text-gray-400">
                  <User size={16} className="text-gray-600" />
                  <span className="text-xs font-medium truncate max-w-[120px]">{prop.propietario?.nombre || 'Sin propietario'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Layers size={16} className="text-gray-600" />
                  <span className="text-xs font-bold">{prop.ambientes} amb.</span>
                </div>
              </div>

              {/* Actions Overlay */}
              <div className="flex gap-2 absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button 
                  onClick={() => handleEditClick(prop)}
                  className="p-2 bg-bg-dark/80 backdrop-blur-sm border border-border-card text-gray-400 hover:text-brand rounded-lg transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteClick(prop.id)}
                  className="p-2 bg-bg-dark/80 backdrop-blur-sm border border-border-card text-gray-400 hover:text-red-500 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedProperty ? 'Editar propiedad' : 'Nueva propiedad'}
      >
        <PropertyForm 
          initialData={selectedProperty}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchProperties();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Propiedades;
