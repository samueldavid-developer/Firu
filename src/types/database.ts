export interface Inquilino {
  id: string
  nombre: string
  dni?: string
  telefono?: string
  email?: string
  created_at?: string
}

export interface Contrato {
  id: string
  inquilino_id: string
  monto_mensual: number
  /** Monto mensual opcional de condominio. Se cobra el mismo día de cobro que el alquiler. */
  monto_condominio?: number
  fecha_inicio: string
  /** Vacío o ausente cuando el contrato es "Persona permanente" (sin plazo definido). */
  fecha_fin?: string
  /** Día del mes en que se debe cobrar (1 a 31). */
  dia_cobro: number
  estado: 'Activo' | 'Persona permanente'
  created_at?: string
}

/** Concepto de un cobro registrado en la colección `pagos`. */
export type ConceptoPago = 'Alquiler' | 'Condominio'

export interface Pago {
  id: string
  contrato_id: string
  /** Nombre del inquilino congelado al momento del cobro, para preservar el historial aunque se borre el contrato o el inquilino. */
  inquilino_nombre?: string
  /** Ausente equivale a 'Alquiler' (registros previos a la incorporación del condominio). */
  concepto?: ConceptoPago
  mes: number
  anio: number
  monto: number
  estado: 'Pendiente' | 'Cobrado'
  fecha_cobro?: string
  created_at?: string
}

export interface Gasto {
  id: string
  descripcion: string
  monto: number
  /** Fecha del gasto en formato ISO (YYYY-MM-DD). */
  fecha: string
  createdAt?: string
  updatedAt?: string
}
