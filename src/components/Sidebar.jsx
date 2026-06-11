import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, FileText, Package, Search,
    FileArchive, Bell, Users, BarChart3, LogOut, Ship
} from 'lucide-react';

const Sidebar = () => {
    const { user, logoutUser } = useAuth();

    const links = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN','IMPORTATEUR','ADII','OPERATEUR','INSPECTEUR'] },
        { to: '/fiches', label: 'Fiches Suiveuses', icon: FileText, roles: ['ADMIN','IMPORTATEUR','ADII','OPERATEUR'] },
        { to: '/conteneurs', label: 'Conteneurs', icon: Package, roles: ['ADMIN','OPERATEUR','ADII'] },
        { to: '/inspections', label: 'Inspections', icon: Search, roles: ['ADMIN','ADII','INSPECTEUR'] },
        { to: '/documents', label: 'Documents', icon: FileArchive, roles: ['ADMIN','IMPORTATEUR'] },
        { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['ADMIN','IMPORTATEUR','ADII','OPERATEUR','INSPECTEUR'] },
        { to: '/admin/users', label: 'Utilisateurs', icon: Users, roles: ['ADMIN'] },
        { to: '/admin/reports', label: 'Rapports', icon: BarChart3, roles: ['ADMIN'] },
    ];

    const visibleLinks = links.filter(l => l.roles.includes(user?.role));

    const roleColors = {
        ADMIN: 'bg-red-500',
        IMPORTATEUR: 'bg-blue-500',
        ADII: 'bg-green-500',
        OPERATEUR: 'bg-yellow-500',
        INSPECTEUR: 'bg-purple-500',
    };

    return (
        <div className="w-64 bg-gray-900 min-h-screen flex flex-col fixed left-0 top-0 z-10">
            {/* Logo */}
            <div className="p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Ship size={22} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-base">Port Tracking</h2>
                        <p className="text-gray-400 text-xs">Système Portuaire</p>
                    </div>
                </div>
            </div>

            {/* User Info */}
            <div className="px-4 py-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{user?.nom || user?.email}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full text-white ${roleColors[user?.role]}`}>
              {user?.role}
            </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {visibleLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`
                            }
                        >
                            <Icon size={18} />
                            {link.label}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-700">
                <button
                    onClick={logoutUser}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-150"
                >
                    <LogOut size={18} />
                    Déconnexion
                </button>
            </div>
        </div>
    );
};

export default Sidebar;