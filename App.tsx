import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";

// 🔤 ICONOS (FUENTES)
import * as Font from "expo-font";
import {
  FontAwesome5,
  MaterialIcons,
  Entypo,
} from "@expo/vector-icons";

// 🧭 Navegación
import StackNavigator from "./src/navigation/StackNavigator";

// 🧠 AuthGate
import AuthGate from "./src/services/AuthGate";

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
  // 🔤 PRECARGAR ICONOS (SIN BLOQUEAR UI)
  // ========================================
  useEffect(() => {
    Font.loadAsync({
      ...FontAwesome5.font,
      ...MaterialIcons.font,
      ...Entypo.font,
    }).catch((e) =>
      console.log("❌ Error cargando fuentes de iconos", e)
    );
  }, []);

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
  // 🔁 SYNC CUANDO HAY AUTH
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
        console.log("🔐 Sesión local:", session.email);
      }

      const net = await NetInfo.fetch();
      if (net.isConnected && net.isInternetReachable) {
        await syncPendingUsers();
      }
    })();
  }, []);

  // ========================================
  // 🌐 INTERNET DE REGRESO → SYNC
  // ========================================
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        syncPendingUsers();
      }
    });
    return () => unsub();
  }, []);

  // ========================================
  // 🚀 APP
  // ========================================
  return (
    <NavigationContainer>
      <AuthGate>
        <StackNavigator />
      </AuthGate>
    </NavigationContainer>
  );
}
