import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import {
    Clock, CheckCircle2, History, FileText, Calendar,
    ChevronDown, X, Search, AlertCircle, MapPin, Camera
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const YEAR_ORDER = ['L1', 'L2', 'L3', 'M1', 'M2'];
const niveauOrderIndex = (n) => { const i = YEAR_ORDER.indexOf(String(n || '')); return i === -1 ? 999 : i; };
const sortNiveau = (a, b) => { const ia = niveauOrderIndex(a), ib = niveauOrderIndex(b); return ia !== ib ? ia - ib : String(a || '').localeCompare(String(b || '')); };
const globalSemesterNumber = (niveau, semestre) => { const n = String(niveau || ''), s = Number(semestre || 0), offsets = { L1: 0, L2: 2, L3: 4, M1: 0, M2: 2 }; return (offsets[n] ?? 0) + s; };
const globalSemesterLabel = (niveau, semestre) => `S${globalSemesterNumber(niveau, semestre)}`;
const toNumber = (v) => { const p = typeof v === 'number' ? v : parseFloat(String(v ?? 0)); return Number.isFinite(p) ? p : 0; };
const teachingHourWeight = (t) => t === 'CM' ? 1 : (t === 'TD' || t === 'TP' ? 2 / 3 : 0);
const weightedTeachingHours = (s) => toNumber(s?.duree) * teachingHourWeight(String(s?.type_seance || ''));
const roundHours = (v) => Math.round(v * 10) / 10;
const isWithinCurrentMonth = (d) => {
    const dt = new Date(d);
    const now = new Date();
    return !Number.isNaN(dt.getTime()) &&
        dt.getMonth() === now.getMonth() &&
        dt.getFullYear() === now.getFullYear();
};

const getCurrentMonthName = () => {
    return new Date().toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase();
};

const TeacherDashboard = () => {
    const [sessions, setSessions] = useState([]);
    const [allMatieres, setAllMatieres] = useState([]);
    const [todaySchedules, setTodaySchedules] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [availableSemestresByYear, setAvailableSemestresByYear] = useState({});
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSemestre, setSelectedSemestre] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterMatiere, setFilterMatiere] = useState('');
    const [selectedMotif, setSelectedMotif] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

    useEffect(() => { fetchData(); fetchTodaySchedules(); }, []);

    const fetchTodaySchedules = async () => {
        try { const r = await api.get('/teacher/today-schedules'); setTodaySchedules(r.data); }
        catch (e) { console.error(e); }
    };

    const fetchData = async () => {
        try {
            const [sr, mr] = await Promise.all([api.get('/pointages'), api.get('/teacher/matieres')]);
            const nextSessions = Array.isArray(sr.data) ? sr.data : [];
            const am = Array.isArray(mr.data) ? mr.data : [];
            setSessions(nextSessions); setAllMatieres(am);
            const byYear = {};
            am.forEach(m => { const n = String(m.niveau || ''), s = Number(m.semestre || 0); if (!n || !Number.isFinite(s) || s <= 0) return; if (!byYear[n]) byYear[n] = new Set(); byYear[n].add(s); });
            const years = Object.keys(byYear).sort(sortNiveau);
            const sBy = {}; years.forEach(y => { sBy[y] = Array.from(byYear[y] || []).sort((a, b) => Number(a) - Number(b)); });
            setAvailableYears(years); setAvailableSemestresByYear(sBy);
            const iy = years[0] || '', is = iy ? (sBy[iy]?.[0] || 1) : 1;
            setSelectedYear(iy); setSelectedSemestre(is);
        } catch (e) { console.error(e); }
    };

    const handleQuickPointage = (s) => { setSelectedSchedule(s); setShowConfirmModal(true); setPhotoFile(null); };

    const confirmQuickPointage = async () => {
        if (!selectedSchedule) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('matiere_id', selectedSchedule.matiere_id);
            formData.append('date', new Date().toISOString().split('T')[0]);
            formData.append('heure_debut', selectedSchedule.heure_debut.substring(0, 5));
            formData.append('heure_fin', selectedSchedule.heure_fin.substring(0, 5));
            formData.append('type_seance', selectedSchedule.type_seance);
            formData.append('annee_scolaire_id', 1);
            if (photoFile) {
                formData.append('preuve_photo', photoFile);
            }

            await api.post('/pointages', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast("Séance pointée avec succès !", 'success');
            setShowConfirmModal(false);
            setPhotoFile(null);
            fetchData(); fetchTodaySchedules();
        } catch (e) { showToast(e.response?.data?.message || "Erreur lors du pointage", 'error'); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette séance ?")) return;
        try { await api.delete(`/pointages/${id}`); showToast("Séance supprimée", 'success'); fetchData(); }
        catch (e) { showToast("Erreur lors de la suppression", 'error'); }
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const isAlreadyPointed = (sched) => {
        const s0 = sched.heure_debut.substring(0, 5), e0 = sched.heure_fin.substring(0, 5);
        return sessions.some(s => String(s.matiere_id) === String(sched.matiere_id) && s.date === todayStr && s.heure_debut.substring(0, 5) === s0 && s.heure_fin.substring(0, 5) === e0);
    };

    const totalHours = roundHours(sessions.filter(s => s.statut === 'APPROUVE' && isWithinCurrentMonth(s.date)).reduce((a, s) => a + weightedTeachingHours(s), 0));
    const pendingHours = roundHours(sessions.filter(s => s.statut === 'EN_ATTENTE' && isWithinCurrentMonth(s.date)).reduce((a, s) => a + weightedTeachingHours(s), 0));
    const filteredSessions = sessions.filter(s => {
        const n = String(s.matiere?.nom || '').toLowerCase();
        return n.includes(searchTerm.toLowerCase()) && (!filterDate || s.date === filterDate) && (!filterMatiere || String(s.matiere_id) === String(filterMatiere));
    });
    const semestresForYear = Array.isArray(availableSemestresByYear[selectedYear]) ? availableSemestresByYear[selectedYear] : [];

    return (
        <AppLayout
            title="Mon Tableau de Bord"
            navbarContent={availableYears.length > 0 ? (
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Année</span>
                    <div className="relative">
                        <select className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-full text-sm font-extrabold text-slate-700 shadow-sm outline-none cursor-pointer" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><ChevronDown size={14} strokeWidth={3} /></div>
                    </div>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">Semestre</span>
                    <div className="relative">
                        <select className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-full text-sm font-extrabold text-slate-700 shadow-sm outline-none cursor-pointer" value={String(selectedSemestre)} onChange={e => setSelectedSemestre(Number(e.target.value))} disabled={semestresForYear.length === 0}>
                            {semestresForYear.map(sem => <option key={String(sem)} value={String(sem)}>{globalSemesterLabel(selectedYear, Number(sem))}</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><ChevronDown size={14} strokeWidth={3} /></div>
                    </div>
                </div>
            ) : null}
        >
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className={`fixed top-6 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 'bg-red-500/90 border-red-400 text-white'}`}>
                        {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="font-bold text-sm">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirm Modal */}
            <AnimatePresence>
                {showConfirmModal && selectedSchedule && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowConfirmModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-100">
                            <div className="p-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 bg-[#e8f4fb] text-[#0f4c6b] rounded-2xl flex items-center justify-center shrink-0"><Calendar size={28} /></div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Confirmer le pointage</h3>
                                        <p className="text-slate-500 font-medium text-sm">Vérifiez les informations de la séance.</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-6 mb-8 space-y-4 border border-slate-100">
                                    {[
                                        ['Matière', selectedSchedule.matiere?.nom],
                                        ['Niveau', <span key="niv" className="px-3 py-0.5 rounded-lg font-black text-sm bg-slate-100 text-slate-700">{selectedSchedule.matiere?.niveau} {selectedSchedule.matiere?.semestre ? `- ${globalSemesterLabel(selectedSchedule.matiere.niveau, selectedSchedule.matiere.semestre)}` : ''}</span>],
                                        ['Type', <span key="type" className={`px-3 py-0.5 rounded-lg font-black text-sm ${selectedSchedule.type_seance === 'CM' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{selectedSchedule.type_seance}</span>],
                                        ['Horaire', <span key="h" className="flex items-center gap-2"><Clock size={15} className="text-[#0f4c6b]" />{selectedSchedule.heure_debut.substring(0, 5)} — {selectedSchedule.heure_fin.substring(0, 5)}</span>],
                                        ['Salle / Groupe', <span key="s" className="flex items-center gap-2"><MapPin size={15} className="text-[#0f4c6b]" />{selectedSchedule.salle || 'N/A'} · G{selectedSchedule.groupe || 'Tous'}</span>],
                                        ['Date', new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })],
                                    ].map(([label, val]) => (
                                        <div key={label} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                                            <span className="font-black text-slate-400 text-xs uppercase tracking-widest">{label}</span>
                                            <span className="font-bold text-slate-900 text-sm text-right">{val}</span>
                                        </div>
                                    ))}

                                    <div className="py-2 border-t border-slate-100">
                                        <label className="flex flex-col gap-2 cursor-pointer group">
                                            <span className="font-black text-slate-400 text-xs uppercase tracking-widest flex items-center justify-between">
                                                Preuve Physique (Optionnel)
                                                {photoFile && <span className="text-emerald-500 text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md">Fichier sélectionné</span>}
                                            </span>
                                            <div className={`p-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-3 ${photoFile ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white hover:border-[#0f4c6b]/50 text-slate-500 hover:text-[#0f4c6b]'}`}>
                                                <Camera size={20} />
                                                <span className="text-sm font-bold">
                                                    {photoFile ? photoFile.name : "Prendre en photo la feuille d'appel"}
                                                </span>
                                            </div>
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setPhotoFile(e.target.files[0])} />
                                        </label>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95">Annuler</button>
                                    <button onClick={confirmQuickPointage} disabled={loading} className="flex-[2] py-4 bg-[#0f4c6b] text-white font-black rounded-2xl hover:bg-[#1a6b96] shadow-xl shadow-[#0f4c6b]/30 transition-all active:scale-95 disabled:bg-slate-300 flex items-center justify-center gap-2">
                                        {loading ? 'Pointage...' : <><CheckCircle2 size={18} /> Confirmer le pointage</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex flex-col gap-8">

                {/* ── Rangée 1 : 3 petites cartes stats ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: `HEURES ÉQUIV. CM (${getCurrentMonthName()})`, value: `${totalHours} h`, icon: <Clock size={28} />, colors: 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white' },
                        { label: 'Sessions Totales', value: sessions.length, icon: <CheckCircle2 size={28} />, colors: 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' },
                        { label: 'Attente Équiv. CM', value: `${pendingHours} h`, icon: <History size={28} />, colors: 'bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white' },
                    ].map(({ label, value, icon, colors }) => (
                        <motion.div key={label} whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-xl transition-all duration-300">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${colors}`}>{icon}</div>
                            <div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
                                <h3 className="text-2xl font-black text-slate-900">{value}</h3>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── Rangée 2 : Planning à gauche | Tableau à droite ── */}
                <div className="grid grid-cols-1 gap-8 items-start" style={{ gridTemplateColumns: '380px 1fr' }}>

                    {/* Planning du Jour */}
                    <div className="rounded-[2.5rem] bg-[#0f4c6b] shadow-2xl shadow-[#0f4c6b]/25 overflow-hidden sticky top-8">
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white"><Calendar size={22} /></div>
                                <h2 className="text-xl font-black text-white uppercase tracking-wider">Planning du Jour</h2>
                            </div>
                            <div className="space-y-5">
                                {todaySchedules.length === 0 ? (
                                    <div className="py-12 px-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                                        <p className="text-sky-100/60 text-sm font-bold italic">Aucun cours prévu aujourd'hui.</p>
                                    </div>
                                ) : todaySchedules.map(sched => (
                                    <div key={sched.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-white/25 hover:bg-white/10 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${sched.type_seance === 'CM' ? 'bg-indigo-500/25 text-indigo-200' : 'bg-emerald-500/25 text-emerald-200'}`}>{sched.type_seance}</span>
                                                {sched.matiere?.niveau && (
                                                    <span className="px-2 py-1 rounded-lg text-[9px] font-black bg-white/10 text-white/70">
                                                        {sched.matiere.niveau} {sched.matiere.semestre ? `- ${globalSemesterLabel(sched.matiere.niveau, sched.matiere.semestre)}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-sky-100/60 flex items-center gap-1.5"><Clock size={13} />{sched.heure_debut.substring(0, 5)} - {sched.heure_fin.substring(0, 5)}</span>
                                        </div>
                                        <h4 className="text-base font-black text-white mb-2">{sched.matiere?.nom}</h4>
                                        <div className="flex items-center gap-3 mb-5 text-sky-100/40 text-xs font-bold">
                                            <span className="flex items-center gap-1"><MapPin size={11} />{sched.salle || 'N/A'}</span>
                                            <span>·</span>
                                            <span>Groupe {sched.groupe || 'Tous'}</span>
                                        </div>
                                        {isAlreadyPointed(sched) ? (
                                            <div className="w-full py-3.5 bg-white/10 border border-white/15 text-white/35 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                                                <CheckCircle2 size={15} /> Déjà Pointé
                                            </div>
                                        ) : (
                                            <button onClick={() => handleQuickPointage(sched)} className="w-full py-3.5 bg-white text-[#0f4c6b] rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-sky-50 active:scale-95 transition-all flex items-center justify-center gap-2">
                                                <CheckCircle2 size={15} /> Pointer Maintenant
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-8 py-5 bg-black/15 border-t border-white/5">
                            <p className="text-[9px] text-sky-100/30 font-bold uppercase tracking-[0.2em] italic text-center">Le pointage manuel est désactivé · Suivez votre emploi du temps</p>
                        </div>
                    </div>

                    {/* Tableau Historique */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#e8f4fb] text-[#0f4c6b] rounded-xl flex items-center justify-center"><FileText size={20} /></div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Historique des Sessions</h3>
                                    <p className="text-[11px] text-slate-400 font-medium">{filteredSessions.length} séance{filteredSessions.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#0f4c6b]/10 w-44" />
                                </div>
                                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer" />
                                <select value={filterMatiere} onChange={e => setFilterMatiere(e.target.value)}
                                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer">
                                    <option value="">Toutes les matières</option>
                                    {allMatieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5">Date & Horaire</th>
                                        <th className="px-8 py-5">Matière</th>
                                        <th className="px-8 py-5">Durée</th>
                                        <th className="px-8 py-5 text-center">Statut</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredSessions.length === 0 ? (
                                        <tr><td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                <History size={48} /><p className="font-bold text-sm">Aucune session trouvée</p>
                                            </div>
                                        </td></tr>
                                    ) : filteredSessions.map(session => (
                                        <tr key={session.id} className="hover:bg-slate-50/60 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-bold text-slate-900 mb-1">
                                                    {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-black flex items-center gap-1.5">
                                                    <Clock size={11} className="text-[#0f4c6b]/50" />{session.heure_debut?.substring(0, 5)} - {session.heure_fin?.substring(0, 5)}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-bold text-slate-900 mb-1">{session.matiere?.nom || 'Inconnu'}</div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${session.type_seance === 'CM' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{session.type_seance}</span>
                                                    {session.matiere?.niveau && (
                                                        <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-slate-100 text-slate-500">
                                                            {session.matiere.niveau} {session.matiere.semestre ? `- ${globalSemesterLabel(session.matiere.niveau, session.matiere.semestre)}` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 font-black text-slate-700 text-sm">{session.duree} h</td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    {session.statut === 'APPROUVE' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase"><CheckCircle2 size={11} /> Approuvé</span>
                                                    ) : session.statut === 'REJETE' ? (
                                                        <button onClick={() => setSelectedMotif(session.motif_rejet || "Aucun motif spécifié")}>
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 uppercase hover:bg-red-600 hover:text-white transition-all"><AlertCircle size={11} /> Rejeté</span>
                                                        </button>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase"><Clock size={11} /> En attente</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                {session.statut === 'EN_ATTENTE' && (
                                                    <button onClick={() => handleDelete(session.id)} className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><X size={16} /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal motif rejet */}
            <AnimatePresence>
                {selectedMotif && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                            <div className="p-10 text-center">
                                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertCircle size={40} strokeWidth={2.5} /></div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Motif du Rejet</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Raison donnée par l'agent</p>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 text-base font-medium leading-relaxed mb-8 italic">"{selectedMotif}"</div>
                                <button onClick={() => setSelectedMotif(null)} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95">Fermer</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
};

export default TeacherDashboard;
