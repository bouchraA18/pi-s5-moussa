import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import {
    Users,
    CheckCircle2,
    Clock,
    Search,
    Check,
    X,
    FileSearch,
    Loader2,
    Calendar,
    MoreHorizontal,
    AlertCircle,
    TrendingUp,
    BarChart3,
    BookOpen,
    Plus,
    Filter,
    ChevronRight,
    ArrowUpRight,
    Download,
    RotateCcw
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ACADEMIC_LEVELS, getSemestresForNiveau, globalSemesterLabel } from '../utils/academics';

const toNumber = (value) => {
    const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
    return Number.isFinite(parsed) ? parsed : 0;
};

const teachingHourWeight = (typeSeance) => {
    if (typeSeance === 'CM') return 1;
    if (typeSeance === 'TD' || typeSeance === 'TP') return 2 / 3;
    return 0;
};

const weightedTeachingHours = (session) =>
    toNumber(session?.duree) * teachingHourWeight(String(session?.type_seance || ''));

const formatCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const AgentDashboard = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [pointages, setPointages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Stats state
    const [dashboardStats, setDashboardStats] = useState({
        pending_count: 0,
        validated_count: 0,
        validated_this_month: 0,
        total_hours: 0,
        distribution: [] // Not heavily used in this view but available
    });

    const [rejectionModal, setRejectionModal] = useState({ show: false, sessionId: null, reason: '' });

    // Assignments (Agent/Admin): assign matieres to teachers by semester
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignSaving, setAssignSaving] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [availableNiveaux, setAvailableNiveaux] = useState([]);
    const [assignTeacherId, setAssignTeacherId] = useState('');
    const [assignNiveau, setAssignNiveau] = useState('');
    const [assignSemestre, setAssignSemestre] = useState(1);
    const [assignMatieres, setAssignMatieres] = useState([]);
    const [assignSelectedMatiereIds, setAssignSelectedMatiereIds] = useState([]);
    const [reportTeacherId, setReportTeacherId] = useState('');
    const [reportDateFrom, setReportDateFrom] = useState('');
    const [reportDateTo, setReportDateTo] = useState('');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadTeachers();
        fetchStats();
    }, []);

    useEffect(() => {
        fetchPointages();
    }, [activeTab, reportTeacherId, reportDateFrom, reportDateTo]);

    const loadTeachers = async () => {
        try {
            const usersRes = await api.get('/users');
            const allUsers = Array.isArray(usersRes.data)
                ? usersRes.data
                : Array.isArray(usersRes.data?.data)
                    ? usersRes.data.data
                    : [];
            const nextTeachers = allUsers.filter((u) => u?.role === 'ENSEIGNANT');
            setTeachers(nextTeachers);
            return nextTeachers;
        } catch (err) {
            console.error("Error fetching teachers:", err);
            setTeachers([]);
            return [];
        }
    };

    const refreshAssignData = async (teacherId, niveau, semestre) => {
        if (!teacherId || !niveau || !semestre) {
            setAssignMatieres([]);
            setAssignSelectedMatiereIds([]);
            return;
        }
        setAssignLoading(true);
        try {
            const [matieresRes, assignedRes] = await Promise.all([
                api.get('/matieres', { params: { niveau, semestre } }),
                api.get('/admin/teacher-semester-matieres', {
                    params: { teacher_id: teacherId, niveau, semestre }
                })
            ]);
            setAssignMatieres(Array.isArray(matieresRes.data) ? matieresRes.data : []);
            setAssignSelectedMatiereIds(
                Array.isArray(assignedRes.data?.matiere_ids)
                    ? assignedRes.data.matiere_ids.map((id) => String(id))
                    : []
            );
        } catch (err) {
            console.error("Error fetching assignment data:", err);
            setAssignMatieres([]);
            setAssignSelectedMatiereIds([]);
        } finally {
            setAssignLoading(false);
        }
    };

    const openAssignModal = async () => {
        setAssignModalOpen(true);
        setAssignLoading(true);
        try {
            const nextTeachers = teachers.length > 0 ? teachers : await loadTeachers();
            setTeachers(nextTeachers);

            const niveaux = [...ACADEMIC_LEVELS];
            setAvailableNiveaux(niveaux);

            const nextTeacherId = nextTeachers[0]?.id ? String(nextTeachers[0].id) : '';
            const nextNiveau = niveaux[0] || '';
            const nextSemestre = getSemestresForNiveau(nextNiveau)[0] || 1;

            setAssignTeacherId(nextTeacherId);
            setAssignNiveau(nextNiveau);
            setAssignSemestre(nextSemestre);

            await refreshAssignData(nextTeacherId, nextNiveau, nextSemestre);
        } catch (err) {
            console.error("Error opening assignment modal:", err);
        } finally {
            setAssignLoading(false);
        }
    };

    const closeAssignModal = () => {
        setAssignModalOpen(false);
        setAssignSaving(false);
    };

    useEffect(() => {
        if (!assignModalOpen) return;
        refreshAssignData(assignTeacherId, assignNiveau, assignSemestre);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignModalOpen, assignTeacherId, assignNiveau, assignSemestre]);

    useEffect(() => {
        if (!assignModalOpen) return;
        const semestres = getSemestresForNiveau(assignNiveau);
        if (semestres.length > 0 && !semestres.includes(Number(assignSemestre))) {
            setAssignSemestre(semestres[0]);
        }
    }, [assignModalOpen, assignNiveau, assignSemestre]);

    const toggleAssignMatiere = (id) => {
        const sid = String(id);
        setAssignSelectedMatiereIds((prev) => {
            const next = new Set(prev.map(String));
            if (next.has(sid)) next.delete(sid);
            else next.add(sid);
            return Array.from(next);
        });
    };

    const saveAssignments = async () => {
        if (!assignTeacherId || !assignNiveau || !assignSemestre) return;
        setAssignSaving(true);
        try {
            await api.put('/admin/teacher-semester-matieres', {
                teacher_id: Number(assignTeacherId),
                niveau: assignNiveau,
                semestre: Number(assignSemestre),
                matiere_ids: assignSelectedMatiereIds.map((id) => Number(id)),
            });
            alert("Affectations enregistrées !");
        } catch (err) {
            console.error("Error saving assignments:", err);
            alert(err.response?.data?.message || "Erreur lors de l'enregistrement des affectations");
        } finally {
            setAssignSaving(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setDashboardStats(res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    const fetchPointages = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'pending' ? '/admin/pending' : '/admin/validated';
            const params = activeTab === 'validated'
                ? {
                    teacher_id: reportTeacherId || undefined,
                    date_from: reportDateFrom || undefined,
                    date_to: reportDateTo || undefined,
                }
                : undefined;
            const res = await api.get(endpoint, { params });
            setPointages(res.data);
        } catch (err) {
            console.error("Error fetching pointages:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        // Optimistic UI Update: Remove from list immediately
        const originalPointages = [...pointages];
        setPointages(prev => prev.filter(p => String(p.id) !== String(id)));

        try {
            console.log('Approving session:', id);
            await api.post(`/admin/approve/${id}`);
            console.log('Session approved successfully');

            // Update stats in background
            fetchStats();
        } catch (err) {
            console.error('Error approving session:', err);
            // Rollback on error
            setPointages(originalPointages);
            alert(err.response?.data?.message || "Erreur lors de l'approbation");
        }
    };

    const handleRejectClick = (id) => {
        setRejectionModal({ show: true, sessionId: id, reason: '' });
    };

    const handleConfirmReject = async () => {
        if (!rejectionModal.reason.trim()) {
            alert("Veuillez saisir un motif");
            return;
        }

        const idToReject = rejectionModal.sessionId;
        const originalPointages = [...pointages];

        // Optimistic UI Update: Remove from list and close modal immediately
        setPointages(prev => prev.filter(p => String(p.id) !== String(idToReject)));
        setRejectionModal({ show: false, sessionId: null, reason: '' });

        try {
            console.log('Rejecting session:', idToReject);
            await api.post(`/admin/reject/${idToReject}`, { motif_rejet: rejectionModal.reason });
            console.log('Session rejected successfully');

            // Update stats in background
            fetchStats();
        } catch (err) {
            console.error('Error rejecting session:', err);
            // Rollback is tricky because modal is closed, but at least restore list
            setPointages(originalPointages);
            alert(err.response?.data?.message || "Erreur lors du rejet");
        }
    };

    const resetValidatedFilters = () => {
        setReportTeacherId('');
        setReportDateFrom('');
        setReportDateTo('');
    };

    const exportValidatedSessionsCsv = async () => {
        if (activeTab !== 'validated' || filteredPointages.length === 0) return;
        setExporting(true);
        try {
            const header = [
                'Enseignant',
                'Email',
                'Matiere',
                'Type',
                'Date',
                'Heure debut',
                'Heure fin',
                'Duree',
                'Heures calculees',
            ];
            const rows = filteredPointages.map((session) => ([
                session.teacher?.name || '',
                session.teacher?.email || '',
                session.matiere?.nom || '',
                session.type_seance || '',
                session.date || '',
                session.heure_debut || '',
                session.heure_fin || '',
                toNumber(session.duree).toFixed(1),
                weightedTeachingHours(session).toFixed(1),
            ]));
            const csv = [header, ...rows]
                .map((row) => row.map(formatCsvValue).join(','))
                .join('\n');
            const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const from = reportDateFrom || 'debut';
            const to = reportDateTo || 'fin';
            link.href = url;
            link.download = `sessions-validees-${from}-${to}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    };

    // Filtered pointages
    const filteredPointages = pointages.filter((p) => {
        const search = searchTerm.toLowerCase();
        return String(p.teacher?.name || '').toLowerCase().includes(search) ||
            String(p.matiere?.nom || '').toLowerCase().includes(search);
    });

    const stats = [
        {
            label: 'À Valider',
            value: dashboardStats.pending_count.toString(),
            icon: AlertCircle,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            desc: 'Demandes en attente',
            trend: 'Action requise',
            trendColor: 'text-amber-600'
        },
        {
            label: 'Validés (Mois)',
            value: dashboardStats.validated_this_month.toString(),
            icon: CheckCircle2,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            desc: `Sur ${dashboardStats.validated_count} total`,
            trend: '+12% vs préc.',
            trendColor: 'text-emerald-600'
        },
        {
            label: 'Volume Horaire (30j)',
            value: `${dashboardStats.total_hours}h`,
            icon: Clock,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            desc: 'Cumul validé',
            trend: '30 derniers jours',
            trendColor: 'text-slate-500'
        },
    ];

    const assignSemestreOptions = getSemestresForNiveau(assignNiveau);

    return (
        <AppLayout title="Administration Scolarité">
            <div className="min-h-screen bg-slate-50/50 pb-20">
                {/* Assignment Modal */}
                <AnimatePresence>
                    {assignModalOpen && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                                onClick={closeAssignModal}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-white w-full max-w-3xl rounded-[24px] shadow-2xl overflow-hidden border border-slate-100"
                            >
                                <div className="p-8">
                                    <div className="flex items-start justify-between gap-6 mb-8">
                                        <div className="flex items-start gap-5">
                                            <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shrink-0">
                                                <BookOpen size={28} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Affectation des Matières</h3>
                                                <p className="text-slate-500 leading-relaxed">
                                                    Assignez des matières à un enseignant selon le niveau et le semestre.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={closeAssignModal}
                                            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
                                            title="Fermer"
                                        >
                                            <X size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div>
                                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-2">
                                                Enseignant
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 font-semibold"
                                                value={assignTeacherId}
                                                onChange={(e) => setAssignTeacherId(e.target.value)}
                                            >
                                                {teachers.length === 0 ? (
                                                    <option value="">Aucun enseignant</option>
                                                ) : (
                                                    teachers.map((t) => (
                                                        <option key={t.id} value={String(t.id)}>
                                                            {t.name} ({t.email})
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-2">
                                                Niveau
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 font-semibold"
                                                value={assignNiveau}
                                                onChange={(e) => setAssignNiveau(e.target.value)}
                                            >
                                                {availableNiveaux.length === 0 ? (
                                                    <option value="">Aucun niveau</option>
                                                ) : (
                                                    availableNiveaux.map((n) => (
                                                        <option key={n} value={n}>
                                                            {n}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-2">
                                                Semestre
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 font-semibold"
                                                value={String(assignSemestre)}
                                                onChange={(e) => setAssignSemestre(Number(e.target.value))}
                                                disabled={assignSemestreOptions.length === 0}
                                            >
                                                {assignSemestreOptions.length === 0 ? (
                                                    <option value="">Aucun semestre</option>
                                                ) : (
                                                    assignSemestreOptions.map((semestre) => (
                                                        <option key={semestre} value={String(semestre)}>
                                                            {globalSemesterLabel(assignNiveau, semestre)}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
                                                Matières disponibles
                                            </p>
                                            <p className="text-xs font-bold text-slate-500">
                                                {assignSelectedMatiereIds.length} sélectionnée(s)
                                            </p>
                                        </div>

                                        {assignLoading ? (
                                            <div className="py-10 flex items-center justify-center text-slate-500">
                                                <Loader2 className="animate-spin" size={20} />
                                                <span className="ml-3 font-semibold">Chargement...</span>
                                            </div>
                                        ) : assignMatieres.length === 0 ? (
                                            <div className="py-10 text-center text-slate-500 font-semibold">
                                                Aucune matière pour ce niveau/semestre.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {assignMatieres.map((m) => {
                                                    const checked = assignSelectedMatiereIds.includes(String(m.id));
                                                    return (
                                                        <button
                                                            key={m.id}
                                                            type="button"
                                                            onClick={() => toggleAssignMatiere(m.id)}
                                                            className={[
                                                                "p-4 rounded-2xl border text-left transition-all",
                                                                checked
                                                                    ? "bg-white border-primary-200 ring-2 ring-primary-500/10 shadow-sm"
                                                                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm",
                                                            ].join(" ")}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="text-sm font-extrabold text-slate-900">
                                                                        {m.nom}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500 font-semibold mt-1">
                                                                        Code: {m.code}
                                                                    </p>
                                                                </div>
                                                                <div
                                                                    className={[
                                                                        "w-10 h-10 rounded-xl flex items-center justify-center border",
                                                                        checked
                                                                            ? "bg-primary-50 text-primary-600 border-primary-100"
                                                                            : "bg-slate-50 text-slate-400 border-slate-200",
                                                                    ].join(" ")}
                                                                >
                                                                    {checked ? (
                                                                        <Check size={18} strokeWidth={3} />
                                                                    ) : (
                                                                        <Plus size={18} strokeWidth={3} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-end gap-3 mt-8">
                                        <button
                                            onClick={closeAssignModal}
                                            className="py-3.5 px-6 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={saveAssignments}
                                            disabled={assignSaving || assignLoading || !assignTeacherId || !assignNiveau}
                                            className={[
                                                "py-3.5 px-6 rounded-xl font-semibold shadow-lg transition-all active:scale-[0.98]",
                                                assignSaving || assignLoading || !assignTeacherId || !assignNiveau
                                                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                                    : "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20",
                                            ].join(" ")}
                                        >
                                            {assignSaving ? "Enregistrement..." : "Enregistrer"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Rejection Modal */}
                <AnimatePresence>
                    {rejectionModal.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                                onClick={() => setRejectionModal({ show: false, sessionId: null, reason: '' })}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-white w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden border border-slate-100"
                            >
                                <div className="p-8">
                                    <div className="flex items-start gap-5 mb-8">
                                        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                                            <X size={28} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Rejeter la demande</h3>
                                            <p className="text-slate-500 leading-relaxed">
                                                Veuillez indiquer le motif du rejet. Cette information sera transmise à l'enseignant.
                                            </p>
                                        </div>
                                    </div>

                                    <textarea
                                        className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-700 font-medium resize-none mb-8 placeholder:text-slate-400"
                                        placeholder="Ex: Le volume horaire ne correspond pas..."
                                        value={rejectionModal.reason}
                                        onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                                        autoFocus
                                    />

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setRejectionModal({ show: false, sessionId: null, reason: '' })}
                                            className="flex-1 py-3.5 px-6 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleConfirmReject}
                                            className="flex-1 py-3.5 px-6 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-[0.98]"
                                        >
                                            Confirmer le rejet
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header Section */}
                    <header className="mb-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                                    Tableau de Bord
                                </h1>
                                <p className="text-slate-500 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Administration & Suivi des Séances
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-600 shadow-sm">
                                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <button
                                    onClick={openAssignModal}
                                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full text-sm font-extrabold shadow-lg shadow-primary-500/20 transition-all active:scale-[0.98] inline-flex items-center gap-2"
                                    title="Affecter des matières"
                                >
                                    <BookOpen size={16} strokeWidth={2.5} />
                                    Affectations
                                </button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {stats.map((stat, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={i}
                                    className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_2px_20px_-4px_rgba(30,41,59,0.04)] group hover:shadow-[0_8px_30px_-6px_rgba(30,41,59,0.08)] transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                            <stat.icon size={24} strokeWidth={2.5} />
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-slate-50 border border-slate-100 ${stat.trendColor}`}>
                                            {stat.trend}
                                            <ArrowUpRight size={12} strokeWidth={3} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">{stat.value}</div>
                                        <div className="text-sm font-medium text-slate-400">{stat.label}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-20">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                {/* Tabs */}
                                <div className="p-1.5 bg-slate-50 rounded-2xl inline-flex w-full lg:w-auto">
                                    {['pending', 'validated'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`relative flex-1 lg:flex-none px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab
                                                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
                                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {tab === 'pending' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                                                {tab === 'pending' ? 'À Valider' : 'Historique Validé'}
                                                {tab === 'pending' && dashboardStats.pending_count > 0 && (
                                                    <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-md font-extrabold min-w-[18px]">
                                                        {dashboardStats.pending_count}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Search */}
                                <div className="relative w-full lg:w-80 group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <Search size={18} strokeWidth={2.5} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Rechercher..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                            {activeTab === 'validated' && (
                                <div className="mt-4 flex flex-col xl:flex-row xl:items-end gap-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                        <div>
                                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-2">
                                                Enseignant
                                            </label>
                                            <select
                                                value={reportTeacherId}
                                                onChange={(e) => setReportTeacherId(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 font-semibold"
                                            >
                                                <option value="">Tous les enseignants</option>
                                                {teachers.map((teacher) => (
                                                    <option key={teacher.id} value={String(teacher.id)}>
                                                        {teacher.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-2">
                                                Du
                                            </label>
                                            <input
                                                type="date"
                                                value={reportDateFrom}
                                                onChange={(e) => setReportDateFrom(e.target.value)}
                                                max={reportDateTo || undefined}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-2">
                                                Au
                                            </label>
                                            <input
                                                type="date"
                                                value={reportDateTo}
                                                onChange={(e) => setReportDateTo(e.target.value)}
                                                min={reportDateFrom || undefined}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 font-semibold"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={resetValidatedFilters}
                                            className="py-3 px-4 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all inline-flex items-center gap-2"
                                        >
                                            <RotateCcw size={16} strokeWidth={2.5} />
                                            Réinitialiser
                                        </button>
                                        <button
                                            onClick={exportValidatedSessionsCsv}
                                            disabled={filteredPointages.length === 0 || exporting}
                                            className={[
                                                "py-3 px-4 rounded-xl font-semibold inline-flex items-center gap-2 transition-all",
                                                filteredPointages.length === 0 || exporting
                                                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20",
                                            ].join(' ')}
                                        >
                                            <Download size={16} strokeWidth={2.5} />
                                            {exporting ? 'Export...' : 'Exporter CSV'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="min-h-[400px]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-80">
                                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" strokeWidth={2} />
                                    <p className="text-slate-400 font-medium animate-pulse">Chargement des données...</p>
                                </div>
                            ) : filteredPointages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-96 text-center px-4">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                        <FileSearch className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Aucune demande trouvée</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto">
                                        {searchTerm
                                            ? "Aucun résultat ne correspond à votre recherche."
                                            : activeTab === 'validated'
                                                ? "Aucune séance approuvée ne correspond à ces filtres."
                                                : "Tout est à jour ! Aucune demande en attente pour le moment."}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Enseignant</th>
                                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Type & Matière</th>
                                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Horaire</th>
                                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Statut</th>
                                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            <AnimatePresence mode="popLayout">
                                                {filteredPointages.map((p, index) => (
                                                    <motion.tr
                                                        key={p.id}
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                                        className="group hover:bg-slate-50/80 transition-colors"
                                                    >
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
                                                                    {p.teacher?.name.substring(0, 2).toUpperCase() || 'UK'}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{p.teacher?.name}</div>
                                                                    <div className="text-xs font-medium text-slate-500">{p.teacher?.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-semibold text-slate-700">{p.matiere?.nom}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${p.type_seance === 'CM' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                                            p.type_seance === 'TP' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                                                                                'bg-orange-50 text-orange-600 border-orange-100'
                                                                        }`}>
                                                                        {p.type_seance}
                                                                    </span>
                                                                    <span className="text-xs font-medium text-slate-400">{p.duree}h</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                                                    <Calendar size={14} className="text-slate-400" />
                                                                    {new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-slate-500 text-xs pl-5.5">
                                                                    {p.heure_debut} - {p.heure_fin}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            {p.statut === 'EN_ATTENTE' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold uppercase tracking-wide">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                                    À Valider
                                                                </span>
                                                            ) : p.statut === 'APPROUVE' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold uppercase tracking-wide">
                                                                    <CheckCircle2 size={12} strokeWidth={3} />
                                                                    Validé
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-100 text-xs font-bold uppercase tracking-wide">
                                                                    <X size={12} strokeWidth={3} />
                                                                    Rejeté
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-8 py-5 text-right">
                                                            {p.statut === 'EN_ATTENTE' && (
                                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-200">
                                                                    <button
                                                                        onClick={() => handleApprove(p.id)}
                                                                        className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-100 shadow-sm transition-all flex items-center justify-center hover:shadow-emerald-500/30"
                                                                        title="Approuver"
                                                                    >
                                                                        <Check size={20} strokeWidth={2.5} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRejectClick(p.id)}
                                                                        className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:bg-red-50 hover:text-red-500 border border-slate-200 hover:border-red-100 shadow-sm transition-all flex items-center justify-center"
                                                                        title="Rejeter"
                                                                    >
                                                                        <X size={20} strokeWidth={2.5} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {p.statut !== 'EN_ATTENTE' && (
                                                                <button className="text-slate-300 hover:text-slate-600 transition-colors">
                                                                    <MoreHorizontal size={20} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default AgentDashboard;
