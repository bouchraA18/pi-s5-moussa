import React from "react";
import { Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Phone,
  Save,
  User,
} from "lucide-react-native";

import AppLayout from "@/layouts/AppLayout";
import api from "@/services/api";
import SpinningIcon from "@/ui/SpinningIcon";
import TextField from "@/ui/TextField";

type UserType = {
  id?: number | string;
  name?: string;
  nom?: string | null;
  prenom?: string | null;
  telephone?: string | null;
  email?: string;
  role?: string;
};

type ProfileData = {
  name: string;
  nom: string;
  prenom: string;
  telephone: string;
};

type PasswordData = {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
};

async function mergeStoredUser(partial: Partial<UserType>) {
  const stored = await AsyncStorage.getItem("user");
  const storedUser = stored ? (JSON.parse(stored) as UserType) : null;
  await AsyncStorage.setItem(
    "user",
    JSON.stringify({ ...(storedUser || {}), ...(partial || {}) })
  );
}

export default function ProfilePage() {
  const [user, setUser] = React.useState<UserType | null>(null);
  const [profileData, setProfileData] = React.useState<ProfileData>({
    name: "",
    nom: "",
    prenom: "",
    telephone: "",
  });
  const [passwordData, setPasswordData] = React.useState<PasswordData>({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [passwordLoading, setPasswordLoading] = React.useState(false);
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  const clearTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSuccessClear = React.useCallback(() => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      setSuccess("");
    }, 3000);
  }, []);

  React.useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  const fetchUserData = React.useCallback(async () => {
    try {
      const response = await api.get("/user");
      const nextUser = (response.data || null) as UserType | null;
      setUser(nextUser);
      setProfileData({
        name: String(nextUser?.name || ""),
        nom: String(nextUser?.nom || ""),
        prenom: String(nextUser?.prenom || ""),
        telephone: String(nextUser?.telephone || ""),
      });
    } catch (err) {
      // match web: console.error only
      // eslint-disable-next-line no-console
      console.error("Error fetching user data:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleProfileSubmit = async () => {
    if (!profileData.name.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await api.put("/profile", profileData);
      setSuccess("Profil mis à jour avec succès !");
      const nextUser = (response.data?.user || null) as UserType | null;
      setUser(nextUser);
      if (nextUser) await mergeStoredUser(nextUser);
      scheduleSuccessClear();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Erreur lors de la mise à jour du profil"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (
      !passwordData.current_password.trim() ||
      !passwordData.new_password.trim() ||
      !passwordData.new_password_confirmation.trim()
    )
      return;
    setPasswordLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.put("/profile/password", passwordData);
      setSuccess("Mot de passe modifié avec succès !");
      setPasswordData({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
      scheduleSuccessClear();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Erreur lors du changement de mot de passe"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const canSubmitProfile = profileData.name.trim().length > 0 && !loading;
  const canSubmitPassword =
    passwordData.current_password.trim().length > 0 &&
    passwordData.new_password.trim().length > 0 &&
    passwordData.new_password_confirmation.trim().length > 0 &&
    !passwordLoading;

  return (
    <AppLayout title="Mon Profil">
      <View className="w-full max-w-[900px] self-center">
        <View className="mb-8">
          <Text className="text-4xl font-black text-slate-900 mb-2">
            Mon Profil
          </Text>
          <Text className="text-slate-500 font-medium">
            Gérez vos informations personnelles et votre sécurité
          </Text>
        </View>

        {success ? (
          <View className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex-row items-center gap-3">
            <CheckCircle2 size={20} color="#047857" />
            <Text className="text-emerald-700 text-sm">{success}</Text>
          </View>
        ) : null}

        {error ? (
          <View className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex-row items-center gap-3">
            <AlertCircle size={20} color="#b91c1c" />
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        ) : null}

        <View className="gap-8">
          {/* Profile Information */}
          <View className="bg-white rounded-[32px] shadow-lg border border-slate-100 p-8">
            <View className="flex-row items-center gap-3 mb-6">
              <View className="w-12 h-12 bg-primary-50 rounded-2xl items-center justify-center">
                <User size={24} color="#004e7c" />
              </View>
              <View>
                <Text className="text-xl font-black text-slate-900">
                  Informations Personnelles
                </Text>
                <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Profil
                </Text>
              </View>
            </View>

            <View className="gap-5">
              <TextField
                label="Nom complet"
                value={profileData.name}
                onChangeText={(v) => setProfileData((p) => ({ ...p, name: v }))}
                placeholder="Jean Dupont"
                autoCapitalize="words"
                left={<User size={18} color="#94a3b8" />}
              />

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <TextField
                    label="Nom"
                    value={profileData.nom}
                    onChangeText={(v) =>
                      setProfileData((p) => ({ ...p, nom: v }))
                    }
                    placeholder="Dupont"
                    autoCapitalize="words"
                  />
                </View>
                <View className="flex-1">
                  <TextField
                    label="Prénom"
                    value={profileData.prenom}
                    onChangeText={(v) =>
                      setProfileData((p) => ({ ...p, prenom: v }))
                    }
                    placeholder="Jean"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <TextField
                label="Téléphone"
                value={profileData.telephone}
                onChangeText={(v) =>
                  setProfileData((p) => ({ ...p, telephone: v }))
                }
                placeholder="+33 6 12 34 56 78"
                keyboardType="phone-pad"
                left={<Phone size={18} color="#94a3b8" />}
              />

              <View className="pt-2">
                <Pressable
                  accessibilityRole="button"
                  disabled={!canSubmitProfile}
                  onPress={handleProfileSubmit}
                  className={[
                    "w-full py-4 bg-primary-600 rounded-xl shadow-lg shadow-primary-200",
                    "items-center justify-center flex-row gap-2",
                    !canSubmitProfile ? "opacity-70" : "active:opacity-90",
                  ].join(" ")}
                >
                  {loading ? (
                    <SpinningIcon>
                      <Loader2 size={20} color="#ffffff" />
                    </SpinningIcon>
                  ) : (
                    <Save size={20} color="#ffffff" />
                  )}
                  <Text className="text-white font-black text-sm uppercase tracking-wider">
                    Enregistrer les modifications
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Password Change */}
          <View className="bg-white rounded-[32px] shadow-lg border border-slate-100 p-8">
            <View className="flex-row items-center gap-3 mb-6">
              <View className="w-12 h-12 bg-amber-50 rounded-2xl items-center justify-center">
                <Lock size={24} color="#d97706" />
              </View>
              <View>
                <Text className="text-xl font-black text-slate-900">
                  Sécurité
                </Text>
                <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Mot de passe
                </Text>
              </View>
            </View>

            <View className="gap-5">
              <TextField
                label="Mot de passe actuel"
                value={passwordData.current_password}
                onChangeText={(v) =>
                  setPasswordData((p) => ({ ...p, current_password: v }))
                }
                placeholder="••••••••"
                secureTextEntry
                left={<Lock size={18} color="#94a3b8" />}
              />

              <TextField
                label="Nouveau mot de passe"
                value={passwordData.new_password}
                onChangeText={(v) =>
                  setPasswordData((p) => ({ ...p, new_password: v }))
                }
                placeholder="••••••••"
                secureTextEntry
                helperText="Minimum 8 caractères"
                left={<Lock size={18} color="#94a3b8" />}
              />

              <TextField
                label="Confirmer le nouveau mot de passe"
                value={passwordData.new_password_confirmation}
                onChangeText={(v) =>
                  setPasswordData((p) => ({
                    ...p,
                    new_password_confirmation: v,
                  }))
                }
                placeholder="••••••••"
                secureTextEntry
                left={<Lock size={18} color="#94a3b8" />}
              />

              <View className="pt-2">
                <Pressable
                  accessibilityRole="button"
                  disabled={!canSubmitPassword}
                  onPress={handlePasswordSubmit}
                  className={[
                    "w-full py-4 bg-amber-600 rounded-xl shadow-lg shadow-amber-200",
                    "items-center justify-center flex-row gap-2",
                    !canSubmitPassword ? "opacity-70" : "active:opacity-90",
                  ].join(" ")}
                >
                  {passwordLoading ? (
                    <SpinningIcon>
                      <Loader2 size={20} color="#ffffff" />
                    </SpinningIcon>
                  ) : (
                    <Lock size={20} color="#ffffff" />
                  )}
                  <Text className="text-white font-black text-sm uppercase tracking-wider">
                    Changer le mot de passe
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Account Info */}
        <View className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-bold text-slate-700">Email</Text>
              <Text className="text-slate-900 font-medium">
                {user?.email || ""}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-sm font-bold text-slate-700">Rôle</Text>
              <View className="px-3 py-1 bg-primary-100 rounded-lg mt-1">
                <Text className="text-primary-700 text-xs font-bold uppercase">
                  {user?.role === "ENSEIGNANT" ? "Enseignant" : user?.role || ""}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </AppLayout>
  );
}
