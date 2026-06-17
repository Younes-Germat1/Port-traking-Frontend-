import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getUnreadNotifications } from '../api/notificationAPI';

const Navbar = ({ title }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user?.id) return;
        const fetchUnread = async () => {
            try {
                const data = await getUnreadNotifications(user.id);
                setUnreadCount(Array.isArray(data) ? data.length : 0);
            } catch {}
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [user?.id]);

    const roleColors = {
        ADMIN: 'bg-red-100 text-red-700',
        IMPORTATEUR: 'bg-blue-100 text-blue-700',
        ADII: 'bg-green-100 text-green-700',
        OPERATEUR: 'bg-yellow-100 text-yellow-700',
        INSPECTEUR: 'bg-purple-100 text-purple-700',
    };

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => { navigate('/notifications'); setUnreadCount(0); }}
                    className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">{user?.nom || user?.email}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user?.role]}`}>
                            {user?.role}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;