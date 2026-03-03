import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Edit2,
  Loader2,
  Mail,
  Phone,
  Plus,
  Shield,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react-native";

import AppLayout from "@/layouts/AppLayout";
import api from "@/services/api";
import CenteredModal from "@/ui/CenteredModal";
import SelectModalField from "@/ui/SelectModalField";
import SpinningIcon from "@/ui/SpinningIcon";
import { alert, confirm } from "@/ui/nativeAlert";
import { normalizeSchoolEmail } from "@/utils/email";

type UserType = {
  id: number | string;
  name: string;
  nom?: string | null;
  prenom?: string | null;
  email: string;
  telephone?: string | null;
  role: "ENSEIGNANT" | "AGENT_SCOLARITE" | "ADMINISTRATEUR" | string;
  created_at?: string;
};

type FormData = {
  name: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: "ENSEIGNANT" | "AGENT_SCOLARITE" | "ADMINISTRATEUR" | string;
  password: string;
};

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function roleLabel(role: string) {
  if (role === "ALL") return "TOUS";
  return role.charAt(0) + role.slice(1).toLowerCase().replace("_", " ");
}

export default function AdminUsers() {
  const [users, setUsers] = React.useState<UserType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<
    "ALL" | "ENSEIGNANT" | "AGENT_SCOLARITE" | "ADMINISTRATEUR"
  >("ALL");

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserType | null>(null);
  const [activeRowId, setActiveRowId] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    role: "ENSEIGNANT",
    password: "",
  });

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setUsers(res.data.data);
      } else {
        setUsers([]);
        // eslint-disable-next-line no-console
        console.error("Structure de réponse inattendue:", res.data);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openModal = (user: UserType | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        nom: String(user.nom || ""),
        prenom: String(user.prenom || ""),
        email: user.email,
        telephone: String(user.telephone || ""),
        role: user.role,
        password: "",
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        role: "ENSEIGNANT",
        password: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    let normalizedEmail = "";
    try {
      normalizedEmail = normalizeSchoolEmail(formData.email);
    } catch (err: any) {
      alert(err?.message || "Adresse email invalide.");
      return;
    }

    const payload = { ...formData, email: normalizedEmail };
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        await api.post("/users", payload);
      }
      fetchUsers();
      closeModal();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: UserType["id"]) => {
    const ok = await confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?");
    if (!ok) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => String(u.id) !== String(id)));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  const safeUsers = safeArray<UserType>(users);
  const filteredUsers = safeUsers.filter((u) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      String(u.name || "").toLowerCase().includes(s) ||
      String(u.email || "").toLowerCase().includes(s);
    const matchesRole = selectedRole === "ALL" || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const totalUsers = safeUsers.length;
  const teachersCount = safeUsers.filter((u) => u.role === "ENSEIGNANT").length;
  const agentCount = safeUsers.filter((u) => u.role === "AGENT_SCOLARITE").length;
  const adminCount = safeUsers.filter((u) => u.role === "ADMINISTRATEUR").length;

  const stats = [
    {
      label: "Total Utilisateurs",
      value: String(totalUsers),
      icon: Users,
      gradientColors: ["#3b82f6", "#4f46e5"] as const,
      pillBg: "bg-blue-50",
      pillText: "text-blue-600",
      pillColor: "#2563eb",
    },
    {
      label: "Enseignants",
      value: String(teachersCount),
      icon: BookOpen,
      gradientColors: ["#34d399", "#14b8a6"] as const,
      pillBg: "bg-emerald-50",
      pillText: "text-emerald-600",
      pillColor: "#059669",
    },
    {
      label: "Agents Scolarité",
      value: String(agentCount),
      icon: Shield,
      gradientColors: ["#fbbf24", "#f97316"] as const,
      pillBg: "bg-amber-50",
      pillText: "text-amber-600",
      pillColor: "#d97706",
    },
    {
      label: "Administrateurs",
      value: String(adminCount),
      icon: Shield,
      gradientColors: ["#a855f7", "#db2777"] as const,
      pillBg: "bg-purple-50",
      pillText: "text-purple-600",
      pillColor: "#7c3aed",
    },
  ];

  const canSubmitModal =
    formData.name.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    (editingUser ? true : formData.password.trim().length > 0);

  return (
    <AppLayout title="Gestion des Utilisateurs">
      <View className="w-full max-w-[1100px] self-center">
        <CenteredModal
          visible={isModalOpen}
          onClose={closeModal}
          containerClassName="rounded-3xl"
        >
          <View className="border border-white/50 overflow-hidden rounded-3xl">
            <View className="px-8 py-6 border-b border-gray-100 flex-row items-center justify-between bg-slate-50/50">
              <View className="flex-1 pr-4">
                <Text className="text-2xl font-bold text-gray-900 tracking-tight">
                  {editingUser ? "Modifier le profil" : "Nouvel Utilisateur"}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Remplissez les informations ci-dessous
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={closeModal}
                className="p-2 rounded-full"
              >
                <X size={20} color="#9ca3af" />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 520 }}
              contentContainerStyle={{ padding: 32 }}
            >
              <View className="flex-row flex-wrap -mx-3">
                <View className="w-1/2 px-3 mb-6">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Identité
                  </Text>
                  <TextInput
                    value={formData.name}
                    onChangeText={(v) => setFormData((p) => ({ ...p, name: v }))}
                    placeholder="ex: Jean Dupont"
                    placeholderTextColor="#9ca3af"
                    className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl font-medium text-gray-800"
                  />
                </View>

                <View className="w-1/2 px-3 mb-6">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Email
                  </Text>
                  <TextInput
                    value={formData.email}
                    onChangeText={(v) => setFormData((p) => ({ ...p, email: v }))}
                    placeholder="jean@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl font-medium text-gray-800"
                  />
                </View>

                <View className="w-1/2 px-3 mb-6">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Nom
                  </Text>
                  <TextInput
                    value={formData.nom}
                    onChangeText={(v) => setFormData((p) => ({ ...p, nom: v }))}
                    placeholderTextColor="#9ca3af"
                    className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-800"
                  />
                </View>

                <View className="w-1/2 px-3 mb-6">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Prénom
                  </Text>
                  <TextInput
                    value={formData.prenom}
                    onChangeText={(v) =>
                      setFormData((p) => ({ ...p, prenom: v }))
                    }
                    placeholderTextColor="#9ca3af"
                    className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-800"
                  />
                </View>

                <View className="w-1/2 px-3 mb-6">
                  <SelectModalField
                    label="Rôle"
                    value={String(formData.role)}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, role: v as any }))
                    }
                    options={[
                      { value: "ENSEIGNANT", label: "Enseignant" },
                      { value: "AGENT_SCOLARITE", label: "Agent Scolarité" },
                      { value: "ADMINISTRATEUR", label: "Administrateur" },
                    ]}
                    labelClassName="text-xs font-bold text-gray-500 uppercase tracking-wide"
                    fieldClassName="bg-gray-50/50 border-gray-200 py-3.5 px-3.5 rounded-xl"
                    valueClassName="text-gray-800 font-medium"
                    chevronColor="#9ca3af"
                  />
                </View>

                <View className="w-1/2 px-3 mb-6">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Téléphone
                  </Text>
                  <TextInput
                    value={formData.telephone}
                    onChangeText={(v) =>
                      setFormData((p) => ({ ...p, telephone: v }))
                    }
                    placeholder="+33 6 ..."
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-800"
                  />
                </View>

                <View className="w-full px-3 mb-2">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Sécurité{" "}
                    <Text className="text-gray-400 font-normal normal-case">
                      {editingUser
                        ? "(Laisser vide pour ne pas changer)"
                        : "(Mot de passe requis)"}
                    </Text>
                  </Text>
                  <TextInput
                    value={formData.password}
                    onChangeText={(v) =>
                      setFormData((p) => ({ ...p, password: v }))
                    }
                    placeholder={editingUser ? "••••••••" : "Créer un mot de passe"}
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-800"
                  />
                </View>
              </View>

              <View className="flex-row items-center gap-4 mt-8 pt-6 border-t border-gray-100">
                <Pressable
                  accessibilityRole="button"
                  onPress={closeModal}
                  className="px-6 py-3.5 bg-white border border-gray-200 rounded-xl shadow-sm"
                >
                  <Text className="text-gray-700 font-semibold">Annuler</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={!canSubmitModal}
                  onPress={handleSubmit}
                  className={[
                    "flex-1 px-6 py-3.5 rounded-xl",
                    canSubmitModal ? "bg-blue-600" : "bg-blue-600/50",
                  ].join(" ")}
                >
                  <Text className="text-white font-bold text-center">
                    {editingUser ? "Sauvegarder les modifications" : "Créer le compte"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </CenteredModal>

        {/* Header Section */}
        <View className="flex-row items-end justify-between gap-6 mb-10">
          <View className="flex-1">
            <Text className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Utilisateurs
            </Text>
            <Text className="text-slate-500 mt-2 text-lg font-medium">
              Gérez votre équipe et les accès à la plateforme.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => openModal(null)}
            className="rounded-2xl shadow-xl shadow-blue-200 overflow-hidden"
          >
            {({ pressed }) => (
              <View className="px-6 py-3.5 bg-blue-900 flex-row items-center gap-3">
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: pressed ? 1 : 0,
                  }}
                >
                  <LinearGradient
                    colors={["#2563eb", "#4f46e5"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                </View>
                <View className="bg-white/20 p-1 rounded-lg">
                  <Plus size={18} color="#ffffff" />
                </View>
                <Text className="text-white font-bold">Nouvel Utilisateur</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Stats */}
        <View className="gap-6 mb-10">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <View
                key={idx}
                className="bg-white/80 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/40 overflow-hidden p-6"
              >
                <View className="flex-row items-start justify-between mb-4">
                  <View className="rounded-2xl shadow-lg shadow-blue-500/20">
                    <LinearGradient
                      colors={s.gradientColors as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 16, padding: 14 }}
                    >
                      <Icon size={22} color="#ffffff" />
                    </LinearGradient>
                  </View>
                  <View
                    className={[
                      "flex-row items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full",
                      s.pillBg,
                      s.pillText,
                    ].join(" ")}
                  >
                    <ArrowUpRight size={12} color={s.pillColor} />
                    <Text className={["text-xs font-bold", s.pillText].join(" ")}>
                      Actif
                    </Text>
                  </View>
                </View>
                <View className="gap-1">
                  <Text className="text-4xl font-extrabold text-slate-800 tracking-tight">
                    {s.value}
                  </Text>
                  <Text className="text-slate-500 font-medium text-sm">
                    {s.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Main Content Card */}
        <View className="bg-white/80 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/40 overflow-hidden">
          {/* Toolbar */}
          <View className="p-6 border-b border-gray-100 bg-white/50">
            <View className="gap-4">
              <View className="relative">
                <View className="absolute left-4 top-3.5">
                  <Search size={20} color="#9ca3af" />
                </View>
                <TextInput
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholder="Rechercher un utilisateur..."
                  placeholderTextColor="#9ca3af"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 rounded-2xl font-medium text-gray-700"
                />
              </View>

              <View className="flex-row bg-gray-100/80 p-1.5 rounded-xl">
                {(
                  ["ALL", "ENSEIGNANT", "AGENT_SCOLARITE", "ADMINISTRATEUR"] as const
                ).map((role) => {
                  const isActive = selectedRole === role;
                  return (
                    <Pressable
                      key={role}
                      accessibilityRole="button"
                      onPress={() => setSelectedRole(role)}
                      className={[
                        "px-4 py-2 rounded-lg",
                        isActive ? "bg-white shadow-sm" : "bg-transparent",
                      ].join(" ")}
                    >
                      <Text
                        className={[
                          "text-xs font-bold",
                          isActive ? "text-slate-800" : "text-slate-500",
                        ].join(" ")}
                      >
                        {roleLabel(role)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Table */}
          <View>
            {loading ? (
              <View className="items-center justify-center py-20">
                <SpinningIcon>
                  <Loader2 size={40} color="#3b82f6" />
                </SpinningIcon>
                <Text className="text-slate-400 font-medium mt-4">
                  Chargement des données...
                </Text>
              </View>
            ) : (
              <ScrollView horizontal>
                <View>
                  <View className="flex-row bg-gray-50/50 border-b border-gray-100">
                    <Text className="w-[320px] px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Identité
                    </Text>
                    <Text className="w-[220px] px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Rôle & Statut
                    </Text>
                    <Text className="w-[320px] px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Coordonnées
                    </Text>
                    <Text className="w-[160px] px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                      Actions
                    </Text>
                  </View>

                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const rowId = String(u.id);
                      const isActive = activeRowId === rowId;
                      const showActions = isActive;
                      const initials = String(u.name || "UK")
                        .substring(0, 2)
                        .toUpperCase();

                      const avatarBg =
                        u.role === "ADMINISTRATEUR"
                          ? "bg-purple-600"
                          : u.role === "AGENT_SCOLARITE"
                            ? "bg-emerald-500"
                            : "bg-blue-500";

                      const dotBg =
                        u.role === "ADMINISTRATEUR"
                          ? "bg-purple-500"
                          : u.role === "AGENT_SCOLARITE"
                            ? "bg-emerald-500"
                            : "bg-blue-500";

                      const roleBadge =
                        u.role === "ADMINISTRATEUR"
                          ? "bg-purple-50 text-purple-700 border-purple-100"
                          : u.role === "AGENT_SCOLARITE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-blue-50 text-blue-700 border-blue-100";

                      const RoleIcon =
                        u.role === "ADMINISTRATEUR"
                          ? Shield
                          : u.role === "AGENT_SCOLARITE"
                            ? Users
                            : BookOpen;
                      const roleIconColor =
                        u.role === "ADMINISTRATEUR"
                          ? "#7c3aed"
                          : u.role === "AGENT_SCOLARITE"
                            ? "#059669"
                            : "#2563eb";

                      return (
                        <Pressable
                          key={rowId}
                          accessibilityRole="button"
                          onPress={() =>
                            setActiveRowId((prev) => (prev === rowId ? null : rowId))
                          }
                          className="flex-row border-b border-gray-50"
                        >
                          <View className="w-[320px] px-8 py-5">
                            <View className="flex-row items-center gap-5">
                              <View
                                className={[
                                  "w-12 h-12 rounded-2xl items-center justify-center shadow-md",
                                  avatarBg,
                                ].join(" ")}
                              >
                                <Text className="text-white font-bold text-lg">
                                  {initials}
                                </Text>
                              </View>
                              <View>
                                <Text className="font-bold text-slate-900 text-base">
                                  {u.name}
                                </Text>
                                <View className="flex-row items-center gap-1.5 mt-0.5">
                                  <View className={["w-1.5 h-1.5 rounded-full", dotBg].join(" ")} />
                                  <Text className="text-xs font-medium text-slate-500">
                                    Inscrit le{" "}
                                    {u.created_at
                                      ? new Date(u.created_at).toLocaleDateString()
                                      : ""}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>

                          <View className="w-[220px] px-6 py-5">
                            <View
                              className={[
                                "self-start flex-row items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm",
                                roleBadge,
                              ].join(" ")}
                            >
                              <RoleIcon size={12} color={roleIconColor} />
                              <Text className="text-xs font-bold uppercase tracking-wide">
                                {String(u.role).replace("_", " ")}
                              </Text>
                            </View>
                          </View>

                          <View className="w-[320px] px-6 py-5">
                            <View className="gap-2">
                              <View className="flex-row items-center gap-2.5">
                                <View className="p-1 rounded-md bg-slate-100">
                                  <Mail size={12} color="#64748b" />
                                </View>
                                <Text className="text-sm font-medium text-slate-600">
                                  {u.email}
                                </Text>
                              </View>
                              {u.telephone ? (
                                <View className="flex-row items-center gap-2.5">
                                  <View className="p-1 rounded-md bg-slate-100">
                                    <Phone size={10} color="#94a3b8" />
                                  </View>
                                  <Text className="text-xs text-slate-500">
                                    {u.telephone}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>

                          <View className="w-[160px] px-8 py-5 items-end justify-center">
                            {showActions ? (
                              <View className="flex-row gap-2">
                                <Pressable
                                  accessibilityRole="button"
                                  onPress={() => openModal(u)}
                                  className="p-2.5 rounded-xl"
                                >
                                  <Edit2 size={18} color="#2563eb" />
                                </Pressable>
                                <Pressable
                                  accessibilityRole="button"
                                  onPress={() => handleDelete(u.id)}
                                  className="p-2.5 rounded-xl"
                                >
                                  <Trash2 size={18} color="#dc2626" />
                                </Pressable>
                              </View>
                            ) : (
                              <Pressable accessibilityRole="button" onPress={() => {}}>
                                <ChevronDown size={18} color="#cbd5e1" />
                              </Pressable>
                            )}
                          </View>
                        </Pressable>
                      );
                    })
                  ) : (
                    <View className="py-20 items-center justify-center w-full">
                      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
                        <Search size={32} color="#9ca3af" />
                      </View>
                      <Text className="font-bold text-xl text-slate-600">
                        Aucun utilisateur trouvé
                      </Text>
                      <Text className="text-slate-400 mt-2">
                        Essayez d'ajuster vos filtres de recherche
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </AppLayout>
  );
}
