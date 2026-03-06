import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import {
    Calendar,
    Clock,
    User,
    BookOpen,
    MapPin,
    Plus,
    Edit2,
    Trash2,
    Search,
    Filter,
    Loader2,
    X,
    CheckCircle2,
    Users,
    Upload
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSchedules = () => {
    const [schedules, setSchedules] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [matieres, setMatieres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDay, setFilterDay] = useState('ALL');

    const [formData, setFormData] = useState({
        enseignant_id: '',
        matiere_id: '',
        jour_semaine: 1,
        heure_debut: '08:00',
        heure_fin: '10:00',
        type_seance: 'CM',
        groupe: '',
        salle: '',
        annee_scolaire_id: 1 // TODO: Get dynamically
    });

    const days = [
        { id: 1, label: 'Lundi' },
        { id: 2, label: 'Mardi' },
        { id: 3, label: 'Mercredi' },
        { id: 4, label: 'Jeudi' },
        { id: 5, label: 'Vendredi' },
        { id: 6, label: 'Samedi' },
        { id: 7, label: 'Dimanche' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [schedRes, teacherRes, matiereRes] = await Promise.all([
                api.get('/schedules'),
                api.get('/users?role=ENSEIGNANT'),
                api.get('/matieres')
            ]);
            setSchedules(schedRes.data);
            setTeachers(teacherRes.data.data || teacherRes.data);
            setMatieres(matiereRes.data.data || matiereRes.data);
        } catch (err) {
            console.error("Error fetching schedule data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSchedule) {
                await api.put(`/schedules/${editingSchedule.id}`, formData);
            } else {
                await api.post('/schedules', formData);
            }
            fetchData();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.message || "Erreur lors de l'enregistrement");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Supprimer ce créneau ?")) return;
        try {
            await api.delete(`/schedules/${id}`);
            setSchedules(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            alert("Erreur lors de la suppression");
        }
    };

    const handleImportCSV = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.confirm("Êtes-vous sûr de vouloir importer ce fichier CSV ?")) {
            e.target.value = null;
            return;
        }

        setImporting(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await api.post('/schedules/import', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(res.data.message + (res.data.errors?.length ? '\n\nErreurs:\n' + res.data.errors.join('\n') : ''));
            fetchData();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "Erreur lors de l'importation";
            alert(msg);
        } finally {
            setImporting(false);
            e.target.value = null;
        }
    };

    const openModal = (schedule = null) => {
        if (schedule) {
            setEditingSchedule(schedule);
            setFormData({
                enseignant_id: schedule.enseignant_id,
                matiere_id: schedule.matiere_id,
                jour_semaine: schedule.jour_semaine,
                heure_debut: schedule.heure_debut.substring(0, 5),
                heure_fin: schedule.heure_fin.substring(0, 5),
                type_seance: schedule.type_seance,
                groupe: schedule.groupe || '',
                salle: schedule.salle || '',
                annee_scolaire_id: schedule.annee_scolaire_id
            });
        } else {
            setEditingSchedule(null);
            setFormData({
                enseignant_id: '',
                matiere_id: '',
                jour_semaine: 1,
                heure_debut: '08:00',
                heure_fin: '10:00',
                type_seance: 'CM',
                groupe: '',
                salle: '',
                annee_scolaire_id: 1
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSchedule(null);
    };

    const filteredSchedules = schedules.filter(s => {
        const matchesDay = filterDay === 'ALL' || s.jour_semaine === parseInt(filterDay);
        const matchesSearch = s.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.matiere?.nom.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesDay && matchesSearch;
    });

    return (
        <AppLayout title="Gestion de l'Emploi du Temps">
            <div className="relative min-h-screen pb-20">
                {/* Header & Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm">Séances programmées</p>
                            <h3 className="text-2xl font-bold text-slate-900">{schedules.length}</h3>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-1 gap-4 w-full">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher un prof ou une matière..."
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            value={filterDay}
                            onChange={e => setFilterDay(e.target.value)}
                        >
                            <option value="ALL">Tous les jours</option>
                            {days.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <label className={`cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
                            {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                            {importing ? "Importation..." : "Importer CSV"}
                            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} disabled={importing} />
                        </label>
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                        >
                            <Plus size={18} />
                            Nouveau Créneau
                        </button>
                    </div>
                </div>

                {/* Main Schedule Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Jour / Heure</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Matière</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Enseignant</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Salle / Groupe</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto" />
                                        </td>
                                    </tr>
                                ) : filteredSchedules.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center text-slate-400">
                                            Aucun créneau trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSchedules.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{days.find(d => d.id === s.jour_semaine)?.label}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                    <Clock size={12} />
                                                    {s.heure_debut.substring(0, 5)} - {s.heure_fin.substring(0, 5)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${s.type_seance === 'CM' ? 'bg-blue-100 text-blue-600' :
                                                        s.type_seance === 'TD' ? 'bg-emerald-100 text-emerald-600' :
                                                            'bg-amber-100 text-amber-600'
                                                        }`}>
                                                        {s.type_seance}
                                                    </div>
                                                    <div className="font-medium text-slate-700">{s.matiere?.nom}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                        <User size={14} />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700">{s.teacher?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm flex items-center gap-1 text-slate-600">
                                                        <MapPin size={12} />
                                                        {s.salle || 'N/A'}
                                                    </div>
                                                    <div className="text-xs flex items-center gap-1 text-slate-400">
                                                        <Users size={12} />
                                                        {s.groupe || 'Tous'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openModal(s)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal Form */}
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
                                <form onSubmit={handleSubmit}>
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-slate-900">{editingSchedule ? 'Modifier le créneau' : 'Nouveau créneau'}</h2>
                                        <button type="button" onClick={closeModal} className="p-2 hover:bg-slate-50 rounded-full transition-all"><X size={20} /></button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Enseignant</label>
                                                <select required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" value={formData.enseignant_id} onChange={e => setFormData({ ...formData, enseignant_id: e.target.value })}>
                                                    <option value="">Sélectionner...</option>
                                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Matière</label>
                                                <select required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" value={formData.matiere_id} onChange={e => setFormData({ ...formData, matiere_id: e.target.value })}>
                                                    <option value="">Sélectionner...</option>
                                                    {matieres.map(m => <option key={m.id} value={m.id}>{m.nom} ({m.code})</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Jour</label>
                                                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" value={formData.jour_semaine} onChange={e => setFormData({ ...formData, jour_semaine: e.target.value })}>
                                                    {days.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Début</label>
                                                <input type="time" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" value={formData.heure_debut} onChange={e => setFormData({ ...formData, heure_debut: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Fin</label>
                                                <input type="time" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" value={formData.heure_fin} onChange={e => setFormData({ ...formData, heure_fin: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                                                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" value={formData.type_seance} onChange={e => setFormData({ ...formData, type_seance: e.target.value })}>
                                                    <option value="CM">CM</option>
                                                    <option value="TD">TD</option>
                                                    <option value="TP">TP</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Salle</label>
                                                <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" placeholder="ex: Salle 101" value={formData.salle} onChange={e => setFormData({ ...formData, salle: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Groupe</label>
                                                <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" placeholder="ex: G1" value={formData.groupe} onChange={e => setFormData({ ...formData, groupe: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-50/50 flex gap-4">
                                        <button type="button" onClick={closeModal} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">Annuler</button>
                                        <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 italic flex items-center justify-center gap-2">
                                            <CheckCircle2 size={18} />
                                            Enregistrer le créneau
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AppLayout>
    );
};

export default AdminSchedules;
