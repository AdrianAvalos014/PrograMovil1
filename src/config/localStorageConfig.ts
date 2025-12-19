//==============================================================================
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ======================================================
   MEDICAMENTOS
====================================================== */

export const MEDS_KEY_PREFIX = "@tasklife/meds";

export type StoredMed = {
  id: string;
  nombre: string;
  dosisMg: string;
  cadaHoras: string;
  cantidad: string;
  umbral: string;
  photoUri?: string;
  lastTaken?: number;
};

function medsKeyForUser(uid?: string | null) {
  const safeUid = uid || "guest";
  return `${MEDS_KEY_PREFIX}_${safeUid}`;
}

export async function loadMeds(uid?: string | null): Promise<StoredMed[]> {
  try {
    const raw = await AsyncStorage.getItem(medsKeyForUser(uid));
    return raw ? (JSON.parse(raw) as StoredMed[]) : [];
  } catch (e) {
    console.log("[storage] loadMeds error", e);
    return [];
  }
}

export async function saveMeds(
  uid: string | null | undefined,
  meds: StoredMed[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(medsKeyForUser(uid), JSON.stringify(meds));
  } catch (e) {
    console.log("[storage] saveMeds error", e);
  }
}

/* ======================================================
   TAREAS
====================================================== */

export type Prioridad = "Baja" | "Media" | "Alta";

export type StoredTask = {
  id: number;
  titulo: string;
  descripcion?: string;
  fechaLimite?: string;
  prioridad: Prioridad;
  completada: boolean;
};

const TASKS_KEY_PREFIX = "@tasklife/tasks";

function tasksKeyForUser(uid?: string | null) {
  return `${TASKS_KEY_PREFIX}_${uid || "guest"}`;
}

export async function loadTasks(uid?: string | null): Promise<StoredTask[]> {
  try {
    const raw = await AsyncStorage.getItem(tasksKeyForUser(uid));
    return raw ? (JSON.parse(raw) as StoredTask[]) : [];
  } catch (e) {
    console.log("[storage] loadTasks error", e);
    return [];
  }
}

export async function saveTasks(
  uid: string | null | undefined,
  tasks: StoredTask[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(tasksKeyForUser(uid), JSON.stringify(tasks));
  } catch (e) {
    console.log("[storage] saveTasks error", e);
  }
}

/* ======================================================
   COMPRAS — MODELO CON CARRITO 🛒
====================================================== */

export interface ProductoCompra {
  id: string;
  descripcion: string;
  cantidad: number;
  precio: number;
}

export interface StoredCompra {
  id: string;
  categoria: string;
  productos: ProductoCompra[];
  total: number;
  fecha: number;
}

const COMPRAS_KEY = "@tasklife/compras";

export const loadCompras = async (
  userId: string | null
): Promise<StoredCompra[]> => {
  try {
    if (!userId) return [];
    const raw = await AsyncStorage.getItem(`${COMPRAS_KEY}_${userId}`);
    return raw ? (JSON.parse(raw) as StoredCompra[]) : [];
  } catch (e) {
    console.log("Error loading compras:", e);
    return [];
  }
};

export const saveCompras = async (
  userId: string | null,
  compras: StoredCompra[]
): Promise<void> => {
  try {
    if (!userId) return;
    await AsyncStorage.setItem(
      `${COMPRAS_KEY}_${userId}`,
      JSON.stringify(compras)
    );
  } catch (e) {
    console.log("Error saving compras:", e);
  }
};

/* ======================================================
   EVENTOS
====================================================== */

export interface StoredEvento {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  comentarios?: string;
}

const EVENTOS_KEY = "@tasklife/eventos";

export const loadEventos = async (userId: string | null) => {
  try {
    if (!userId) return [];
    const raw = await AsyncStorage.getItem(`${EVENTOS_KEY}_${userId}`);
    return raw ? (JSON.parse(raw) as StoredEvento[]) : [];
  } catch (e) {
    console.log("Error loading eventos:", e);
    return [];
  }
};

export const saveEventos = async (
  userId: string | null,
  eventos: StoredEvento[]
) => {
  try {
    if (!userId) return;
    await AsyncStorage.setItem(
      `${EVENTOS_KEY}_${userId}`,
      JSON.stringify(eventos)
    );
  } catch (e) {
    console.log("Error saving eventos:", e);
  }
};

/* ======================================================
   AUTH — OFFLINE FIRST 🔐
====================================================== */

export type StoredUser = {
  id: string;
  email: string; // siempre en lowercase
  password: string;
  nombre: string;
  synced: boolean;
  deleted?: boolean;
};

const USERS_KEY = "@tasklife/users";
const SESSION_KEY = "@tasklife/session";

// -------- Usuarios --------

export const loadUsers = async (): Promise<StoredUser[]> => {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch (e) {
    console.log("Error loading users:", e);
    return [];
  }
};

export const saveUsers = async (users: StoredUser[]) => {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.log("Error saving users:", e);
  }
};

// -------- Sesión --------

export const saveSession = async (user: StoredUser) => {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch (e) {
    console.log("Error saving session:", e);
  }
};

export const loadSession = async (): Promise<StoredUser | null> => {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch (e) {
    console.log("Error loading session:", e);
    return null;
  }
};

export const clearSession = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {}
};

// -------- Eliminación --------

export const markUserDeleted = async (email: string) => {
  const normalized = email.toLowerCase();
  const users = await loadUsers();

  const updated = users.map((u) =>
    u.email === normalized ? { ...u, deleted: true } : u
  );

  await saveUsers(updated);
};
