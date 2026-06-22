import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getConteneursByFiche, createConteneur, getAllConteneurs } from '../../api/conteneurAPI';
import { getAllFiches } from '../../api/ficheAPI';
import { useAuth } from '../../context/AuthContext';
import { Package, Plus, MapPin, Clock, List, Map as MapIcon, ShieldAlert, Snowflake, AlertTriangle, Box, X, Search, Loader2 } from 'lucide-react';

const statutConfig = {
    ARRIVE:        { color: 'bg-blue-100 text-blue-700',     label: 'Arrivé' },
    STOCKE:        { color: 'bg-green-100 text-green-700',   label: 'Stocké' },
    EN_INSPECTION: { color: 'bg-yellow-100 text-yellow-700', label: 'En Inspection' },
    CHARGEMENT:    { color: 'bg-purple-100 text-purple-700', label: 'Chargement' },
    PARTI:         { color: 'bg-gray-100 text-gray-700',     label: 'Parti' },
};
const STATUT_FILTERS = ['TOUS', 'ARRIVE', 'STOCKE', 'EN_INSPECTION', 'CHARGEMENT', 'PARTI'];

const SECTION_CONFIG = {
    DANGEREUSE: { label: 'Dangereuse — Zone D', sub: 'Sécurisée', icon: ShieldAlert, iconColor: 'text-red-500' },
    PERISSABLE: { label: 'Périssable — Zone P', sub: 'Réfrigérée', icon: Snowflake, iconColor: 'text-orange-500' },
    FRAGILE:    { label: 'Fragile — Zone F',    sub: 'Manutention soignée', icon: AlertTriangle, iconColor: 'text-yellow-500' },
    STANDARD:   { label: 'Standard — Zone S',   sub: 'Stockage général', icon: Box, iconColor: 'text-gray-500' },
};
const SECTION_ORDER = ['DANGEREUSE', 'PERISSABLE', 'FRAGILE', 'STANDARD'];

const getSlotStatus = (c) => {
    const hours = c.dwellTimeHours;
    const warn = c.warningThreshold || 72;
    const crit = c.critiqueThreshold || 120;
    if (hours == null) return 'normal';
    if (hours >= crit) return 'critique';
    if (hours >= warn) return 'attention';
    return 'normal';
};

const ConteneurList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [view, setView] = useState('list');

    const [allConteneurs, setAllConteneurs] = useState([]);
    const [loadingConteneurs, setLoadingConteneurs] = useState(true);

    const [fiches, setFiches] = useState([]);
    const [placingId, setPlacingId] = useState(null);

    const [search, setSearch] = useState('');
    const [statutFilter, setStatutFilter] = useState('TOUS');
    const [expandedSection, setExpandedSection] = useState(null);

    useEffect(() => {
        fetchConteneurs();
        getAllFiches().then(data => {
            let filtered = Array.isArray(data) ? data : [];
            if (user?.role === 'OPERATEUR') {
                filtered = filtered.filter(f => f.statut === 'APPROUVEE' || f.statut === 'PLACEE');
            }
            setFiches(filtered);
        }).catch(() => setFiches([]));
    }, [user]);

    const fetchConteneurs = async () => {
        setLoadingConteneurs(true);
        try {
            const data = await getAllConteneurs();
            setAllConteneurs(Array.isArray(data) ? data : []);
        } catch {
            setAllConteneurs([]);
        } finally {
            setLoadingConteneurs(false);
        }
    };

    const ficheNomById = useMemo(() => {
        const map = {};
        fiches.forEach(f => { map[f.id] = f.importateurNom; });
        return map;
    }, [fiches]);

    const filteredConteneurs = allConteneurs
        .filter(c => {
            const matchStatut = statutFilter === 'TOUS' || c.statut === statutFilter;
            const term = search.trim().toLowerCase();
            const matchSearch = term === '' ||
                c.id.toString().includes(term) ||
                c.ficheId?.toString().includes(term) ||
                (ficheNomById[c.ficheId] || '').toLowerCase().includes(term);
            return matchStatut && matchSearch;
        })
        .sort((a, b) => a.id - b.id);

    // ── Fiches approuvées qui n'ont pas encore de conteneur ──
    const fichesAPlacer = useMemo(() => {
        if (user?.role !== 'OPERATEUR') return [];
        const ficheIdsAvecConteneur = new Set(allConteneurs.map(c => c.ficheId));
        return fiches.filter(f => f.statut === 'APPROUVEE' && !ficheIdsAvecConteneur.has(f.id));
    }, [fiches, allConteneurs, user]);

    const handlePlacerFiche = async (ficheId) => {
        setPlacingId(ficheId);
        try {
            const newConteneur = await createConteneur(ficheId);
            navigate(`/conteneurs/${newConteneur.id}`);
        } catch {
            alert('Erreur lors de la création du conteneur.');
        } finally {
            setPlacingId(null);
        }
    };

    const mapConteneurs = allConteneurs.filter(c => c.zone);
    const sectionGroups = SECTION_ORDER.reduce((acc, section) => {
        acc[section] = mapConteneurs.filter(c => (c.section || 'STANDARD') === section);
        return acc;
    }, {});

    const totalPlaced = mapConteneurs.length;
    const totalCritique = mapConteneurs.filter(c => getSlotStatus(c) === 'critique').length;
    const totalZones = new Set(mapConteneurs.map(c => c.zone)).size;

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Conteneurs" />
                <div className="p-6">

                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => setView('list')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                                view === 'list' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                            }`}
                        >
                            <List size={16} /> Liste des conteneurs
                        </button>
                        <button
                            onClick={() => setView('map')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                                view === 'map' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                            }`}
                        >
                            <MapIcon size={16} /> Carte du port
                        </button>
                    </div>

                    {view === 'list' && (
                        <>
                            {user?.role === 'OPERATEUR' && fichesAPlacer.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 mb-5">
                                    <h3 className="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
                                        <Plus size={16} className="text-orange-500" />
                                        Fiches approuvées à placer ({fichesAPlacer.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {fichesAPlacer.map(f => {
                                            const isPlacing = placingId === f.id;
                                            return (
                                                <div key={f.id} onClick={() => !isPlacing && handlePlacerFiche(f.id)}
                                                     className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 cursor-pointer transition">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700">Fiche #{f.id}</p>
                                                        <p className="text-xs text-gray-400">{f.importateurNom}</p>
                                                    </div>
                                                    {isPlacing ? (
                                                        <Loader2 size={16} className="animate-spin text-orange-500" />
                                                    ) : (
                                                        <span className="text-xs bg-orange-600 text-white px-2.5 py-1 rounded-full font-semibold">Assigner une place →</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mb-4">
                                <div className="flex-1 relative">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher par ID conteneur, fiche ou importateur..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    />
                                </div>
                                <select
                                    value={statutFilter}
                                    onChange={(e) => setStatutFilter(e.target.value)}
                                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {STATUT_FILTERS.map(s => (
                                        <option key={s} value={s}>{s === 'TOUS' ? 'Tous les statuts' : statutConfig[s]?.label}</option>
                                    ))}
                                </select>
                            </div>

                            {user?.role === 'ADMIN' && (
                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 text-sm px-4 py-3 rounded-xl mb-6">
                                    <Package size={16} />
                                    Vue administrateur — consultation uniquement, la gestion des conteneurs est réservée à l'opérateur.
                                </div>
                            )}

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Fiche</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Zone</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Rangée</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Position</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Quai</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Dwell Time</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                    {loadingConteneurs ? (
                                        <tr>
                                            <td colSpan="9" className="text-center py-12">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                            </td>
                                        </tr>
                                    ) : filteredConteneurs.map(c => (
                                        <tr key={c.id} onClick={() => navigate(`/conteneurs/${c.id}`)}
                                            className="hover:bg-gray-50 cursor-pointer transition">
                                            <td className="px-6 py-4 font-semibold text-gray-700">#{c.id}</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                Fiche #{c.ficheId}{ficheNomById[c.ficheId] ? ` — ${ficheNomById[c.ficheId]}` : ''}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statutConfig[c.statut]?.color}`}>
                                                    {statutConfig[c.statut]?.label || c.statut}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{c.zone || '-'}</td>
                                            <td className="px-6 py-4 text-gray-600">{c.rangee || '-'}</td>
                                            <td className="px-6 py-4 text-gray-600">{c.position || '-'}</td>
                                            <td className="px-6 py-4 text-gray-600">{c.quai || '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <Clock size={14} className="text-gray-400" />
                                                    {c.dwellTimeHours != null ? `${c.dwellTimeHours}h` : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => navigate(`/conteneurs/${c.id}`)}
                                                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm"
                                                >
                                                    <MapPin size={14} />
                                                    Détails
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                {!loadingConteneurs && filteredConteneurs.length === 0 && (
                                    <div className="text-center py-16">
                                        <Package size={48} className="text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-400 font-medium">
                                            {allConteneurs.length === 0 ? 'Aucun conteneur pour le moment' : 'Aucun résultat pour ce filtre'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {view === 'map' && (
                        <>
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                                    <p className="text-xs text-gray-400">Conteneurs placés</p>
                                    <p className="text-2xl font-bold text-gray-800 mt-0.5">{totalPlaced}</p>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                                    <p className="text-xs text-gray-400">Zones actives</p>
                                    <p className="text-2xl font-bold text-gray-800 mt-0.5">{totalZones}</p>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                                    <p className="text-xs text-gray-400">Alertes critiques</p>
                                    <p className="text-2xl font-bold text-red-600 mt-0.5">{totalCritique}</p>
                                </div>
                            </div>

                            {loadingConteneurs ? (
                                <div className="flex justify-center py-16">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : totalPlaced === 0 ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16">
                                    <MapIcon size={48} className="text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 font-medium">Aucun conteneur placé pour le moment</p>
                                </div>
                            ) : (
                                <>
                                    {/* Category breakdown — share of total placed, click to drill in */}
                                    <div className="grid grid-cols-2 gap-4 mb-5">
                                        {SECTION_ORDER.map(sectionKey => {
                                            const cfg = SECTION_CONFIG[sectionKey];
                                            const items = sectionGroups[sectionKey] || [];
                                            const Icon = cfg.icon;
                                            const isExpanded = expandedSection === sectionKey;
                                            const pct = totalPlaced > 0 ? Math.round((items.length / totalPlaced) * 100) : 0;
                                            const critiqueInSection = items.filter(c => getSlotStatus(c) === 'critique').length;

                                            return (
                                                <div
                                                    key={sectionKey}
                                                    onClick={() => setExpandedSection(isExpanded ? null : sectionKey)}
                                                    className={`bg-white rounded-2xl border p-4 cursor-pointer transition ${
                                                        isExpanded ? 'border-blue-300 shadow-md' : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Icon size={18} className={cfg.iconColor} />
                                                            <span className="text-sm font-semibold text-gray-700">{cfg.label}</span>
                                                        </div>
                                                        <span className="text-xs text-gray-400">{items.length} conteneur{items.length !== 1 ? 's' : ''}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-3 mb-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-3 rounded-full transition-all ${critiqueInSection > 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                                        <span>{pct}% du total placé</span>
                                                        {critiqueInSection > 0 && (
                                                            <span className="text-red-500 font-medium">{critiqueInSection} critique{critiqueInSection > 1 ? 's' : ''}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="bg-white rounded-xl border border-gray-100 p-3 mb-5 flex items-center gap-5 flex-wrap text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500"></span>Critique</span>
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-400"></span>Attention</span>
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500"></span>Normal</span>
                                    </div>

                                    {expandedSection && (
                                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="flex items-center gap-2">
                                                    {(() => {
                                                        const Icon = SECTION_CONFIG[expandedSection].icon;
                                                        return <Icon size={20} className={SECTION_CONFIG[expandedSection].iconColor} />;
                                                    })()}
                                                    <h3 className="font-bold text-gray-800">{SECTION_CONFIG[expandedSection].label}</h3>
                                                </div>
                                                <button onClick={() => setExpandedSection(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                                                    <X size={18} className="text-gray-400" />
                                                </button>
                                            </div>

                                            {(() => {
                                                const items = sectionGroups[expandedSection] || [];
                                                const zonesInSection = items.reduce((acc, c) => {
                                                    const z = c.zone || 'Zone inconnue';
                                                    if (!acc[z]) acc[z] = [];
                                                    acc[z].push(c);
                                                    return acc;
                                                }, {});
                                                return (
                                                    <div className="space-y-5">
                                                        {Object.entries(zonesInSection).map(([zone, zoneItems]) => (
                                                            <div key={zone}>
                                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{zone}</p>
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                                    {zoneItems.map(c => {
                                                                        const status = getSlotStatus(c);
                                                                        return (
                                                                            <div
                                                                                key={c.id}
                                                                                onClick={() => navigate(`/conteneurs/${c.id}`)}
                                                                                className={`rounded-xl border px-3 py-2.5 cursor-pointer hover:shadow-md transition ${
                                                                                    status === 'critique'  ? 'bg-red-50 border-red-200' :
                                                                                        status === 'attention' ? 'bg-yellow-50 border-yellow-200' :
                                                                                            'bg-green-50 border-green-200'
                                                                                }`}
                                                                            >
                                                                                <p className="text-sm font-bold text-gray-800">#{c.id}</p>
                                                                                <p className="text-xs text-gray-500 mt-0.5">Quai {c.quai || '-'} · {c.rangee || '-'} / {c.position || '-'}</p>
                                                                                <p className={`text-xs font-medium mt-1 ${
                                                                                    status === 'critique'  ? 'text-red-600' :
                                                                                        status === 'attention' ? 'text-yellow-600' : 'text-green-600'
                                                                                }`}>
                                                                                    {c.dwellTimeHours != null ? `${c.dwellTimeHours}h` : '-'}
                                                                                </p>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConteneurList;