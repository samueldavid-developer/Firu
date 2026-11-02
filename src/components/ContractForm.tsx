import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, query, orderBy, addDoc, doc, updateDoc, mapDocs, cleanData, createdAt } from '../lib/fire';
import type { Contrato, Inquilino } from '../types/database';
import { Save, Loader2 } from 'lucide-react';

interface ContractFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Contrato;
}

/** Fecha actual del sistema en formato YYYY-MM-DD para prellenar los campos de fecha. */
const hoyISO = () => new Date().toISOString().split('T')[0];

/** Solo dígitos enteros (bloquea letras, signos, 'e' y separadores). */
const sanitizeEntero = (value: string) => value.replace(/\D/g, '');

/** Dígitos con un único separador decimal (punto o coma normalizada a punto). */
const sanitizeMonto = (value: string) => {
  const limpio = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const [entero, ...decimales] = limpio.split('.');
  return decimales.length ? `${entero}.${decimales.join('')}` : entero;
};

/** Oculta las flechas del input numérico y evita que el scroll cambie el valor. */
const INPUT_NUMERICO =
  'w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

const ContractForm: React.FC<ContractFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<Inquilino[]>([]);
  const [formData, setFormData] = useState({
    inquilino_id: initialData?.inquilino_id || '',
    monto_mensual: initialData?.monto_mensual?.toString() || '',
    monto_condominio: initialData?.monto_condominio?.toString() || '',
    fecha_inicio: initialData?.fecha_inicio || hoyISO(),
    fecha_fin: initialData?.fecha_fin || hoyISO(),
    dia_cobro: initialData?.dia_cobro?.toString() || '',
    estado: initialData?.estado || 'Activo' as Contrato['estado'],
  });

  const esPlazoDefinido = formData.estado === 'Activo';

  useEffect(() => {
    const fetchTenants = async () => {
      const snapshot = await getDocs(query(collection(db, 'inquilinos'), orderBy('nombre')));
      setTenants(mapDocs<Inquilino>(snapshot));
    };
    fetchTenants();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'estado') {
      // Al pasar a "Persona permanente" el contrato no tiene plazo, se limpia la fecha de fin
      setFormData(prev => ({ ...prev, estado: value as Contrato['estado'], fecha_fin: value === 'Activo' ? prev.fecha_fin : '' }));
      return;
    }

    if (name === 'monto_mensual') {
      setFormData(prev => ({ ...prev, monto_mensual: sanitizeMonto(value) }));
      return;
    }

    if (name === 'monto_condominio') {
      setFormData(prev => ({ ...prev, monto_condominio: sanitizeMonto(value) }));
      return;
    }

    if (name === 'dia_cobro') {
      setFormData(prev => ({ ...prev, dia_cobro: sanitizeEntero(value) }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const monto = Number(formData.monto_mensual);
    const diaCobro = Number(formData.dia_cobro);
    const condominio = formData.monto_condominio.trim() === '' ? 0 : Number(formData.monto_condominio);
    if (!formData.inquilino_id || !(monto > 0) || !(diaCobro >= 1 && diaCobro <= 31) || isNaN(condominio) || condominio < 0) {
      alert('Completa el inquilino, un monto mensual válido y un día de cobro entre 1 y 31.');
      return;
    }

    setLoading(true);

    try {
      const payload = cleanData({
        inquilino_id: formData.inquilino_id,
        monto_mensual: monto,
        monto_condominio: condominio,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: esPlazoDefinido ? formData.fecha_fin : '',
        dia_cobro: diaCobro,
        estado: formData.estado
      });

      if (initialData?.id) {
        await updateDoc(doc(db, 'contratos', initialData.id), payload);
      } else {
        await addDoc(collection(db, 'contratos'), { ...payload, ...createdAt() });
      }
      onSuccess();
    } catch (error) {
      console.error('Error detallado de Firestore:', error);
      alert('Error al guardar el contrato. Revisa la consola (F12) para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Monto mensual *</label>
          <input
            required
            type="number"
            inputMode="decimal"
            name="monto_mensual"
            value={formData.monto_mensual}
            onChange={handleChange}
            onWheel={(e) => e.currentTarget.blur()}
            placeholder="0.00"
            className={INPUT_NUMERICO}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Día de cobro *</label>
          <input
            required
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            name="dia_cobro"
            value={formData.dia_cobro}
            onChange={handleChange}
            onWheel={(e) => e.currentTarget.blur()}
            placeholder="10"
            className={INPUT_NUMERICO}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Condominio mensual (opcional)</label>
        <input
          type="number"
          inputMode="decimal"
          name="monto_condominio"
          value={formData.monto_condominio}
          onChange={handleChange}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder="0.00"
          className={INPUT_NUMERICO}
        />
        <p className="text-xs text-gray-500">
          Cargo extra mensual. Se cobra el mismo día de cobro que el alquiler.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</label>
        <select
          name="estado"
          value={formData.estado}
          onChange={handleChange}
          className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors appearance-none cursor-pointer"
        >
          <option value="Activo">Activo</option>
          <option value="Persona permanente">Persona permanente</option>
        </select>
      </div>

      <div className={`grid ${esPlazoDefinido ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
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
        {esPlazoDefinido && (
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
        )}
      </div>

      {!esPlazoDefinido && (
        <p className="text-xs text-gray-500">
          Los contratos de persona permanente no tienen fecha de fin.
        </p>
      )}

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
          className="flex-[2] py-3 rounded-xl bg-brand text-bg-dark font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-hover transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {initialData ? 'Guardar cambios' : 'Crear contrato'}
        </button>
      </div>
    </form>
  );
};

export default ContractForm;
