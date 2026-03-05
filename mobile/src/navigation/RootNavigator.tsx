import React from "react";

import { useCurrentRoute } from "@/navigation/navigationRef";
import type { RootStackParamList } from "@/navigation/types";

import LoginPage from "@/screens/LoginPage";
import RegisterPage from "@/screens/RegisterPage";
import TeacherDashboard from "@/screens/TeacherDashboard";
import AgentDashboard from "@/screens/AgentDashboard";
import ProfilePage from "@/screens/ProfilePage";
import AdminUsers from "@/screens/AdminUsers";
import AdminMatieres from "@/screens/AdminMatieres";

const screens: Record<keyof RootStackParamList, React.ComponentType> = {
  Login: LoginPage,
  Register: RegisterPage,
  TeacherDashboard,
  AgentDashboard,
  Profile: ProfilePage,
  AdminUsers,
  AdminMatieres,
};

export default function RootNavigator() {
  const routeName = useCurrentRoute();
  const Screen = screens[routeName] || LoginPage;

  return <Screen />;
}
