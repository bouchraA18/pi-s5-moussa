import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { Lock, Mail, ArrowRight, Loader2, CheckCircle2, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { normalizeSchoolEmail, SCHOOL_EMAIL_DOMAIN } from '../utils/email';


const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        let normalizedEmail = '';
        try {
            normalizedEmail = normalizeSchoolEmail(email);
        } catch (err) {
            const data = err?.response?.data;
            const firstValidationError = data?.errors
                ? Object.values(data.errors)[0]?.[0]
                : undefined;
            if (firstValidationError || data?.message) {
                setError(firstValidationError || data.message);
                return;
            }
            setError(err?.message || 'Email invalide.');
            setLoading(false);
            return;
        }

        try {
            const data = await authService.login(normalizedEmail, password);
            const user = data.user;

            if (user.role === 'ADMINISTRATEUR' || user.role === 'AGENT' || user.role === 'AGENT_SCOLARITE') {
                navigate('/agent-dashboard'); // Admin/Agent view
            } else {
                navigate('/teacher-dashboard'); // Teacher view
            }
        } catch (err) {
            if (!String(email || '').includes('@')) {
                setError(`Saisissez l'adresse complète (avec @...) si votre email n'est pas @${SCHOOL_EMAIL_DOMAIN}.`);
            } else {
                setError('Identifiants incorrects. Veuillez réessayer.');
            }
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
                            Gérez vos enseignements <span className="text-primary-300">simplement</span>.
                        </h1>

                        <p className="text-lg text-primary-100 mb-8 leading-relaxed">
                            La plateforme centralisée pour le suivi des heures, la validation des services et la gestion académique.
                        </p>

                        <div className="space-y-4">
                            {[
                                "Suivi en temps réel des vacations",
                                "Validation rapide par l'administration",
                                "Historique complet et transparent"
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

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-lg bg-white p-10 md:p-14 rounded-[2.5rem] shadow-2xl border border-slate-100"
                >
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-slate-200 overflow-hidden">
                            <img
                                src="/supnum-logo.png"
                                alt="SupNum"
                                className="w-14 h-14 object-contain"
                                draggable={false}
                            />
                        </div>
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">ClassTrack</h2>
                        <p className="text-slate-500 mt-3 text-lg font-medium">Accédez à votre espace de gestion</p>
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

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Adresse Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                                    placeholder="prenom.nom@supnum.mr"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-semibold text-slate-700">Mot de passe</label>
                                <Link to="/forgot-password" className="text-xs font-semibold text-primary-600 hover:text-primary-700">Oublié ?</Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-600/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Se connecter <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-400 text-sm">
                            Pas encore de compte ? <Link to="/register" className="text-primary-600 font-semibold hover:underline">S'inscrire</Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
