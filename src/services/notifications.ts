// // src/services/notifications.ts
// import * as Notifications from "expo-notifications";
// import type { StoredMed } from "../config/localStorageConfig";

// // Configurar cómo se muestran las notificaciones cuando la app está abierta
// export function configureNotificationHandler() {
//   Notifications.setNotificationHandler({
//     // 👈 sin tipos explícitos, dejamos que Expo infiera
//     handleNotification: async () => ({
//       shouldPlaySound: true,
//       shouldSetBadge: false,
//       // En SDK 54 ya no es shouldShowAlert, ahora son:
//       shouldShowBanner: true,
//       shouldShowList: true,
//     }),
//   });
// }

// export async function requestNotificationPermission(): Promise<boolean> {
//   const { status: existingStatus } = await Notifications.getPermissionsAsync();
//   let finalStatus = existingStatus;

//   if (existingStatus !== "granted") {
//     const { status } = await Notifications.requestPermissionsAsync();
//     finalStatus = status;
//   }

//   return finalStatus === "granted";
// }

// /**
//  * Programa una notificación repetitiva cada X horas para un medicamento.
//  */
// export async function scheduleMedNotification(
//   med: StoredMed
// ): Promise<string | null> {
//   const ok = await requestNotificationPermission();
//   if (!ok) return null;

//   const hours = Number(med.cadaHoras || "0");
//   if (!hours || hours <= 0) return null;

//   // 👇 Tipado explícito de trigger como TIME_INTERVAL
//   const trigger = {
//     type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
//     seconds: hours * 3600,
//     repeats: true,
//   } as const;

//   const id = await Notifications.scheduleNotificationAsync({
//     content: {
//       title: "Recordatorio de medicamento",
//       body: `Es hora de tomar ${med.nombre} (${med.dosisMg} mg)`,
//       data: { medId: med.id },
//     },
//     trigger,
//   });

//   return id;
// }

// export async function cancelMedNotification(notificationId?: string) {
//   if (!notificationId) return;
//   try {
//     await Notifications.cancelScheduledNotificationAsync(notificationId);
//   } catch (e) {
//     console.log("[notifications] cancel error", e);
//   }
// }


// src/services/notifications.ts
import * as Notifications from "expo-notifications";
import type { StoredMed } from "../config/localStorageConfig";

// Configurar cómo se muestran las notificaciones cuando la app está abierta
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    // 👈 sin tipos explícitos, dejamos que Expo infiera
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      // En SDK 54 ya no es shouldShowAlert, ahora son:
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

/**
 * Programa una notificación repetitiva cada X horas para un medicamento.
 */
export async function scheduleMedNotification(
  med: StoredMed
): Promise<string | null> {
  const ok = await requestNotificationPermission();
  if (!ok) return null;

  const hours = Number(med.cadaHoras || "0");
  if (!hours || hours <= 0) return null;

  // 👇 Tipado explícito de trigger como TIME_INTERVAL
  const trigger = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: hours * 3600,
    repeats: true,
  } as const;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Recordatorio de medicamento",
      body: `Es hora de tomar ${med.nombre} (${med.dosisMg} mg)`,
      data: { medId: med.id },
    },
    trigger,
  });

  return id;
}

export async function cancelMedNotification(notificationId?: string) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.log("[notifications] cancel error", e);
  }
}

