import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";

import LoginPage from "@/screens/LoginPage";
import RegisterPage from "@/screens/RegisterPage";
import TeacherDashboard from "@/screens/TeacherDashboard";
import AgentDashboard from "@/screens/AgentDashboard";
import ProfilePage from "@/screens/ProfilePage";
import AdminUsers from "@/screens/AdminUsers";
import AdminMatieres from "@/screens/AdminMatieres";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="Login" component={LoginPage} />
      <Stack.Screen name="Register" component={RegisterPage} />

      <Stack.Screen name="TeacherDashboard" component={TeacherDashboard} />
      <Stack.Screen name="AgentDashboard" component={AgentDashboard} />
      <Stack.Screen name="Profile" component={ProfilePage} />

      <Stack.Screen name="AdminUsers" component={AdminUsers} />
      <Stack.Screen name="AdminMatieres" component={AdminMatieres} />
    </Stack.Navigator>
  );
}

