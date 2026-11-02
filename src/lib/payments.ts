export type EstadoCobro = 'cobrado' | 'hoy' | 'proximo' | 'atrasado' | 'pendiente';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Fecha de cobro del período indicado, ajustando el día al último del mes si hiciera falta. */
export const fechaDeCobro = (anio: number, mes: number, diaCobro: number): Date => {
  const ultimoDiaDelMes = new Date(anio, mes, 0).getDate();
  return new Date(anio, mes - 1, Math.min(diaCobro, ultimoDiaDelMes));
};

/** Primer período de cobro cuyo día de cobro no sea anterior a la fecha de inicio del contrato. */
export const primerPeriodoCobro = (fechaInicio: Date, diaCobro: number): { anio: number; mes: number } => {
  const anio = fechaInicio.getFullYear();
  const mes = fechaInicio.getMonth() + 1;
  if (fechaDeCobro(anio, mes, diaCobro) < fechaInicio) {
    return mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 };
  }
  return { anio, mes };
};

/** Días entre hoy y la fecha de cobro (positivo = falta, 0 = hoy, negativo = atrasado). */
export const diasHastaCobro = (fechaCobro: Date, hoy: Date = new Date()): number => {
  const objetivo = new Date(fechaCobro.getFullYear(), fechaCobro.getMonth(), fechaCobro.getDate());
  const actual = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((objetivo.getTime() - actual.getTime()) / MS_PER_DAY);
};

/** Clasifica el cobro según los días de diferencia. Devuelve null si todavía falta demasiado. */
export const clasificarCobro = (dias: number): EstadoCobro | null => {
  if (dias < 0) return 'atrasado';
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'proximo';
  return null;
};

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

/**
 * Formatea una fecha 'YYYY-MM-DD' sin desfase de zona horaria
 * (new Date('2026-01-10') se interpreta como UTC y retrocedería un día en Argentina).
 */
export const formatDate = (dateStr: string) => {
  const [anio, mes, dia] = dateStr.split('T')[0].split('-').map(Number);
  if (!anio || !mes || !dia) return dateStr;
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-AR');
};
