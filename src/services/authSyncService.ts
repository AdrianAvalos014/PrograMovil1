// import NetInfo from "@react-native-community/netinfo";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { auth } from "./firebase-config";
// import { loadUsers, saveUsers } from "../config/localStorageConfig";

// export const syncPendingUsers = async () => {
//   const net = await NetInfo.fetch();
//   if (!net.isConnected) return;

//   const users = await loadUsers();

//   for (const u of users) {
//     if (!u.synced && !u.deleted) {
//       try {
//         await createUserWithEmailAndPassword(auth, u.email, u.password);
//         u.synced = true;
//       } catch {}
//     }
//   }

//   await saveUsers(users);
// };
// // src/services/authSyncService.ts
// import NetInfo from "@react-native-community/netinfo";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { auth } from "./firebase-config";
// import { loadUsers, saveUsers } from "../config/localStorageConfig";

// export const syncPendingUsers = async () => {
//   try {
//     const net = await NetInfo.fetch();
//     const online = net.isConnected && net.isInternetReachable;
//     if (!online) return;

//     const users = await loadUsers();
//     let changed = false;

//     for (const user of users) {
//       if (user.deleted || user.synced) continue;

//       try {
//         await createUserWithEmailAndPassword(
//           auth,
//           user.email,
//           user.password
//         );
//         user.synced = true;
//         changed = true;
//       } catch (e) {
//         // Si falla Firebase, se reintentará después
//         console.log("[authSync] sync failed for", user.email);
//       }
//     }

//     if (changed) {
//       await saveUsers(users);
//     }
//   } catch (e) {
//     console.log("[authSync] unexpected error", e);
//   }
// };

// // src/services/authSyncService.ts
// import NetInfo from "@react-native-community/netinfo";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { auth } from "./firebase-config";
// import { loadUsers, saveUsers } from "../config/localStorageConfig";

// export const syncPendingUsers = async () => {
//   try {
//     const net = await NetInfo.fetch();
//     const online = net.isConnected && net.isInternetReachable;
//     if (!online) return;

//     const users = await loadUsers();
//     let changed = false;

//     for (const user of users) {
//       if (user.deleted || user.synced) continue;

//       try {
//         await createUserWithEmailAndPassword(auth, user.email, user.password);

//         user.synced = true;
//         changed = true;
//         console.log("✅ Usuario sincronizado:", user.email);
//       } catch (e: any) {
//         // 👉 Si ya existe en Firebase, lo marcamos como sincronizado
//         if (e?.code === "auth/email-already-in-use") {
//           user.synced = true;
//           changed = true;
//           console.log("ℹ️ Usuario ya existía:", user.email);
//         } else {
//           console.log("❌ Error sincronizando usuario:", user.email, e?.code);
//         }
//       }
//     }

//     if (changed) {
//       await saveUsers(users);
//     }
//   } catch (e) {
//     console.log("[authSync] unexpected error", e);
//   }
// };


// import NetInfo from "@react-native-community/netinfo";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { auth } from "./firebase-config";
// import { loadUsers, saveUsers } from "../config/localStorageConfig";

// export const syncPendingUsers = async () => {
//   try {
//     const net = await NetInfo.fetch();
//     if (!net.isConnected || !net.isInternetReachable) return;

//     const users = await loadUsers();
//     let changed = false;

//     for (const user of users) {
//       if (user.deleted || user.synced) continue;

//       try {
//         await createUserWithEmailAndPassword(
//           auth,
//           user.email,
//           user.password
//         );

//         user.synced = true;
//         changed = true;
//         console.log("✅ Usuario sincronizado:", user.email);
//       } catch (e: any) {
//         if (e?.code === "auth/email-already-in-use") {
//           // 🔥 YA EXISTE EN FIREBASE → MARCAR COMO SYNC
//           user.synced = true;
//           changed = true;
//           console.log("ℹ️ Usuario ya existía en Firebase:", user.email);
//         } else {
//           console.log("❌ Error sync usuario:", user.email, e?.code);
//         }
//       }
//     }

//     if (changed) {
//       await saveUsers(users);
//     }
//   } catch (e) {
//     console.log("[authSync] unexpected error", e);
//   }
// };


// src/services/authSyncService.ts
// import NetInfo from "@react-native-community/netinfo";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { auth } from "./firebase-config";
// import { loadUsers, saveUsers } from "../config/localStorageConfig";

// export const syncPendingUsers = async () => {
//   const net = await NetInfo.fetch();
//   if (!net.isConnected || !net.isInternetReachable) return;

//   const users = await loadUsers();
//   let changed = false;

//   for (const u of users) {
//     if (u.synced || u.deleted) continue;

//     try {
//       await createUserWithEmailAndPassword(auth, u.email, u.password);
//       u.synced = true;
//       changed = true;
//       console.log("✅ Usuario sincronizado:", u.email);
//     } catch (e: any) {
//       if (e.code === "auth/email-already-in-use") {
//         // 👉 Ya existe en Firebase → lo marcamos como synced
//         u.synced = true;
//         changed = true;
//         console.log("ℹ️ Ya existía en Firebase:", u.email);
//       } else {
//         console.log("❌ Error sync:", u.email, e.code);
//       }
//     }
//   }

//   if (changed) await saveUsers(users);
// };


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
