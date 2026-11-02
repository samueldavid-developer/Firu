import { useState, useEffect } from 'react';
import { db, collection, getDocs, query, where, mapDocs, fetchLookup } from '../lib/fire';
import type { Contrato, Inquilino } from '../types/database';

export interface Alert {
  id: string;
  type: 'expiry' | 'payment';
  title: string;
  description: string;
  daysRemaining?: number;
  color: 'red' | 'orange';
  link: string;
}

/** Estados que representan un contrato vigente. */
export const ESTADOS_VIGENTES: Contrato['estado'][] = ['Activo', 'Persona permanente'];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const newAlerts: Alert[] = [];
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const in60Days = new Date(now);
      in60Days.setDate(now.getDate() + 60);
      const sixtyDaysStr = in60Days.toISOString().split('T')[0];

      const [contractsSnap, tenants, paymentsSnap] = await Promise.all([
        getDocs(query(collection(db, 'contratos'), where('estado', 'in', ESTADOS_VIGENTES))),
        fetchLookup<Inquilino>('inquilinos'),
        getDocs(
          query(
            collection(db, 'pagos'),
            where('estado', '==', 'Pendiente'),
            where('mes', '==', now.getMonth() + 1),
            where('anio', '==', now.getFullYear())
          )
        )
      ]);

      // 1. Contratos con plazo definido por vencer (próximos 60 días)
      mapDocs<Contrato>(contractsSnap)
        .filter(c => c.fecha_fin && c.fecha_fin >= today && c.fecha_fin <= sixtyDaysStr)
        .forEach(c => {
          newAlerts.push({
            id: `expiry-${c.id}`,
            type: 'expiry',
            title: 'Contrato vence pronto',
            description: tenants[c.inquilino_id]?.nombre || 'Sin inquilino',
            daysRemaining: Math.ceil((new Date(c.fecha_fin as string).getTime() - now.getTime()) / MS_PER_DAY),
            color: 'red',
            link: '/contratos'
          });
        });

      // 2. Pagos pendientes del mes actual
      if (paymentsSnap.size > 0) {
        newAlerts.push({
          id: 'pending-payments-summary',
          type: 'payment',
          title: 'Pagos pendientes este mes',
          description: `${paymentsSnap.size} contratos sin cobrar`,
          color: 'orange',
          link: '/contratos'
        });
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return { alerts, loading, refreshAlerts: fetchAlerts };
};
