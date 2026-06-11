import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getMyNotifications, markAsRead } from '../../api/notificationAPI';
import { useAuth } from '../../context/AuthContext';
import { Bell, CheckCheck } from 'lucide-react';

const NotificationList = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMyNotifications(user.id)
            .then(res => setNotifications(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleRead = async (id) => {
        await markAsRead(id);
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, lu: true } : n)
        );
    };

    const unreadCount = notifications.filter(n => !n.lu).length;

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Notifications" />
                <div className="p-6">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Mes Notifications</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est lu'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => notifications.filter(n => !n.lu).forEach(n => handleRead(n.id))}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                                <CheckCheck size={16} />
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`bg-white rounded-2xl shadow-sm border p-4 flex justify-between items-start transition ${
                                        !n.lu ? 'border-blue-200 border-l-4 border-l-blue-500' : 'border-gray-100'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-xl mt-0.5 ${!n.lu ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                            <Bell size={16} className={!n.lu ? 'text-blue-600' : 'text-gray-400'} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${!n.lu ? 'text-gray-800' : 'text-gray-500'}`}>
                                                {n.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {n.createdAt ? new Date(n.createdAt).toLocaleString('fr-FR') : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    {!n.lu && (
                                        <button
                                            onClick={() => handleRead(n.id)}
                                            className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium flex items-center gap-1 ml-4 flex-shrink-0"
                                        >
                                            <CheckCheck size={12} />
                                            Lu
                                        </button>
                                    )}
                                </div>
                            ))}
                            {notifications.length === 0 && (
                                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                                    <Bell size={48} className="text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 font-medium">Aucune notification</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationList;