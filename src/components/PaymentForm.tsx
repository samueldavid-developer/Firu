import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Pago, Contrato, Propiedad, Inquilino } from '../types/database';
import { Save, Loader2 } from 'lucide-react';

interface PaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Pago;
}

interface ContratoWithDetails extends Contrato {
  propiedad: Propiedad;
  inquilino: Inquilino;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<ContratoWithDetails[]>([]);
  
  const now = new Date();
  const [formData, setFormData] = useState({
    contrato_id: initialData?.contrato_id || '',
    mes: initialData?.mes || now.getMonth() + 1,
    anio: initialData?.anio || now.getFullYear(),
    monto: initialData?.monto || 0,
    estado: initialData?.estado || 'Pendiente',
    fecha_cobro: initialData?.fecha_cobro || '',
  });

  useEffect(() => {
    const fetchContracts = async () => {
      const { data } = await supabase
        .from('contratos')
        .select('*, propiedad:propiedades(*), inquilino:inquilinos(*)')
        .eq('estado', 'Activo');
      if (data) setContracts(data as any);
    };
    fetchContracts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: (name === 'mes' || name === 'anio' || name === 'monto') 
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
          .from('pagos')
          .update(formData)
          .eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pagos')
          .insert([formData]);
        if (error) throw error;
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contrato Activo *</label>
        <select
          required
          name="contrato_id"
          value={formData.contrato_id}
          onChange={handleChange}
          className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors appearance-none cursor-pointer"
        >
          <option value="">Seleccionar contrato...</option>
          {contracts.map(c => (
            <option key={c.id} value={c.id}>
              {c.propiedad.direccion} - {c.inquilino.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mes</label>
          <select
            name="mes"
            value={formData.mes}
            onChange={handleChange}
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors appearance-none cursor-pointer"
          >
            {meses.map((mes, index) => (
              <option key={mes} value={index + 1}>{mes}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Año</label>
          <input
            type="number"
            name="anio"
            value={formData.anio}
            onChange={handleChange}
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Monto *</label>
          <input
            required
            type="number"
            name="monto"
            value={formData.monto}
            onChange={handleChange}
            placeholder="Ej: 250000"
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
            <option value="Pendiente">Pendiente</option>
            <option value="Cobrado">Cobrado</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha de cobro</label>
        <input
          type="date"
          name="fecha_cobro"
          value={formData.fecha_cobro}
          onChange={handleChange}
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
          {initialData ? 'Actualizar' : 'Registrar Pago'}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;
