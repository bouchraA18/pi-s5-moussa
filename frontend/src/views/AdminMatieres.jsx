import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import {
    BookOpen,
    Search,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    GraduationCap,
    Clock,
    X,
    Filter,
    ArrowUpRight,
    Layers
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const AdminMatieres = () => {
    const [matieres, setMatieres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMatiere, setEditingMatiere] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState('ALL');

    const [formData, setFormData] = useState({
        code: '',
        nom: '',
        description: '',
        niveau: 'L1',
        semestre: 1,
        filiale: 'Informatique',
        credit: 2,
        nombre_heures_prevu: 20
    });

    useEffect(() => {
        fetchMatieres();
    }, []);

    const fetchMatieres = async () => {
        setLoading(true);
        try {
            const res = await api.get('/matieres');
            if (Array.isArray(res.data)) {
                setMatieres(res.data);
            } else if (res.data && Array.isArray(res.data.data)) {
                setMatieres(res.data.data);
            } else {
                setMatieres([]);
                console.error("Structure de réponse inattendue:", res.data);
            }
        } catch (err) {
            console.error("Error fetching matieres:", err);
            setMatieres([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMatiere) {
                await api.put(`/matieres/${editingMatiere.id}`, formData);
            } else {
                await api.post('/matieres', formData);
            }
            fetchMatieres();
            closeModal();
            fetchMatieres(); // Double fetch for safety as seen in previous logic
            closeModal();
        } catch (err) {
            console.error("Erreur complète:", err.response?.data);
            const message = err.response?.data?.message || "Erreur lors de l'enregistrement.";
            const errors = err.response?.data?.errors;

            if (errors) {
                const errorDetails = Object.values(errors).flat().join('\n');
                alert(`${message}\n\n${errorDetails}`);
            } else {
                alert(message);
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Êtes-vous sûr ?")) return;
        try {
            await api.delete(`/matieres/${id}`);
            setMatieres(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la suppression");
        }
    };

    const openModal = (matiere = null) => {
        if (matiere) {
            setEditingMatiere(matiere);
            setFormData(matiere);
        } else {
            setEditingMatiere(null);
            setFormData({
                code: '',
                nom: '',
                description: '',
                niveau: 'L1',
                semestre: 1,
                filiale: 'Informatique',
                credit: 2,
                nombre_heures_prevu: 20
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMatiere(null);
    };

    const safeMatieres = Array.isArray(matieres) ? matieres : [];

    const filteredMatieres = safeMatieres.filter(m => {
        const matchesSearch =
            m.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.code?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = selectedLevel === 'ALL' || m.niveau === selectedLevel;
        return matchesSearch && matchesLevel;
    });

    // Stats
    const totalMatieres = safeMatieres.length;
    const creditsTotal = safeMatieres.reduce((acc, m) => acc + (m.credit || 0), 0);
    const hoursTotal = safeMatieres.reduce((acc, m) => acc + (m.nombre_heures_prevu || 0), 0);
    const averageCredits = totalMatieres > 0 ? (creditsTotal / totalMatieres).toFixed(1) : 0;

    const stats = [
        {
            label: 'Matières Totales',
            value: totalMatieres,
            icon: BookOpen,
            gradient: 'from-indigo-500 to-purple-600',
            bg: 'bg-indigo-50',
            text: 'text-indigo-600'
        },
        {
            label: 'Volume Horaire',
            value: `${hoursTotal}h`,
            icon: Clock,
            gradient: 'from-amber-400 to-orange-500',
            bg: 'bg-amber-50',
            text: 'text-amber-600'
        },
        {
            label: 'Crédits Totaux',
            value: creditsTotal,
            icon: GraduationCap,
            gradient: 'from-emerald-400 to-teal-500',
            bg: 'bg-emerald-50',
            text: 'text-emerald-600'
        },
        {
            label: 'Moy. Crédits',
            value: averageCredits,
            icon: Layers,
            gradient: 'from-blue-400 to-cyan-500',
            bg: 'bg-blue-50',
            text: 'text-blue-600'
        },
    ];

    return (
        <AppLayout title="Gestion des Matières">
            <div className="relative min-h-screen bg-slate-50/50 pb-20 overflow-hidden">
                {/* Decoration Background Elements */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />
                <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
                <div className="absolute -top-20 left-40 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />

                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                                onClick={closeModal}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                                transition={{ type: "spring", duration: 0.5 }}
                                className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl shadow-indigo-200/50 overflow-hidden border border-white/50"
                            >
                                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50/50 to-white">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                            {editingMatiere ? 'Modifier le Module' : 'Nouveau Module'}
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">Détails du programme académique</p>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:rotate-90"
                                    >
                                        <X size={20} className="text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Code Matière</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium font-mono text-indigo-700 placeholder-indigo-300"
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                                placeholder="INFO101"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Intitulé</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium text-gray-800"
                                                value={formData.nom}
                                                onChange={e => setFormData({ ...formData, nom: e.target.value })}
                                                placeholder="Algorithmique Avancée"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Niveau d'étude</label>
                                            <select
                                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                                                value={formData.niveau}
                                                onChange={e => setFormData({ ...formData, niveau: e.target.value })}
                                            >
                                                {['L1', 'L2', 'L3', 'M1', 'M2'].map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Semestre</label>
                                            <div className="flex gap-2">
                                                {[1, 2].map(s => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, semestre: s })}
                                                        className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all border ${formData.semestre === s
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/30'
                                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        S{s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Volume Horaire</label>
                                            <div className="relative">
                                                <input
                                                    required
                                                    type="number"
                                                    className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none pl-12"
                                                    value={formData.nombre_heures_prevu}
                                                    onChange={e => setFormData({ ...formData, nombre_heures_prevu: parseFloat(e.target.value) })}
                                                />
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-amber-100 rounded text-amber-600">
                                                    <Clock size={14} strokeWidth={3} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Crédits ECTS</label>
                                            <div className="relative">
                                                <input
                                                    required
                                                    type="number"
                                                    className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none pl-12"
                                                    value={formData.credit}
                                                    onChange={e => setFormData({ ...formData, credit: parseInt(e.target.value) })}
                                                />
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-emerald-100 rounded text-emerald-600">
                                                    <GraduationCap size={14} strokeWidth={3} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Description</label>
                                            <textarea
                                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none h-24 resize-none"
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Description succincte du contenu..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-6 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm focus:ring-2 focus:ring-gray-200"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 focus:ring-4 focus:ring-indigo-500/30"
                                        >
                                            {editingMatiere ? 'Mettre à jour' : 'Ajouter au programme'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Programme</h1>
                            <p className="text-slate-500 mt-2 text-lg font-medium">Gestion des matières, modules et crédits.</p>
                        </motion.div>

                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => openModal()}
                            className="group relative px-6 py-3.5 bg-blue-900 text-white font-bold rounded-2xl hover:bg-blue-800 shadow-xl shadow-blue-200 transition-all flex items-center gap-3 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative flex items-center gap-2">
                                <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                                    <Plus size={18} strokeWidth={3} />
                                </div>
                                <span>Nouvelle Matière</span>
                            </div>
                        </motion.button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {stats.map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="relative bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-300 group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon size={22} strokeWidth={2.5} />
                                    </div>
                                    <div className="bg-white/50 p-1.5 rounded-full backdrop-blur-sm">
                                        <ArrowUpRight size={14} className="text-gray-400" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{stat.value}</span>
                                    <h3 className="text-slate-500 font-medium text-sm">{stat.label}</h3>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Main Content Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/40 overflow-hidden"
                    >
                        {/* Toolbar */}
                        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/50">
                            <div className="relative w-full sm:w-96 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Rechercher un module, un code..."
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-none rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all text-gray-700 placeholder-gray-400 font-medium"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex bg-gray-100/80 p-1.5 rounded-xl">
                                {['ALL', 'L1', 'L2', 'L3', 'M1', 'M2'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setSelectedLevel(level)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedLevel === level
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {level === 'ALL' ? 'TOUS' : level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                                    <p className="text-slate-400 font-medium animate-pulse">Chargement...</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Module</th>
                                            <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Niveau & Semestre</th>
                                            <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Charge & Crédits</th>
                                            <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredMatieres.length > 0 ? (
                                            filteredMatieres.map((matiere, index) => (
                                                <motion.tr
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    key={matiere.id}
                                                    className="group hover:bg-indigo-50/30 transition-colors duration-200"
                                                >
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-slate-600 font-bold shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Code</span>
                                                                <span className="text-sm text-slate-800 font-mono tracking-tight">{matiere.code}</span>
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 text-base">{matiere.nom}</div>
                                                                <div className="text-xs font-medium text-slate-500 mt-1 max-w-xs truncate">{matiere.description || 'Aucune description'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wide border ${matiere.niveau.startsWith('M')
                                                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                                                }`}>
                                                                {matiere.niveau}
                                                            </span>
                                                            <div className="h-4 w-px bg-slate-200" />
                                                            <span className="font-bold text-slate-600 text-sm">
                                                                Semestre {matiere.semestre}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                                                                    <Clock size={14} strokeWidth={2.5} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Heures</span>
                                                                    <span className="text-sm font-bold text-slate-700">{matiere.nombre_heures_prevu}h</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                                                                    <GraduationCap size={14} strokeWidth={2.5} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Crédits</span>
                                                                    <span className="text-sm font-bold text-slate-700">{matiere.credit}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                            <button
                                                                onClick={() => openModal(matiere)}
                                                                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all hover:shadow-sm"
                                                                title="Modifier"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(matiere.id)}
                                                                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all hover:shadow-sm"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="py-20 text-center">
                                                    <div className="flex flex-col items-center justify-center opacity-40">
                                                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                                            <BookOpen size={32} className="text-gray-400" />
                                                        </div>
                                                        <p className="font-bold text-xl text-slate-600">Aucun module trouvé</p>
                                                        <p className="text-slate-400 mt-2">Essayez d'ajuster vos filtres de recherche</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    );
};

export default AdminMatieres;
