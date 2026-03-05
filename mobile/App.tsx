import "./global.css";
import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "@/navigation/RootNavigator";
import { navigationRef } from "@/navigation/navigationRef";
import * as Notifications from "expo-notifications";

import { authService } from "@/services/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  React.useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data: any = response.notification.request.content.data || {};
        const type = String(data?.type || "");

        const user = await authService.getCurrentUser();
        if (!user) {
          navigationRef.navigate("Login");
          return;
        }

        if (type === "new_session") {
          navigationRef.navigate("AgentDashboard");
          return;
        }
        if (type === "status_update") {
          navigationRef.navigate("TeacherDashboard");
          return;
        }

        navigationRef.navigate(
          user.role === "ENSEIGNANT" ? "TeacherDashboard" : "AgentDashboard"
        );
      }
    );

    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
