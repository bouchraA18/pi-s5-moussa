import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react-native";

import { navigate } from "@/navigation/navigationRef";
import api from "@/services/api";
import SpinningIcon from "@/ui/SpinningIcon";
import { normalizeSchoolEmail } from "@/utils/email";

type FormData = {
  name: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
  password_confirmation: string;
};

const SUPNUM_LOGO = require("../../assets/images/supnum-logo.png");

export default function RegisterPage() {
  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [focus, setFocus] = React.useState<Record<string, boolean>>({});

  const handleChange = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");

    let normalizedEmail = "";
    try {
      normalizedEmail = normalizeSchoolEmail(formData.email);
    } catch (err: any) {
      setError(err?.message || "Adresse email invalide.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/register", {
        ...formData,
        email: normalizedEmail,
      });
      await AsyncStorage.setItem("token", String(response.data.token));
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("TeacherDashboard");
    } catch (err: any) {
      const data = err?.response?.data;
      // Laravel validation errors come in data.errors (object of field => [msgs])
      const firstValidationError = data?.errors
        ? Object.values(data.errors as Record<string, string[]>)[0]?.[0]
        : undefined;
      setError(
        firstValidationError ||
        data?.message ||
        "Erreur lors de l'inscription. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    formData.name.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.password.length > 0 &&
    formData.password_confirmation.length > 0 &&
    !loading;

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
          <View className="w-full max-w-lg bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 my-8">
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-white rounded-2xl items-center justify-center mb-6 shadow-lg border border-slate-200 overflow-hidden">
                <Image
                  source={SUPNUM_LOGO}
                  style={{ width: 56, height: 56 }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-4xl font-extrabold text-slate-900 tracking-tight">
                Inscription
              </Text>
              <Text className="text-slate-500 mt-3 text-lg font-medium">
                Créez votre compte enseignant
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

            <View className="space-y-5">
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-700 mb-2">
                    Nom
                  </Text>
                  <View className="relative">
                    <View className="absolute left-4 top-3">
                      <User
                        size={18}
                        color={focus.nom ? "#3490c6" : "#94a3b8"}
                      />
                    </View>
                    <TextInput
                      value={formData.nom}
                      onChangeText={(v) => handleChange("nom", v)}
                      onFocus={() => setFocus((p) => ({ ...p, nom: true }))}
                      onBlur={() => setFocus((p) => ({ ...p, nom: false }))}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm"
                      placeholder="Dupont"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-700 mb-2">
                    Prénom
                  </Text>
                  <View className="relative">
                    <View className="absolute left-4 top-3">
                      <User
                        size={18}
                        color={focus.prenom ? "#3490c6" : "#94a3b8"}
                      />
                    </View>
                    <TextInput
                      value={formData.prenom}
                      onChangeText={(v) => handleChange("prenom", v)}
                      onFocus={() => setFocus((p) => ({ ...p, prenom: true }))}
                      onBlur={() => setFocus((p) => ({ ...p, prenom: false }))}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm"
                      placeholder="Jean"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </View>

              <View>
                <Text className="text-sm font-semibold text-slate-700 mb-2">
                  Nom complet
                </Text>
                <View className="relative">
                  <View className="absolute left-4 top-3.5">
                    <User
                      size={20}
                      color={focus.name ? "#3490c6" : "#94a3b8"}
                    />
                  </View>
                <TextInput
                  value={formData.name}
                  onChangeText={(v) => handleChange("name", v)}
                  onFocus={() => setFocus((p) => ({ ...p, name: true }))}
                  onBlur={() => setFocus((p) => ({ ...p, name: false }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  placeholder="Jean Dupont"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

              <View>
                <Text className="text-sm font-semibold text-slate-700 mb-2">
                  Email
                </Text>
                <View className="relative">
                  <View className="absolute left-4 top-3.5">
                    <Mail
                      size={20}
                      color={focus.email ? "#3490c6" : "#94a3b8"}
                    />
                  </View>
                  <TextInput
                    value={formData.email}
                    onChangeText={(v) => handleChange("email", v)}
                    onFocus={() => setFocus((p) => ({ ...p, email: true }))}
                    onBlur={() => setFocus((p) => ({ ...p, email: false }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  placeholder="prenom.nom@supnum.mr"
                  placeholderTextColor="#94a3b8"
                />
                </View>
              </View>

              <View>
                <Text className="text-sm font-semibold text-slate-700 mb-2">
                  Téléphone (optionnel)
                </Text>
                <View className="relative">
                  <View className="absolute left-4 top-3.5">
                    <Phone
                      size={20}
                      color={focus.telephone ? "#3490c6" : "#94a3b8"}
                    />
                  </View>
                  <TextInput
                    value={formData.telephone}
                    onChangeText={(v) => handleChange("telephone", v)}
                    onFocus={() =>
                      setFocus((p) => ({ ...p, telephone: true }))
                    }
                    onBlur={() =>
                      setFocus((p) => ({ ...p, telephone: false }))
                    }
                    keyboardType="phone-pad"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="+33 6 12 34 56 78"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View>
                <Text className="text-sm font-semibold text-slate-700 mb-2">
                  Mot de passe
                </Text>
                <View className="relative">
                  <View className="absolute left-4 top-3.5">
                    <Lock
                      size={20}
                      color={focus.password ? "#3490c6" : "#94a3b8"}
                    />
                  </View>
                  <TextInput
                    value={formData.password}
                    onChangeText={(v) => handleChange("password", v)}
                    onFocus={() => setFocus((p) => ({ ...p, password: true }))}
                    onBlur={() => setFocus((p) => ({ ...p, password: false }))}
                    secureTextEntry
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <Text className="text-xs text-slate-400 mt-1.5">
                  Minimum 8 caractères
                </Text>
              </View>

              <View>
                <Text className="text-sm font-semibold text-slate-700 mb-2">
                  Confirmer le mot de passe
                </Text>
                <View className="relative">
                  <View className="absolute left-4 top-3.5">
                    <Lock
                      size={20}
                      color={
                        focus.password_confirmation ? "#3490c6" : "#94a3b8"
                      }
                    />
                  </View>
                  <TextInput
                    value={formData.password_confirmation}
                    onChangeText={(v) =>
                      handleChange("password_confirmation", v)
                    }
                    onFocus={() =>
                      setFocus((p) => ({ ...p, password_confirmation: true }))
                    }
                    onBlur={() =>
                      setFocus((p) => ({ ...p, password_confirmation: false }))
                    }
                    secureTextEntry
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!canSubmit}
                onPress={handleRegister}
                className={[
                  "w-full bg-primary-600 active:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/30 py-4 items-center justify-center mt-6",
                  canSubmit ? "opacity-100" : "opacity-70",
                ].join(" ")}
              >
                {loading ? (
                  <SpinningIcon>
                    <Loader2 size={20} color="#ffffff" />
                  </SpinningIcon>
                ) : (
                  <View className="flex-row items-center justify-center gap-2">
                    <Text className="text-white font-bold">S'inscrire</Text>
                    <ArrowRight size={20} color="#ffffff" />
                  </View>
                )}
              </Pressable>
            </View>

            <View className="mt-8 items-center">
              <Text className="text-slate-400 text-sm">
                Vous avez déjà un compte ?{" "}
                <Text
                  className="text-primary-600 font-semibold"
                  onPress={() => navigate("Login")}
                >
                  Se connecter
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
