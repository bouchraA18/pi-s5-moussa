import type { LinkingOptions } from "@react-navigation/native";
import type { RootStackParamList } from "@/navigation/types";

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["classtrack://"],
  config: {
    screens: {
      Login: "login",
      Register: "register",
      TeacherDashboard: "teacher-dashboard",
      AgentDashboard: "agent-dashboard",
      Profile: "profile",
      AdminUsers: "admin/users",
      AdminMatieres: "admin/matieres",
    },
  },
};

export default linking;

