import React from "react";
import { AppState, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  History,
  PlusCircle,
  Search,
  X,
} from "lucide-react-native";

import AppLayout from "@/layouts/AppLayout";
import api from "@/services/api";
import CenteredModal from "@/ui/CenteredModal";
import DateTimeField from "@/ui/DateTimeField";
import SelectModalField from "@/ui/SelectModalField";
import { alert, confirm } from "@/ui/nativeAlert";
import {
  buildSemestresByNiveau,
  globalSemesterLabel,
  normalizeNiveau,
  sortNiveau,
} from "@/utils/academics";

type Matiere = {
  id: number | string;
  code?: string | null;
  nom: string;
  niveau?: string | null;
  semestre?: number | string | null;
};

type Session = {
  id: number | string;
  matiere_id: number | string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  type_seance: string;
  duree?: string | number | null;
  statut: "APPROUVE" | "EN_ATTENTE" | "REJETE" | string;
  motif_rejet?: string | null;
  matiere?: { nom?: string | null } | null;
};

type FormData = {
  matiere_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  type_seance: string;
};

const TIME_SLOTS = [
  { start: "08:00", end: "09:30" },
  { start: "09:45", end: "11:15" },
  { start: "11:30", end: "13:00" },
  { start: "15:00", end: "16:30" },
  { start: "17:00", end: "18:30" },
] as const;

function timeSlotValue(start: string, end: string) {
  return `${start}|${end}`;
}

function toNumber(v: unknown) {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? 0));
  return Number.isFinite(n) ? n : 0;
}

function teachingHourWeight(typeSeance: unknown) {
  const type = String(typeSeance || "");
  if (type === "CM") return 1;
  if (type === "TD" || type === "TP") return 2 / 3;
  return 0;
}

function weightedTeachingHours(session: Pick<Session, "type_seance" | "duree">) {
  return toNumber(session.duree) * teachingHourWeight(session.type_seance);
}

function roundHours(v: number) {
  return Math.round(v * 10) / 10;
}

function isWithinLast30Days(dateValue: unknown) {
  const date = new Date(String(dateValue || ""));
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000;
}

export default function TeacherDashboard() {
  const scrollRef = React.useRef<ScrollView>(null);
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [matieres, setMatieres] = React.useState<Matiere[]>([]);
  const [allMatieres, setAllMatieres] = React.useState<Matiere[]>([]);
  const [availableYears, setAvailableYears] = React.useState<string[]>([]);
  const [availableSemestresByYear, setAvailableSemestresByYear] = React.useState<
    Record<string, number[]>
  >({});
  const [selectedYear, setSelectedYear] = React.useState("");
  const [selectedSemestre, setSelectedSemestre] = React.useState("1");
  const [loading, setLoading] = React.useState(true);
  const selectedYearRef = React.useRef("");
  const selectedSemestreRef = React.useRef("1");

  const [formData, setFormData] = React.useState<FormData>({
    matiere_id: "",
    date: new Date().toISOString().split("T")[0],
    heure_debut: "",
    heure_fin: "",
    type_seance: "CM",
  });

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterDate, setFilterDate] = React.useState("");
  const [filterMatiere, setFilterMatiere] = React.useState("");
  const [selectedMotif, setSelectedMotif] = React.useState<string | null>(null);
  const [activeRowId, setActiveRowId] = React.useState<string | null>(null);

  React.useEffect(() => {
    selectedYearRef.current = selectedYear;
  }, [selectedYear]);

  React.useEffect(() => {
    selectedSemestreRef.current = selectedSemestre;
  }, [selectedSemestre]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, matieresRes] = await Promise.all([
        api.get("/pointages"),
        api.get("/teacher/matieres"),
      ]);

      const nextSessions: Session[] = Array.isArray(sessionsRes.data)
        ? sessionsRes.data
        : [];
      const assignedMatieres: Matiere[] = Array.isArray(matieresRes.data)
        ? matieresRes.data
        : Array.isArray((matieresRes.data as any)?.data)
          ? (matieresRes.data as any).data
          : [];

      setSessions(nextSessions);
      setAllMatieres(assignedMatieres);

      const { years, semestresByNiveau: semestresByYear } =
        buildSemestresByNiveau(assignedMatieres);

      setAvailableYears(years);
      setAvailableSemestresByYear(semestresByYear);

      const prevYear = normalizeNiveau(selectedYearRef.current);
      const prevSemestre = Number(selectedSemestreRef.current || 0);

      const nextYear =
        prevYear && years.includes(prevYear) ? prevYear : years[0] || "";
      const semestresForNextYear = nextYear ? semestresByYear[nextYear] || [] : [];
      const nextSemestre = nextYear
        ? String(
            semestresForNextYear.includes(prevSemestre)
              ? prevSemestre
              : semestresForNextYear[0] ?? 1
          )
        : "1";

      setSelectedYear(nextYear);
      setSelectedSemestre(nextSemestre);

      const visible = nextYear
        ? assignedMatieres.filter(
            (m: Matiere) =>
              normalizeNiveau(m.niveau) === nextYear &&
              Number(m.semestre || 0) === Number(nextSemestre)
          )
        : [];
      setMatieres(visible);

      setFormData((prev) => ({
        ...prev,
        matiere_id:
          prev.matiere_id && visible.some((m) => String(m.id) === String(prev.matiere_id))
            ? prev.matiere_id
            : visible[0]?.id
              ? String(visible[0].id)
              : "",
      }));
    } catch (err) {
      // matches web: console.error only
      // eslint-disable-next-line no-console
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchData();
    });
    return () => sub.remove();
  }, [fetchData]);

  React.useEffect(() => {
    if (!selectedYear) {
      setMatieres([]);
      setFormData((p) => ({ ...p, matiere_id: "" }));
      return;
    }

    const semestres = availableSemestresByYear[selectedYear] || [];
    if (semestres.length > 0 && !semestres.includes(Number(selectedSemestre))) {
      setSelectedSemestre(String(semestres[0]));
    }
  }, [selectedYear, availableSemestresByYear, selectedSemestre]);

  React.useEffect(() => {
    if (!selectedYear) {
      setMatieres([]);
      setFormData((p) => ({ ...p, matiere_id: "" }));
      return;
    }

    const visible = allMatieres.filter(
      (m) =>
        normalizeNiveau(m.niveau) === selectedYear &&
        Number(m.semestre || 0) === Number(selectedSemestre)
    );
    setMatieres(visible);
    setFormData((p) => {
      const current = String(p.matiere_id || "");
      const stillValid = visible.some((m) => String(m.id) === current);
      return {
        ...p,
        matiere_id: stillValid
          ? p.matiere_id
          : visible[0]?.id
            ? String(visible[0].id)
            : "",
      };
    });
  }, [selectedYear, selectedSemestre, allMatieres]);

  const resetForm = React.useCallback(() => {
    setFormData({
      matiere_id: matieres[0]?.id ? String(matieres[0].id) : "",
      date: new Date().toISOString().split("T")[0],
      heure_debut: "",
      heure_fin: "",
      type_seance: "CM",
    });
  }, [matieres]);

  const handlePointage = async () => {
    if (!formData.heure_debut || !formData.heure_fin) {
      alert("Veuillez choisir un horaire.");
      return;
    }
    if (!formData.matiere_id) {
      alert("Aucune matière assignée.");
      return;
    }
    try {
      if (editingId) {
        await api.put(`/pointages/${editingId}`, {
          ...formData,
          matiere_id: formData.matiere_id,
        });
        setEditingId(null);
        alert("Séance modifiée !");
      } else {
        await api.post("/pointages", {
          ...formData,
          matiere_id: formData.matiere_id,
          annee_scolaire_id: 1,
        });
        alert("Pointage réussi !");
      }

      resetForm();
      fetchData();
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert(
        "Erreur lors de l'opération: " +
          (err?.response?.data?.message || err?.message || "Erreur inconnue")
      );
    }
  };

  const handleEdit = (session: Session) => {
    const assigned = allMatieres.find(
      (m) => String(m.id) === String(session.matiere_id)
    );
    if (assigned?.niveau && assigned?.semestre) {
      setSelectedYear(normalizeNiveau(assigned.niveau));
      setSelectedSemestre(String(Number(assigned.semestre)));
    }
    setEditingId(String(session.id));
    setFormData({
      matiere_id: String(session.matiere_id),
      date: session.date,
      heure_debut: session.heure_debut,
      heure_fin: session.heure_fin,
      type_seance: session.type_seance,
    });
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleDelete = async (id: Session["id"]) => {
    const ok = await confirm("Voulez-vous vraiment supprimer cette séance ?");
    if (!ok) return;
    try {
      await api.delete(`/pointages/${id}`);
      fetchData();
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  const totalHours = roundHours(
    sessions
    .filter((s) => s.statut === "APPROUVE" && isWithinLast30Days(s.date))
    .reduce((acc, s) => acc + weightedTeachingHours(s), 0)
  );

  const pendingHours = sessions
    .filter((s) => s.statut === "EN_ATTENTE")
    .reduce((acc, s) => acc + toNumber(s.duree), 0);

  const filteredSessions = sessions.filter((s) => {
    const matiereName = String(s.matiere?.nom || "").toLowerCase();
    const matchesSearch = matiereName.includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || s.date === filterDate;
    const matchesMatiere =
      !filterMatiere || String(s.matiere_id) === String(filterMatiere);
    return matchesSearch && matchesDate && matchesMatiere;
  });

  const matiereOptions = matieres.map((m) => ({
    label: m.nom,
    value: String(m.id),
  }));

  const allMatiereOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const unique = allMatieres.filter((m) => {
      const id = String(m.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    unique.sort((a, b) => String(a.nom || "").localeCompare(String(b.nom || ""), "fr"));
    return unique.map((m) => ({ label: m.nom, value: String(m.id) }));
  }, [allMatieres]);

  const yearOptions = availableYears.map((y) => ({ label: y, value: y }));
  const semestresForSelectedYear = availableSemestresByYear[selectedYear] || [];
  const semestreOptions = semestresForSelectedYear.map((sem) => ({
    label: globalSemesterLabel(selectedYear, Number(sem)),
    value: String(sem),
  }));

  const timeSlotOptions = TIME_SLOTS.map((s) => ({
    label: `${s.start} - ${s.end}`,
    value: timeSlotValue(s.start, s.end),
  }));

  const selectedTimeSlot = React.useMemo(() => {
    const match = TIME_SLOTS.find(
      (s) => s.start === formData.heure_debut && s.end === formData.heure_fin
    );
    return match ? timeSlotValue(match.start, match.end) : "";
  }, [formData.heure_debut, formData.heure_fin]);

  return (
    <AppLayout
      title="Mon Tableau de Bord"
      routeName="TeacherDashboard"
      scrollRef={scrollRef}
      headerContent={
        availableYears.length > 0 ? (
          <View className="flex-row items-center gap-2">
            <View className="w-[110px]">
              <SelectModalField
                label="Année"
                showLabel={false}
                value={selectedYear}
                options={yearOptions}
                placeholder="Année"
                onChange={setSelectedYear}
                fieldClassName="bg-white border-slate-200 px-4 py-2 rounded-full"
                valueClassName="text-slate-700 text-xs font-black"
                chevronColor="#94a3b8"
              />
            </View>
            <View className="w-[120px]">
              <SelectModalField
                label="Semestre"
                showLabel={false}
                value={selectedSemestre}
                options={semestreOptions}
                placeholder="Semestre"
                onChange={setSelectedSemestre}
                fieldClassName="bg-white border-slate-200 px-4 py-2 rounded-full"
                valueClassName="text-slate-700 text-xs font-black"
                chevronColor="#94a3b8"
              />
            </View>
          </View>
        ) : (
          <View className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-full">
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Aucune matière
            </Text>
          </View>
        )
      }
    >
      {/* Stats Section */}
      <View className="gap-6 mb-8">
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex-row items-center gap-4">
          <View className="w-12 h-12 bg-primary-50 rounded-full items-center justify-center">
            <Clock size={24} color="#004e7c" />
          </View>
          <View>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Total équivalent CM (30j)
            </Text>
            <Text className="text-2xl font-black text-slate-900 tracking-tight">
              {totalHours} h
            </Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex-row items-center gap-4">
          <View className="w-12 h-12 bg-orange-50 rounded-full items-center justify-center">
            <BarChart3 size={24} color="#f97316" />
          </View>
          <View>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Nombre de Sessions
            </Text>
            <Text className="text-2xl font-black text-slate-900 tracking-tight">
              {sessions.length}
            </Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex-row items-center gap-4">
          <View className="w-12 h-12 bg-amber-50 rounded-full items-center justify-center">
            <History size={24} color="#f59e0b" />
          </View>
          <View>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Heures en Attente
            </Text>
            <Text className="text-2xl font-black text-slate-900 tracking-tight">
              {pendingHours} h
            </Text>
          </View>
        </View>
      </View>

      {/* Pointing Form */}
      <View className="bg-form-bg rounded-2xl shadow-xl overflow-hidden p-6 mb-8">
        <View className="flex-row items-center justify-between gap-2 mb-8">
          <View className="flex-row items-center gap-2">
            {editingId ? (
              <Clock size={16} color="#e0f2fe" />
            ) : (
              <PlusCircle size={16} color="#e0f2fe" />
            )}
            <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-100">
              {editingId ? "MODIFIER LA SÉANCE" : "POINTER UNE SÉANCE"}
            </Text>
          </View>
          {editingId ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setEditingId(null);
                resetForm();
              }}
              className="p-1 rounded-full"
            >
              <X size={14} color="#e0f2fe" />
            </Pressable>
          ) : null}
        </View>

        <View className="gap-6">
          <SelectModalField
            label="Matière"
            value={formData.matiere_id}
            options={matiereOptions}
            onChange={(v) => setFormData((p) => ({ ...p, matiere_id: v }))}
            labelClassName="text-white ml-0.5"
            fieldClassName="bg-form-field border-form-border"
            valueClassName="text-white"
            chevronColor="#bae6fd"
          />

          <SelectModalField
            label="Horaire"
            value={selectedTimeSlot}
            options={timeSlotOptions}
            placeholder="Choisir un horaire"
            onChange={(v) => {
              const [start, end] = String(v).split("|");
              setFormData((p) => ({
                ...p,
                heure_debut: start || "",
                heure_fin: end || "",
              }));
            }}
            labelClassName="text-white ml-0.5"
            fieldClassName="bg-form-field border-form-border"
            valueClassName="text-white"
            chevronColor="#bae6fd"
          />

          <View className="space-y-2">
            <Text className="text-sm font-bold text-white ml-0.5">Type</Text>
            <View className="flex-row gap-3">
              {(["CM", "TD", "TP"] as const).map((t) => {
                const active = formData.type_seance === t;
                return (
                  <Pressable
                    key={t}
                    accessibilityRole="button"
                    onPress={() => setFormData((p) => ({ ...p, type_seance: t }))}
                    className={[
                      "flex-1 py-3 rounded-xl border items-center justify-center",
                      active
                        ? "bg-orange-500 border-orange-300"
                        : "bg-form-field border-form-border",
                    ].join(" ")}
                  >
                    <Text
                      className={[
                        "text-sm font-black uppercase tracking-widest",
                        active ? "text-white" : "text-sky-50",
                      ].join(" ")}
                    >
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <DateTimeField
            label="Date"
            mode="date"
            value={formData.date}
            onChange={(v) => setFormData((p) => ({ ...p, date: v }))}
            labelClassName="text-white ml-0.5"
            fieldClassName="bg-form-field border-form-border"
            valueClassName="text-white"
          />

          <Pressable
            accessibilityRole="button"
            onPress={matieres.length === 0 ? undefined : handlePointage}
            className={[
              "w-full py-4 rounded-xl items-center justify-center shadow-lg",
              matieres.length === 0
                ? "bg-slate-400"
                : "bg-accent-500 active:bg-accent-600",
            ].join(" ")}
          >
            <Text className="text-white font-black text-sm uppercase tracking-widest">
              {matieres.length === 0 ? "Aucune matière assignée" : "Valider la Séance"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* History */}
      <View className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <View className="p-6 border-b border-slate-50 gap-4">
          <View className="flex-row items-center gap-2">
            <FileText size={20} color="#004e7c" />
            <Text className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">
              Historique des Sessions
            </Text>
          </View>

          <View className="flex-row flex-wrap items-center gap-3">
            <View className="relative w-40">
              <View className="absolute left-3 top-2.5">
                <Search size={14} color="#94a3b8" />
              </View>
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Rechercher..."
                placeholderTextColor="#94a3b8"
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
              />
            </View>

            <View className="min-w-[160px]">
              <DateTimeField
                label="Date"
                showLabel={false}
                mode="date"
                value={filterDate}
                onChange={setFilterDate}
                placeholder=""
                clearOnLongPress
                fieldClassName="bg-slate-50 border-slate-100 px-3 py-2"
                valueClassName="text-slate-700 text-xs font-bold"
              />
            </View>

            <SelectModalField
              label="Matière"
              showLabel={false}
              value={filterMatiere}
              options={[
                { label: "Toutes les matières", value: "" },
                ...allMatiereOptions,
              ]}
              onChange={setFilterMatiere}
              fieldClassName="bg-slate-50 border-slate-100 px-3 py-2"
              valueClassName="text-slate-700 text-xs font-bold"
            />
          </View>
        </View>

        {/* List (vertical) */}
        <View className="p-6 gap-4">
          {filteredSessions.length === 0 ? (
            <View className="py-10">
              <Text className="text-center text-slate-300 font-medium">
                Aucune session enregistrée
              </Text>
            </View>
          ) : (
            filteredSessions.map((session) => {
              const isActive = activeRowId === String(session.id);
              const showActions = isActive && session.statut === "EN_ATTENTE";

              const dateLabel = new Date(session.date).toLocaleDateString(
                "fr-FR",
                { day: "numeric", month: "short", year: "numeric" }
              );

              const status =
                session.statut === "APPROUVE"
                  ? { label: "Approuvé", bg: "bg-emerald-50", bd: "border-emerald-100", fg: "#059669", icon: "check" as const }
                  : session.statut === "REJETE"
                    ? { label: "Rejeté", bg: "bg-red-50", bd: "border-red-100", fg: "#dc2626", icon: "x" as const }
                    : { label: "En attente", bg: "bg-amber-50", bd: "border-amber-100", fg: "#d97706", icon: "clock" as const };

              const StatusIcon =
                status.icon === "check"
                  ? CheckCircle2
                  : status.icon === "x"
                    ? X
                    : Clock;

              return (
                <Pressable
                  key={String(session.id)}
                  accessibilityRole="button"
                  onPress={() =>
                    setActiveRowId((prev) =>
                      prev === String(session.id) ? null : String(session.id)
                    )
                  }
                  className={[
                    "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm",
                    isActive ? "bg-slate-50/40" : "",
                  ].join(" ")}
                >
                  <View className="flex-row items-start justify-between gap-4">
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-900">
                        {dateLabel}
                      </Text>
                      <Text className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {session.heure_debut} - {session.heure_fin}
                      </Text>
                    </View>

                    {session.statut === "REJETE" ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          setSelectedMotif(
                            session.motif_rejet || "Aucun motif spécifié"
                          )
                        }
                      >
                        <View
                          className={[
                            "flex-row items-center gap-1.5 px-3 py-1 rounded-full border",
                            status.bg,
                            status.bd,
                          ].join(" ")}
                        >
                          <StatusIcon size={12} color={status.fg} />
                          <Text
                            className={[
                              "text-[10px] font-bold uppercase",
                              session.statut === "REJETE"
                                ? "text-red-600"
                                : "text-slate-700",
                            ].join(" ")}
                          >
                            {status.label}
                          </Text>
                        </View>
                        <Text className="text-[8px] font-black text-red-400 uppercase tracking-tighter mt-1 text-right">
                          Cliquez pour voir motif
                        </Text>
                      </Pressable>
                    ) : (
                      <View
                        className={[
                          "flex-row items-center gap-1.5 px-3 py-1 rounded-full border",
                          status.bg,
                          status.bd,
                        ].join(" ")}
                      >
                        <StatusIcon size={12} color={status.fg} />
                        <Text
                          className={[
                            "text-[10px] font-bold uppercase",
                            session.statut === "APPROUVE"
                              ? "text-emerald-600"
                              : "text-amber-600",
                          ].join(" ")}
                        >
                          {status.label}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="mt-4 flex-row items-center justify-between gap-4">
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-900 mb-0.5">
                        {session.matiere?.nom || "Inconnu"}
                      </Text>
                      <Text className="text-[10px] text-slate-400 font-bold uppercase">
                        {session.type_seance}
                      </Text>
                    </View>

                    <View className="items-end">
                      <Text className="font-black text-slate-700 text-sm">
                        {session.duree} h
                      </Text>
                    </View>
                  </View>

                  {showActions ? (
                    <View className="mt-4 flex-row justify-end gap-2">
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleEdit(session)}
                        className="p-2 rounded-lg"
                      >
                        <FileText size={16} color="#004e7c" />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleDelete(session.id)}
                        className="p-2 rounded-lg"
                      >
                        <X size={16} color="#dc2626" />
                      </Pressable>
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>
      </View>

      {/* Rejection Reason Modal */}
      <CenteredModal
        visible={Boolean(selectedMotif)}
        onClose={() => setSelectedMotif(null)}
        containerClassName="rounded-[40px]"
      >
        <View className="p-10 items-center">
          <View className="w-20 h-20 bg-red-50 rounded-3xl items-center justify-center mb-8">
            <AlertCircle size={40} color="#dc2626" />
          </View>

          <Text className="text-2xl font-black text-slate-900 mb-4 tracking-tight">
            Motif du Rejet
          </Text>
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
            Informations de l'agent
          </Text>

          <View className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 mb-10 w-full">
            <Text className="text-slate-700 text-lg font-medium leading-relaxed italic text-center">
              "{selectedMotif}"
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => setSelectedMotif(null)}
            className="w-full py-5 bg-slate-900 active:bg-slate-800 rounded-2xl items-center justify-center shadow-xl"
          >
            <Text className="text-white font-black text-sm uppercase tracking-widest">
              J'ai compris
            </Text>
          </Pressable>
        </View>
      </CenteredModal>

      {/* Keep parity with web state variable (not rendered) */}
      {loading ? null : null}
    </AppLayout>
  );
}
