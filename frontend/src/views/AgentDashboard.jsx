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
    Filter,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

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

    useEffect(() => {
        fetchPointages();
        fetchStats();
    }, [activeTab]);

    const [rejectionModal, setRejectionModal] = useState({ show: false, sessionId: null, reason: '' });

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
            const endpoint = activeTab === 'pending' ? '/admin/pending' : '/pointages';
            const res = await api.get(endpoint);
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

    // Filtered pointages
    const filteredPointages = pointages.filter(p =>
        p.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.matiere?.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            label: 'Volume Horaire',
            value: `${dashboardStats.total_hours}h`,
            icon: Clock,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            desc: 'Cumul validé',
            trend: 'Stable',
            trendColor: 'text-slate-500'
        },
    ];

    return (
        <AppLayout title="Administration Scolarité">
            <div className="min-h-screen bg-slate-50/50 pb-20">
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
                                        {searchTerm ? "Aucun résultat ne correspond à votre recherche." : "Tout est à jour ! Aucune demande en attente pour le moment."}
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
