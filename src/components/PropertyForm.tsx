import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Propiedad, Propietario } from '../types/database';
import { Save, Loader2 } from 'lucide-react';

interface PropertyFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Propiedad;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [owners, setOwners] = useState<Propietario[]>([]);
  const [formData, setFormData] = useState({
    direccion: initialData?.direccion || '',
    ciudad: initialData?.ciudad || '',
    tipo: initialData?.tipo || 'Departamento',
    ambientes: initialData?.ambientes || 1,
    propietario_id: initialData?.propietario_id || '',
    estado: initialData?.estado || 'Disponible'
  });

  useEffect(() => {
    const fetchOwners = async () => {
      const { data } = await supabase
        .from('propietarios')
        .select('id, nombre')
        .order('nombre');
      if (data) setOwners(data);
    };
    fetchOwners();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'ambientes' ? parseInt(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData?.id) {
        const { error } = await supabase
          .from('propiedades')
          .update(formData)
          .eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('propiedades')
          .insert([formData]);
        if (error) throw error;
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Error al guardar la propiedad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dirección *</label>
        <input
          required
          type="text"
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
          placeholder="Ej: Av. Colón 123"
          className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ciudad</label>
          <input
            type="text"
            name="ciudad"
            value={formData.ciudad}
            onChange={handleChange}
            placeholder="Ej: Córdoba"
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors appearance-none cursor-pointer"
          >
            <option value="Departamento">Departamento</option>
            <option value="Casa">Casa</option>
            <option value="Local">Local</option>
            <option value="Oficina">Oficina</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ambientes</label>
          <input
            type="number"
            min="1"
            name="ambientes"
            value={formData.ambientes}
            onChange={handleChange}
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors appearance-none cursor-pointer"
          >
            <option value="Disponible">Disponible</option>
            <option value="Alquilada">Alquilada</option>
            <option value="Mantenimiento">Mantenimiento</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Propietario</label>
        <select
          name="propietario_id"
          value={formData.propietario_id}
          onChange={handleChange}
          className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors appearance-none cursor-pointer"
        >
          <option value="">Seleccionar propietario...</option>
          {owners.map(owner => (
            <option key={owner.id} value={owner.id}>{owner.nombre}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-bold text-sm hover:text-white hover:bg-white/10 transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-2 py-3 rounded-xl bg-brand text-bg-dark font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-hover transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {initialData ? 'Guardar cambios' : 'Crear propiedad'}
        </button>
      </div>
    </form>
  );
};

export default PropertyForm;
