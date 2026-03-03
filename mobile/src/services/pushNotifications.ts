import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import api from "@/services/api";

function getProjectId(): string | undefined {
  const envId = process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;
  const fromConstants =
    // SDK 54: prefer EAS project id if available
    (Constants.easConfig as any)?.projectId ||
    (Constants.expoConfig as any)?.extra?.eas?.projectId;

  return envId || fromConstants;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED) {
    return true;
  }

  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: true },
  });

  return Boolean(
    req.granted ||
      req.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
  );
}

export async function registerAndSyncExpoPushToken(): Promise<void> {
  const hasPerm = await ensureNotificationPermission();
  if (!hasPerm) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#3490c6",
      sound: "default",
    });
  }

  if (!Device.isDevice) {
    return;
  }

  const projectId = getProjectId();
  if (!projectId) {
    // Local notifications still work; remote push needs an Expo project id.
    return;
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId,
    })
  ).data;

  await api.post("/push-token", {
    token,
    platform: Platform.OS,
  });
}

export async function presentLocalNotification(opts: {
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<void> {
  const hasPerm = await ensureNotificationPermission();
  if (!hasPerm) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: opts.title,
      body: opts.body,
      sound: "default",
      data: opts.data ?? {},
    },
    trigger: null,
  });
}

