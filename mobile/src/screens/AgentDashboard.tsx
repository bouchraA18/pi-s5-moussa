import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileSearch,
  Loader2,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react-native";

import AppLayout from "@/layouts/AppLayout";
import api from "@/services/api";
import CenteredModal from "@/ui/CenteredModal";
import SelectModalField from "@/ui/SelectModalField";
import SpinningIcon from "@/ui/SpinningIcon";
import { alert } from "@/ui/nativeAlert";
import { buildSemestresByNiveau, globalSemesterLabel, normalizeNiveau } from "@/utils/academics";

type Pointage = {
  id: number | string;
  type_seance: string;
  duree?: string | number | null;
  date: string;
  heure_debut: string;
  heure_fin: string;
  statut: "EN_ATTENTE" | "APPROUVE" | "REJETE" | string;
  teacher?: { name: string; email: string } | null;
  matiere?: { nom: string } | null;
};

type DashboardStats = {
  pending_count: number;
  validated_count: number;
  validated_this_month: number;
  total_hours: number;
  distribution: unknown[];
};

type Teacher = {
  id: number | string;
  name: string;
  email: string;
  role: string;
};

type Matiere = {
  id: number | string;
  code: string;
  nom: string;
  niveau: string;
  semestre: number;
};

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = React.useState<"pending" | "validated">(
    "pending"
  );
  const [pointages, setPointages] = React.useState<Pointage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  const [dashboardStats, setDashboardStats] = React.useState<DashboardStats>({
    pending_count: 0,
    validated_count: 0,
    validated_this_month: 0,
    total_hours: 0,
    distribution: [],
  });

  const [rejectionModal, setRejectionModal] = React.useState<{
    show: boolean;
    sessionId: string | null;
    reason: string;
  }>({ show: false, sessionId: null, reason: "" });

  const [activeRowId, setActiveRowId] = React.useState<string | null>(null);

  // Assign matieres to teachers by semestre/niveau
  const [assignModalOpen, setAssignModalOpen] = React.useState(false);
  const [assignLoading, setAssignLoading] = React.useState(false);
  const [assignSaving, setAssignSaving] = React.useState(false);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [niveaux, setNiveaux] = React.useState<string[]>([]);
  const [assignSemestresByNiveau, setAssignSemestresByNiveau] = React.useState<
    Record<string, number[]>
  >({});
  const [assignTeacherId, setAssignTeacherId] = React.useState("");
  const [assignNiveau, setAssignNiveau] = React.useState("");
  const [assignSemestre, setAssignSemestre] = React.useState("1");
  const [assignMatieres, setAssignMatieres] = React.useState<Matiere[]>([]);
  const [assignSelectedIds, setAssignSelectedIds] = React.useState<string[]>(
    []
  );

  const fetchStats = React.useCallback(async () => {
    try {
      const res = await api.get("/admin/stats");
      setDashboardStats(res.data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error fetching stats:", err);
    }
  }, []);

  const fetchPointages = React.useCallback(async () => {
    setLoading(true);
    try {
      const endpoint =
        activeTab === "pending" ? "/admin/pending" : "/admin/validated";
      const res = await api.get(endpoint);
      setPointages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error fetching pointages:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  React.useEffect(() => {
    fetchPointages();
    fetchStats();
  }, [activeTab, fetchPointages, fetchStats]);

  const refreshAssignData = React.useCallback(
    async (teacherId: string, niveau: string, semestre: string) => {
      if (!teacherId || !niveau || !semestre) {
        setAssignMatieres([]);
        setAssignSelectedIds([]);
        return;
      }
      setAssignLoading(true);
      try {
        const [matieresRes, assignedRes] = await Promise.all([
          api.get("/matieres", { params: { niveau, semestre: Number(semestre) } }),
          api.get("/admin/teacher-semester-matieres", {
            params: { teacher_id: teacherId, niveau, semestre: Number(semestre) },
          }),
        ]);
        setAssignMatieres(Array.isArray(matieresRes.data) ? matieresRes.data : []);
        setAssignSelectedIds(
          Array.isArray(assignedRes.data?.matiere_ids)
            ? assignedRes.data.matiere_ids.map((id: any) => String(id))
            : []
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching assignment data:", err);
        setAssignMatieres([]);
        setAssignSelectedIds([]);
      } finally {
        setAssignLoading(false);
      }
    },
    []
  );

  const openAssignModal = React.useCallback(async () => {
    setAssignModalOpen(true);
    setAssignLoading(true);
    try {
      const [usersRes, matieresAllRes] = await Promise.all([
        api.get("/users"),
        api.get("/matieres"),
      ]);

      const allUsers: Teacher[] = Array.isArray(usersRes.data)
        ? usersRes.data
        : Array.isArray((usersRes.data as any)?.data)
          ? (usersRes.data as any).data
          : [];
      const nextTeachers = allUsers.filter((u) => u?.role === "ENSEIGNANT");
      setTeachers(nextTeachers);

      const matieresAll: Matiere[] = Array.isArray(matieresAllRes.data) ? matieresAllRes.data : [];
      const { years, semestresByNiveau } = buildSemestresByNiveau(matieresAll);
      setNiveaux(years);
      setAssignSemestresByNiveau(semestresByNiveau);

      const nextTeacherId = nextTeachers[0]?.id ? String(nextTeachers[0].id) : "";
      const nextNiveau = years[0] || "";
      const nextSemestre = nextNiveau
        ? String(semestresByNiveau[nextNiveau]?.[0] ?? 1)
        : "1";

      setAssignTeacherId(nextTeacherId);
      setAssignNiveau(normalizeNiveau(nextNiveau));
      setAssignSemestre(nextSemestre);

      await refreshAssignData(nextTeacherId, normalizeNiveau(nextNiveau), nextSemestre);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error opening assignment modal:", err);
    } finally {
      setAssignLoading(false);
    }
  }, [refreshAssignData]);

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setAssignSaving(false);
  };

  React.useEffect(() => {
    if (!assignModalOpen) return;
    refreshAssignData(assignTeacherId, assignNiveau, assignSemestre);
  }, [assignModalOpen, assignTeacherId, assignNiveau, assignSemestre, refreshAssignData]);

  React.useEffect(() => {
    if (!assignModalOpen) return;
    if (!assignNiveau) return;
    const semestres = assignSemestresByNiveau[assignNiveau] || [];
    if (semestres.length > 0 && !semestres.includes(Number(assignSemestre))) {
      setAssignSemestre(String(semestres[0]));
    }
  }, [assignModalOpen, assignNiveau, assignSemestresByNiveau, assignSemestre]);

  const toggleAssignMatiere = (id: Matiere["id"]) => {
    const sid = String(id);
    setAssignSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return Array.from(next);
    });
  };

  const saveAssignments = async () => {
    if (!assignTeacherId || !assignNiveau || !assignSemestre) return;
    setAssignSaving(true);
    try {
      await api.put("/admin/teacher-semester-matieres", {
        teacher_id: Number(assignTeacherId),
        niveau: assignNiveau,
        semestre: Number(assignSemestre),
        matiere_ids: assignSelectedIds.map((id) => Number(id)),
      });
      alert("Affectations enregistrées !");
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("Error saving assignments:", err);
      alert(
        err?.response?.data?.message ||
          "Erreur lors de l'enregistrement des affectations"
      );
    } finally {
      setAssignSaving(false);
    }
  };

  const handleApprove = async (id: Pointage["id"]) => {
    const originalPointages = [...pointages];
    setPointages((prev) => prev.filter((p) => String(p.id) !== String(id)));
    try {
      // eslint-disable-next-line no-console
      console.log("Approving session:", id);
      await api.post(`/admin/approve/${id}`);
      // eslint-disable-next-line no-console
      console.log("Session approved successfully");
      fetchStats();
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("Error approving session:", err);
      setPointages(originalPointages);
      alert(err?.response?.data?.message || "Erreur lors de l'approbation");
    }
  };

  const handleRejectClick = (id: Pointage["id"]) => {
    setRejectionModal({ show: true, sessionId: String(id), reason: "" });
  };

  const handleConfirmReject = async () => {
    if (!rejectionModal.reason.trim()) {
      alert("Veuillez saisir un motif");
      return;
    }

    const idToReject = rejectionModal.sessionId;
    const originalPointages = [...pointages];

    setPointages((prev) => prev.filter((p) => String(p.id) !== String(idToReject)));
    setRejectionModal({ show: false, sessionId: null, reason: "" });

    try {
      // eslint-disable-next-line no-console
      console.log("Rejecting session:", idToReject);
      await api.post(`/admin/reject/${idToReject}`, {
        motif_rejet: rejectionModal.reason,
      });
      // eslint-disable-next-line no-console
      console.log("Session rejected successfully");
      fetchStats();
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("Error rejecting session:", err);
      setPointages(originalPointages);
      alert(err?.response?.data?.message || "Erreur lors du rejet");
    }
  };

  const filteredPointages = pointages.filter((p) => {
    const teacherName = String(p.teacher?.name || "").toLowerCase();
    const matiereName = String(p.matiere?.nom || "").toLowerCase();
    const s = searchTerm.toLowerCase();
    return teacherName.includes(s) || matiereName.includes(s);
  });

  const stats = [
    {
      label: "À Valider",
      value: String(dashboardStats.pending_count),
      icon: AlertCircle,
      color: "#f59e0b",
      bg: "bg-amber-500/10",
      trend: "Action requise",
      trendColor: "text-amber-600",
    },
    {
      label: "Validés (Mois)",
      value: String(dashboardStats.validated_this_month),
      icon: CheckCircle2,
      color: "#10b981",
      bg: "bg-emerald-500/10",
      trend: "+12% vs préc.",
      trendColor: "text-emerald-600",
    },
    {
      label: "Volume Horaire",
      value: `${dashboardStats.total_hours}h`,
      icon: Clock,
      color: "#3b82f6",
      bg: "bg-blue-500/10",
      trend: "Stable",
      trendColor: "text-slate-500",
    },
  ];

  const semestresForAssignNiveau = assignSemestresByNiveau[assignNiveau] || [];
  const assignSemestreOptions = semestresForAssignNiveau.map((sem) => ({
    label: globalSemesterLabel(assignNiveau, sem),
    value: String(sem),
  }));

  return (
    <AppLayout title="Administration Scolarité">
      {/* Assignment Modal */}
      <CenteredModal
        visible={assignModalOpen}
        onClose={closeAssignModal}
        containerClassName="rounded-[24px]"
      >
        <View className="p-8">
          <View className="flex-row items-start justify-between gap-6 mb-8">
            <View className="flex-row items-start gap-5 flex-1">
              <View className="w-14 h-14 bg-primary-50 rounded-2xl items-center justify-center">
                <BookOpen size={28} color="#004e7c" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-slate-900 mb-2">
                  Affectation des Matières
                </Text>
                <Text className="text-slate-500">
                  Assignez des matières à un enseignant selon le niveau et le
                  semestre.
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={closeAssignModal}
              className="p-2 rounded-xl"
            >
              <X size={18} color="#94a3b8" />
            </Pressable>
          </View>

          <View className="gap-4 mb-6">
            <SelectModalField
              label="Enseignant"
              value={assignTeacherId}
              options={teachers.map((t) => ({
                label: `${t.name} (${t.email})`,
                value: String(t.id),
              }))}
              placeholder={teachers.length === 0 ? "Aucun enseignant" : ""}
              onChange={setAssignTeacherId}
              fieldClassName="bg-slate-50 border-slate-200"
              valueClassName="text-slate-900"
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <SelectModalField
                  label="Année"
                  value={assignNiveau}
                  options={niveaux.map((n) => ({ label: n, value: n }))}
                  placeholder={niveaux.length === 0 ? "Aucun niveau" : ""}
                  onChange={(v) => setAssignNiveau(normalizeNiveau(v))}
                  fieldClassName="bg-slate-50 border-slate-200"
                  valueClassName="text-slate-900"
                />
              </View>
              <View className="w-[120px]">
                <SelectModalField
                  label="Semestre"
                  value={assignSemestre}
                  options={assignSemestreOptions}
                  placeholder={
                    semestresForAssignNiveau.length === 0 ? "Aucun semestre" : ""
                  }
                  onChange={setAssignSemestre}
                  fieldClassName="bg-slate-50 border-slate-200"
                  valueClassName="text-slate-900"
                />
              </View>
            </View>
          </View>

          <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xs font-black text-slate-700 uppercase tracking-widest">
                Matières disponibles
              </Text>
              <Text className="text-xs font-bold text-slate-500">
                {assignSelectedIds.length} sélectionnée(s)
              </Text>
            </View>

            {assignLoading ? (
              <View className="py-10 items-center justify-center flex-row">
                <SpinningIcon size={18} color="#64748b" />
                <Text className="ml-3 font-semibold text-slate-500">
                  Chargement...
                </Text>
              </View>
            ) : assignMatieres.length === 0 ? (
              <View className="py-10">
                <Text className="text-center text-slate-500 font-semibold">
                  Aucune matière pour ce niveau/semestre.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                <View className="gap-2">
                  {assignMatieres.map((m) => {
                    const checked = assignSelectedIds.includes(String(m.id));
                    return (
                      <Pressable
                        key={String(m.id)}
                        accessibilityRole="button"
                        onPress={() => toggleAssignMatiere(m.id)}
                        className={[
                          "px-4 py-3 rounded-xl border bg-white",
                          checked ? "border-primary-200" : "border-slate-200",
                        ].join(" ")}
                      >
                        <View className="flex-row items-center justify-between gap-3">
                          <View className="flex-1">
                            <Text className="text-sm font-extrabold text-slate-900">
                              {m.nom}
                            </Text>
                            <Text className="text-xs text-slate-500 font-semibold mt-1">
                              Code: {m.code}
                            </Text>
                          </View>
                          <View
                            className={[
                              "w-10 h-10 rounded-xl border items-center justify-center",
                              checked
                                ? "bg-primary-50 border-primary-100"
                                : "bg-slate-50 border-slate-200",
                            ].join(" ")}
                          >
                            {checked ? (
                              <Check size={18} color="#004e7c" />
                            ) : null}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>

          <View className="flex-row items-center gap-3 mt-8">
            <Pressable
              accessibilityRole="button"
              onPress={closeAssignModal}
              className="flex-1 py-3.5 px-6 bg-white border border-slate-200 rounded-xl items-center"
            >
              <Text className="text-slate-600 font-semibold">Annuler</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={saveAssignments}
              className={[
                "flex-1 py-3.5 px-6 rounded-xl items-center shadow-lg active:scale-[0.98]",
                assignSaving ||
                assignLoading ||
                !assignTeacherId ||
                !assignNiveau
                  ? "bg-slate-200"
                  : "bg-primary-600 shadow-primary-500/20",
              ].join(" ")}
              disabled={
                assignSaving ||
                assignLoading ||
                !assignTeacherId ||
                !assignNiveau
              }
            >
              <Text
                className={[
                  "font-semibold",
                  assignSaving ||
                  assignLoading ||
                  !assignTeacherId ||
                  !assignNiveau
                    ? "text-slate-500"
                    : "text-white",
                ].join(" ")}
              >
                {assignSaving ? "Enregistrement..." : "Enregistrer"}
              </Text>
            </Pressable>
          </View>
        </View>
      </CenteredModal>
      {/* Rejection Modal */}
      <CenteredModal
        visible={rejectionModal.show}
        onClose={() => setRejectionModal({ show: false, sessionId: null, reason: "" })}
        containerClassName="rounded-[24px]"
      >
        <View className="p-8">
          <View className="flex-row items-start gap-5 mb-8">
            <View className="w-14 h-14 bg-red-50 rounded-2xl items-center justify-center">
              <X size={28} color="#ef4444" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-slate-900 mb-2">
                Rejeter la demande
              </Text>
              <Text className="text-slate-500">
                Veuillez indiquer le motif du rejet. Cette information sera
                transmise à l'enseignant.
              </Text>
            </View>
          </View>

          <TextInput
            value={rejectionModal.reason}
            onChangeText={(t) => setRejectionModal((p) => ({ ...p, reason: t }))}
            placeholder="Ex: Le volume horaire ne correspond pas..."
            placeholderTextColor="#94a3b8"
            multiline
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium mb-8"
          />

          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setRejectionModal({ show: false, sessionId: null, reason: "" })
              }
              className="flex-1 py-3.5 px-6 bg-white border border-slate-200 rounded-xl items-center"
            >
              <Text className="text-slate-600 font-semibold">Annuler</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleConfirmReject}
              className="flex-1 py-3.5 px-6 bg-red-500 rounded-xl items-center shadow-lg shadow-red-500/20 active:scale-[0.98]"
            >
              <Text className="text-white font-semibold">Confirmer le rejet</Text>
            </Pressable>
          </View>
        </View>
      </CenteredModal>

      {/* Header */}
      <View className="mb-10">
        <View className="gap-6 mb-8">
          <View>
            <Text className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Tableau de Bord
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-emerald-500" />
              <Text className="text-slate-500 font-medium">
                Administration & Suivi des Séances
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3 flex-wrap">
            <View className="px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
              <Text className="text-sm font-semibold text-slate-600">
                {new Date().toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={openAssignModal}
              className="px-5 py-2.5 bg-primary-600 rounded-full flex-row items-center gap-2 shadow-lg shadow-primary-500/20 active:scale-[0.98]"
            >
              <BookOpen size={16} color="#ffffff" />
              <Text className="text-white text-sm font-extrabold">
                Affectations
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <View
                key={i}
                className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm"
              >
                <View className="flex-row items-start justify-between mb-6">
                  <View className={["p-3.5 rounded-2xl", stat.bg].join(" ")}>
                    <Icon size={24} color={stat.color} />
                  </View>
                  <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100">
                    <Text className={["text-[11px] font-bold uppercase tracking-wide", stat.trendColor].join(" ")}>
                      {stat.trend}
                    </Text>
                    <ArrowUpRight size={12} color="#64748b" />
                  </View>
                </View>
                <View>
                  <Text className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
                    {stat.value}
                  </Text>
                  <Text className="text-sm font-medium text-slate-400">
                    {stat.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Main Content */}
      <View className="bg-white rounded-[32px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <View className="p-6 border-b border-slate-100 bg-white">
          <View className="gap-6">
            <View className="p-1.5 bg-slate-50 rounded-2xl flex-row">
              {(["pending", "validated"] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <Pressable
                    key={tab}
                    accessibilityRole="button"
                    onPress={() => setActiveTab(tab)}
                    className={[
                      "flex-1 px-6 py-3 rounded-xl",
                      isActive ? "bg-white" : "bg-transparent",
                    ].join(" ")}
                  >
                    <View className="flex-row items-center justify-center gap-2">
                      {tab === "pending" ? (
                        <AlertCircle size={16} color={isActive ? "#0f172a" : "#64748b"} />
                      ) : (
                        <CheckCircle2 size={16} color={isActive ? "#0f172a" : "#64748b"} />
                      )}
                      <Text
                        className={[
                          "text-sm font-bold",
                          isActive ? "text-slate-900" : "text-slate-500",
                        ].join(" ")}
                      >
                        {tab === "pending" ? "À Valider" : "Historique Validé"}
                      </Text>
                      {tab === "pending" && dashboardStats.pending_count > 0 ? (
                        <View className="ml-1 px-1.5 py-0.5 bg-red-500 rounded-md min-w-[18px] items-center">
                          <Text className="text-[10px] font-extrabold text-white">
                            {dashboardStats.pending_count}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View className="relative">
              <View className="absolute left-4 top-3.5">
                <Search size={18} color="#94a3b8" />
              </View>
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Rechercher..."
                placeholderTextColor="#94a3b8"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 rounded-2xl font-medium text-slate-900"
              />
            </View>
          </View>
        </View>

        {/* Content */}
        <View>
          {loading ? (
            <View className="items-center justify-center h-80">
              <SpinningIcon>
                <Loader2 size={40} color="#3b82f6" />
              </SpinningIcon>
              <Text className="text-slate-400 font-medium mt-4">
                Chargement des données...
              </Text>
            </View>
          ) : filteredPointages.length === 0 ? (
            <View className="items-center justify-center h-96 px-4">
              <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
                <FileSearch size={40} color="#cbd5e1" />
              </View>
              <Text className="text-xl font-bold text-slate-900 mb-2">
                Aucune demande trouvée
              </Text>
              <Text className="text-slate-500 text-center max-w-xs">
                {searchTerm
                  ? "Aucun résultat ne correspond à votre recherche."
                  : "Tout est à jour ! Aucune demande en attente pour le moment."}
              </Text>
            </View>
          ) : (
            <ScrollView horizontal>
              <View>
                <View className="flex-row border-b border-slate-100 bg-slate-50/50">
                  <Text className="w-[240px] px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Enseignant
                  </Text>
                  <Text className="w-[240px] px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Type & Matière
                  </Text>
                  <Text className="w-[220px] px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Date & Horaire
                  </Text>
                  <Text className="w-[160px] px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                    Statut
                  </Text>
                  <Text className="w-[180px] px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                    Actions
                  </Text>
                </View>

                {filteredPointages.map((p) => {
                  const rowId = String(p.id);
                  const isActive = activeRowId === rowId;
                  const initials =
                    (p.teacher?.name || "UK").substring(0, 2).toUpperCase();
                  const showActions = p.statut === "EN_ATTENTE";

                  return (
                    <Pressable
                      key={rowId}
                      accessibilityRole="button"
                      onPress={() => setActiveRowId(rowId)}
                      className={[
                        "flex-row border-b border-slate-50",
                        isActive ? "bg-slate-50/80" : "bg-white",
                      ].join(" ")}
                    >
                      <View className="w-[240px] px-8 py-5">
                        <View className="flex-row items-center gap-4">
                          <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center shadow-md">
                            <Text className="text-white font-bold text-sm">
                              {initials}
                            </Text>
                          </View>
                          <View>
                            <Text className="font-bold text-slate-900">
                              {p.teacher?.name}
                            </Text>
                            <Text className="text-xs font-medium text-slate-500">
                              {p.teacher?.email}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="w-[240px] px-6 py-5">
                        <View className="gap-1">
                          <Text className="font-semibold text-slate-700">
                            {p.matiere?.nom}
                          </Text>
                          <View className="flex-row items-center gap-2">
                            <View
                              className={[
                                "px-2 py-0.5 rounded-md border",
                                p.type_seance === "CM"
                                  ? "bg-purple-50 border-purple-100"
                                  : p.type_seance === "TP"
                                    ? "bg-pink-50 border-pink-100"
                                    : "bg-orange-50 border-orange-100",
                              ].join(" ")}
                            >
                              <Text
                                className={[
                                  "text-[10px] font-bold uppercase tracking-wider",
                                  p.type_seance === "CM"
                                    ? "text-purple-600"
                                    : p.type_seance === "TP"
                                      ? "text-pink-600"
                                      : "text-orange-600",
                                ].join(" ")}
                              >
                                {p.type_seance}
                              </Text>
                            </View>
                            <Text className="text-xs font-medium text-slate-400">
                              {p.duree}h
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="w-[220px] px-6 py-5">
                        <View className="gap-1">
                          <View className="flex-row items-center gap-2">
                            <Calendar size={14} color="#94a3b8" />
                            <Text className="text-slate-700 font-medium text-sm">
                              {new Date(p.date).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </Text>
                          </View>
                          <Text className="text-slate-500 text-xs">
                            {p.heure_debut} - {p.heure_fin}
                          </Text>
                        </View>
                      </View>

                      <View className="w-[160px] px-6 py-5 items-center justify-center">
                        {p.statut === "EN_ATTENTE" ? (
                          <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
                            <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <Text className="text-xs font-bold uppercase tracking-wide text-amber-700">
                              À Valider
                            </Text>
                          </View>
                        ) : p.statut === "APPROUVE" ? (
                          <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
                            <CheckCircle2 size={12} color="#059669" />
                            <Text className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                              Validé
                            </Text>
                          </View>
                        ) : (
                          <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100">
                            <X size={12} color="#dc2626" />
                            <Text className="text-xs font-bold uppercase tracking-wide text-red-700">
                              Rejeté
                            </Text>
                          </View>
                        )}
                      </View>

                      <View className="w-[180px] px-8 py-5 items-end justify-center">
                        {p.statut === "EN_ATTENTE" ? (
                          <View className="flex-row items-center gap-2">
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => handleApprove(p.id)}
                              className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 items-center justify-center"
                            >
                              <Check size={20} color="#059669" />
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => handleRejectClick(p.id)}
                              className="w-10 h-10 rounded-xl bg-white border border-slate-200 items-center justify-center"
                            >
                              <X size={20} color="#94a3b8" />
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable accessibilityRole="button" onPress={() => {}}>
                            <MoreHorizontal size={20} color="#cbd5e1" />
                          </Pressable>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </AppLayout>
  );
}
