import React, { useState } from 'react';
import { db, collection, addDoc, doc, updateDoc, cleanData } from '../lib/fire';
import type { Gasto } from '../types/database';
import { Save, Loader2 } from 'lucide-react';

interface GastoFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Gasto;
}

const hoyISO = () => new Date().toISOString().split('T')[0];

/** Dígitos con un único separador decimal (punto o coma normalizada a punto). */
const sanitizeMonto = (value: string) => {
  const limpio = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const [entero, ...decimales] = limpio.split('.');
  return decimales.length ? `${entero}.${decimales.join('')}` : entero;
};

/** Oculta las flechas del input numérico y evita que el scroll cambie el valor. */
const INPUT_NUMERICO =
  'w-full bg-bg-dark border border-border-card rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-brand transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

const GastoForm: React.FC<GastoFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    descripcion: initialData?.descripcion || '',
    monto: initialData?.monto?.toString() || '',
    fecha: initialData?.fecha?.split('T')[0] || hoyISO()
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'monto') {
      setFormData(prev => ({ ...prev, monto: sanitizeMonto(value) }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const monto = Number(formData.monto);
    if (!formData.descripcion.trim() || !formData.fecha || isNaN(monto) || monto <= 0) {
      alert('Ingresa una descripción, un monto válido y una fecha.');
      return;
    }

    setLoading(true);
    try {
      const payload = cleanData({
        descripcion: formData.descripcion.trim(),
        monto,
        fecha: formData.fecha
      });
      const ahora = new Date().toISOString();

      if (initialData?.id) {
        await updateDoc(doc(db, 'gastos', initialData.id), { ...payload, updatedAt: ahora });
      } else {
        await addDoc(collection(db, 'gastos'), { ...payload, createdAt: ahora, updatedAt: ahora });
      }
      onSuccess();
    } catch (error) {
      console.error('Error detallado de Firestore:', error);
      alert('Error al guardar el gasto. Revisa la consola (F12) para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción / Concepto *</label>
        <input
          required
          type="text"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Ej: Reparación de cañería"
          className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Monto ($) *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">$</span>
            <input
              required
              type="number"
              inputMode="decimal"
              name="monto"
              min="0"
              step="0.01"
              value={formData.monto}
              onChange={handleChange}
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="0.00"
              className={INPUT_NUMERICO}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha del gasto *</label>
          <input
            required
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors [color-scheme:dark]"
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
          {initialData ? 'Guardar cambios' : 'Registrar gasto'}
        </button>
      </div>
    </form>
  );
};

export default GastoForm;
