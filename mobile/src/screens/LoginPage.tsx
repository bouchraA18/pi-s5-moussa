import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Image,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
} from "lucide-react-native";

import type { RootStackParamList } from "@/navigation/types";
import { authService } from "@/services/api";
import SpinningIcon from "@/ui/SpinningIcon";
import { normalizeSchoolEmail, SCHOOL_EMAIL_DOMAIN } from "@/utils/email";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const SUPNUM_LOGO = require("../../assets/images/supnum-logo.png");

export default function LoginPage() {
  const navigation = useNavigation<Navigation>();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [emailFocused, setEmailFocused] = React.useState(false);
  const [passwordFocused, setPasswordFocused] = React.useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    let normalizedEmail = "";
    try {
      normalizedEmail = normalizeSchoolEmail(email);
    } catch (err: any) {
      setError(err?.message || "Adresse email invalide.");
      setLoading(false);
      return;
    }

    try {
      const data = await authService.login(normalizedEmail, password);
      const user = data.user;

      if (
        user.role === "ADMINISTRATEUR" ||
        user.role === "AGENT" ||
        user.role === "AGENT_SCOLARITE"
      ) {
        navigation.navigate("AgentDashboard");
      } else {
        navigation.navigate("TeacherDashboard");
      }
    } catch (err: any) {
      if (!err?.response) {
        setError(
          "Impossible de joindre le serveur. V\u00e9rifiez votre connexion, puis EXPO_PUBLIC_API_URL dans mobile/.env."
        );
        return;
      }

      const data = err?.response?.data;
      const firstValidationError = data?.errors
        ? Object.values(data.errors as Record<string, string[]>)[0]?.[0]
        : undefined;

      const missingAt = !String(email || "").includes("@");
      setError(
        firstValidationError ||
        data?.message ||
        (missingAt
          ? `Saisissez l'adresse complète (avec @...) si votre email n'est pas @${SCHOOL_EMAIL_DOMAIN}.`
          : "Identifiants incorrects. Veuillez réessayer.")
      );
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 bg-slate-50 px-6 items-center justify-center">
          <View className="w-full max-w-lg bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100">
            <View className="items-center mb-10">
              <View className="w-20 h-20 bg-white rounded-2xl items-center justify-center mb-6 shadow-lg border border-slate-200 overflow-hidden">
                <Image
                  source={SUPNUM_LOGO}
                  style={{ width: 56, height: 56 }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-4xl font-extrabold text-slate-900 tracking-tight">
                ClassTrack
              </Text>
              <Text className="text-slate-500 mt-3 text-lg font-medium">
                Accédez à votre espace de gestion
              </Text>
            </View>

            {error ? (
              <View className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                <View className="flex-row items-center gap-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <Text className="text-red-600 text-sm font-medium">
                    {error}
                  </Text>
                </View>
              </View>
            ) : null}

            <View className="space-y-6">
              <View>
                <Text className="text-sm font-semibold text-slate-700 mb-2">
                  Adresse Email
                </Text>
                <View className="relative">
                  <View className="absolute left-4 top-3.5">
                    <Mail
                      size={20}
                      color={emailFocused ? "#3490c6" : "#94a3b8"}
                    />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="prenom.nom@supnum.mr"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-semibold text-slate-700">
                    Mot de passe
                  </Text>
                  <Pressable accessibilityRole="button" onPress={() => { }}>
                    <Text className="text-xs font-semibold text-primary-600">
                      Oublié ?
                    </Text>
                  </Pressable>
                </View>
                <View className="relative">
                  <View className="absolute left-4 top-3.5">
                    <Lock
                      size={20}
                      color={passwordFocused ? "#3490c6" : "#94a3b8"}
                    />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry
                    textContentType="password"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!canSubmit}
                onPress={handleLogin}
                className={[
                  "w-full bg-primary-600 active:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/30 py-4 items-center justify-center mt-8",
                  canSubmit ? "opacity-100" : "opacity-70",
                ].join(" ")}
              >
                {loading ? (
                  <SpinningIcon>
                    <Loader2 size={20} color="#ffffff" />
                  </SpinningIcon>
                ) : (
                  <View className="flex-row items-center justify-center gap-2">
                    <Text className="text-white font-bold">Se connecter</Text>
                    <ArrowRight size={20} color="#ffffff" />
                  </View>
                )}
              </Pressable>
            </View>

            <View className="mt-8 items-center">
              <Text className="text-slate-400 text-sm">
                Pas encore de compte ?{" "}
                <Text
                  className="text-primary-600 font-semibold"
                  onPress={() => navigation.navigate("Register")}
                >
                  S'inscrire
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
