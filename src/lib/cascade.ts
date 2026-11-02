import { db, collection, getDocs, query, where, doc, deleteDoc, writeBatch } from './fire';
import type { Pago } from '../types/database';

/**
 * Elimina únicamente los pagos NO cobrados (pendientes) de un contrato.
 * Los pagos con estado "Cobrado" se conservan intactos porque forman parte
 * del historial de ingresos y deben sobrevivir al borrado del contrato.
 */
const deletePagosPendientesDeContrato = async (contratoId: string) => {
  const pagosSnap = await getDocs(query(collection(db, 'pagos'), where('contrato_id', '==', contratoId)));
  const pendientes = pagosSnap.docs.filter(pagoDoc => (pagoDoc.data() as Pago).estado !== 'Cobrado');
  if (pendientes.length === 0) return;

  const batch = writeBatch(db);
  pendientes.forEach(pagoDoc => batch.delete(pagoDoc.ref));
  await batch.commit();
};

/** Elimina un contrato junto con sus pagos pendientes (los cobrados se preservan). */
export const deleteContratoCascade = async (contratoId: string) => {
  await deletePagosPendientesDeContrato(contratoId);
  await deleteDoc(doc(db, 'contratos', contratoId));
};

/** Elimina un inquilino junto con sus contratos y los pagos pendientes de esos contratos. */
export const deleteInquilinoCascade = async (inquilinoId: string) => {
  const contratosSnap = await getDocs(query(collection(db, 'contratos'), where('inquilino_id', '==', inquilinoId)));

  for (const contratoDoc of contratosSnap.docs) {
    await deletePagosPendientesDeContrato(contratoDoc.id);
    await deleteDoc(contratoDoc.ref);
  }

  await deleteDoc(doc(db, 'inquilinos', inquilinoId));
};
