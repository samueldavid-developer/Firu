import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type QuerySnapshot
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Re-export de la API de Firestore usada por los módulos
export {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit
};

/** Convierte un snapshot de Firestore en un array tipado incluyendo el id del documento. */
export const mapDocs = <T>(snapshot: QuerySnapshot<DocumentData>): T[] =>
  snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));

/** Carga una colección completa en un mapa indexado por id (para resolver relaciones manualmente). */
export const fetchLookup = async <T>(collectionName: string): Promise<Record<string, T>> => {
  const snapshot = await getDocs(collection(db, collectionName));
  const lookup: Record<string, T> = {};
  snapshot.docs.forEach(d => {
    lookup[d.id] = { id: d.id, ...d.data() } as T;
  });
  return lookup;
};

/** Firestore rechaza valores `undefined`; los eliminamos antes de escribir. */
export const cleanData = <T extends Record<string, unknown>>(data: T): Partial<T> =>
  Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Partial<T>;

/** Marca temporal de creación para documentos nuevos. */
export const createdAt = () => ({ created_at: new Date().toISOString() });
