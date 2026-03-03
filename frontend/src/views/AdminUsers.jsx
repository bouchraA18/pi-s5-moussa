import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import {
    Users,
    Search,
    Plus,
    Edit2,
    Trash2,
    Check,
    X,
    MoreHorizontal,
    Shield,
    Mail,
    Phone,
    Loader2,
    BookOpen,
    Filter,
    ChevronDown,
    ArrowUpRight
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeSchoolEmail } from '../utils/email';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('ALL');

    const [formData, setFormData] = useState({
        name: '',
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        role: 'ENSEIGNANT',
        password: '',
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            if (Array.isArray(res.data)) {
                setUsers(res.data);
            } else if (res.data && Array.isArray(res.data.data)) {
                setUsers(res.data.data);
            } else {
                setUsers([]);
                console.error("Structure de réponse inattendue:", res.data);
            }
        } catch (err) {
            console.error("Error fetching users:", err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let normalizedEmail = '';
        try {
            normalizedEmail = normalizeSchoolEmail(formData.email);
        } catch (err) {
            alert(err?.message || 'Email invalide.');
            return;
        }

        const payload = { ...formData, email: normalizedEmail };
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, payload);
            } else {
                await api.post('/users', payload);
            }
            fetchUsers();
            closeModal();
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'enregistrement");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
        try {
            await api.delete(`/users/${id}`);
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la suppression");
        }
    };

    const openModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                nom: user.nom || '',
                prenom: user.prenom || '',
                email: user.email,
                telephone: user.telephone || '',
                role: user.role,
                password: '',
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                nom: '',
                prenom: '',
                email: '',
                telephone: '',
                role: 'ENSEIGNANT',
                password: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    // Safe Data Handling
    const safeUsers = Array.isArray(users) ? users : [];

    // Filtering Logic
    const filteredUsers = safeUsers.filter(user => {
        const matchesSearch =
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    // Stats calculation
    const totalUsers = safeUsers.length;
    const teachersCount = safeUsers.filter(u => u.role === 'ENSEIGNANT').length;
    const agentCount = safeUsers.filter(u => u.role === 'AGENT_SCOLARITE').length;
    const adminCount = safeUsers.filter(u => u.role === 'ADMINISTRATEUR').length;

    const stats = [
        {
            label: 'Total Utilisateurs',
            value: totalUsers,
            icon: Users,
            gradient: 'from-blue-500 to-indigo-600',
            bg: 'bg-blue-50',
            text: 'text-blue-600'
        },
        {
            label: 'Enseignants',
            value: teachersCount,
            icon: BookOpen,
            gradient: 'from-emerald-400 to-teal-500',
            bg: 'bg-emerald-50',
            text: 'text-emerald-600'
        },
        {
            label: 'Agents Scolarité',
            value: agentCount,
            icon: Shield,
            gradient: 'from-amber-400 to-orange-500',
            bg: 'bg-amber-50',
            text: 'text-amber-600'
        },
        {
            label: 'Administrateurs',
            value: adminCount,
            icon: Shield,
            gradient: 'from-purple-500 to-pink-600',
            bg: 'bg-purple-50',
            text: 'text-purple-600'
        },
    ];

    return (
        <AppLayout title="Gestion des Utilisateurs">
            <div className="relative min-h-screen bg-slate-50/50 pb-20 overflow-hidden">
                {/* Decoration Background Elements */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/80 to-transparent -z-10" />
                <div className="absolute top-20 right-20 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
                <div className="absolute top-20 left-20 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />

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
                                className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-white/50"
                            >
                                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50/50 to-white">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                            {editingUser ? 'Modifier le profil' : 'Nouvel Utilisateur'}
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">Remplissez les informations ci-dessous</p>
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
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Identité</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-gray-800 placeholder-gray-400"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="ex: Jean Dupont"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-gray-800 placeholder-gray-400"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="jean@example.com"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nom</label>
                                            <input
                                                type="text"
                                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                                value={formData.nom}
                                                onChange={e => setFormData({ ...formData, nom: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Prénom</label>
                                            <input
                                                type="text"
                                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                                value={formData.prenom}
                                                onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Rôle</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none"
                                                    value={formData.role}
                                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                >
                                                    <option value="ENSEIGNANT">Enseignant</option>
                                                    <option value="AGENT_SCOLARITE">Agent Scolarité</option>
                                                    <option value="ADMINISTRATEUR">Administrateur</option>
                                                </select>
                                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Téléphone</label>
                                            <input
                                                type="text"
                                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                                value={formData.telephone}
                                                onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                                                placeholder="+33 6 ..."
                                            />
                                        </div>

                                        <div className="col-span-2 space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                Sécurité <span className="text-gray-400 font-normal ml-1 normal-case">{editingUser ? '(Laisser vide pour ne pas changer)' : '(Mot de passe requis)'}</span>
                                            </label>
                                            <input
                                                type="password"
                                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                placeholder={editingUser ? "••••••••" : "Créer un mot de passe"}
                                                required={!editingUser}
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
                                            className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 focus:ring-4 focus:ring-blue-500/30"
                                        >
                                            {editingUser ? 'Sauvegarder les modifications' : 'Créer le compte'}
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
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Utilisateurs</h1>
                            <p className="text-slate-500 mt-2 text-lg font-medium">Gérez votre équipe et les accès à la plateforme.</p>
                        </motion.div>

                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => openModal()}
                            className="group relative px-6 py-3.5 bg-blue-900 text-white font-bold rounded-2xl hover:bg-blue-800 shadow-xl shadow-blue-200 transition-all flex items-center gap-3 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative flex items-center gap-2">
                                <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                                    <Plus size={18} strokeWidth={3} />
                                </div>
                                <span>Nouvel Utilisateur</span>
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
                                className="relative bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon size={22} strokeWidth={2.5} />
                                    </div>
                                    <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${stat.bg} ${stat.text}`}>
                                        <ArrowUpRight size={12} />
                                        <span>Actif</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{stat.value}</span>
                                    <h3 className="text-slate-500 font-medium text-sm">{stat.label}</h3>
                                </div>
                                {/* Decorative gradient blur */}
                                <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl rounded-full group-hover:opacity-20 transition-opacity`} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Main Content Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-slate-200/40 overflow-hidden"
                    >
                        {/* Toolbar */}
                        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/50">
                            <div className="relative w-full sm:w-96 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Rechercher un utilisateur..."
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-none rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-gray-700 placeholder-gray-400 font-medium"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex bg-gray-100/80 p-1.5 rounded-xl">
                                    {['ALL', 'ENSEIGNANT', 'AGENT_SCOLARITE', 'ADMINISTRATEUR'].map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => setSelectedRole(role)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedRole === role
                                                ? 'bg-white text-slate-800 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            {role === 'ALL' ? 'TOUS' : role.charAt(0) + role.slice(1).toLowerCase().replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                                    <p className="text-slate-400 font-medium animate-pulse">Chargement des données...</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Identité</th>
                                            <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Rôle & Statut</th>
                                            <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Coordonnées</th>
                                            <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map((user, index) => (
                                                <motion.tr
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    key={user.id}
                                                    className="group hover:bg-blue-50/30 transition-colors duration-200"
                                                >
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-5">
                                                            <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform group-hover:scale-105 ${user.role === 'ADMINISTRATEUR' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                                                                user.role === 'AGENT_SCOLARITE' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' :
                                                                    'bg-gradient-to-br from-blue-400 to-blue-600'
                                                                }`}>
                                                                {user.name.substring(0, 2).toUpperCase()}
                                                                <div className="absolute inset-0 rounded-2xl border border-white/20" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 text-base">{user.name}</div>
                                                                <div className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${user.role === 'ADMINISTRATEUR' ? 'bg-purple-500' :
                                                                        user.role === 'AGENT_SCOLARITE' ? 'bg-emerald-500' :
                                                                            'bg-blue-500'
                                                                        }`} />
                                                                    Inscrit le {new Date(user.created_at).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide border shadow-sm ${user.role === 'ADMINISTRATEUR' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                            user.role === 'AGENT_SCOLARITE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                'bg-blue-50 text-blue-700 border-blue-100'
                                                            }`}>
                                                            {user.role === 'ADMINISTRATEUR' && <Shield size={12} />}
                                                            {user.role === 'ENSEIGNANT' && <BookOpen size={12} />}
                                                            {user.role === 'AGENT_SCOLARITE' && <Users size={12} />}
                                                            {user.role.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">
                                                                <div className="p-1 rounded-md bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                                    <Mail size={12} strokeWidth={2.5} />
                                                                </div>
                                                                {user.email}
                                                            </div>
                                                            {user.telephone && (
                                                                <div className="flex items-center gap-2.5 text-xs text-slate-500">
                                                                    <div className="p-1 rounded-md bg-slate-100 text-slate-400">
                                                                        <Phone size={10} strokeWidth={2.5} />
                                                                    </div>
                                                                    {user.telephone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                            <button
                                                                onClick={() => openModal(user)}
                                                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all hover:shadow-sm"
                                                                title="Modifier"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(user.id)}
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
                                                            <Search size={32} className="text-gray-400" />
                                                        </div>
                                                        <p className="font-bold text-xl text-slate-600">Aucun utilisateur trouvé</p>
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

export default AdminUsers;
