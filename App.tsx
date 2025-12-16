// // App.tsx
// import React, { useEffect } from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import StackNavigator from "./src/navigation/StackNavigator";

// import * as Notifications from "expo-notifications";
// import {
//   configureNotificationHandler,
//   ACTION_TAKE,
//   ACTION_SNOOZE,
//   scheduleUrgentReminder,
//   scheduleLowStockNotification,
// } from "./src/services/notifications";
// import {
//   loadMeds,
//   saveMeds,
//   type StoredMed,
// } from "./src/config/localStorageConfig";

// export default function App() {
//   useEffect(() => {
//     configureNotificationHandler();

//     // Listener para cuando el usuario interactúa con la notificación
//     const sub = Notifications.addNotificationResponseReceivedListener(
//       async (response) => {
//         try {
//           const data = response.notification.request.content.data as any;
//           const medId = data?.medId as string | undefined;
//           const userId = data?.userId as string | undefined;
//           const actionId = response.actionIdentifier;

//           if (!medId || !userId) return;

//           const meds = await loadMeds(userId);
//           const idx = meds.findIndex((m) => m.id === medId);
//           if (idx === -1) return;

//           const med: StoredMed = meds[idx];

//           // === Botón "Tomar" ===
//           if (actionId === ACTION_TAKE) {
//             const nCant = Math.max(0, Number(med.cantidad) - 1);
//             const updated: StoredMed = {
//               ...med,
//               cantidad: String(nCant),
//               lastTaken: Date.now(),
//             };

//             const next = [...meds];
//             next[idx] = updated;
//             await saveMeds(userId, next);

//             // Si justo se quedó en 5 pastillas → notificación especial
//             if (nCant === 5) {
//               await scheduleLowStockNotification(updated, userId);
//             }

//             // (La notificación periódica se sigue disparando sola
//             //  porque está programada con repeats, no hace falta reprogramar aquí)
//           }

//           // === Botón "Posponer" ===
//           if (actionId === ACTION_SNOOZE) {
//             // recordatorio urgente en 5 minutos
//             await scheduleUrgentReminder(med, userId);
//           }
//         } catch (e) {
//           console.log("[notifications] response handler error", e);
//         }
//       }
//     );

//     return () => {
//       sub.remove();
//     };
//   }, []);

//   return (
//     <NavigationContainer>
//       <StackNavigator />
//     </NavigationContainer>
//   );
// }

// App.tsx
// import React, { useEffect } from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import StackNavigator from "./src/navigation/StackNavigator";

// import * as Notifications from "expo-notifications";
// import {
//   configureNotificationHandler,
//   ACTION_TAKE,
//   ACTION_SNOOZE,
//   scheduleUrgentReminder,
//   scheduleLowStockNotification,
// } from "./src/services/notifications";
// import {
//   loadMeds,
//   saveMeds,
//   type StoredMed,
// } from "./src/config/localStorageConfig";

// // 🔐 Firebase Auth
// import { auth } from "./src/services/firebase-config";

// // 🔁 Cola de sincronización (tareas, etc.)
// import { processQueue } from "./src/services/syncService";

// export default function App() {
//   // ================== NOTIFICACIONES (lo que ya tenías) ==================
//   useEffect(() => {
//     configureNotificationHandler();

//     const sub = Notifications.addNotificationResponseReceivedListener(
//       async (response) => {
//         try {
//           const data = response.notification.request.content.data as any;
//           const medId = data?.medId as string | undefined;
//           const userId = data?.userId as string | undefined;
//           const actionId = response.actionIdentifier;

//           if (!medId || !userId) return;

//           const meds = await loadMeds(userId);
//           const idx = meds.findIndex((m) => m.id === medId);
//           if (idx === -1) return;

//           const med: StoredMed = meds[idx];

//           // === Botón "Tomar" ===
//           if (actionId === ACTION_TAKE) {
//             const nCant = Math.max(0, Number(med.cantidad) - 1);
//             const updated: StoredMed = {
//               ...med,
//               cantidad: String(nCant),
//               lastTaken: Date.now(),
//             };

//             const next = [...meds];
//             next[idx] = updated;
//             await saveMeds(userId, next);

//             if (nCant === 5) {
//               await scheduleLowStockNotification(updated, userId);
//             }
//           }

//           // === Botón "Posponer" ===
//           if (actionId === ACTION_SNOOZE) {
//             await scheduleUrgentReminder(med, userId);
//           }
//         } catch (e) {
//           console.log("[notifications] response handler error", e);
//         }
//       }
//     );

//     return () => {
//       sub.remove();
//     };
//   }, []);

//   // ================== SYNC OFFLINE → FIRESTORE ==================
//   useEffect(() => {
//     // cada vez que cambie el usuario, intentamos mandar la cola pendiente
//     const unsub = auth.onAuthStateChanged((user) => {
//       if (user) {
//         // aquí ya hay uid y (si hay internet) Firestore
//         processQueue(user.uid);
//       }
//     });

//     return unsub;
//   }, []);

//   return (
//     <NavigationContainer>
//       <StackNavigator />
//     </NavigationContainer>
//   );
// }

// import React, { useEffect } from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import StackNavigator from "./src/navigation/StackNavigator";

// import * as Notifications from "expo-notifications";
// import {
//   configureNotificationHandler,
//   ACTION_TAKE,
//   ACTION_SNOOZE,
//   scheduleUrgentReminder,
//   scheduleLowStockNotification,
// } from "./src/services/notifications";

// import {
//   loadMeds,
//   saveMeds,
//   type StoredMed,
// } from "./src/config/localStorageConfig";

// // 🔐 Firebase Auth
// import { auth } from "./src/services/firebase-config";

// // 🔁 Cola de sincronización
// import { processQueue } from "./src/services/syncService";

// // 🔥 OFFLINE LOGIN
// import NetInfo from "@react-native-community/netinfo";
// import { loadAuthCache } from "./src/services/offline-authservices";

// export default function App() {
//   // ========================================
//   // 🔔 NOTIFICACIONES
//   // ========================================
//   useEffect(() => {
//     configureNotificationHandler();

//     const sub = Notifications.addNotificationResponseReceivedListener(
//       async (response) => {
//         try {
//           const data = response.notification.request.content.data as any;
//           const medId = data?.medId as string | undefined;
//           const userId = data?.userId as string | undefined;
//           const actionId = response.actionIdentifier;

//           if (!medId || !userId) return;

//           const meds = await loadMeds(userId);
//           const idx = meds.findIndex((m) => m.id === medId);
//           if (idx === -1) return;

//           const med: StoredMed = meds[idx];

//           // Botón "Tomar"
//           if (actionId === ACTION_TAKE) {
//             const nCant = Math.max(0, Number(med.cantidad) - 1);
//             const updated: StoredMed = {
//               ...med,
//               cantidad: String(nCant),
//               lastTaken: Date.now(),
//             };

//             const next = [...meds];
//             next[idx] = updated;
//             await saveMeds(userId, next);

//             if (nCant === 5) {
//               await scheduleLowStockNotification(updated, userId);
//             }
//           }

//           // Botón "Posponer"
//           if (actionId === ACTION_SNOOZE) {
//             await scheduleUrgentReminder(med, userId);
//           }
//         } catch (e) {
//           console.log("[notifications] response handler error", e);
//         }
//       }
//     );

//     return () => sub.remove();
//   }, []);

//   // ========================================
//   // 🔁 SYNC OFFLINE → FIRESTORE
//   // ========================================
//   useEffect(() => {
//     const unsub = auth.onAuthStateChanged((user) => {
//       if (user) processQueue(user.uid);
//     });
//     return unsub;
//   }, []);

//   // ========================================
//   // 🔐 AUTO-LOGIN OFFLINE
//   // ========================================
//   useEffect(() => {
//     (async () => {
//       const net = await NetInfo.fetch();
//       const online = net.isConnected && net.isInternetReachable;

//       if (!online) {
//         const cache = await loadAuthCache();
//         if (cache) {
//           console.log("🔐 Auto-login offline listo");
//           // No hacemos signIn porque Firebase está offline
//           // pero toda la app funciona con UID local del cache
//         }
//       }
//     })();
//   }, []);

//   return (
//     <NavigationContainer>
//       <StackNavigator />
//     </NavigationContainer>
//   );
// }

// App.tsx
// import React, { useEffect } from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import StackNavigator from "./src/navigation/StackNavigator";

// import * as Notifications from "expo-notifications";
// import {
//   configureNotificationHandler,
//   ACTION_TAKE,
//   ACTION_SNOOZE,
//   scheduleUrgentReminder,
//   scheduleLowStockNotification,
// } from "./src/services/notifications";

// import {
//   loadMeds,
//   saveMeds,
//   type StoredMed,
//   loadSession,
// } from "./src/config/localStorageConfig";

// // 🔐 Firebase
// import { auth } from "./src/services/firebase-config";

// // 🔁 Sync
// import { processQueue } from "./src/services/syncService";
// import { syncPendingUsers } from "./src/services/authSyncService";

// // 🌐 Network
// import NetInfo from "@react-native-community/netinfo";

// export default function App() {
//   // ========================================
//   // 🔔 NOTIFICACIONES
//   // ========================================
//   useEffect(() => {
//     configureNotificationHandler();

//     const sub = Notifications.addNotificationResponseReceivedListener(
//       async (response) => {
//         try {
//           const data = response.notification.request.content.data as any;
//           const medId = data?.medId as string | undefined;
//           const userId = data?.userId as string | undefined;
//           const actionId = response.actionIdentifier;

//           if (!medId || !userId) return;

//           const meds = await loadMeds(userId);
//           const idx = meds.findIndex((m) => m.id === medId);
//           if (idx === -1) return;

//           const med: StoredMed = meds[idx];

//           if (actionId === ACTION_TAKE) {
//             const nCant = Math.max(0, Number(med.cantidad) - 1);
//             const updated: StoredMed = {
//               ...med,
//               cantidad: String(nCant),
//               lastTaken: Date.now(),
//             };

//             const next = [...meds];
//             next[idx] = updated;
//             await saveMeds(userId, next);

//             if (nCant === 5) {
//               await scheduleLowStockNotification(updated, userId);
//             }
//           }

//           if (actionId === ACTION_SNOOZE) {
//             await scheduleUrgentReminder(med, userId);
//           }
//         } catch (e) {
//           console.log("[notifications] response handler error", e);
//         }
//       }
//     );

//     return () => sub.remove();
//   }, []);

//   // ========================================
//   // 🔁 SYNC OFFLINE → FIREBASE
//   // ========================================
//   useEffect(() => {
//     const unsub = auth.onAuthStateChanged((user) => {
//       if (user) {
//         processQueue(user.uid);
//       }
//     });
//     return unsub;
//   }, []);

//   // ========================================
//   // 🔐 AUTO-SESSION + USER SYNC
//   // ========================================
//   useEffect(() => {
//     (async () => {
//       const session = await loadSession();
//       if (session) {
//         console.log("🔐 Sesión local encontrada:", session.email);
//       }

//       const net = await NetInfo.fetch();
//       if (net.isConnected && net.isInternetReachable) {
//         await syncPendingUsers();
//       }
//     })();
//   }, []);

//   return (
//     <NavigationContainer>
//       <StackNavigator />
//     </NavigationContainer>
//   );
// }

// App.tsx
// import React, { useEffect } from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import StackNavigator from "./src/navigation/StackNavigator";

// import * as Notifications from "expo-notifications";
// import {
//   configureNotificationHandler,
//   ACTION_TAKE,
//   ACTION_SNOOZE,
//   scheduleUrgentReminder,
//   scheduleLowStockNotification,
// } from "./src/services/notifications";

// import {
//   loadMeds,
//   saveMeds,
//   type StoredMed,
//   loadSession,
// } from "./src/config/localStorageConfig";

// // 🔐 Firebase
// import { auth } from "./src/services/firebase-config";

// // 🔁 Sync
// import { processQueue } from "./src/services/syncService";
// import { syncPendingUsers } from "./src/services/authSyncService";

// // 🌐 Network
// import NetInfo from "@react-native-community/netinfo";

// export default function App() {
//   // ========================================
//   // 🔔 NOTIFICACIONES
//   // ========================================
//   useEffect(() => {
//     configureNotificationHandler();

//     const sub = Notifications.addNotificationResponseReceivedListener(
//       async (response) => {
//         try {
//           const data = response.notification.request.content.data as any;
//           const medId = data?.medId as string | undefined;
//           const userId = data?.userId as string | undefined;
//           const actionId = response.actionIdentifier;

//           if (!medId || !userId) return;

//           const meds = await loadMeds(userId);
//           const idx = meds.findIndex((m) => m.id === medId);
//           if (idx === -1) return;

//           const med: StoredMed = meds[idx];

//           if (actionId === ACTION_TAKE) {
//             const nCant = Math.max(0, Number(med.cantidad) - 1);
//             const updated: StoredMed = {
//               ...med,
//               cantidad: String(nCant),
//               lastTaken: Date.now(),
//             };

//             const next = [...meds];
//             next[idx] = updated;
//             await saveMeds(userId, next);

//             if (nCant === 5) {
//               await scheduleLowStockNotification(updated, userId);
//             }
//           }

//           if (actionId === ACTION_SNOOZE) {
//             await scheduleUrgentReminder(med, userId);
//           }
//         } catch (e) {
//           console.log("[notifications] response handler error", e);
//         }
//       }
//     );

//     return () => sub.remove();
//   }, []);

//   // ========================================
//   // 🔁 SYNC DATOS OFFLINE → FIREBASE
//   // ========================================
//   useEffect(() => {
//     const unsub = auth.onAuthStateChanged((user) => {
//       if (user) {
//         processQueue(user.uid);
//       }
//     });
//     return unsub;
//   }, []);

//   // ========================================
//   // 🔐 AUTO-SESSION + SYNC INICIAL
//   // ========================================
//   useEffect(() => {
//     (async () => {
//       const session = await loadSession();
//       if (session) {
//         console.log("🔐 Sesión local encontrada:", session.email);
//       }

//       const net = await NetInfo.fetch();
//       if (net.isConnected && net.isInternetReachable) {
//         await syncPendingUsers();
//       }
//     })();
//   }, []);

//   // ========================================
//   // 🌐 LISTENER CUANDO REGRESA INTERNET
//   // ========================================
//   useEffect(() => {
//     const unsubscribe = NetInfo.addEventListener((state) => {
//       if (state.isConnected && state.isInternetReachable) {
//         console.log("🌐 Internet restaurado → sincronizando usuarios");
//         syncPendingUsers();
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   return (
//     <NavigationContainer>
//       <StackNavigator />
//     </NavigationContainer>
//   );
// }






// ====================
// App.tsx
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./src/navigation/StackNavigator";

// 🔔 Notificaciones
import * as Notifications from "expo-notifications";
import {
  configureNotificationHandler,
  ACTION_TAKE,
  ACTION_SNOOZE,
  scheduleUrgentReminder,
  scheduleLowStockNotification,
} from "./src/services/notifications";

// 💾 Local storage
import {
  loadMeds,
  saveMeds,
  type StoredMed,
  loadSession,
} from "./src/config/localStorageConfig";

// 🔐 Firebase
import { auth } from "./src/services/firebase-config";

// 🔁 Sync
import { processQueue } from "./src/services/syncService";
import { syncPendingUsers } from "./src/services/authSyncService";

// 🌐 Network
import NetInfo from "@react-native-community/netinfo";

export default function App() {
  // ========================================
  // 🔔 NOTIFICACIONES
  // ========================================
  useEffect(() => {
    configureNotificationHandler();

    const sub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        try {
          const data = response.notification.request.content.data as any;
          const medId = data?.medId as string | undefined;
          const userId = data?.userId as string | undefined;
          const actionId = response.actionIdentifier;

          if (!medId || !userId) return;

          const meds = await loadMeds(userId);
          const idx = meds.findIndex((m) => m.id === medId);
          if (idx === -1) return;

          const med: StoredMed = meds[idx];

          // ✅ Tomar medicamento
          if (actionId === ACTION_TAKE) {
            const nCant = Math.max(0, Number(med.cantidad) - 1);

            const updated: StoredMed = {
              ...med,
              cantidad: String(nCant),
              lastTaken: Date.now(),
            };

            const next = [...meds];
            next[idx] = updated;
            await saveMeds(userId, next);

            if (nCant === 5) {
              await scheduleLowStockNotification(updated, userId);
            }
          }

          // ⏰ Posponer
          if (actionId === ACTION_SNOOZE) {
            await scheduleUrgentReminder(med, userId);
          }
        } catch (e) {
          console.log("[notifications] response handler error", e);
        }
      }
    );

    return () => sub.remove();
  }, []);

  // ========================================
  // 🔁 SYNC DE DATOS (cuando hay auth)
  // ========================================
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        processQueue(user.uid);
      }
    });
    return unsub;
  }, []);

  // ========================================
  // 🔐 SESIÓN LOCAL + SYNC INICIAL
  // ========================================
  useEffect(() => {
    (async () => {
      const session = await loadSession();
      if (session) {
        console.log("🔐 Sesión local encontrada:", session.email);
      }

      const net = await NetInfo.fetch();
      if (net.isConnected && net.isInternetReachable) {
        await syncPendingUsers();
      }
    })();
  }, []);

  // ========================================
  // 🌐 CUANDO REGRESA INTERNET → SYNC USUARIOS
  // ========================================
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        console.log("🌐 Internet restaurado → sincronizando usuarios");
        syncPendingUsers();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
}
