import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowUpRight,
  BookOpen,
  Clock,
  Edit2,
  GraduationCap,
  Layers,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react-native";

import AppLayout from "@/layouts/AppLayout";
import api from "@/services/api";
import CenteredModal from "@/ui/CenteredModal";
import SelectModalField from "@/ui/SelectModalField";
import SpinningIcon from "@/ui/SpinningIcon";
import { alert, confirm } from "@/ui/nativeAlert";
import { getSemestresForNiveau, globalSemesterLabel } from "@/utils/academics";

type Matiere = {
  id: number | string;
  code: string;
  nom: string;
  description?: string | null;
  niveau: string;
  semestre: number;
  filiale?: string;
  credit: number;
  nombre_heures_prevu: number;
};

type FormData = {
  code: string;
  nom: string;
  description: string;
  niveau: string;
  semestre: number;
  filiale: string;
  credit: number;
  nombre_heures_prevu: number;
};

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export default function AdminMatieres() {
  const [matieres, setMatieres] = React.useState<Matiere[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedLevel, setSelectedLevel] = React.useState<
    "ALL" | "L1" | "L2" | "L3" | "M1" | "M2"
  >("ALL");

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingMatiere, setEditingMatiere] = React.useState<Matiere | null>(
    null
  );
  const [activeRowId, setActiveRowId] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState<FormData>({
    code: "",
    nom: "",
    description: "",
    niveau: "L1",
    semestre: 1,
    filiale: "Informatique",
    credit: 2,
    nombre_heures_prevu: 20,
  });

  const fetchMatieres = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/matieres");
      if (Array.isArray(res.data)) {
        setMatieres(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setMatieres(res.data.data);
      } else {
        setMatieres([]);
        // eslint-disable-next-line no-console
        console.error("Structure de réponse inattendue:", res.data);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error fetching matieres:", err);
      setMatieres([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMatieres();
  }, [fetchMatieres]);

  const openModal = (matiere: Matiere | null = null) => {
    if (matiere) {
      setEditingMatiere(matiere);
      setFormData({
        code: String(matiere.code || ""),
        nom: String(matiere.nom || ""),
        description: String(matiere.description || ""),
        niveau: String(matiere.niveau || "L1"),
        semestre: Number(matiere.semestre || 1),
        filiale: String(matiere.filiale || "Informatique"),
        credit: Number(matiere.credit ?? 2),
        nombre_heures_prevu: Number(matiere.nombre_heures_prevu ?? 20),
      });
    } else {
      setEditingMatiere(null);
      setFormData({
        code: "",
        nom: "",
        description: "",
        niveau: "L1",
        semestre: 1,
        filiale: "Informatique",
        credit: 2,
        nombre_heures_prevu: 20,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMatiere(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingMatiere) {
        await api.put(`/matieres/${editingMatiere.id}`, formData);
      } else {
        await api.post("/matieres", formData);
      }
      fetchMatieres();
      closeModal();
      fetchMatieres();
      closeModal();
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("Erreur complète:", err?.response?.data);
      const message =
        err?.response?.data?.message || "Erreur lors de l'enregistrement.";
      const errors = err?.response?.data?.errors;
      if (errors) {
        const errorDetails = Object.values(errors).flat().join("\n");
        alert(`${message}\n\n${errorDetails}`);
      } else {
        alert(message);
      }
    }
  };

  const handleDelete = async (id: Matiere["id"]) => {
    const ok = await confirm("Êtes-vous sûr ?");
    if (!ok) return;
    try {
      await api.delete(`/matieres/${id}`);
      setMatieres((prev) => prev.filter((m) => String(m.id) !== String(id)));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  const safeMatieres = safeArray<Matiere>(matieres);
  const filteredMatieres = safeMatieres.filter((m) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      String(m.nom || "").toLowerCase().includes(s) ||
      String(m.code || "").toLowerCase().includes(s);
    const matchesLevel = selectedLevel === "ALL" || m.niveau === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const totalMatieres = safeMatieres.length;
  const creditsTotal = safeMatieres.reduce((acc, m) => acc + (m.credit || 0), 0);
  const hoursTotal = safeMatieres.reduce(
    (acc, m) => acc + (m.nombre_heures_prevu || 0),
    0
  );
  const averageCredits =
    totalMatieres > 0 ? (creditsTotal / totalMatieres).toFixed(1) : "0";

  const stats = [
    {
      label: "Matières Totales",
      value: String(totalMatieres),
      icon: BookOpen,
      gradientColors: ["#6366f1", "#9333ea"] as const,
    },
    {
      label: "Volume Horaire",
      value: `${hoursTotal}h`,
      icon: Clock,
      gradientColors: ["#fbbf24", "#f97316"] as const,
    },
    {
      label: "Crédits Totaux",
      value: String(creditsTotal),
      icon: GraduationCap,
      gradientColors: ["#34d399", "#14b8a6"] as const,
    },
    {
      label: "Moy. Crédits",
      value: String(averageCredits),
      icon: Layers,
      gradientColors: ["#60a5fa", "#06b6d4"] as const,
    },
  ];

  const canSubmitModal =
    formData.code.trim().length > 0 && formData.nom.trim().length > 0;
  const semestreOptions = getSemestresForNiveau(formData.niveau);

  return (
    <AppLayout title="Gestion des Matières" routeName="AdminMatieres">
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
                  {editingMatiere ? "Modifier le Module" : "Nouveau Module"}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Détails du programme académique
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
              style={{ maxHeight: 560 }}
              contentContainerStyle={{ padding: 32 }}
            >
              <View className="flex-row flex-wrap -mx-3">
                <View className="w-1/2 px-3 mb-6">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Code Matière
                  </Text>
                  <TextInput
                    value={formData.code}
                    onChangeText={(v) => setFormData((p) => ({ ...p, code: v }))}
                    placeholder="INFO101"
                    placeholderTextColor="#a5b4fc"
                    autoCapitalize="characters"
                    className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl font-medium text-indigo-700"
                  />
                </View>

                <View className="w-1/2 px-3 mb-6">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Intitulé
                  </Text>
                  <TextInput
                    value={formData.nom}
                    onChangeText={(v) => setFormData((p) => ({ ...p, nom: v }))}
                    placeholder="Algorithmique Avancée"
                    placeholderTextColor="#9ca3af"
                    className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl font-medium text-gray-800"
                  />
                </View>

                <View className="w-1/2 px-3 mb-6">
                  <SelectModalField
                    label="Niveau d'étude"
                    value={formData.niveau}
                    onChange={(v) =>
                      setFormData((p) => {
                        const semestres = getSemestresForNiveau(v);
                        return {
                          ...p,
                          niveau: v,
                          semestre: semestres.includes(Number(p.semestre))
                            ? Number(p.semestre)
                            : (semestres[0] ?? 1),
                        };
                      })
                    }
                    options={["L1", "L2", "L3", "M1", "M2"].map((o) => ({
                      value: o,
                      label: o,
                    }))}
                    labelClassName="text-xs font-bold text-gray-500 uppercase tracking-wide"
                    fieldClassName="bg-gray-50/50 border-gray-200 py-3.5 px-3.5 rounded-xl"
                    valueClassName="text-gray-800 font-medium"
                    chevronColor="#9ca3af"
                  />
                </View>

                <View className="w-1/2 px-3 mb-6">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Semestre
                  </Text>
                  <View className="flex-row gap-2">
                    {semestreOptions.map((s) => {
                      const isActive = formData.semestre === s;
                      return (
                        <Pressable
                          key={String(s)}
                          accessibilityRole="button"
                          onPress={() =>
                            setFormData((p) => ({ ...p, semestre: s }))
                          }
                          className={[
                            "flex-1 py-3.5 rounded-xl border",
                            isActive
                              ? "bg-indigo-600 border-indigo-600"
                              : "bg-white border-gray-200",
                          ].join(" ")}
                        >
                          <Text
                            className={[
                              "text-sm font-bold text-center",
                              isActive ? "text-white" : "text-gray-500",
                            ].join(" ")}
                          >
                            {globalSemesterLabel(formData.niveau, s)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View className="w-1/2 px-3 mb-6">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Volume Horaire
                  </Text>
                  <View className="relative">
                    <View className="absolute left-4 top-3.5 p-1 bg-amber-100 rounded">
                      <Clock size={14} color="#d97706" />
                    </View>
                    <TextInput
                      value={String(formData.nombre_heures_prevu)}
                      onChangeText={(v) =>
                        setFormData((p) => ({
                          ...p,
                          nombre_heures_prevu: Number.parseFloat(v || "0"),
                        }))
                      }
                      keyboardType="numeric"
                      className="w-full p-3.5 pl-12 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-800"
                    />
                  </View>
                </View>

                <View className="w-1/2 px-3 mb-6">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Crédits ECTS
                  </Text>
                  <View className="relative">
                    <View className="absolute left-4 top-3.5 p-1 bg-emerald-100 rounded">
                      <GraduationCap size={14} color="#059669" />
                    </View>
                    <TextInput
                      value={String(formData.credit)}
                      onChangeText={(v) =>
                        setFormData((p) => ({
                          ...p,
                          credit: Number.parseInt(v || "0", 10),
                        }))
                      }
                      keyboardType="numeric"
                      className="w-full p-3.5 pl-12 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-800"
                    />
                  </View>
                </View>

                <View className="w-full px-3 mb-2">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Description
                  </Text>
                  <TextInput
                    value={formData.description}
                    onChangeText={(v) =>
                      setFormData((p) => ({ ...p, description: v }))
                    }
                    placeholder="Description succincte du contenu..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-800 h-24"
                    textAlignVertical="top"
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
                    canSubmitModal ? "bg-indigo-600" : "bg-indigo-600/50",
                  ].join(" ")}
                >
                  <Text className="text-white font-bold text-center">
                    {editingMatiere ? "Mettre à jour" : "Ajouter au programme"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </CenteredModal>

        <View className="flex-row items-end justify-between gap-6 mb-10">
          <View className="flex-1">
            <Text className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Programme
            </Text>
            <Text className="text-slate-500 mt-2 text-lg font-medium">
              Gestion des matières, modules et crédits.
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
                    colors={["#4f46e5", "#7c3aed"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                </View>
                <View className="bg-white/20 p-1 rounded-lg">
                  <Plus size={18} color="#ffffff" />
                </View>
                <Text className="text-white font-bold">Nouvelle Matière</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View className="gap-6 mb-10">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <View
                key={idx}
                className="bg-white/80 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/40 overflow-hidden p-6"
              >
                <View className="flex-row items-start justify-between mb-4">
                  <View className="rounded-2xl shadow-lg shadow-indigo-500/20">
                    <LinearGradient
                      colors={s.gradientColors as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 16, padding: 14 }}
                    >
                      <Icon size={22} color="#ffffff" />
                    </LinearGradient>
                  </View>
                  <View className="bg-white/50 p-1.5 rounded-full">
                    <ArrowUpRight size={14} color="#9ca3af" />
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

        <View className="bg-white/80 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/40 overflow-hidden">
          <View className="p-6 border-b border-gray-100 bg-white/50">
            <View className="gap-4">
              <View className="relative">
                <View className="absolute left-4 top-3.5">
                  <Search size={20} color="#9ca3af" />
                </View>
                <TextInput
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholder="Rechercher un module, un code..."
                  placeholderTextColor="#9ca3af"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 rounded-2xl font-medium text-gray-700"
                />
              </View>

              <View className="flex-row bg-gray-100/80 p-1.5 rounded-xl">
                {(["ALL", "L1", "L2", "L3", "M1", "M2"] as const).map((level) => {
                  const isActive = selectedLevel === level;
                  return (
                    <Pressable
                      key={level}
                      accessibilityRole="button"
                      onPress={() => setSelectedLevel(level)}
                      className={[
                        "px-3 py-1.5 rounded-lg",
                        isActive ? "bg-white shadow-sm" : "bg-transparent",
                      ].join(" ")}
                    >
                      <Text
                        className={[
                          "text-xs font-bold",
                          isActive ? "text-slate-800" : "text-slate-500",
                        ].join(" ")}
                      >
                        {level === "ALL" ? "TOUS" : level}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View>
            {loading ? (
              <View className="items-center justify-center py-20">
                <SpinningIcon>
                  <Loader2 size={40} color="#6366f1" />
                </SpinningIcon>
                <Text className="text-slate-400 font-medium mt-4">
                  Chargement...
                </Text>
              </View>
            ) : (
              <ScrollView horizontal>
                <View>
                  <View className="flex-row bg-gray-50/50 border-b border-gray-100">
                    <Text className="w-[360px] px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Module
                    </Text>
                    <Text className="w-[240px] px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Niveau & Semestre
                    </Text>
                    <Text className="w-[260px] px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Charge & Crédits
                    </Text>
                    <Text className="w-[160px] px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                      Actions
                    </Text>
                  </View>

                  {filteredMatieres.length > 0 ? (
                    filteredMatieres.map((m) => {
                      const rowId = String(m.id);
                      const isActive = activeRowId === rowId;
                      const showActions = isActive;

                      const levelBadge = m.niveau.startsWith("M")
                        ? "bg-purple-50 text-purple-700 border-purple-100"
                        : "bg-blue-50 text-blue-700 border-blue-100";

                      return (
                        <Pressable
                          key={rowId}
                          accessibilityRole="button"
                          onPress={() =>
                            setActiveRowId((prev) => (prev === rowId ? null : rowId))
                          }
                          className="flex-row border-b border-gray-50"
                        >
                          <View className="w-[360px] px-8 py-5">
                            <View className="flex-row items-center gap-5">
                              <View className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 items-center justify-center shadow-sm">
                                <Text className="text-[10px] text-slate-400 uppercase tracking-wider">
                                  Code
                                </Text>
                                <Text className="text-sm text-slate-800 font-mono font-bold">
                                  {m.code}
                                </Text>
                              </View>
                              <View className="flex-1">
                                <Text className="font-bold text-slate-900 text-base">
                                  {m.nom}
                                </Text>
                                <Text
                                  className="text-xs font-medium text-slate-500 mt-1"
                                  numberOfLines={1}
                                >
                                  {m.description || "Aucune description"}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View className="w-[240px] px-6 py-5">
                            <View className="flex-row items-center gap-3">
                              <View
                                className={[
                                  "px-2.5 py-1 rounded-lg border",
                                  levelBadge,
                                ].join(" ")}
                              >
                                <Text className="font-bold text-[11px] uppercase tracking-wide">
                                  {m.niveau}
                                </Text>
                              </View>
                              <View className="h-4 w-px bg-slate-200" />
                              <Text className="font-bold text-slate-600 text-sm">
                                {globalSemesterLabel(m.niveau, m.semestre)}
                              </Text>
                            </View>
                          </View>

                          <View className="w-[260px] px-6 py-5">
                            <View className="flex-row gap-4">
                              <View className="flex-row items-center gap-2">
                                <View className="p-1.5 rounded-lg bg-amber-50">
                                  <Clock size={14} color="#d97706" />
                                </View>
                                <View>
                                  <Text className="text-[10px] font-bold text-slate-400 uppercase">
                                    Heures
                                  </Text>
                                  <Text className="text-sm font-bold text-slate-700">
                                    {m.nombre_heures_prevu}h
                                  </Text>
                                </View>
                              </View>
                              <View className="flex-row items-center gap-2">
                                <View className="p-1.5 rounded-lg bg-emerald-50">
                                  <GraduationCap size={14} color="#059669" />
                                </View>
                                <View>
                                  <Text className="text-[10px] font-bold text-slate-400 uppercase">
                                    Crédits
                                  </Text>
                                  <Text className="text-sm font-bold text-slate-700">
                                    {m.credit}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>

                          <View className="w-[160px] px-8 py-5 items-end justify-center">
                            {showActions ? (
                              <View className="flex-row gap-2">
                                <Pressable
                                  accessibilityRole="button"
                                  onPress={() => openModal(m)}
                                  className="p-2.5 rounded-xl"
                                >
                                  <Edit2 size={18} color="#4f46e5" />
                                </Pressable>
                                <Pressable
                                  accessibilityRole="button"
                                  onPress={() => handleDelete(m.id)}
                                  className="p-2.5 rounded-xl"
                                >
                                  <Trash2 size={18} color="#dc2626" />
                                </Pressable>
                              </View>
                            ) : (
                              <Pressable accessibilityRole="button" onPress={() => {}}>
                                <X size={18} color="#cbd5e1" />
                              </Pressable>
                            )}
                          </View>
                        </Pressable>
                      );
                    })
                  ) : (
                    <View className="py-20 items-center justify-center w-full">
                      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
                        <BookOpen size={32} color="#9ca3af" />
                      </View>
                      <Text className="font-bold text-xl text-slate-600">
                        Aucun module trouvé
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
