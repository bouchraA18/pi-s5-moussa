import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { User, Phone, Lock, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState({
        name: '',
        nom: '',
        prenom: '',
        telephone: ''
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await api.get('/user');
            setUser(response.data);
            setProfileData({
                name: response.data.name || '',
                nom: response.data.nom || '',
                prenom: response.data.prenom || '',
                telephone: response.data.telephone || ''
            });
        } catch (err) {
            console.error('Error fetching user data:', err);
        }
    };

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.put('/profile', profileData);
            setSuccess('Profil mis à jour avec succès !');
            setUser(response.data.user);

            // Update localStorage
            const storedUser = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...storedUser, ...response.data.user }));

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.put('/profile/password', passwordData);
            setSuccess('Mot de passe modifié avec succès !');
            setPasswordData({
                current_password: '',
                new_password: '',
                new_password_confirmation: ''
            });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <AppLayout title="Mon Profil">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-black text-slate-900 mb-2">Mon Profil</h1>
                    <p className="text-slate-500 font-medium">Gérez vos informations personnelles et votre sécurité</p>
                </motion.div>

                {/* Success/Error Messages */}
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-3"
                        >
                            <CheckCircle2 size={20} />
                            {success}
                        </motion.div>
                    )}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3"
                        >
                            <AlertCircle size={20} />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Profile Information */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-[2rem] shadow-lg border border-slate-100 p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">
                                <User size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Informations Personnelles</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Profil</p>
                            </div>
                        </div>

                        <form onSubmit={handleProfileSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nom complet</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={profileData.name}
                                        onChange={handleProfileChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-sm"
                                        placeholder="Jean Dupont"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nom</label>
                                    <input
                                        type="text"
                                        name="nom"
                                        value={profileData.nom}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-sm"
                                        placeholder="Dupont"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Prénom</label>
                                    <input
                                        type="text"
                                        name="prenom"
                                        value={profileData.prenom}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-sm"
                                        placeholder="Jean"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Téléphone</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                    <input
                                        type="tel"
                                        name="telephone"
                                        value={profileData.telephone}
                                        onChange={handleProfileChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-sm"
                                        placeholder="+33 6 12 34 56 78"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-primary-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            <Save size={20} /> Enregistrer les modifications
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>

                    {/* Password Change */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-[2rem] shadow-lg border border-slate-100 p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                <Lock size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Sécurité</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mot de passe</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Mot de passe actuel</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        name="current_password"
                                        required
                                        value={passwordData.current_password}
                                        onChange={handlePasswordChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nouveau mot de passe</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        name="new_password"
                                        required
                                        value={passwordData.new_password}
                                        onChange={handlePasswordChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1.5">Minimum 8 caractères</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Confirmer le nouveau mot de passe</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        name="new_password_confirmation"
                                        required
                                        value={passwordData.new_password_confirmation}
                                        onChange={handlePasswordChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {passwordLoading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            <Lock size={20} /> Changer le mot de passe
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>

                {/* Account Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-100"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-700">Email</p>
                            <p className="text-slate-900 font-medium">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">Rôle</p>
                            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold uppercase">
                                {user?.role === 'ENSEIGNANT' ? 'Enseignant' : user?.role}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AppLayout>
    );
};

export default ProfilePage;
