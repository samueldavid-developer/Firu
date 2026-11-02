import { useCallback, useEffect, useState } from 'react';
import { db, collection, getDocs, query, where, addDoc, updateDoc, doc, writeBatch, mapDocs, fetchLookup, createdAt } from '../lib/fire';
import type { ConceptoPago, Contrato, Inquilino, Pago } from '../types/database';
import { ESTADOS_VIGENTES } from './useAlerts';
import { fechaDeCobro, primerPeriodoCobro, diasHastaCobro, clasificarCobro } from '../lib/payments';

export interface PeriodoPendiente {
  mes: number;
  anio: number;
}

export interface PaymentAlert {
  id: string;
  contratoId: string;
  concepto: ConceptoPago;
  inquilinoNombre: string;
  /** Monto total a cobrar (en condominio incluye la deuda acumulada de meses anteriores). */
  monto: number;
  /** Monto unitario del concepto por período (monto mensual o monto de condominio). */
  montoUnitario: number;
  diaCobro: number;
  /** 'atrasado' | 'hoy' | 'proximo' */
  estado: 'atrasado' | 'hoy' | 'proximo';
  /** Días hasta el cobro: negativo si está atrasado. */
  dias: number;
  mes: number;
  anio: number;
  /** Id del pago ya existente para el período, si lo hubiera. */
  pagoId?: string;
  vencimiento: Date;
  /** Períodos adeudados (solo condominio): permite registrar la deuda acumulada completa. */
  periodosPendientes?: PeriodoPendiente[];
}

/** Máximo de meses hacia atrás que se revisan para acumular deuda de condominio. */
const MAX_MESES_DEUDA = 24;

const clavePago = (contratoId: string, concepto: ConceptoPago) => `${contratoId}::${concepto}`;

const parseFecha = (fecha?: string): Date => {
  if (!fecha) return new Date();
  const [anio, mes, dia] = fecha.split('T')[0].split('-').map(Number);
  return new Date(anio, mes - 1, dia);
};

/** Lista de meses entre dos fechas (inclusive), de más antiguo a más reciente. */
const mesesEntre = (desde: Date, hasta: Date): PeriodoPendiente[] => {
  const meses: PeriodoPendiente[] = [];
  let anio = desde.getFullYear();
  let mes = desde.getMonth() + 1;
  const anioFin = hasta.getFullYear();
  const mesFin = hasta.getMonth() + 1;

  while (anio < anioFin || (anio === anioFin && mes <= mesFin)) {
    meses.push({ anio, mes });
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }
  return meses;
};

/** Clasifica un vencimiento devolviendo siempre uno de los tres estados de alerta. */
const clasificarVencimiento = (dias: number): PaymentAlert['estado'] =>
  dias < 0 ? 'atrasado' : dias === 0 ? 'hoy' : 'proximo';

export const usePaymentAlerts = () => {
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);
  const [resumen, setResumen] = useState({ pendientes: 0, montoPendiente: 0 });
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const hoy = new Date();
      const mes = hoy.getMonth() + 1;
      const anio = hoy.getFullYear();

      // Se cargan todos los pagos para poder detectar la deuda de condominio de meses anteriores.
      const [contratosSnap, inquilinos, pagosSnap] = await Promise.all([
        getDocs(query(collection(db, 'contratos'), where('estado', 'in', ESTADOS_VIGENTES))),
        fetchLookup<Inquilino>('inquilinos'),
        getDocs(collection(db, 'pagos'))
      ]);

      const pagoActualPorClave = new Map<string, Pago>();
      const condominiosCobrados = new Set<string>();

      mapDocs<Pago>(pagosSnap).forEach(pago => {
        const concepto: ConceptoPago = pago.concepto || 'Alquiler';
        if (pago.mes === mes && pago.anio === anio) {
          pagoActualPorClave.set(clavePago(pago.contrato_id, concepto), pago);
        }
        if (concepto === 'Condominio' && pago.estado === 'Cobrado') {
          condominiosCobrados.add(`${pago.contrato_id}::${pago.anio}-${pago.mes}`);
        }
      });

      const proximos: PaymentAlert[] = [];
      let pendientes = 0;
      let montoPendiente = 0;

      mapDocs<Contrato>(contratosSnap).forEach(contrato => {
        const inquilinoNombre = inquilinos[contrato.inquilino_id]?.nombre || 'Sin inquilino';

        // --- Cobro del alquiler (según el día de cobro del contrato) ---
        const pagoAlquiler = pagoActualPorClave.get(clavePago(contrato.id, 'Alquiler'));
        if (pagoAlquiler?.estado !== 'Cobrado') {
          pendientes += 1;
          montoPendiente += contrato.monto_mensual || 0;

          const vencimiento = fechaDeCobro(anio, mes, contrato.dia_cobro);
          const dias = diasHastaCobro(vencimiento, hoy);
          const estado = clasificarCobro(dias);

          if (estado && estado !== 'cobrado' && estado !== 'pendiente') {
            proximos.push({
              id: clavePago(contrato.id, 'Alquiler'),
              contratoId: contrato.id,
              concepto: 'Alquiler',
              inquilinoNombre,
              monto: contrato.monto_mensual || 0,
              montoUnitario: contrato.monto_mensual || 0,
              diaCobro: contrato.dia_cobro,
              estado,
              dias,
              mes,
              anio,
              pagoId: pagoAlquiler?.id,
              vencimiento
            });
          }
        }

        // --- Cobro del condominio (mismo día de cobro que el alquiler) ---
        const montoCondominio = contrato.monto_condominio || 0;
        if (montoCondominio > 0) {
          const inicio = parseFecha(contrato.fecha_inicio);
          // La primera obligación arranca en el período de inicio del contrato (o el siguiente)
          const periodoInicial = primerPeriodoCobro(inicio, contrato.dia_cobro);
          const limite = new Date(anio, mes - 1 - MAX_MESES_DEUDA, 1);
          const desdeBase = new Date(periodoInicial.anio, periodoInicial.mes - 1, 1);
          const desde = desdeBase > limite ? desdeBase : limite;
          const vencimientoDe = (periodo: PeriodoPendiente) =>
            fechaDeCobro(periodo.anio, periodo.mes, contrato.dia_cobro);

          // Los meses anteriores al actual que no fueron cobrados quedan como deuda acumulada.
          const vencidos: PeriodoPendiente[] = [];
          mesesEntre(desde, new Date(anio, mes - 1, 1)).forEach(periodo => {
            if (periodo.anio === anio && periodo.mes === mes) return;
            if (condominiosCobrados.has(`${contrato.id}::${periodo.anio}-${periodo.mes}`)) return;
            if (diasHastaCobro(vencimientoDe(periodo), hoy) < 0) vencidos.push(periodo);
          });

          const vencActual = fechaDeCobro(anio, mes, contrato.dia_cobro);
          const diasActual = diasHastaCobro(vencActual, hoy);
          const actualCobrado = condominiosCobrados.has(`${contrato.id}::${anio}-${mes}`);
          const incluirActual = !actualCobrado && diasActual <= 1;

          if (vencidos.length > 0 || incluirActual) {
            const periodosPendientes = [...vencidos, ...(incluirActual ? [{ mes, anio }] : [])];
            const primerVencido = vencidos[0];
            const pagoCondActual = pagoActualPorClave.get(clavePago(contrato.id, 'Condominio'));

            proximos.push({
              id: clavePago(contrato.id, 'Condominio'),
              contratoId: contrato.id,
              concepto: 'Condominio',
              inquilinoNombre,
              monto: periodosPendientes.length * montoCondominio,
              montoUnitario: montoCondominio,
              diaCobro: contrato.dia_cobro,
              estado: vencidos.length > 0 ? 'atrasado' : clasificarVencimiento(diasActual),
              // Días transcurridos desde el vencimiento más antiguo (o el del mes actual)
              dias: primerVencido ? diasHastaCobro(vencimientoDe(primerVencido), hoy) : diasActual,
              mes,
              anio,
              pagoId: pagoCondActual?.id,
              vencimiento: primerVencido ? vencimientoDe(primerVencido) : vencActual,
              periodosPendientes
            });
          }
        }
      });

      proximos.sort((a, b) => a.dias - b.dias);

      setAlerts(proximos);
      setResumen({ pendientes, montoPendiente });
    } catch (error) {
      console.error('Error fetching payment alerts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registra el cobro con estado 'Cobrado'.
   * - Alquiler: un único pago del período actual.
   * - Condominio: un pago por cada período adeudado (permite saldar la deuda acumulada).
   */
  const registerPayment = useCallback(async (alert: PaymentAlert) => {
    const fecha = new Date().toISOString().split('T')[0];

    if (alert.concepto === 'Condominio') {
      const periodos = alert.periodosPendientes ?? [{ mes: alert.mes, anio: alert.anio }];
      const batch = writeBatch(db);

      periodos.forEach(periodo => {
        batch.set(doc(collection(db, 'pagos')), {
          contrato_id: alert.contratoId,
          inquilino_nombre: alert.inquilinoNombre,
          concepto: 'Condominio',
          mes: periodo.mes,
          anio: periodo.anio,
          monto: alert.montoUnitario,
          estado: 'Cobrado',
          fecha_cobro: fecha,
          ...createdAt()
        });
      });

      await batch.commit();
      await fetchAlerts();
      return;
    }

    if (alert.pagoId) {
      await updateDoc(doc(db, 'pagos', alert.pagoId), {
        estado: 'Cobrado',
        monto: alert.monto,
        inquilino_nombre: alert.inquilinoNombre,
        concepto: 'Alquiler',
        fecha_cobro: fecha
      });
    } else {
      await addDoc(collection(db, 'pagos'), {
        contrato_id: alert.contratoId,
        inquilino_nombre: alert.inquilinoNombre,
        concepto: 'Alquiler',
        mes: alert.mes,
        anio: alert.anio,
        monto: alert.monto,
        estado: 'Cobrado',
        fecha_cobro: fecha,
        ...createdAt()
      });
    }

    await fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, resumen, loading, refreshAlerts: fetchAlerts, registerPayment };
};
