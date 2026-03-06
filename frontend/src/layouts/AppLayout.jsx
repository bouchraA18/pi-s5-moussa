import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Bell, Clock, Check, History, MessageSquare, Trash2 } from 'lucide-react';
import api, { authService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const AppLayout = ({ children, title, navbarContent }) => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [notifications, setNotifications] = React.useState([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [showNotifications, setShowNotifications] = React.useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unread_count);
        } catch (err) {
            console.error("Error fetching notifications", err);
        }
    };

    React.useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.post(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/read-all');
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNotification = async (e, id) => {
        e.stopPropagation(); // Prevent marking as read
        try {
            await api.delete(`/notifications/${id}`);
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = async () => {
        await authService.logout();
        navigate('/login');
    };

    const handleHome = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role === 'ENSEIGNANT') {
            navigate('/teacher-dashboard');
            return;
        }
        navigate('/agent-dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <button
                                type="button"
                                onClick={handleHome}
                                className="flex items-center gap-2"
                                title="Accueil"
                            >
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-slate-200 overflow-hidden">
                                    <img
                                        src="/supnum-logo.png"
                                        alt="SupNum"
                                        className="w-8 h-8 object-contain"
                                        draggable={false}
                                    />
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                                    ClassTrack
                                </span>
                            </button>

                            {/* Navigation Links for Admin/Agent */}
                            {user?.role === 'ADMINISTRATEUR' && (
                                <div className="hidden md:flex items-center space-x-1 ml-10">
                                    <button
                                        onClick={() => navigate('/agent-dashboard')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${window.location.pathname === '/agent-dashboard' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                    >
                                        Tableau de Bord
                                    </button>
                                    <button
                                        onClick={() => navigate('/admin/users')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${window.location.pathname === '/admin/users' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                    >
                                        Utilisateurs
                                    </button>
                                    <button
                                        onClick={() => navigate('/admin/matieres')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${window.location.pathname === '/admin/matieres' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                    >
                                        Matières & Modules
                                    </button>
                                    <button
                                        onClick={() => navigate('/admin/schedules')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${window.location.pathname === '/admin/schedules' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                    >
                                        Planning
                                    </button>
                                </div>
                            )}

                            {navbarContent ? (
                                <div className="flex items-center ml-6 min-w-0">
                                    {navbarContent}
                                </div>
                            ) : null}

                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className={`p-2 rounded-full transition-all relative ${showNotifications ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:text-primary-600 hover:bg-primary-50'}`}
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {showNotifications && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 overflow-hidden"
                                            >
                                                <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                                    <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                                                    {unreadCount > 0 && (
                                                        <button
                                                            onClick={markAllAsRead}
                                                            className="text-[10px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider"
                                                        >
                                                            Tout marquer comme lu
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="max-h-[350px] overflow-y-auto">
                                                    {notifications.length === 0 ? (
                                                        <div className="p-8 text-center">
                                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                                                <Bell size={20} />
                                                            </div>
                                                            <p className="text-sm text-slate-500 font-medium">Aucune notification</p>
                                                        </div>
                                                    ) : (
                                                        <div className="divide-y divide-slate-50">
                                                            {notifications.map((notif) => (
                                                                <div
                                                                    key={notif.id}
                                                                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!notif.read_at ? 'bg-primary-50/30' : ''}`}
                                                                    onClick={() => !notif.read_at && markAsRead(notif.id)}
                                                                >
                                                                    <div className="flex gap-3">
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.data?.type === 'new_session' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                                                                            }`}>
                                                                            {notif.data?.type === 'new_session' ? <Clock size={14} /> : <Check size={14} />}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-bold text-slate-900 leading-tight mb-0.5">
                                                                                {notif.data?.message || 'Notification'}
                                                                            </p>
                                                                            <p className="text-[10px] text-slate-500 truncate">
                                                                                {notif.data?.details || 'Voir les détails'}
                                                                            </p>
                                                                            <p className="text-[9px] text-slate-400 mt-1 font-medium italic">
                                                                                {new Date(notif.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-2">
                                                                            {!notif.read_at && (
                                                                                <div className="w-2 h-2 bg-primary-500 rounded-full mt-1"></div>
                                                                            )}
                                                                            <button
                                                                                onClick={(e) => deleteNotification(e, notif.id)}
                                                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                                                title="Supprimer"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-semibold text-slate-900">{user?.name || 'Utilisateur'}</p>
                                    <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
                                </div>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all"
                                    title="Mon Profil"
                                >
                                    <User size={20} />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                    title="Déconnexion"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-screen-2xl mx-auto px-6 sm:px-10 lg:px-16 py-8 animate-in fade-in duration-500">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                </div>
                {children}
            </main>

            {/* Footer */}
            <footer className="py-6 border-t border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
                    © {new Date().getFullYear()} ClassTrack - Système de Suivi d'Enseignements
                </div>
            </footer>
        </div>
    );
};

export default AppLayout;
