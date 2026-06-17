import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Loader2, AlertCircle, Check } from 'lucide-react';
import { getMyNotifications, markAsRead } from '../../api/notificationAPI';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

export default function NotificationList() {
    const { user } = useAuth();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);
    const [markingId, setMarkingId]         = useState(null);

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getMyNotifications(user.id);
            setNotifications(Array.isArray(data) ? data : []);
        } catch {
            setError('Impossible de charger les notifications.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            setMarkingId(id);
            await markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, lu: true } : n)
            );
        } catch {
            alert('Erreur lors de la mise à jour.');
        } finally {
            setMarkingId(null);
        }
    };

    const handleMarkAllAsRead = async () => {
        const unread = notifications.filter(n => !n.lu);
        for (const n of unread) {
            await markAsRead(n.id);
        }
        setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    };

    const unreadCount = notifications.filter(n => !n.lu).length;

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('fr-MA', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const getNotifStyle = (message) => {
        if (message?.includes('rejet') || message?.includes('REJET'))
            return { bg: 'bg-red-50 border-red-100',    dot: 'bg-red-500',     icon: '❌' };
        if (message?.includes('liber') || message?.includes('LIBER'))
            return { bg: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500', icon: '🎉' };
        if (message?.includes('approuv') || message?.includes('APPROUV'))
            return { bg: 'bg-green-50 border-green-100',  dot: 'bg-green-500',   icon: '✅' };
        if (message?.includes('inspect') || message?.includes('INSPECT'))
            return { bg: 'bg-purple-50 border-purple-100', dot: 'bg-purple-500',  icon: '🔍' };
        return { bg: 'bg-blue-50 border-blue-100', dot: 'bg-blue-500', icon: '🔔' };
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Notifications" />
                <div className="p-6 max-w-3xl mx-auto">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                            <p className="text-sm text-gray-400 mt-1">
                                {unreadCount > 0
                                    ? `${unreadCount} non lue(s)`
                                    : 'Tout est lu'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-2 text-blue-600 border border-blue-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-50 transition"
                            >
                                <CheckCheck size={16} />
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    {/* Contenu */}
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 size={32} className="animate-spin text-blue-500" />
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-3 rounded-xl">
                            <AlertCircle size={18} /> {error}
                            <button onClick={fetchNotifications} className="ml-auto text-blue-600 text-xs underline">
                                Réessayer
                            </button>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
                            <Bell size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Aucune notification pour le moment.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map((notif) => {
                                const style = getNotifStyle(notif.message);
                                return (
                                    <div
                                        key={notif.id}
                                        className={`flex items-start gap-4 p-4 rounded-2xl border transition ${
                                            notif.lu
                                                ? 'bg-white border-gray-100'
                                                : `${style.bg} ${style.bg}`
                                        }`}
                                    >
                                        {/* Icône */}
                                        <div className="text-xl shrink-0 mt-0.5">
                                            {style.icon}
                                        </div>

                                        {/* Contenu */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${notif.lu ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatDate(notif.createdAt)}
                                            </p>
                                        </div>

                                        {/* Bouton marquer lu */}
                                        {!notif.lu && (
                                            <button
                                                onClick={() => handleMarkAsRead(notif.id)}
                                                disabled={markingId === notif.id}
                                                className="shrink-0 flex items-center gap-1.5 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 disabled:opacity-50 transition"
                                            >
                                                {markingId === notif.id
                                                    ? <Loader2 size={12} className="animate-spin" />
                                                    : <Check size={12} />
                                                }
                                                Lu
                                            </button>
                                        )}

                                        {/* Dot non lu */}
                                        {!notif.lu && (
                                            <div className={`w-2 h-2 rounded-full ${style.dot} shrink-0 mt-2`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}