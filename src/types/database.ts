export interface Propietario {
  id: string
  nombre: string
  cuit_dni?: string
  telefono?: string
  email?: string
  cuenta_bancaria?: string
  created_at?: string
}

export interface Propiedad {
  id: string
  propietario_id?: string
  direccion: string
  ciudad?: string
  tipo: 'Departamento' | 'Casa' | 'Local' | 'Oficina'
  ambientes: number
  estado: 'Disponible' | 'Alquilada' | 'Mantenimiento'
  created_at?: string
}

export interface Inquilino {
  id: string
  nombre: string
  dni?: string
  telefono?: string
  email?: string
  garante?: string
  created_at?: string
}

export interface Contrato {
  id: string
  propiedad_id: string
  inquilino_id: string
  monto_mensual: number
  deposito?: number
  tipo_ajuste: 'ICL' | 'IPC' | 'Fijo'
  frecuencia_ajuste_meses: number
  fecha_inicio: string
  fecha_fin: string
  proximo_aumento?: string
  estado: 'Activo' | 'Finalizado' | 'Rescindido'
  created_at?: string
}

export interface Pago {
  id: string
  contrato_id: string
  mes: number
  anio: number
  monto: number
  estado: 'Pendiente' | 'Cobrado'
  fecha_cobro?: string
  created_at?: string
}

export interface Servicio {
  id: string
  propiedad_id: string
  tipo_servicio: string
  responsable: 'Inquilino' | 'Propietario'
  monto: number
  estado: 'Pendiente' | 'Pagado'
  mes_anio?: string
  fecha_cobro?: string
  created_at?: string
}