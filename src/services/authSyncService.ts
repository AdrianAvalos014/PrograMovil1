// ====================================================
// src/services/authSyncService.ts
import NetInfo from "@react-native-community/netinfo";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase-config";
import { loadUsers, saveUsers } from "../config/localStorageConfig";

let syncing = false; // 🔒 LOCK GLOBAL

export const syncPendingUsers = async () => {
  if (syncing) return;
  syncing = true;

  try {
    const net = await NetInfo.fetch();
    if (!net.isConnected || !net.isInternetReachable) return;

    const users = await loadUsers();
    let changed = false;

    for (const user of users) {
      if (user.synced || user.deleted) continue;

      try {
        await createUserWithEmailAndPassword(auth, user.email, user.password);
        user.synced = true;
        changed = true;
        console.log("✅ Firebase user creado:", user.email);
      } catch (e: any) {
        if (e?.code === "auth/email-already-in-use") {
          user.synced = true; // ya existe → lo marcamos
          changed = true;
          console.log("ℹ️ Ya existía en Firebase:", user.email);
        } else {
          console.log("❌ Error sync:", user.email, e?.code);
        }
      }
    }

    if (changed) await saveUsers(users);
  } finally {
    syncing = false;
  }
};




