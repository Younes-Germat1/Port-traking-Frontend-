import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2, AlertCircle, Check, FileText, Package, CheckCircle, XCircle, Search, Truck } from 'lucide-react';
import { getMyNotifications, markAsRead, markAllAsRead } from '../../api/notificationAPI';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

const getNotifConfig = (message) => {
    if (!message) return { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200', emoji: '🔔' };
    const m = message.toLowerCase();
    if (m.includes('rejet'))    return { icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-100',     border: 'border-red-200',     emoji: '❌' };
    if (m.includes('liber'))    return { icon: CheckCircle,  color: 'text-emerald-500', bg: 'bg-emerald-100', border: 'border-emerald-200', emoji: '🎉' };
    if (m.includes('approuv'))  return { icon: CheckCircle,  color: 'text-green-500',   bg: 'bg-green-100',   border: 'border-green-200',   emoji: '✅' };
    if (m.includes('inspect'))  return { icon: Search,       color: 'text-purple-500',  bg: 'bg-purple-100',  border: 'border-purple-200',  emoji: '🔍' };
    if (m.includes('emplace') || m.includes('plac')) return { icon: Package, color: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-200', emoji: '📦' };
    if (m.includes('dédouan')) return { icon: Truck,        color: 'text-indigo-500',  bg: 'bg-indigo-100',  border: 'border-indigo-200',  emoji: '🚢' };
    return { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200', emoji: '🔔' };
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now  = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60)   return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function NotificationList() {
    const { user }   = useAuth();
    const navigate   = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);
    const [markingId, setMarkingId]         = useState(null);
    const [markingAll, setMarkingAll]       = useState(false);
    const [filter, setFilter]               = useState('all'); // all | unread | read

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
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
        } catch {
            alert('Erreur lors de la mise à jour.');
        } finally {
            setMarkingId(null);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            setMarkingAll(true);
            await markAllAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
        } catch { /* silent */ }
        finally { setMarkingAll(false); }
    };

    const handleClick = async (notif) => {
        if (!notif.lu) await handleMarkAsRead(notif.id);
        if (notif.ficheId) navigate(`/fiches/${notif.ficheId}`);
    };

    const unreadCount = notifications.filter(n => !n.lu).length;
    const filtered    = notifications.filter(n => {
        if (filter === 'unread') return !n.lu;
        if (filter === 'read')   return n.lu;
        return true;
    });

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Notifications" />
                <div className="p-6 max-w-4xl mx-auto">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                            <p className="text-sm text-gray-400 mt-1">
                                {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est lu'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllAsRead} disabled={markingAll}
                                    className="flex items-center gap-2 text-blue-600 border border-blue-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-50 disabled:opacity-50 transition">
                                <CheckCheck size={16} />
                                {markingAll ? 'En cours...' : 'Tout marquer comme lu'}
                            </button>
                        )}
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-2 mb-6">
                        {[
                            { key: 'all',    label: `Toutes (${notifications.length})` },
                            { key: 'unread', label: `Non lues (${unreadCount})` },
                            { key: 'read',   label: `Lues (${notifications.length - unreadCount})` },
                        ].map(({ key, label }) => (
                            <button key={key} onClick={() => setFilter(key)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                                        filter === key
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                                    }`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 size={32} className="animate-spin text-blue-500" />
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-3 rounded-xl">
                            <AlertCircle size={18} /> {error}
                            <button onClick={fetchNotifications} className="ml-auto text-blue-600 text-xs underline">Réessayer</button>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell size={28} className="text-gray-300" />
                            </div>
                            <p className="text-gray-400 font-medium">Aucune notification.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((notif) => {
                                const cfg = getNotifConfig(notif.message);
                                const Icon = cfg.icon;
                                return (
                                    <div key={notif.id}
                                         onClick={() => handleClick(notif)}
                                         className={`group flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                                             notif.lu
                                                 ? 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                                                 : `bg-gradient-to-r from-blue-50 to-white border-blue-100 hover:border-blue-300 shadow-sm`
                                         }`}>

                                        {/* Icon */}
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                            <Icon size={22} className={cfg.color} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-relaxed ${notif.lu ? 'text-gray-500' : 'text-gray-800 font-semibold'}`}>
                                                {notif.message || '🔔 Notification'}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-xs text-gray-400">{formatDate(notif.createdAt)}</span>
                                                {notif.ficheId && (
                                                    <span className="text-xs text-blue-500 font-medium flex items-center gap-1">
                                                        <FileText size={11} /> Fiche #{notif.ficheId}
                                                    </span>
                                                )}
                                                {!notif.lu && (
                                                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                                                        Nouveau
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {!notif.lu && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                                                    disabled={markingId === notif.id}
                                                    className="flex items-center gap-1.5 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 disabled:opacity-50 transition opacity-0 group-hover:opacity-100"
                                                >
                                                    {markingId === notif.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                    Lu
                                                </button>
                                            )}
                                            {/* Unread dot */}
                                            {!notif.lu && (
                                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Summary footer */}
                    {filtered.length > 0 && (
                        <div className="mt-6 text-center text-xs text-gray-400">
                            {filtered.length} notification(s) affichée(s)
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}