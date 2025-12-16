// src/services/syncService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "./firebase-config";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

const SYNC_QUEUE_KEY_PREFIX = "@tasklife/syncQueue";

export type SyncCollection = "tasks" | "meds" | "purchases" | "events";
export type SyncOperationType = "CREATE_OR_UPDATE" | "DELETE";

export interface SyncOperation {
  id: string;
  userId: string;
  collection: SyncCollection;
  docId: string;
  type: SyncOperationType;
  payload?: any;
  timestamp: number;
}

function queueKey(userId: string) {
  return `${SYNC_QUEUE_KEY_PREFIX}_${userId}`;
}

async function loadQueue(userId: string): Promise<SyncOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(queueKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SyncOperation[]) : [];
  } catch (e) {
    console.log("[sync] loadQueue error", e);
    return [];
  }
}

async function saveQueue(userId: string, ops: SyncOperation[]) {
  try {
    await AsyncStorage.setItem(queueKey(userId), JSON.stringify(ops));
  } catch (e) {
    console.log("[sync] saveQueue error", e);
  }
}

// 👉 la usan las pantallas (TareasScreen ya la está usando)
export async function enqueueOperation(op: SyncOperation) {
  const queue = await loadQueue(op.userId);
  queue.push(op);
  await saveQueue(op.userId, queue);
}

// 👉 la llamaremos desde App.tsx cuando haya usuario
export async function processQueue(userId: string) {
  let queue = await loadQueue(userId);
  if (!queue.length) return;

  const remaining: SyncOperation[] = [];

  for (const op of queue) {
    try {
      const ref = doc(db, `users/${userId}/${op.collection}`, op.docId);

      if (op.type === "CREATE_OR_UPDATE" && op.payload) {
        await setDoc(ref, op.payload, { merge: true });
      } else if (op.type === "DELETE") {
        await deleteDoc(ref);
      }
      // si no truena, se considera procesada
    } catch (e) {
      console.log("[sync] error procesando op", op.id, e);
      remaining.push(op); // se queda en la cola para reintentar
    }
  }

  await saveQueue(userId, remaining);
}
