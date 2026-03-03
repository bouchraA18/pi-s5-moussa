import "./global.css";
import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "@/navigation/RootNavigator";
import linking from "@/navigation/linking";
import * as Notifications from "expo-notifications";

import { authService } from "@/services/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const navRef = React.useRef<any>(null);

  React.useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data: any = response.notification.request.content.data || {};
        const type = String(data?.type || "");

        const user = await authService.getCurrentUser();
        if (!user) {
          navRef.current?.navigate?.("Login");
          return;
        }

        if (type === "new_session") {
          navRef.current?.navigate?.("AgentDashboard");
          return;
        }
        if (type === "status_update") {
          navRef.current?.navigate?.("TeacherDashboard");
          return;
        }

        navRef.current?.navigate?.(
          user.role === "ENSEIGNANT" ? "TeacherDashboard" : "AgentDashboard"
        );
      }
    );

    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navRef} linking={linking}>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
