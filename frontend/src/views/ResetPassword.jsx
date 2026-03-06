import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { Lock, ArrowRight, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const emailStr = searchParams.get('email');

    const [email, setEmail] = useState(emailStr || '');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== passwordConfirmation) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        if (!token) {
            setError('Jeton de réinitialisation manquant ou invalide.');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const data = await authService.resetPassword({
                email,
                password,
                password_confirmation: passwordConfirmation,
                token
            });
            setMessage(data.message || 'Mot de passe réinitialisé avec succès.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            const data = err?.response?.data;
            const firstValidationError = data?.errors
                ? Object.values(data.errors)[0]?.[0]
                : undefined;
            setError(firstValidationError || data?.message || 'Une erreur est survenue lors de la réinitialisation.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Lien invalide</h2>
                    <p className="text-slate-500 mb-6">Le lien de réinitialisation est incomplet ou invalide.</p>
                    <Link to="/forgot-password" className="text-primary-600 font-semibold hover:underline">
                        Demander un nouveau lien
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-96 bg-primary-600 rounded-b-[4rem] z-0"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-white p-10 md:p-14 rounded-[2.5rem] shadow-2xl border border-slate-100 z-10"
            >
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary-100">
                        <Lock className="w-10 h-10 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Nouveau mot de passe</h2>
                    <p className="text-slate-500 mt-3 font-medium">Créez un nouveau mot de passe sécurisé pour votre compte.</p>
                </div>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-8 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-3"
                    >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                            <span className="font-medium leading-relaxed">{message}</span>
                            <span className="text-emerald-600 mt-1">Redirection en cours...</span>
                        </div>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2 font-medium"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className={`space-y-6 ${message ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input type="hidden" value={email} />

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nouveau mot de passe</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                            <input
                                type="password"
                                required
                                minLength="8"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmez le mot de passe</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                            <input
                                type="password"
                                required
                                minLength="8"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !password || !passwordConfirmation}
                        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-600/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                Sauvegarder <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

            </motion.div>
        </div>
    );
};

export default ResetPassword;
