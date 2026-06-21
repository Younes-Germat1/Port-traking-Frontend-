import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getAllUsers, createUser, deleteUser } from '../../api/userAPI';
import { Users, Plus, Trash2, UserCheck, Search } from 'lucide-react';

const ORGANISMES = ['ADII', 'ONSSA', 'AMSSNUR', 'LPEE'];

const UserManagement = () => {
    const [users, setUsers]       = useState([]);
    const [loading, setLoading]   = useState(true);
    const [form, setForm]         = useState({ nom: '', email: '', password: '', role: 'ADII', organisme: '' });
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [success, setSuccess]   = useState('');
    const [search, setSearch]     = useState('');
    const [filterRole, setFilterRole] = useState('');

    const fetchUsers = () => {
        setLoading(true);
        getAllUsers()
            .then(data => setUsers(Array.isArray(data) ? data : []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await createUser(form);
            setForm({ nom: '', email: '', password: '', role: 'ADII', organisme: '' });
            setShowForm(false);
            setSuccess('Utilisateur créé avec succès!');
            setTimeout(() => setSuccess(''), 3000);
            fetchUsers();
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Supprimer cet utilisateur?')) return;
        await deleteUser(id);
        fetchUsers();
    };

    const roleConfig = {
        ADMIN:       { color: 'bg-red-100 text-red-700',     label: 'Admin' },
        IMPORTATEUR: { color: 'bg-blue-100 text-blue-700',   label: 'Importateur' },
        ADII:        { color: 'bg-green-100 text-green-700', label: 'ADII' },
        OPERATEUR:   { color: 'bg-yellow-100 text-yellow-700', label: 'Opérateur' },
        INSPECTEUR:  { color: 'bg-purple-100 text-purple-700', label: 'Inspecteur' },
    };

    const filteredUsers = users.filter(u => {
        const matchSearch = search === '' ||
            u.nom?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase());
        const matchRole = filterRole === '' || u.role === filterRole;
        return matchSearch && matchRole;
    });

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Gestion des Utilisateurs" />
                <div className="p-6">

                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Utilisateurs</h2>
                            <p className="text-gray-500 text-sm mt-1">{users.length} utilisateur(s)</p>
                        </div>
                        <button onClick={() => setShowForm(!showForm)}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-medium text-sm">
                            <Plus size={18} /> Nouvel Utilisateur
                        </button>
                    </div>

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">
                            {success}
                        </div>
                    )}

                    {showForm && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                            <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                                <UserCheck size={18} className="text-blue-600" />
                                Créer un Nouvel Utilisateur
                            </h3>
                            <p className="text-xs text-gray-400 mb-4 -mt-2">
                                Les comptes Importateur sont créés via la page d'inscription publique.
                            </p>
                            <form onSubmit={handleCreate}>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase">Nom Complet</label>
                                        <input type="text" placeholder="ex: Ahmed Benali" value={form.nom}
                                               onChange={(e) => setForm({ ...form, nom: e.target.value })}
                                               className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase">Email</label>
                                        <input type="email" placeholder="email@port.ma" value={form.email}
                                               onChange={(e) => setForm({ ...form, email: e.target.value })}
                                               className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase">Mot de Passe</label>
                                        <input type="password" placeholder="••••••••" value={form.password}
                                               onChange={(e) => setForm({ ...form, password: e.target.value })}
                                               className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase">Rôle</label>
                                        <select value={form.role}
                                                onChange={(e) => setForm({ ...form, role: e.target.value, organisme: e.target.value === 'INSPECTEUR' ? form.organisme : '' })}
                                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                            <option value="ADII">ADII</option>
                                            <option value="OPERATEUR">Opérateur</option>
                                            <option value="INSPECTEUR">Inspecteur</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>

                                    {form.role === 'INSPECTEUR' && (
                                        <div className="col-span-2">
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase">
                                                Organisme de contrôle
                                            </label>
                                            <select value={form.organisme}
                                                    onChange={(e) => setForm({ ...form, organisme: e.target.value })}
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                                    required>
                                                <option value="">Sélectionner un organisme...</option>
                                                {ORGANISMES.map(org => (
                                                    <option key={org} value={org}>{org}</option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Cet inspecteur ne verra que les inspections liées à cet organisme.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowForm(false)}
                                            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 font-medium text-sm">
                                        Annuler
                                    </button>
                                    <button type="submit" disabled={creating}
                                            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold text-sm">
                                        {creating ? 'Création...' : 'Créer Utilisateur'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="flex gap-3 mb-4">
                        <div className="flex-1 relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Rechercher par nom ou email..." value={search}
                                   onChange={(e) => setSearch(e.target.value)}
                                   className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                        </div>
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Tous les rôles</option>
                            {Object.entries(roleConfig).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Nom</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Rôle</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Organisme</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-semibold text-gray-700">#{u.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                {u.nom?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-gray-700">{u.nom}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleConfig[u.role]?.color}`}>
                                            {roleConfig[u.role]?.label || u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.role === 'INSPECTEUR' && u.organisme ? (
                                            <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-semibold">
                                                {u.organisme}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleDelete(u.id)}
                                                className="flex items-center gap-1.5 text-red-500 hover:text-red-700 font-medium text-sm">
                                            <Trash2 size={14} /> Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {!loading && filteredUsers.length === 0 && (
                            <div className="text-center py-16">
                                <Users size={48} className="text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">Aucun utilisateur trouvé</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;