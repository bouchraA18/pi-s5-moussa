import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Bell,
  Check,
  Clock,
  LogOut,
  Menu,
  Trash2,
  User as UserIcon,
} from "lucide-react-native";

import type { RootStackParamList } from "@/navigation/types";
import api, { authService } from "@/services/api";
import CenteredModal from "@/ui/CenteredModal";
import GradientText from "@/ui/GradientText";
import {
  presentLocalNotification,
  registerAndSyncExpoPushToken,
} from "@/services/pushNotifications";

const SUPNUM_LOGO = require("../../assets/images/supnum-logo.png");

type Props = {
  title: string;
  children: React.ReactNode;
  scrollRef?: React.RefObject<ScrollView | null>;
  headerContent?: React.ReactNode;
};

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type Notification = {
  id: number | string;
  created_at: string;
  read_at?: string | null;
  data?: Record<string, any>;
};

export default function AppLayout({ title, children, scrollRef, headerContent }: Props) {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const showSm = width >= 640;
  const showMd = width >= 768;
  const currentRouteName = useNavigationState(
    (state) => state.routes[state.index]?.name
  );

  const [user, setUser] = React.useState<any>(null);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showNavMenu, setShowNavMenu] = React.useState(false);
  const [activeNotifId, setActiveNotifId] = React.useState<string | null>(null);
  const suppressNextRowPressForId = React.useRef<string | null>(null);
  const notifInitRef = React.useRef(false);
  const notifKnownIdsRef = React.useRef<Set<string>>(new Set());
  const pushRegisteredRef = React.useRef(false);

  const adminNavItems = React.useMemo(
    () =>
      [
        { label: "Tableau de Bord", route: "AgentDashboard" as const },
        { label: "Utilisateurs", route: "AdminUsers" as const },
        { label: "Matières & Modules", route: "AdminMatieres" as const },
      ] as const,
    []
  );

  React.useEffect(() => {
    authService
      .getCurrentUser()
      .then((u) => setUser(u))
      .catch(() => setUser(null));
  }, []);

  React.useEffect(() => {
    if (!user || pushRegisteredRef.current) return;
    pushRegisteredRef.current = true;
    registerAndSyncExpoPushToken().catch(() => {
      // silent
    });
  }, [user]);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      const next = (res.data.notifications || []) as Notification[];
      const unread = Number(res.data.unread_count || 0);

      if (!notifInitRef.current) {
        next.forEach((n) => notifKnownIdsRef.current.add(String(n.id)));
        notifInitRef.current = true;
      } else {
        const known = notifKnownIdsRef.current;
        const newOnes = next.filter((n) => !known.has(String(n.id)));
        newOnes.forEach((n) => known.add(String(n.id)));

        // Fire local notifications for new items (best-effort).
        for (const n of newOnes) {
          const msg = String(n.data?.message || "Notification");
          const details = String(n.data?.details || "");
          const body = details ? `${msg}\n${details}` : msg;
          presentLocalNotification({
            title: "ClassTrack",
            body,
            data: {
              ...(n.data || {}),
              type: n.data?.type,
              session_id: n.data?.session_id,
            },
          }).catch(() => {
            // silent
          });
        }
      }

      setNotifications(next);
      setUnreadCount(unread);
    } catch {
      // match web behavior: console.error only (mobile keeps silent here)
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: Notification["id"]) => {
    try {
      await api.post(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      // silent
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/notifications/read-all");
      fetchNotifications();
    } catch {
      // silent
    }
  };

  const deleteNotification = async (id: Notification["id"]) => {
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch {
      // silent
    }
  };

  const handleHome = () => {
    if (!user) {
      navigation.navigate("Login");
      return;
    }
    if (user.role === "ENSEIGNANT") {
      navigation.navigate("TeacherDashboard");
      return;
    }
    navigation.navigate("AgentDashboard");
  };

  const handleLogout = async () => {
    await authService.logout();
    navigation.navigate("Login");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="border-b border-slate-200">
        <BlurView intensity={22} tint="light" style={StyleSheet.absoluteFill} />
        <View className="bg-white/80" style={StyleSheet.absoluteFill} />

        <View className="px-4 h-16 flex-row items-center">
          <View className="flex-row items-center gap-4 flex-1">
          <Pressable
            accessibilityRole="button"
            onPress={handleHome}
            className="flex-row items-center gap-2"
          >
            <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-lg border border-slate-200 overflow-hidden">
              <Image
                source={SUPNUM_LOGO}
                style={{ width: 30, height: 30 }}
                resizeMode="contain"
              />
            </View>
            <GradientText
              colors={["#004e7c", "#003554"]}
              style={{ fontSize: 20, fontWeight: "700" }}
            >
              ClassTrack
            </GradientText>
          </Pressable>

          {user?.role === "ADMINISTRATEUR" && showMd ? (
            <View className="flex-row items-center gap-1">
              {adminNavItems.map((item) => {
                const isActive = currentRouteName === item.route;
                return (
                  <Pressable
                    key={item.route}
                    accessibilityRole="button"
                    onPress={() => navigation.navigate(item.route)}
                    className={[
                      "px-4 py-2 rounded-lg",
                      isActive ? "bg-primary-50" : "bg-transparent",
                    ].join(" ")}
                  >
                    <Text
                      className={[
                        "text-sm font-bold",
                        isActive ? "text-primary-700" : "text-slate-500",
                      ].join(" ")}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {headerContent && showSm ? (
            <View className="ml-4 flex-1">{headerContent}</View>
          ) : null}
          </View>

          <View className="flex-row items-center gap-3">
            {user?.role === "ADMINISTRATEUR" && !showMd ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowNavMenu(true)}
                className="p-2 rounded-full"
              >
                <Menu size={22} color="#94a3b8" />
              </Pressable>
            ) : null}
            <View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowNotifications((v) => !v)}
                className="p-2 rounded-full"
              >
                <Bell size={20} color="#94a3b8" />
              </Pressable>
              {unreadCount > 0 ? (
                <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center border-2 border-white">
                  <Text className="text-[10px] font-black text-white">
                    {unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="h-8 w-px bg-slate-200" />

            {showSm ? (
              <View className="items-end">
                <Text className="text-sm font-semibold text-slate-900">
                  {user?.name || "Utilisateur"}
                </Text>
                <Text className="text-xs text-slate-500 capitalize">
                  {String(user?.role || "")
                    .toLowerCase()
                    .replace("_", " ")}
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate("Profile")}
              className="p-2 rounded-full"
            >
              <UserIcon size={20} color="#94a3b8" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handleLogout}
              className="p-2 rounded-full"
            >
              <LogOut size={20} color="#94a3b8" />
            </Pressable>
          </View>
        </View>

        {headerContent && !showSm ? (
          <View className="px-4 pb-3">
            <View className="items-end">{headerContent}</View>
          </View>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="px-4 py-8">
          <View className="mb-8">
            <Text className="text-2xl font-bold text-slate-900">{title}</Text>
          </View>
          {children}
        </View>

        <View className="py-6 border-t border-slate-200 bg-white">
          <Text className="text-center text-sm text-slate-400">
            © {new Date().getFullYear()} ClassTrack - Système de Suivi
            d'Enseignements
          </Text>
        </View>
      </ScrollView>

      <CenteredModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        containerClassName="rounded-2xl"
      >
        <View className="p-4 border-b border-slate-50 flex-row items-center justify-between bg-slate-50/50">
          <Text className="font-bold text-slate-800 text-sm">Notifications</Text>
          {unreadCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={markAllAsRead}
              className="py-1 px-1"
            >
              <Text className="text-[10px] font-black text-primary-600 uppercase tracking-wider">
                Tout marquer comme lu
              </Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView style={{ maxHeight: 350 }}>
          {notifications.length === 0 ? (
            <View className="p-8 items-center">
              <View className="w-12 h-12 bg-slate-100 rounded-full items-center justify-center mb-3" />
              <Text className="text-sm text-slate-500 font-medium">
                Aucune notification
              </Text>
            </View>
          ) : (
            <View>
              {notifications.map((notif) => {
                const isUnread = !notif.read_at;
                const isActive = activeNotifId === String(notif.id);
                const icon =
                  notif.data?.type === "new_session" ? (
                    <Clock size={14} color="#2563eb" />
                  ) : (
                    <Check size={14} color="#059669" />
                  );
                const iconBg =
                  notif.data?.type === "new_session"
                    ? "bg-blue-100"
                    : "bg-emerald-100";

                return (
                  <Pressable
                    key={String(notif.id)}
                    accessibilityRole="button"
                    onLongPress={() =>
                      setActiveNotifId((prev) =>
                        prev === String(notif.id) ? null : String(notif.id)
                      )
                    }
                    onPress={() => {
                      if (suppressNextRowPressForId.current === String(notif.id)) {
                        suppressNextRowPressForId.current = null;
                        return;
                      }
                      if (isUnread) markAsRead(notif.id);
                    }}
                    className={[
                      "p-4",
                      isUnread ? "bg-primary-50/30" : "bg-white",
                    ].join(" ")}
                  >
                    <View className="flex-row gap-3">
                      <View
                        className={[
                          "w-8 h-8 rounded-full items-center justify-center",
                          iconBg,
                        ].join(" ")}
                      >
                        {icon}
                      </View>

                      <View className="flex-1">
                        <Text className="text-xs font-black text-slate-900 mb-0.5">
                          {notif.data?.message || "Notification"}
                        </Text>
                        <Text className="text-[10px] text-slate-500">
                          {notif.data?.details || "Voir les détails"}
                        </Text>
                        <Text className="text-[9px] text-slate-400 mt-1 font-medium italic">
                          {new Date(notif.created_at).toLocaleTimeString(
                            "fr-FR",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </Text>
                      </View>

                      <View className="items-end gap-2">
                        {isUnread ? (
                          <View className="w-2 h-2 bg-primary-500 rounded-full mt-1" />
                        ) : null}
                        {isActive ? (
                          <Pressable
                            accessibilityRole="button"
                            onPressIn={() => {
                              suppressNextRowPressForId.current = String(notif.id);
                            }}
                            onPress={() => deleteNotification(notif.id)}
                            className="p-1.5 rounded-lg"
                          >
                            <Trash2 size={14} color="#cbd5e1" />
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </CenteredModal>

      <CenteredModal
        visible={showNavMenu}
        onClose={() => setShowNavMenu(false)}
        containerClassName="rounded-2xl"
      >
        <View className="p-4 border-b border-slate-50 flex-row items-center justify-between bg-slate-50/50">
          <Text className="font-bold text-slate-800 text-sm">Menu</Text>
        </View>
        <View className="p-4 gap-2">
          {adminNavItems.map((item) => {
            const isActive = currentRouteName === item.route;
            return (
              <Pressable
                key={item.route}
                accessibilityRole="button"
                onPress={() => {
                  setShowNavMenu(false);
                  navigation.navigate(item.route);
                }}
                className={[
                  "px-4 py-3 rounded-xl border",
                  isActive
                    ? "bg-primary-50 border-primary-200"
                    : "bg-white border-slate-200",
                ].join(" ")}
              >
                <Text
                  className={[
                    "text-sm font-bold",
                    isActive ? "text-primary-700" : "text-slate-800",
                  ].join(" ")}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </CenteredModal>
    </SafeAreaView>
  );
}
