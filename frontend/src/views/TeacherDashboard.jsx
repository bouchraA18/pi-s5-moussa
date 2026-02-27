import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import {
    BarChart3,
    Clock,
    CheckCircle2,
    History,
    PlusCircle,
    FileText,
    Calendar,
    ChevronDown,
    X,
    Search,
    AlertCircle
} from 'lucide-react';

import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const TIME_SLOTS = [
    { start: '08:00', end: '09:30' },
    { start: '09:45', end: '11:15' },
    { start: '11:30', end: '13:00' },
    { start: '15:00', end: '16:30' },
    { start: '17:00', end: '18:30' },
];

const timeSlotValue = (start, end) => `${start}|${end}`;

const YEAR_ORDER = ['L1', 'L2', 'L3', 'M1', 'M2'];

const niveauOrderIndex = (niveau) => {
    const idx = YEAR_ORDER.indexOf(String(niveau || ''));
    return idx === -1 ? 999 : idx;
};

const sortNiveau = (a, b) => {
    const ia = niveauOrderIndex(a);
    const ib = niveauOrderIndex(b);
    if (ia !== ib) return ia - ib;
    return String(a || '').localeCompare(String(b || ''));
};

const globalSemesterNumber = (niveau, semestre) => {
    const n = String(niveau || '');
    const s = Number(semestre || 0);
    const offsets = {
        L1: 0,
        L2: 2,
        L3: 4,
        M1: 0,
        M2: 2,
    };
    const offset = offsets[n] ?? 0;
    return offset + s;
};

const globalSemesterLabel = (niveau, semestre) => `S${globalSemesterNumber(niveau, semestre)}`;

const TeacherDashboard = () => {
    const [sessions, setSessions] = useState([]);
    const [matieres, setMatieres] = useState([]);
    const [allMatieres, setAllMatieres] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [availableSemestresByYear, setAvailableSemestresByYear] = useState({});
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSemestre, setSelectedSemestre] = useState(1);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        matiere_id: '',
        date: new Date().toISOString().split('T')[0],
        heure_debut: '',
        heure_fin: '',
        type_seance: 'CM'
    });

    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterMatiere, setFilterMatiere] = useState('');
    const [selectedMotif, setSelectedMotif] = useState(null);



    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [sessionsRes, matieresRes] = await Promise.all([
                api.get('/pointages'),
                api.get('/teacher/matieres')
            ]);
            const nextSessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
            const assignedMatieres = Array.isArray(matieresRes.data) ? matieresRes.data : [];

            setSessions(nextSessions);
            setAllMatieres(assignedMatieres);

            const semestresByYearSet = {};
            assignedMatieres.forEach((m) => {
                const niveau = String(m.niveau || '');
                const semestre = Number(m.semestre || 0);
                if (!niveau || !Number.isFinite(semestre) || semestre <= 0) return;
                if (!semestresByYearSet[niveau]) semestresByYearSet[niveau] = new Set();
                semestresByYearSet[niveau].add(semestre);
            });

            const years = Object.keys(semestresByYearSet).sort(sortNiveau);
            const semestresByYear = {};
            years.forEach((y) => {
                semestresByYear[y] = Array.from(semestresByYearSet[y] || []).sort((a, b) => Number(a) - Number(b));
            });

            setAvailableYears(years);
            setAvailableSemestresByYear(semestresByYear);

            const initialYear = years[0] || '';
            const initialSemestre = initialYear ? (semestresByYear[initialYear]?.[0] || 1) : 1;
            setSelectedYear(initialYear);
            setSelectedSemestre(initialSemestre);

            const visibleMatieres = initialYear
                ? assignedMatieres.filter((m) => String(m.niveau || '') === initialYear && Number(m.semestre || 0) === Number(initialSemestre))
                : [];
            setMatieres(visibleMatieres);

            setFormData((prev) => ({
                ...prev,
                matiere_id: visibleMatieres[0]?.id || '',
            }));
        } catch (err) {
            console.error("Error fetching data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedYear) {
            setMatieres([]);
            setFormData((prev) => ({ ...prev, matiere_id: '' }));
            return;
        }

        const semestres = Array.isArray(availableSemestresByYear[selectedYear])
            ? availableSemestresByYear[selectedYear]
            : [];

        if (semestres.length > 0 && !semestres.includes(Number(selectedSemestre))) {
            setSelectedSemestre(Number(semestres[0]));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, availableSemestresByYear]);

    useEffect(() => {
        if (!selectedYear) {
            setMatieres([]);
            setFormData((prev) => ({ ...prev, matiere_id: '' }));
            return;
        }
        const visible = allMatieres.filter(
            (m) => String(m.niveau || '') === selectedYear && Number(m.semestre || 0) === Number(selectedSemestre)
        );
        setMatieres(visible);
        setFormData((prev) => {
            const current = String(prev.matiere_id || '');
            const stillValid = visible.some((m) => String(m.id) === current);
            return { ...prev, matiere_id: stillValid ? prev.matiere_id : (visible[0]?.id || '') };
        });
    }, [selectedYear, selectedSemestre, allMatieres]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePointage = async (e) => {
        e.preventDefault();
        if (!formData.heure_debut || !formData.heure_fin) {
            alert("Veuillez choisir un horaire.");
            return;
        }
        try {
            if (editingId) {
                await api.put(`/pointages/${editingId}`, formData);
                setEditingId(null);
                alert("Séance modifiée !");
            } else {
                await api.post('/pointages', {
                    ...formData,
                    annee_scolaire_id: 1
                });
                alert("Pointage réussi !");
            }
            // Reset form
            setFormData({
                matiere_id: matieres[0]?.id || '',
                date: new Date().toISOString().split('T')[0],
                heure_debut: '',
                heure_fin: '',
                type_seance: 'CM'
            });
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'opération: " + (err.response?.data?.message || err.message));
        }
    };

    const handleEdit = (session) => {
        const assigned = allMatieres.find((m) => String(m.id) === String(session.matiere_id));
        if (assigned) {
            setSelectedYear(String(assigned.niveau || ''));
            setSelectedSemestre(Number(assigned.semestre || 1));
        }
        setEditingId(session.id);
        setFormData({
            matiere_id: session.matiere_id,
            date: session.date,
            heure_debut: session.heure_debut,
            heure_fin: session.heure_fin,
            type_seance: session.type_seance
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette séance ?")) return;
        try {
            await api.delete(`/pointages/${id}`);
            fetchData();
        } catch (err) {
            alert("Erreur lors de la suppression");
        }
    };


    // Calculate stats
    const totalHours = sessions
        .filter(s => s.statut === 'APPROUVE')
        .reduce((acc, s) => acc + parseFloat(s.duree || 0), 0);

    const pendingHours = sessions
        .filter(s => s.statut === 'EN_ATTENTE')
        .reduce((acc, s) => acc + parseFloat(s.duree || 0), 0);

    const timeSlotOptions = TIME_SLOTS.map((s) => ({
        label: `${s.start} - ${s.end}`,
        value: timeSlotValue(s.start, s.end),
    }));

    const selectedTimeSlot = (() => {
        const match = TIME_SLOTS.find(
            (s) => s.start === formData.heure_debut && s.end === formData.heure_fin
        );
        return match ? timeSlotValue(match.start, match.end) : '';
    })();

    const filteredHistorySessions = sessions.filter((s) => {
        const matiereName = String(s.matiere?.nom || '').toLowerCase();
        const matchesSearch = matiereName.includes(searchTerm.toLowerCase());
        const matchesDate = !filterDate || s.date === filterDate;
        const matchesMatiere = !filterMatiere || String(s.matiere_id) === String(filterMatiere);
        return matchesSearch && matchesDate && matchesMatiere;
    });

    const semestresForSelectedYear = Array.isArray(availableSemestresByYear[selectedYear])
        ? availableSemestresByYear[selectedYear]
        : [];

    return (
        <AppLayout
            title="Mon Tableau de Bord"
            navbarContent={
                availableYears.length > 0 ? (
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            Année
                        </span>
                        <div className="relative">
                            <select
                                className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-full text-sm font-extrabold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                {availableYears.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <ChevronDown size={16} strokeWidth={3} />
                            </div>
                        </div>

                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            Semestre
                        </span>
                        <div className="relative">
                            <select
                                className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-full text-sm font-extrabold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                value={String(selectedSemestre)}
                                onChange={(e) => setSelectedSemestre(Number(e.target.value))}
                                disabled={semestresForSelectedYear.length === 0}
                            >
                                {semestresForSelectedYear.map((sem) => (
                                    <option key={String(sem)} value={String(sem)}>
                                        {globalSemesterLabel(selectedYear, Number(sem))}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <ChevronDown size={16} strokeWidth={3} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-500 shadow-sm">
                        Aucune matière assignée
                    </div>
                )
            }
        >
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-xl transition-all duration-300 group"
                >
                    <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Heures Effectuées</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">{totalHours} h</p>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-xl transition-all duration-300 group"
                >
                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre de Sessions</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">{sessions.length}</p>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-xl transition-all duration-300 group"
                >
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                        <History size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Heures en Attente</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">{pendingHours} h</p>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pointing Form - Sidebar Left */}
                <div className="lg:col-span-1">
                    <div className="bg-[#0c4a6e] rounded-2xl shadow-xl overflow-hidden p-6 border-none">
                        <div className="flex items-center justify-between gap-2 mb-8 text-sky-100">
                            <div className="flex items-center gap-2">
                                {editingId ? <Clock size={16} /> : <PlusCircle size={16} />}
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] pt-0.5">
                                    {editingId ? 'MODIFIER LA SÉANCE' : 'POINTER UNE SÉANCE'}
                                </h3>
                            </div>
                            {editingId && (
                                <button
                                    onClick={() => {
                                        setEditingId(null);
                                        setFormData({
                                            matiere_id: matieres[0]?.id || '',
                                            date: new Date().toISOString().split('T')[0],
                                            heure_debut: '',
                                            heure_fin: '',
                                            type_seance: 'CM'
                                        });
                                    }}
                                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>


                        <form onSubmit={handlePointage} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white ml-0.5">Matière</label>
                                <div className="relative">
                                    <select
                                        name="matiere_id"
                                        value={formData.matiere_id}
                                        onChange={handleInputChange}
                                        disabled={matieres.length === 0}
                                        className={`w-full px-4 py-2.5 bg-[#336b8a] border border-[#4a8fb3] rounded-xl text-white font-medium focus:ring-2 focus:ring-white/20 outline-none appearance-none text-sm ${matieres.length === 0 ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        {matieres.length === 0 ? (
                                            <option value="" className="text-slate-900">
                                                Aucune matière assignée
                                            </option>
                                        ) : (
                                            matieres.map(m => (
                                                <option key={m.id} value={m.id} className="text-slate-900">
                                                    {m.nom}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-200 pointer-events-none" size={16} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white ml-0.5">Horaire</label>
                                <div className="relative">
                                    <select
                                        value={selectedTimeSlot}
                                        onChange={(e) => {
                                            const [start, end] = String(e.target.value).split('|');
                                            setFormData(prev => ({
                                                ...prev,
                                                heure_debut: start || '',
                                                heure_fin: end || ''
                                            }));
                                        }}
                                        required
                                        className="w-full px-4 py-2.5 bg-[#336b8a] border border-[#4a8fb3] rounded-xl text-white font-medium focus:ring-2 focus:ring-white/20 outline-none appearance-none cursor-pointer text-sm"
                                    >
                                        <option value="" disabled className="text-slate-900">
                                            Choisir un horaire
                                        </option>
                                        {timeSlotOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value} className="text-slate-900">
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-200 pointer-events-none" size={16} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white ml-0.5">Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['CM', 'TD', 'TP'].map((t) => {
                                        const active = formData.type_seance === t;
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, type_seance: t }))}
                                                className={`py-2.5 rounded-xl border text-sm font-black uppercase tracking-widest transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/20 ${active
                                                    ? 'bg-[#f97316] border-[#fb923c] text-white shadow-lg shadow-orange-950/20'
                                                    : 'bg-[#336b8a] border-[#4a8fb3] text-sky-50 hover:bg-[#3a7a9e]'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white ml-0.5">Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2.5 bg-[#336b8a] border border-[#4a8fb3] rounded-xl text-white font-medium focus:ring-2 focus:ring-white/20 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={matieres.length === 0}
                                className={`w-full py-4 text-white rounded-xl font-black shadow-lg transition-all active:scale-95 text-sm uppercase tracking-widest ${matieres.length === 0 ? 'bg-slate-400 cursor-not-allowed shadow-slate-900/10' : 'bg-[#f97316] hover:bg-[#ea580c] shadow-orange-950/20'}`}
                            >
                                {matieres.length === 0 ? "Aucune matière assignée" : "Valider la Séance"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History Table - Content Right */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
                        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <FileText className="text-primary-600" size={20} />
                                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] pt-0.5">Historique des Sessions</h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Rechercher..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500/10 transition-all w-40"
                                    />
                                </div>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500/10 transition-all"
                                />
                                <select
                                    value={filterMatiere}
                                    onChange={(e) => setFilterMatiere(e.target.value)}
                                    className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500/10 transition-all"
                                >
                                    <option value="">Toutes les matières</option>
                                    {allMatieres.map(m => (
                                        <option key={m.id} value={m.id}>{m.nom}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="md:hidden p-6 space-y-4">
                            {sessions.length === 0 ? (
                                <div className="py-10 text-center text-slate-300 font-medium">
                                    Aucune session enregistrée
                                </div>
                            ) : (
                                filteredHistorySessions.map((session) => (
                                    <div key={session.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">
                                                    {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                    {session.heure_debut} - {session.heure_fin}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                {session.statut === 'APPROUVE' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                                                        <CheckCircle2 size={12} /> Approuvé
                                                    </span>
                                                ) : session.statut === 'REJETE' ? (
                                                    <button
                                                        onClick={() => setSelectedMotif(session.motif_rejet || "Aucun motif spécifié")}
                                                        className="group/rejet relative flex flex-col items-end gap-1 active:scale-95 transition-transform"
                                                    >
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 uppercase group-hover/rejet:bg-red-600 group-hover/rejet:text-white transition-all shadow-sm">
                                                            <X size={12} /> Rejeté
                                                        </span>
                                                        <span className="text-[8px] font-black text-red-400 group-hover/rejet:text-red-600 uppercase tracking-tighter animate-pulse">
                                                            Cliquez pour voir motif
                                                        </span>
                                                    </button>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase">
                                                        <Clock size={12} /> En attente
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-end justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-slate-900 mb-0.5 truncate">
                                                    {session.matiere?.nom || 'Inconnu'}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">
                                                    {session.type_seance}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="font-black text-slate-700 text-sm">
                                                    {session.duree} h
                                                </div>
                                            </div>
                                        </div>

                                        {session.statut === 'EN_ATTENTE' ? (
                                            <div className="mt-4 flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(session)}
                                                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Modifier"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(session.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#fcfdfe] text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                                    <tr>
                                        <th className="px-8 py-6">Date</th>
                                        <th className="px-8 py-6">Matière</th>
                                        <th className="px-8 py-6">Durée</th>
                                        <th className="px-8 py-6 text-center">Statut</th>
                                        <th className="px-8 py-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {sessions.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-16 text-center text-slate-300 font-medium">Aucune session enregistrée</td>
                                        </tr>
                                    ) : (
                                        filteredHistorySessions.map((session) => (
                                                <tr key={session.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="text-sm font-bold text-slate-900 mb-0.5">
                                                            {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-medium">{session.heure_debut} - {session.heure_fin}</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="text-sm font-bold text-slate-900 mb-0.5">{session.matiere?.nom || 'Inconnu'}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{session.type_seance}</div>
                                                    </td>
                                                    <td className="px-8 py-6 font-black text-slate-700 text-sm">
                                                        {session.duree} h
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            {session.statut === 'APPROUVE' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                                                                    <CheckCircle2 size={12} /> Approuvé
                                                                </span>
                                                            ) : session.statut === 'REJETE' ? (
                                                                <button
                                                                    onClick={() => setSelectedMotif(session.motif_rejet || "Aucun motif spécifié")}
                                                                    className="group/rejet relative flex flex-col items-center gap-1 active:scale-95 transition-transform"
                                                                >
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 uppercase group-hover/rejet:bg-red-600 group-hover/rejet:text-white transition-all shadow-sm">
                                                                        <X size={12} /> Rejeté
                                                                    </span>
                                                                    <span className="text-[8px] font-black text-red-400 group-hover/rejet:text-red-600 uppercase tracking-tighter animate-pulse">
                                                                        Cliquez pour voir motif
                                                                    </span>
                                                                </button>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase">
                                                                    <Clock size={12} /> En attente
                                                                </span>
                                                            )}
                                                        </div>

                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        {session.statut === 'EN_ATTENTE' && (
                                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => handleEdit(session)}
                                                                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                                    title="Modifier"
                                                                >
                                                                    <FileText size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(session.id)}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Supprimer"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>

                        </div>
                    </div>
                </div>
            </div>
            {/* Rejection Reason Modal */}
            <AnimatePresence>
                {selectedMotif && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
                        >
                            <div className="p-10 text-center">
                                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <AlertCircle size={40} strokeWidth={2.5} />
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Motif du Rejet</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Informations de l'agent</p>

                                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-slate-700 text-lg font-medium leading-relaxed mb-10 italic">
                                    "{selectedMotif}"
                                </div>

                                <button
                                    onClick={() => setSelectedMotif(null)}
                                    className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95"
                                >
                                    J'ai compris
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
};


export default TeacherDashboard;
