import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Propietario } from '../types/database';
import { Save, Loader2 } from 'lucide-react';

interface OwnerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Propietario;
}

const OwnerForm: React.FC<OwnerFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    cuit_dni: initialData?.cuit_dni || '',
    telefono: initialData?.telefono || '',
    email: initialData?.email || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure we don't send extra fields if database doesn't expect them, 
      // though here we just removed it from state
      if (initialData?.id) {
        const { error } = await supabase
          .from('propietarios')
          .update(formData)
          .eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('propietarios')
          .insert([formData]);
        if (error) throw error;
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving owner:', error);
      alert('Error al guardar el propietario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre completo *</label>
        <input
          required
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ej: Juan Pérez"
          className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">CUIT / DNI *</label>
          <input
            required
            type="text"
            name="cuit_dni"
            value={formData.cuit_dni}
            onChange={handleChange}
            placeholder="20-XXXXXXXX-X"
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono *</label>
          <input
            required
            type="text"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="0351-XXXXXXX"
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email (Opcional)</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="juan.perez@email.com"
          className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
        />
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
          {initialData ? 'Guardar cambios' : 'Crear propietario'}
        </button>
      </div>
    </form>
  );
};

export default OwnerForm;
