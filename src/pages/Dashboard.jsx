import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { getAllFiches } from '../api/ficheAPI';
import { getAllUsers } from '../api/userAPI';
import { getMesTaches } from '../api/inspectionAPI';
import { getConteneursByFiche, getDwellTime } from '../api/conteneurAPI';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Package, Users, CheckCircle,
    Clock, XCircle, TrendingUp, ArrowRight,
    Search, Bell, AlertTriangle, MapPin, Truck
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, bg, subtitle, onClick }) => (
    <div onClick={onClick}
         className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition ${onClick ? 'cursor-pointer hover:border-blue-200' : ''}`}>
        <div className={`${bg} p-4 rounded-xl`}><Icon size={24} className={color} /></div>
        <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-3xl font-bold text-gray-800 mt-0.5">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

const formatDwellTime = (hours) => {
    if (hours === null || hours === undefined) return '-';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days} jour(s)`;
};

const getDwellColor = (hours, warning = 72, critique = 120) => {
    if (hours === null || hours === undefined) return 'text-gray-500';
    if (hours < warning)  return 'text-green-600';
    if (hours < critique) return 'text-yellow-600';
    return 'text-red-600';
};

const getDwellLabel = (hours, warning = 72, critique = 120) => {
    if (hours === null || hours === undefined) return '-';
    if (hours < warning)  return '✅ Normal';
    if (hours < critique) return '⚠️ Long';
    return '🔴 Critique';
};

const PRIORITY_BADGE = {
    CRITIQUE: 'bg-red-100 text-red-700',
    HAUTE:    'bg-orange-100 text-orange-700',
    MOYENNE:  'bg-yellow-100 text-yellow-700',
    NORMALE:  'bg-gray-100 text-gray-600',
};

const statutColor = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
    APPROUVEE:  'bg-green-100 text-green-700',
    REJETEE:    'bg-red-100 text-red-700',
    PLACEE:     'bg-blue-100 text-blue-700',
    DEDOUANEE:  'bg-purple-100 text-purple-700',
    LIBEREE:    'bg-emerald-100 text-emerald-700',
};

const TrackingTimeline = ({ statut }) => {
    const steps = [
        { key: 'EN_ATTENTE', label: 'Soumise' },
        { key: 'APPROUVEE',  label: 'Approuvée' },
        { key: 'PLACEE',     label: 'Placée' },
        { key: 'DEDOUANEE',  label: 'Dédouanée' },
        { key: 'LIBEREE',    label: 'Libérée' },
    ];

    const ORDER = { EN_ATTENTE: 0, APPROUVEE: 1, PLACEE: 2, DEDOUANEE: 3, LIBEREE: 4, REJETEE: -1 };
    const currentIndex = ORDER[statut] ?? 0;

    if (statut === 'REJETEE') {
        return (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">✕</div>
                <div>
                    <p className="text-sm font-semibold text-red-700">Fiche rejetée</p>
                    <p className="text-xs text-red-400">Veuillez corriger et re-soumettre</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center">
            {steps.map((step, index) => {
                const isDone    = index < currentIndex;
                const isCurrent = index === currentIndex;
                return (
                    <div key={step.key} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isDone    ? 'bg-green-500 text-white' :
                                    isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                                        'bg-gray-100 text-gray-400'
                            }`}>
                                {isDone ? '✓' : index + 1}
                            </div>
                            <p className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                                isDone    ? 'text-green-600' :
                                    isCurrent ? 'text-blue-600' :
                                        'text-gray-400'
                            }`}>
                                {step.label}
                            </p>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 mb-5 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [fiches, setFiches]           = useState([]);
    const [users, setUsers]             = useState([]);
    const [inspections, setInspections] = useState([]);
    const [conteneurs, setConteneurs]   = useState([]);
    const [dwellTimes, setDwellTimes]   = useState({});
    const [avgDwell, setAvgDwell]       = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading]         = useState(true);
    const [operateurConteneurs, setOperateurConteneurs] = useState([]);
    const [operateurDwellTimes, setOperateurDwellTimes] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (user?.role === 'INSPECTEUR') {
                    const data = await getMesTaches(user.id);
                    setInspections(Array.isArray(data) ? data : []);
                } else {
                    const fichesRes = await getAllFiches();
                    const allFiches = Array.isArray(fichesRes) ? fichesRes : [];
                    setFiches(allFiches);

                    if (user?.role === 'OPERATEUR') {
                        const relevantFiches = allFiches.filter(f =>
                            f.statut === 'APPROUVEE' || f.statut === 'PLACEE' || f.statut === 'DEDOUANEE'
                        );
                        const conteneurResults = await Promise.all(
                            relevantFiches.map(f => getConteneursByFiche(f.id).catch(() => []))
                        );
                        const allConteneurs = conteneurResults.flat().filter(Boolean);
                        setOperateurConteneurs(allConteneurs);
                        if (allConteneurs.length > 0) {
                            const dwellResults = await Promise.all(
                                allConteneurs.map(async c => {
                                    try { const d = await getDwellTime(c.id); return { id: c.id, hours: d }; }
                                    catch { return { id: c.id, hours: null }; }
                                })
                            );
                            const dwellMap = {};
                            dwellResults.forEach(r => { dwellMap[r.id] = r.hours; });
                            setOperateurDwellTimes(dwellMap);
                        }
                    }

                    if (user?.role === 'IMPORTATEUR') {
                        try {
                            const myFiches = allFiches.filter(f => f.importateurId === user.id);
                            const conteneurResults = await Promise.all(
                                myFiches.map(f => getConteneursByFiche(f.id).catch(() => []))
                            );
                            const allMyConteneurs = conteneurResults.flat().filter(Boolean);
                            setConteneurs(allMyConteneurs);
                            if (allMyConteneurs.length > 0) {
                                const dwellResults = await Promise.all(
                                    allMyConteneurs.map(async c => {
                                        try { const d = await getDwellTime(c.id); return { id: c.id, hours: d }; }
                                        catch { return { id: c.id, hours: null }; }
                                    })
                                );
                                const dwellMap = {};
                                dwellResults.forEach(r => { dwellMap[r.id] = r.hours; });
                                setDwellTimes(dwellMap);
                                const validDwells = dwellResults.map(r => r.hours).filter(d => d !== null && !isNaN(d));
                                if (validDwells.length > 0) {
                                    setAvgDwell(Math.round(validDwells.reduce((a, b) => a + b, 0) / validDwells.length));
                                }
                            }
                        } catch { /* silent */ }
                    }

                    if (user?.role === 'ADMIN') {
                        const usersRes = await getAllUsers();
                        setUsers(Array.isArray(usersRes) ? usersRes : []);
                    }
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        if (user) fetchData();
    }, [user]);

    const countByStatut = (statut) => fiches.filter(f => f.statut === statut).length;
    const goToFiches = (statut = null) => navigate('/fiches', { state: { filtreStatut: statut } });

    const alertConteneurs = operateurConteneurs.filter(c => {
        const h = operateurDwellTimes[c.id];
        const warn = c.warningThreshold || 72;
        return h !== null && h !== undefined && h >= warn;
    }).sort((a, b) => {
        const priorityOrder = { CRITIQUE: 0, HAUTE: 1, MOYENNE: 2, NORMALE: 3 };
        const pa = priorityOrder[a.priority || 'NORMALE'];
        const pb = priorityOrder[b.priority || 'NORMALE'];
        if (pa !== pb) return pa - pb;
        return (operateurDwellTimes[b.id] || 0) - (operateurDwellTimes[a.id] || 0);
    });

    const fichesEnAttentePlacement = fiches.filter(f => f.statut === 'APPROUVEE');

    const conteneurStatutCount = {
        ARRIVE:        operateurConteneurs.filter(c => c.statut === 'ARRIVE').length,
        STOCKE:        operateurConteneurs.filter(c => c.statut === 'STOCKE').length,
        EN_INSPECTION: operateurConteneurs.filter(c => c.statut === 'EN_INSPECTION').length,
        CHARGEMENT:    operateurConteneurs.filter(c => c.statut === 'CHARGEMENT').length,
    };

    const renderStats = () => {
        switch (user?.role) {

            case 'ADMIN':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                        <StatCard title="Total Fiches"  value={fiches.length}                icon={FileText}    color="text-blue-600"   bg="bg-blue-50"   onClick={() => goToFiches()} />
                        <StatCard title="En Attente"    value={countByStatut('EN_ATTENTE')} icon={Clock}       color="text-yellow-600" bg="bg-yellow-50" onClick={() => goToFiches('EN_ATTENTE')} />
                        <StatCard title="Approuvées"    value={countByStatut('APPROUVEE')}  icon={CheckCircle} color="text-green-600"  bg="bg-green-50"  onClick={() => goToFiches('APPROUVEE')} />
                        <StatCard title="Utilisateurs"  value={users.length}                icon={Users}       color="text-purple-600" bg="bg-purple-50" onClick={() => navigate('/admin/users')} />
                    </div>
                );

            case 'IMPORTATEUR': {
                const myFichesFiltered = fiches.filter(f => f.importateurId === user?.id);
                return (
                    <>
                        {/* 6 Stats */}
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                            {[
                                { statut: 'EN_ATTENTE', label: 'En Attente',  color: 'bg-yellow-50 border-yellow-100 text-yellow-700' },
                                { statut: 'APPROUVEE',  label: 'Approuvée',   color: 'bg-green-50 border-green-100 text-green-700' },
                                { statut: 'REJETEE',    label: 'Rejetée',     color: 'bg-red-50 border-red-100 text-red-700' },
                                { statut: 'PLACEE',     label: 'Placée',      color: 'bg-blue-50 border-blue-100 text-blue-700' },
                                { statut: 'DEDOUANEE',  label: 'Dédouanée',   color: 'bg-purple-50 border-purple-100 text-purple-700' },
                                { statut: 'LIBEREE',    label: 'Libérée',     color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                            ].map(({ statut, label, color }) => (
                                <div key={statut} onClick={() => goToFiches(statut)}
                                     className={`rounded-2xl border p-4 text-center cursor-pointer hover:shadow-md transition ${color}`}>
                                    <p className="text-2xl font-bold">{myFichesFiltered.filter(f => f.statut === statut).length}</p>
                                    <p className="text-xs font-medium mt-1">{label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Fiches with Timeline */}
                        {myFichesFiltered.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="font-bold text-gray-800">Suivi de mes fiches</h3>
                                    <button onClick={() => navigate('/fiches')} className="text-blue-600 text-sm hover:underline flex items-center gap-1">Voir tout <ArrowRight size={14} /></button>
                                </div>
                                <div className="space-y-5">
                                    {myFichesFiltered.slice(0, 3).map(f => (
                                        <div key={f.id} onClick={() => navigate(`/fiches/${f.id}`)}
                                             className="border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-blue-200 hover:bg-blue-50 transition">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-sm font-semibold text-gray-700">Fiche #{f.id}</p>
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statutColor[f.statut]}`}>{f.statut}</span>
                                            </div>
                                            <TrackingTimeline statut={f.statut} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Containers */}
                        {conteneurs.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="font-bold text-gray-800">Mes Conteneurs</h3>
                                    <button onClick={() => navigate('/conteneurs')} className="text-blue-600 text-sm hover:underline flex items-center gap-1">Voir tout <ArrowRight size={14} /></button>
                                </div>
                                <div className="space-y-3">
                                    {conteneurs.map(c => {
                                        const hours     = dwellTimes[c.id] ?? null;
                                        const warn      = c.warningThreshold  || 72;
                                        const crit      = c.critiqueThreshold || 120;
                                        const isWarning  = hours !== null && hours >= warn && hours < crit;
                                        const isCritique = hours !== null && hours >= crit;
                                        return (
                                            <div key={c.id} onClick={() => navigate(`/conteneurs/${c.id}`)}
                                                 className="flex items-center justify-between px-5 py-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">Conteneur #{c.id}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {[c.zone, c.rangee, c.position].filter(Boolean).join(' — ') || 'Emplacement non assigné'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-bold tabular-nums ${isCritique ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'}`}>
                                                        {hours !== null ? formatDwellTime(hours) : '—'}
                                                    </p>
                                                    <p className={`text-xs font-medium mt-0.5 ${isCritique ? 'text-red-400' : isWarning ? 'text-yellow-500' : 'text-green-500'}`}>
                                                        {hours === null ? 'Calcul...' : isCritique ? 'Dépassement critique' : isWarning ? 'Attention requise' : 'Dans les délais'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {avgDwell !== null && (
                                    <div className={`mt-5 pt-4 border-t border-gray-100 flex items-center justify-between px-3 py-3 rounded-xl ${
                                        avgDwell >= (conteneurs[0]?.critiqueThreshold || 120) ? 'bg-red-50' :
                                            avgDwell >= (conteneurs[0]?.warningThreshold  || 72)  ? 'bg-yellow-50' : 'bg-green-50'
                                    }`}>
                                        <span className="text-sm font-medium text-gray-600">Dwell Time Moyen</span>
                                        <span className={`text-xl font-bold tabular-nums ${
                                            avgDwell >= (conteneurs[0]?.critiqueThreshold || 120) ? 'text-red-600' :
                                                avgDwell >= (conteneurs[0]?.warningThreshold  || 72)  ? 'text-yellow-600' : 'text-green-600'
                                        }`}>
                                            {formatDwellTime(avgDwell)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Alerts */}
                        {myFichesFiltered.some(f => f.statut === 'REJETEE') && (
                            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3 flex items-center gap-2 text-sm text-red-600 font-medium">
                                <XCircle size={16} />
                                {myFichesFiltered.filter(f => f.statut === 'REJETEE').length} fiche(s) rejetée(s) — cliquez pour voir le motif.
                            </div>
                        )}
                        {myFichesFiltered.some(f => f.statut === 'LIBEREE') && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-3 flex items-center gap-2 text-sm text-emerald-600 font-medium">
                                <CheckCircle size={16} />
                                🎉 {myFichesFiltered.filter(f => f.statut === 'LIBEREE').length} fiche(s) libérée(s) — marchandise prête pour enlèvement !
                            </div>
                        )}
                    </>
                );
            }

            case 'ADII':
                return (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
                            <StatCard title="Total Fiches" value={fiches.length}                icon={FileText}    color="text-blue-600"   bg="bg-blue-50"   onClick={() => goToFiches()} />
                            <StatCard title="À Valider"    value={countByStatut('EN_ATTENTE')} icon={Clock}       color="text-yellow-600" bg="bg-yellow-50" onClick={() => goToFiches('EN_ATTENTE')} subtitle="En attente de décision" />
                            <StatCard title="Approuvées"   value={countByStatut('APPROUVEE')}  icon={CheckCircle} color="text-green-600"  bg="bg-green-50"  onClick={() => goToFiches('APPROUVEE')} />
                            <StatCard title="Rejetées"     value={countByStatut('REJETEE')}    icon={XCircle}     color="text-red-600"    bg="bg-red-50"    onClick={() => goToFiches('REJETEE')} />
                        </div>
                        {countByStatut('EN_ATTENTE') > 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-yellow-100 rounded-xl"><Clock size={20} className="text-yellow-600" /></div>
                                    <div>
                                        <h3 className="font-bold text-yellow-800">Fiches en attente de votre décision</h3>
                                        <p className="text-xs text-yellow-600">{countByStatut('EN_ATTENTE')} fiche(s) nécessitent votre approbation</p>
                                    </div>
                                    <button onClick={() => goToFiches('EN_ATTENTE')} className="ml-auto text-yellow-700 text-sm font-medium hover:underline flex items-center gap-1">Voir tout <ArrowRight size={14} /></button>
                                </div>
                                <div className="space-y-2">
                                    {fiches.filter(f => f.statut === 'EN_ATTENTE').slice(0, 5).map(f => (
                                        <div key={f.id} onClick={() => navigate(`/fiches/${f.id}`)}
                                             className="flex items-center justify-between px-4 py-3 bg-white border border-yellow-100 rounded-xl hover:border-yellow-300 cursor-pointer transition">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Fiche #{f.id}</p>
                                                <p className="text-xs text-gray-400">{f.importateurNom}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-400">{f.createdAt ? new Date(f.createdAt).toLocaleDateString('fr-FR') : '-'}</span>
                                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-semibold">EN ATTENTE</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 flex items-center gap-3">
                                <CheckCircle size={20} className="text-green-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-green-700">Tout est à jour !</p>
                                    <p className="text-xs text-green-600">Aucune fiche en attente de décision.</p>
                                </div>
                            </div>
                        )}
                    </>
                );

            case 'OPERATEUR':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                            <StatCard title="À Placer"   value={fichesEnAttentePlacement.length} icon={MapPin}        color="text-orange-600" bg="bg-orange-50"  onClick={() => goToFiches('APPROUVEE')} subtitle="Fiches approuvées" />
                            <StatCard title="Placées"    value={countByStatut('PLACEE')}         icon={Package}       color="text-blue-600"   bg="bg-blue-50"   onClick={() => goToFiches('PLACEE')} />
                            <StatCard title="Dédouanées" value={countByStatut('DEDOUANEE')}      icon={TrendingUp}    color="text-purple-600" bg="bg-purple-50" onClick={() => goToFiches('DEDOUANEE')} />
                            <StatCard title="⚠️ Alertes" value={alertConteneurs.length}          icon={AlertTriangle} color="text-red-600"    bg="bg-red-50"    subtitle="Dépassement seuil" />
                        </div>
                        {alertConteneurs.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-red-100 rounded-xl"><AlertTriangle size={20} className="text-red-600" /></div>
                                    <div>
                                        <h3 className="font-bold text-red-800">Alertes Dwell Time</h3>
                                        <p className="text-xs text-red-500">{alertConteneurs.length} conteneur(s) — triés par priorité</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {alertConteneurs.slice(0, 6).map(c => {
                                        const hours = operateurDwellTimes[c.id];
                                        const warn  = c.warningThreshold  || 72;
                                        const crit  = c.critiqueThreshold || 120;
                                        return (
                                            <div key={c.id} onClick={() => navigate(`/conteneurs/${c.id}`)}
                                                 className="flex items-center justify-between bg-white border border-red-100 rounded-xl px-4 py-3 cursor-pointer hover:border-red-300 transition">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center"><Package size={16} className="text-red-500" /></div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-gray-700">Conteneur #{c.id}</p>
                                                            {c.priority && (
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_BADGE[c.priority]}`}>
                                                                    {c.priority === 'CRITIQUE' ? '☢️' : c.priority === 'HAUTE' ? '🥩' : '⚠️'} {c.priority}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-400">{c.zone || '-'} — {c.rangee || '-'} — {c.position || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-bold ${getDwellColor(hours, warn, crit)}`}>{formatDwellTime(hours)}</p>
                                                    <p className="text-xs text-red-400">{getDwellLabel(hours, warn, crit)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: 'Arrivés',       count: conteneurStatutCount.ARRIVE,        color: 'bg-blue-50 text-blue-700 border-blue-100' },
                                { label: 'Stockés',       count: conteneurStatutCount.STOCKE,        color: 'bg-green-50 text-green-700 border-green-100' },
                                { label: 'En Inspection', count: conteneurStatutCount.EN_INSPECTION,  color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
                                { label: 'Chargement',    count: conteneurStatutCount.CHARGEMENT,    color: 'bg-purple-50 text-purple-700 border-purple-100' },
                            ].map(({ label, count, color }) => (
                                <div key={label} className={`rounded-xl border p-4 text-center ${color}`}>
                                    <p className="text-2xl font-bold">{count}</p>
                                    <p className="text-xs font-medium mt-1">{label}</p>
                                </div>
                            ))}
                        </div>
                        {fichesEnAttentePlacement.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-50 rounded-xl"><Truck size={20} className="text-orange-500" /></div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">Fiches en attente de placement</h3>
                                            <p className="text-xs text-gray-400">{fichesEnAttentePlacement.length} fiche(s) approuvée(s) sans emplacement</p>
                                        </div>
                                    </div>
                                    <button onClick={() => goToFiches('APPROUVEE')} className="text-orange-600 text-sm hover:underline flex items-center gap-1">Voir tout <ArrowRight size={14} /></button>
                                </div>
                                <div className="space-y-2">
                                    {fichesEnAttentePlacement.slice(0, 4).map(f => (
                                        <div key={f.id} onClick={() => navigate(`/fiches/${f.id}`)}
                                             className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 cursor-pointer transition">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Fiche #{f.id}</p>
                                                <p className="text-xs text-gray-400">{f.importateurNom}</p>
                                            </div>
                                            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">APPROUVÉE</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                );

            case 'INSPECTEUR': {
                const pendingInspections = inspections.filter(i => !i.resultat);
                const doneInspections    = inspections.filter(i => i.resultat);
                return (
                    <>
                        <div className="grid grid-cols-2 gap-5 mb-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                                <div className="bg-yellow-50 p-4 rounded-xl"><Clock size={24} className="text-yellow-600" /></div>
                                <div><p className="text-gray-500 text-sm">À faire</p><p className="text-3xl font-bold text-gray-800">{pendingInspections.length}</p></div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                                <div className="bg-green-50 p-4 rounded-xl"><CheckCircle size={24} className="text-green-600" /></div>
                                <div><p className="text-gray-500 text-sm">Complétées</p><p className="text-3xl font-bold text-gray-800">{doneInspections.length}</p></div>
                            </div>
                        </div>
                        {pendingInspections.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-2 text-sm text-yellow-700 font-medium">
                                <Clock size={16} />{pendingInspections.length} inspection(s) en attente de votre validation
                            </div>
                        )}
                        {pendingInspections.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-6 mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-yellow-50 rounded-xl"><Clock size={20} className="text-yellow-600" /></div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Inspections à effectuer</h3>
                                        <p className="text-xs text-gray-400">Triées par urgence — les plus longtemps en attente en premier</p>
                                    </div>
                                    <button onClick={() => navigate('/inspections')} className="ml-auto text-yellow-700 text-sm font-medium hover:underline flex items-center gap-1">Voir tout <ArrowRight size={14} /></button>
                                </div>
                                <div className="space-y-2">
                                    {pendingInspections.slice(0, 5).map(i => (
                                        <div key={i.id} onClick={() => navigate(`/inspections/${i.id}`)}
                                             className="flex items-center justify-between px-4 py-3 bg-yellow-50 border border-yellow-100 rounded-xl hover:border-yellow-300 cursor-pointer transition">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center"><Search size={14} className="text-yellow-600" /></div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700">Inspection #{i.id}</p>
                                                    <p className="text-xs text-gray-400">Conteneur #{i.conteneurId}{i.organisme ? ` — ${i.organisme}` : ''}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-semibold">À faire →</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {pendingInspections.length === 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 flex items-center gap-3">
                                <CheckCircle size={20} className="text-green-500 shrink-0" />
                                <div><p className="text-sm font-semibold text-green-700">Tout est à jour !</p><p className="text-xs text-green-600">Aucune inspection en attente.</p></div>
                            </div>
                        )}
                        {doneInspections.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-green-50 rounded-xl"><CheckCircle size={20} className="text-green-600" /></div>
                                    <h3 className="font-bold text-gray-800">Inspections complétées</h3>
                                    <button onClick={() => navigate('/inspections')} className="ml-auto text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">Voir tout <ArrowRight size={14} /></button>
                                </div>
                                <div className="space-y-2">
                                    {doneInspections.slice(0, 5).map(i => (
                                        <div key={i.id} onClick={() => navigate(`/inspections/${i.id}`)}
                                             className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 cursor-pointer transition">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i.resultat === 'CONFORME' ? 'bg-green-100' : 'bg-red-100'}`}>
                                                    {i.resultat === 'CONFORME' ? <CheckCircle size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-600" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700">Inspection #{i.id}</p>
                                                    <p className="text-xs text-gray-400">Conteneur #{i.conteneurId}{i.organisme ? ` — ${i.organisme}` : ''}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${i.resultat === 'CONFORME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {i.resultat === 'CONFORME' ? '✅ Conforme' : '❌ Non Conforme'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                );
            }

            default: return null;
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Dashboard" />
                <div className="p-6">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 mb-6 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Bonjour, {user?.nom || user?.email} 👋</h2>
                            <p className="text-blue-200 mt-1">Bienvenue sur le système de suivi portuaire</p>
                        </div>
                        {unreadCount > 0 && (
                            <button onClick={() => navigate('/notifications')} className="relative bg-white/20 hover:bg-white/30 p-3 rounded-xl transition">
                                <Bell size={22} className="text-white" />
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : renderStats()}

                    {user?.role !== 'INSPECTEUR' && user?.role !== 'IMPORTATEUR' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="font-bold text-gray-800 text-lg">Fiches Récentes</h3>
                                <button onClick={() => navigate('/fiches')} className="flex items-center gap-1 text-blue-600 text-sm hover:underline font-medium">Voir tout <ArrowRight size={16} /></button>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-semibold">ID</th>
                                        <th className="px-5 py-3 text-left font-semibold">Importateur</th>
                                        <th className="px-5 py-3 text-left font-semibold">Statut</th>
                                        <th className="px-5 py-3 text-left font-semibold">Date</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                    {fiches.slice(0, 5).map(f => (
                                        <tr key={f.id} className="hover:bg-gray-50 cursor-pointer transition" onClick={() => navigate(`/fiches/${f.id}`)}>
                                            <td className="px-5 py-3.5 font-medium text-gray-700">#{f.id}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{f.importateurNom}</td>
                                            <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statutColor[f.statut]}`}>{f.statut}</span></td>
                                            <td className="px-5 py-3.5 text-gray-500">{f.createdAt ? new Date(f.createdAt).toLocaleDateString('fr-FR') : '-'}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                {fiches.length === 0 && (
                                    <div className="text-center py-12">
                                        <FileText size={40} className="text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-400">Aucune fiche pour le moment</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {user?.role === 'INSPECTEUR' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="font-bold text-gray-800 text-lg">Mes Inspections</h3>
                                <button onClick={() => navigate('/inspections')} className="flex items-center gap-1 text-blue-600 text-sm hover:underline font-medium">Voir tout <ArrowRight size={16} /></button>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-semibold">ID</th>
                                        <th className="px-5 py-3 text-left font-semibold">Conteneur</th>
                                        <th className="px-5 py-3 text-left font-semibold">Organisme</th>
                                        <th className="px-5 py-3 text-left font-semibold">Résultat</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                    {inspections.slice(0, 5).map(i => (
                                        <tr key={i.id} className="hover:bg-gray-50 cursor-pointer transition" onClick={() => navigate(`/inspections/${i.id}`)}>
                                            <td className="px-5 py-3.5 font-medium text-gray-700">#{i.id}</td>
                                            <td className="px-5 py-3.5 text-gray-600">#{i.conteneurId}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{i.organisme || '-'}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    i.resultat === 'CONFORME' ? 'bg-green-100 text-green-700' :
                                                        i.resultat === 'NON_CONFORME' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                }`}>{i.resultat || 'EN ATTENTE'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                {inspections.length === 0 && (
                                    <div className="text-center py-12">
                                        <Search size={40} className="text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-400">Aucune inspection assignée</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;