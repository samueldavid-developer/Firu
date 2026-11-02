import React, { useCallback, useEffect, useState } from 'react';
import { db, collection, getDocs, query, where, mapDocs } from '../lib/fire';
import type { Contrato, Inquilino, Pago } from '../types/database';
import { MESES, fechaDeCobro, formatCurrency, formatDate } from '../lib/payments';
import { CheckCircle2, AlertCircle, AlertTriangle, Phone, CreditCard, Mail, Loader2 } from 'lucide-react';
import Modal from './Modal';

interface ContratoConInquilino extends Contrato {
  inquilino?: Inquilino;
}

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContratoConInquilino | null;
}

/** Fecha local en formato YYYY-MM-DD (evita el desfase de toISOString por zona horaria). */
const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const iniciales = (nombre: string) =>
  nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

/** Fila de un concepto (Alquiler / Condominio) evaluada de forma independiente. */
interface FilaConcepto {
  etiqueta: string;
  pagado: boolean;
  monto: number;
  /** Fecha real de pago (solo si está pagado). */
  fechaPago: string;
  /** Fecha en la que inició la deuda (solo si está pendiente). */
  fechaDeuda: string;
}

const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({ isOpen, onClose, contract }) => {
  const [loading, setLoading] = useState(false);
  const [pagoAlquiler, setPagoAlquiler] = useState<Pago | null>(null);
  const [pagoCondominio, setPagoCondominio] = useState<Pago | null>(null);

  const hoy = new Date();
  const mes = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();
  const idContrato = contract?.id;

  const fetchEstado = useCallback(async () => {
    if (!idContrato) return;
    setLoading(true);
    try {
      // Se consulta solo por contrato_id (índice automático de un solo campo) y se
      // filtra el período en el cliente para no depender de índices compuestos.
      const snapshot = await getDocs(
        query(collection(db, 'pagos'), where('contrato_id', '==', idContrato))
      );
      const cobrados = mapDocs<Pago>(snapshot).filter(
        p => p.estado === 'Cobrado' && p.mes === mes && p.anio === anio
      );
      setPagoAlquiler(cobrados.find(p => (p.concepto || 'Alquiler') === 'Alquiler') || null);
      setPagoCondominio(cobrados.find(p => p.concepto === 'Condominio') || null);
    } catch (error) {
      console.error('Error fetching payment status:', error);
    } finally {
      setLoading(false);
    }
  }, [idContrato, mes, anio]);

  useEffect(() => {
    if (isOpen) fetchEstado();
  }, [isOpen, fetchEstado]);

  if (!contract) return null;

  const nombreInquilino = contract.inquilino?.nombre || 'Sin inquilino';
  const etiquetaPeriodo = `${MESES[mes - 1]} ${anio}`;

  const montoCondominio = contract.monto_condominio || 0;
  const condominioAplica = montoCondominio > 0;

  const alquilerPagado = !!pagoAlquiler;
  const condominioPagado = !!pagoCondominio;

  const filas: FilaConcepto[] = [
    {
      etiqueta: 'Alquiler',
      pagado: alquilerPagado,
      monto: alquilerPagado ? (pagoAlquiler?.monto || 0) : (contract.monto_mensual || 0),
      fechaPago: formatDate(pagoAlquiler?.fecha_cobro || pagoAlquiler?.created_at || ''),
      fechaDeuda: formatDate(toISODate(fechaDeCobro(anio, mes, contract.dia_cobro)))
    }
  ];

  if (condominioAplica) {
    filas.push({
      etiqueta: 'Condominio',
      pagado: condominioPagado,
      monto: condominioPagado ? (pagoCondominio?.monto || 0) : montoCondominio,
      fechaPago: formatDate(pagoCondominio?.fecha_cobro || pagoCondominio?.created_at || ''),
      fechaDeuda: formatDate(toISODate(fechaDeCobro(anio, mes, contract.dia_cobro)))
    });
  }

  const totalConceptos = filas.length;
  const conceptosPagados = filas.filter(f => f.pagado).length;
  const todoPagado = conceptosPagados === totalConceptos;
  const parcial = conceptosPagados > 0 && !todoPagado;

  const totalCobrado = filas.filter(f => f.pagado).reduce((acc, f) => acc + f.monto, 0);
  const totalAdeudado = filas.filter(f => !f.pagado).reduce((acc, f) => acc + f.monto, 0);

  const banner = todoPagado
    ? {
      label: 'Todo pagado',
      icon: CheckCircle2,
      contenedor: 'bg-green-500/10 border-green-500/20',
      color: 'text-green-500',
      detalle: `Todos los conceptos de ${etiquetaPeriodo} están cobrados`
    }
    : parcial
      ? {
        label: 'Pago parcial',
        icon: AlertCircle,
        contenedor: 'bg-orange-500/10 border-orange-500/20',
        color: 'text-orange-500',
        detalle: `${conceptosPagados} de ${totalConceptos} conceptos cobrados en ${etiquetaPeriodo}`
      }
      : {
        label: 'Pago pendiente',
        icon: AlertTriangle,
        contenedor: 'bg-red-500/10 border-red-500/20',
        color: 'text-red-500',
        detalle: `Sin cobros registrados en ${etiquetaPeriodo}`
      };
  const BannerIcon = banner.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comprobante de pago">
      {loading ? (
        <div className="py-10 sm:py-12 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-brand" size={28} />
          <span className="text-sm text-gray-500 font-medium">Consultando estado de pago...</span>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {/* Encabezado: inquilino + datos de contacto */}
          <div className="bg-bg-dark border border-border-card rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-sm shrink-0">
                {iniciales(nombreInquilino)}
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-white truncate">{nombreInquilino}</h4>
                <p className="text-xs text-gray-500 mt-0.5 truncate">Período {etiquetaPeriodo}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-300 min-w-0">
                <Phone size={14} className="text-gray-600 shrink-0" />
                <span className="truncate">{contract.inquilino?.telefono || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300 min-w-0">
                <CreditCard size={14} className="text-gray-600 shrink-0" />
                <span className="truncate">{contract.inquilino?.dni ? `DNI ${contract.inquilino.dni}` : 'Sin cédula'}</span>
              </div>
              {contract.inquilino?.email && (
                <div className="flex items-center gap-2 text-sm text-gray-300 sm:col-span-2 min-w-0">
                  <Mail size={14} className="text-gray-600 shrink-0" />
                  <span className="break-words min-w-0">{contract.inquilino.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Banner principal dinámico */}
          <div className={`flex flex-col items-center text-center gap-2 border rounded-2xl p-4 sm:p-6 ${banner.contenedor}`}>
            <BannerIcon className={banner.color} size={36} />
            <div className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${banner.color}`}>{banner.label}</div>
            <div className="text-[11px] sm:text-xs text-gray-400 break-words">{banner.detalle}</div>
          </div>

          {/* Desglose por concepto (evaluación independiente) */}
          <div className="border border-border-card rounded-2xl overflow-hidden divide-y divide-border-card">
            {filas.map(fila => (
              <div key={fila.etiqueta} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs sm:text-sm font-semibold ${fila.pagado ? 'text-green-500' : 'text-red-500'}`}>
                      {fila.etiqueta}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-widest ${fila.pagado
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                      {fila.pagado ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 break-words">
                    {fila.pagado
                      ? `Pagado el ${fila.fechaPago || '—'}`
                      : `Inicio de deuda: ${fila.fechaDeuda}`}
                  </div>
                </div>
                <div className={`text-xs sm:text-sm font-bold sm:text-right shrink-0 ${fila.pagado ? 'text-white' : 'text-red-500'}`}>
                  {formatCurrency(fila.monto)}
                </div>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="space-y-3">
            {totalCobrado > 0 && (
              <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl border border-brand/30 bg-brand/5">
                <span className="text-xs sm:text-sm font-bold text-white truncate">Total cobrado</span>
                <span className="text-lg sm:text-xl font-bold text-brand shrink-0">{formatCurrency(totalCobrado)}</span>
              </div>
            )}
            {totalAdeudado > 0 && (
              <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl border border-red-500/30 bg-red-500/5">
                <span className="text-xs sm:text-sm font-bold text-white truncate">Total adeudado</span>
                <span className="text-lg sm:text-xl font-bold text-red-500 shrink-0">{formatCurrency(totalAdeudado)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PaymentReceiptModal;
