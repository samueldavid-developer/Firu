import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Contrato, Propiedad, Inquilino } from '../types/database';
import { Save, Loader2 } from 'lucide-react';

interface ContractFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Contrato;
}

const ContractForm: React.FC<ContractFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Propiedad[]>([]);
  const [tenants, setTenants] = useState<Inquilino[]>([]);
  const [formData, setFormData] = useState({
    propiedad_id: initialData?.propiedad_id || '',
    inquilino_id: initialData?.inquilino_id || '',
    monto_mensual: initialData?.monto_mensual || 0,
    deposito: initialData?.deposito || 0,
    tipo_ajuste: initialData?.tipo_ajuste || 'ICL',
    frecuencia_ajuste_meses: initialData?.frecuencia_ajuste_meses || 4,
    fecha_inicio: initialData?.fecha_inicio || '',
    fecha_fin: initialData?.fecha_fin || '',
    estado: initialData?.estado || 'Activo',
  });

  useEffect(() => {
    const fetchData = async () => {
      const [propsRes, tenantsRes] = await Promise.all([
        supabase.from('propiedades').select('*').order('direccion'),
        supabase.from('inquilinos').select('*').order('nombre')
      ]);
      if (propsRes.data) setProperties(propsRes.data);
      if (tenantsRes.data) setTenants(tenantsRes.data);
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: (name === 'monto_mensual' || name === 'deposito' || name === 'frecuencia_ajuste_meses') 
        ? parseFloat(value) 
        : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData?.id) {
        const { error } = await supabase
          .from('contratos')
          .update(formData)
          .eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contratos')
          .insert([formData]);
        if (error) throw error;
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving contract:', error);
      alert('Error al guardar el contrato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Propiedad *</label>
          <select
            required
            name="propiedad_id"
            value={formData.propiedad_id}
            onChange={handleChange}
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors appearance-none cursor-pointer"
          >
            <option value="">Seleccionar propiedad...</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.direccion}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inquilino *</label>
          <select
            required
            name="inquilino_id"
            value={formData.inquilino_id}
            onChange={handleChange}
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors appearance-none cursor-pointer"
          >
            <option value="">Seleccionar inquilino...</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Monto mensual *</label>
          <input
            required
            type="number"
            name="monto_mensual"
            value={formData.monto_mensual}
            onChange={handleChange}
            placeholder="Ej: 250000"
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Depósito</label>
          <input
            type="number"
            name="deposito"
            value={formData.deposito}
            onChange={handleChange}
            placeholder="Ej: 250000"
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo de ajuste</label>
          <select
            name="tipo_ajuste"
            value={formData.tipo_ajuste}
            onChange={handleChange}
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors appearance-none cursor-pointer"
          >
            <option value="ICL">ICL</option>
            <option value="IPC">IPC</option>
            <option value="Fijo">Fijo</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Frecuencia (meses)</label>
          <input
            type="number"
            name="frecuencia_ajuste_meses"
            value={formData.frecuencia_ajuste_meses}
            onChange={handleChange}
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha de inicio *</label>
          <input
            required
            type="date"
            name="fecha_inicio"
            value={formData.fecha_inicio}
            onChange={handleChange}
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha de fin *</label>
          <input
            required
            type="date"
            name="fecha_fin"
            value={formData.fecha_fin}
            onChange={handleChange}
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
          />
        </div>
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
          {initialData ? 'Guardar cambios' : 'Crear contrato'}
        </button>
      </div>
    </form>
  );
};

export default ContractForm;
