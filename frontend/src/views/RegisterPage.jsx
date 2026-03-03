import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Lock, Mail, ArrowRight, Loader2, CheckCircle2, User, Phone, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { normalizeSchoolEmail } from '../utils/email';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        password: '',
        password_confirmation: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        let normalizedEmail = '';
        try {
            normalizedEmail = normalizeSchoolEmail(formData.email);
        } catch (err) {
            const data = err?.response?.data;
            const firstValidationError = data?.errors
                ? Object.values(data.errors)[0]?.[0]
                : undefined;
            if (firstValidationError) {
                setError(firstValidationError);
                return;
            }
            setError(err?.message || 'Email invalide.');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/register', { ...formData, email: normalizedEmail });

            // Store token and user
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Redirect to teacher dashboard
            navigate('/teacher-dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white overflow-hidden">
            {/* Left Side - Visual & Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
                {/* Background Gradients & Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-800 to-slate-900 z-10"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>

                {/* Animated Shapes */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-24 -left-24 w-96 h-96 bg-primary-500 rounded-full blur-3xl opacity-20 z-0"
                ></motion.div>

                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        rotate: [0, -45, 0],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary-600 rounded-full blur-3xl opacity-20 z-0"
                ></motion.div>

                {/* Content */}
                <div className="relative z-20 p-12 text-white max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 overflow-hidden">
                                <img
                                    src="/supnum-logo.png"
                                    alt="SupNum"
                                    className="w-9 h-9 object-contain"
                                    draggable={false}
                                />
                            </div>
                            <span className="text-3xl font-bold tracking-tight">ClassTrack</span>
                        </div>

                        <h1 className="text-5xl font-extrabold leading-tight mb-6">
                            Rejoignez <span className="text-primary-300">ClassTrack</span>
                        </h1>

                        <p className="text-lg text-primary-100 mb-8 leading-relaxed">
                            Créez votre compte enseignant et commencez à gérer vos heures de cours en toute simplicité.
                        </p>

                        <div className="space-y-4">
                            {[
                                "Inscription rapide et sécurisée",
                                "Accès immédiat à votre tableau de bord",
                                "Gestion autonome de votre profil"
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center border border-primary-400/30">
                                        <CheckCircle2 size={14} className="text-primary-300" />
                                    </div>
                                    <span className="text-primary-50">{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-lg bg-white p-10 md:p-14 rounded-[2.5rem] shadow-2xl border border-slate-100 my-8"
                >
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-slate-200 overflow-hidden">
                            <img
                                src="/supnum-logo.png"
                                alt="SupNum"
                                className="w-14 h-14 object-contain"
                                draggable={false}
                            />
                        </div>
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Inscription</h2>
                        <p className="text-slate-500 mt-3 text-lg font-medium">Créez votre compte enseignant</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Nom</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        name="nom"
                                        value={formData.nom}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-sm"
                                        placeholder="Dupont"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Prénom</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        name="prenom"
                                        value={formData.prenom}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-sm"
                                        placeholder="Jean"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Nom complet</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                                    placeholder="Jean Dupont"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                                    placeholder="prenom.nom@supnum.mr"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Téléphone (optionnel)</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <input
                                    type="tel"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                                    placeholder="+33 6 12 34 56 78"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Mot de passe</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">Minimum 8 caractères</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmer le mot de passe</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <input
                                    type="password"
                                    name="password_confirmation"
                                    required
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-600/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    S'inscrire <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-400 text-sm">
                            Vous avez déjà un compte ? <Link to="/" className="text-primary-600 font-semibold hover:underline">Se connecter</Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default RegisterPage;
