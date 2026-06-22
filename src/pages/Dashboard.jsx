import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { getAllFiches } from '../api/ficheAPI';
import { getAllUsers } from '../api/userAPI';
import { getMesTaches } from '../api/inspectionAPI';
import { getConteneursByFiche, getDwellTime, createConteneur } from '../api/conteneurAPI';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Package, Users, CheckCircle,
    Clock, XCircle, ArrowRight,
    Bell, AlertTriangle, MapPin, Truck,
    ClipboardList, ShieldCheck, Flame, Target, Loader2, RefreshCw
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
    if (hours == null) return '-';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const rem  = hours % 24;
    return rem > 0 ? `${days}j ${rem}h` : `${days} jour(s)`;
};

const PRIORITY_BADGE = {
    CRITIQUE: 'bg-red-100 text-red-700',
    HAUTE:    'bg-orange-100 text-orange-700',
    MOYENNE:  'bg-yellow-100 text-yellow-700',
    NORMALE:  'bg-gray-100 text-gray-600',
};
const PRIORITY_ORDER = { CRITIQUE: 0, HAUTE: 1, MOYENNE: 2, NORMALE: 3 };

const statutColor = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
    APPROUVEE:  'bg-green-100 text-green-700',
    REJETEE:    'bg-red-100 text-red-700',
    PLACEE:     'bg-blue-100 text-blue-700',
    LIBEREE:    'bg-emerald-100 text-emerald-700',
};

// ── Detect re-submitted fiche (updatedAt differs from createdAt by > 5 min) ──
const isResoumis = (fiche) => {
    if (!fiche.updatedAt || !fiche.createdAt) return false;
    const diff = new Date(fiche.updatedAt) - new Date(fiche.createdAt);
    return diff > 5 * 60 * 1000; // more than 5 minutes = was modified (re-submitted)
};

const getFichePriority = (fiche) => {
    // Re-soumission is always CRITIQUE
    if (fiche.statut === 'EN_ATTENTE' && isResoumis(fiche)) return 'CRITIQUE';
    const classifications = (fiche.marchandises || []).map(m => m.classification);
    if (classifications.includes('DANGEREUSE')) return 'CRITIQUE';
    if (classifications.includes('PERISSABLE'))  return 'HAUTE';
    if (classifications.includes('FRAGILE'))     return 'MOYENNE';
    return 'NORMALE';
};

const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.toDateString() === new Date().toDateString();
};

const isThisWeek = (dateStr) => {
    if (!dateStr) return false;
    const d   = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
};

// ── Timeline (DEDOUANEE removed) ─────────────────────────────
const TIMELINE_STEPS = [
    { key: 'EN_ATTENTE', label: 'Soumise' },
    { key: 'APPROUVEE',  label: 'Approuvée' },
    { key: 'PLACEE',     label: 'Placée' },
    { key: 'LIBEREE',    label: 'Libérée' },
];
const STATUT_ORDER = { EN_ATTENTE: 0, APPROUVEE: 1, PLACEE: 2, LIBEREE: 3, REJETEE: -1 };

const MiniTimeline = ({ statut }) => {
    const currentIndex = STATUT_ORDER[statut] ?? 0;
    if (statut === 'REJETEE') {
        return (
            <div className="flex items-center gap-2 mt-3">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">✕</div>
                <span className="text-xs text-red-500 font-medium">Rejetée</span>
            </div>
        );
    }
    return (
        <div className="flex items-center mt-3">
            {TIMELINE_STEPS.map((step, index) => {
                const isDone    = index < currentIndex;
                const isCurrent = index === currentIndex;
                return (
                    <div key={step.key} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isDone    ? 'bg-green-500 text-white' :
                                    isCurrent ? 'bg-blue-600 text-white ring-2 ring-blue-100' :
                                        'bg-gray-100 text-gray-400'
                            }`}>
                                {isDone ? '✓' : index + 1}
                            </div>
                            <p className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                                isDone ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
                            }`}>{step.label}</p>
                        </div>
                        {index < TIMELINE_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 mb-3.5 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ── Workflow Graph — DEDOUANEE removed ───────────────────────
const WorkflowGraph = ({ fiches, navigate }) => {
    const steps = [
        { label: 'ADII',       sub: 'en attente', statut: 'EN_ATTENTE', count: fiches.filter(f => f.statut === 'EN_ATTENTE').length, color: 'bg-yellow-50 border-yellow-200 text-yellow-700', dot: 'bg-yellow-400' },
        { label: 'Opérateur',  sub: 'à placer',   statut: 'APPROUVEE',  count: fiches.filter(f => f.statut === 'APPROUVEE').length,  color: 'bg-blue-50 border-blue-200 text-blue-700',       dot: 'bg-blue-400' },
        { label: 'Inspecteur', sub: 'à inspecter',statut: 'PLACEE',     count: fiches.filter(f => f.statut === 'PLACEE').length,     color: 'bg-purple-50 border-purple-200 text-purple-700', dot: 'bg-purple-400' },
        { label: 'Libéré',     sub: 'terminés',   statut: 'LIBEREE',    count: fiches.filter(f => f.statut === 'LIBEREE').length,    color: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-400' },
    ];

    const rejeteesCount  = fiches.filter(f => f.statut === 'REJETEE').length;
    const resoumisCount  = fiches.filter(f => f.statut === 'EN_ATTENTE' && isResoumis(f)).length;
    const inProgress     = steps.filter(s => s.statut !== 'LIBEREE');
    const maxCount       = Math.max(...inProgress.map(s => s.count), 0);
    const bottleneck     = maxCount > 0 ? inProgress.find(s => s.count === maxCount)?.label : null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-800">Flux de travail en temps réel</h3>
                {bottleneck && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
                        <Flame size={12} /> Goulot : {bottleneck}
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-400 mb-5">Cliquez sur une étape pour voir les fiches correspondantes</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {steps.map((s) => {
                    const isBottleneck = s.label === bottleneck;
                    return (
                        <div key={s.label}
                             onClick={() => navigate('/fiches', { state: { filtreStatut: s.statut } })}
                             className={`relative rounded-xl border-2 px-4 py-4 cursor-pointer hover:shadow-lg transition-all text-center ${s.color} ${isBottleneck ? 'ring-2 ring-orange-300' : ''}`}>
                            {isBottleneck && (
                                <span className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                    <Flame size={11} />
                                </span>
                            )}
                            <div className={`w-2.5 h-2.5 rounded-full ${s.dot} mx-auto mb-2`} />
                            <p className="text-sm font-bold">{s.label}</p>
                            <p className="text-lg font-bold mt-1">{s.count}</p>
                            <p className="text-xs mt-0.5 opacity-80">{s.sub}</p>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-3 mt-4 flex-wrap">
                {rejeteesCount > 0 && (
                    <div onClick={() => navigate('/fiches', { state: { filtreStatut: 'REJETEE' } })}
                         className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 cursor-pointer hover:bg-red-100 transition">
                        <XCircle size={18} className="text-red-500" />
                        <p className="text-sm font-semibold text-red-700">
                            {rejeteesCount} fiche{rejeteesCount > 1 ? 's' : ''} rejetée{rejeteesCount > 1 ? 's' : ''}
                        </p>
                    </div>
                )}
                {resoumisCount > 0 && (
                    <div onClick={() => navigate('/fiches', { state: { filtreStatut: 'EN_ATTENTE' } })}
                         className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 cursor-pointer hover:bg-red-100 transition">
                        <RefreshCw size={18} className="text-red-600" />
                        <p className="text-sm font-semibold text-red-700">
                            {resoumisCount} re-soumission{resoumisCount > 1 ? 's' : ''} — priorité CRITIQUE
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Goal Progress ─────────────────────────────────────────────
const GoalProgress = ({ label, todayCount, todayGoal, weekCount, weekGoal }) => {
    const renderBlocks = (count, goal) => {
        const blocks = Math.max(goal, count);
        return (
            <div className="flex gap-1 flex-wrap">
                {Array.from({ length: blocks }).map((_, i) => (
                    <div key={i} className={`h-3 flex-1 min-w-[6px] rounded-sm ${
                        i < count ? (count >= goal ? 'bg-green-500' : 'bg-blue-500') : 'bg-gray-100'
                    }`} />
                ))}
            </div>
        );
    };
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 rounded-lg"><Target size={16} className="text-indigo-600" /></div>
                    <h3 className="font-bold text-gray-800">{label}</h3>
                </div>
                <span className="text-xs text-gray-400">Estimation basée sur l'activité récente</span>
            </div>
            <div className="space-y-5 mt-5">
                <div>
                    <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-600">Aujourd'hui</span>
                        <span className={`font-bold ${todayCount >= todayGoal ? 'text-green-600' : 'text-gray-800'}`}>{todayCount} / {todayGoal}</span>
                    </div>
                    {renderBlocks(todayCount, todayGoal)}
                </div>
                <div>
                    <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-600">Cette semaine</span>
                        <span className={`font-bold ${weekCount >= weekGoal ? 'text-green-600' : 'text-gray-800'}`}>{weekCount} / {weekGoal}</span>
                    </div>
                    {renderBlocks(weekCount, weekGoal)}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
const Dashboard = () => {
    const { user }   = useAuth();
    const navigate   = useNavigate();

    const [fiches, setFiches]           = useState([]);
    const [users, setUsers]             = useState([]);
    const [inspections, setInspections] = useState([]);
    const [conteneurs, setConteneurs]   = useState([]);
    const [dwellTimes, setDwellTimes]   = useState({});
    const [avgDwell, setAvgDwell]       = useState(null);
    const [loading, setLoading]         = useState(true);
    const [operateurConteneurs, setOperateurConteneurs] = useState([]);
    const [operateurDwellTimes, setOperateurDwellTimes] = useState({});
    const [placingId, setPlacingId]     = useState(null);

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
                            ['APPROUVEE', 'PLACEE'].includes(f.statut)
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
                            const map = {};
                            dwellResults.forEach(r => { map[r.id] = r.hours; });
                            setOperateurDwellTimes(map);
                        }
                    }

                    if (user?.role === 'IMPORTATEUR') {
                        const myFiches = allFiches.filter(f => f.importateurId === user.id);
                        const cResults = await Promise.all(
                            myFiches.map(f => getConteneursByFiche(f.id).catch(() => []))
                        );
                        const myConteneurs = cResults.flat().filter(Boolean);
                        setConteneurs(myConteneurs);
                        if (myConteneurs.length > 0) {
                            const dwellResults = await Promise.all(
                                myConteneurs.map(async c => {
                                    try { const d = await getDwellTime(c.id); return { id: c.id, hours: d }; }
                                    catch { return { id: c.id, hours: null }; }
                                })
                            );
                            const map = {};
                            dwellResults.forEach(r => { map[r.id] = r.hours; });
                            setDwellTimes(map);
                            const valid = dwellResults.map(r => r.hours).filter(d => d != null && !isNaN(d));
                            if (valid.length > 0) setAvgDwell(Math.round(valid.reduce((a,b) => a+b, 0) / valid.length));
                        }
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

    const countByStatut = (s) => fiches.filter(f => f.statut === s).length;
    const goToFiches = (s = null) => navigate('/fiches', { state: { filtreStatut: s } });

    const handlePlacerFiche = async (ficheId) => {
        setPlacingId(ficheId);
        try {
            const existing = operateurConteneurs.find(c => c.ficheId === ficheId);
            if (existing) { navigate(`/conteneurs/${existing.id}`); return; }
            const nc = await createConteneur(ficheId);
            navigate(`/conteneurs/${nc.id}`);
        } catch { alert('Erreur lors de la création du conteneur.'); }
        finally { setPlacingId(null); }
    };

    // ── Derived data ───────────────────────────────────────────
    const fichesEnAttentePlacement = fiches.filter(f => f.statut === 'APPROUVEE');

    // ADII: EN_ATTENTE fiches sorted by priority, re-submitted first
    const fichesAValider = fiches
        .filter(f => f.statut === 'EN_ATTENTE')
        .sort((a, b) => PRIORITY_ORDER[getFichePriority(a)] - PRIORITY_ORDER[getFichePriority(b)]);

    // Re-submitted fiches (CRITIQUE)
    const fichesResoumises = fichesAValider.filter(f => isResoumis(f));

    const conteneurStatutCount = {
        ARRIVE:        operateurConteneurs.filter(c => c.statut === 'ARRIVE').length,
        STOCKE:        operateurConteneurs.filter(c => c.statut === 'STOCKE').length,
        EN_INSPECTION: operateurConteneurs.filter(c => c.statut === 'EN_INSPECTION').length,
        CHARGEMENT:    operateurConteneurs.filter(c => c.statut === 'CHARGEMENT').length,
    };

    // ── Goal counts ────────────────────────────────────────────
    const adiiDecidedToday     = fiches.filter(f => ['APPROUVEE','REJETEE'].includes(f.statut) && isToday(f.updatedAt)).length;
    const adiiDecidedWeek      = fiches.filter(f => ['APPROUVEE','REJETEE'].includes(f.statut) && isThisWeek(f.updatedAt)).length;
    const operateurPlacedToday = fiches.filter(f => ['PLACEE','LIBEREE'].includes(f.statut) && isToday(f.updatedAt)).length;
    const operateurPlacedWeek  = fiches.filter(f => ['PLACEE','LIBEREE'].includes(f.statut) && isThisWeek(f.updatedAt)).length;
    const inspectionsDoneToday = inspections.filter(i => i.resultat && isToday(i.date)).length;
    const inspectionsDoneWeek  = inspections.filter(i => i.resultat && isThisWeek(i.date)).length;

    const renderStats = () => {
        switch (user?.role) {

            // ── ADMIN ─────────────────────────────────────────
            case 'ADMIN':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                            <StatCard title="Total Fiches"  value={fiches.length}               icon={FileText}    color="text-blue-600"   bg="bg-blue-50"   onClick={() => goToFiches()} />
                            <StatCard title="En Attente"    value={countByStatut('EN_ATTENTE')} icon={Clock}       color="text-yellow-600" bg="bg-yellow-50" onClick={() => goToFiches('EN_ATTENTE')} />
                            <StatCard title="Approuvées"    value={countByStatut('APPROUVEE')}  icon={CheckCircle} color="text-green-600"  bg="bg-green-50"  onClick={() => goToFiches('APPROUVEE')} />
                            <StatCard title="Utilisateurs"  value={users.length}                icon={Users}       color="text-purple-600" bg="bg-purple-50" onClick={() => navigate('/admin/users')} />
                        </div>
                        {/* Re-soumissions alert for admin */}
                        {fichesResoumises.length > 0 && (
                            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
                                <RefreshCw size={18} className="text-red-600 shrink-0"/>
                                <p className="text-sm font-semibold text-red-700">
                                    ⚠️ {fichesResoumises.length} fiche(s) re-soumise(s) par les importateurs — à traiter en priorité par l'ADII.
                                </p>
                                <button onClick={() => goToFiches('EN_ATTENTE')}
                                        className="ml-auto text-xs text-red-600 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-semibold">
                                    Voir →
                                </button>
                            </div>
                        )}
                        <WorkflowGraph fiches={fiches} navigate={navigate} />
                    </>
                );

            // ── IMPORTATEUR — DEDOUANEE removed from grid ─────
            case 'IMPORTATEUR': {
                const myFiches = fiches.filter(f => f.importateurId === user?.id);
                return (
                    <>
                        {/* 5 stats — DEDOUANEE removed */}
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                            {[
                                { statut: 'EN_ATTENTE', label: 'En Attente',  color: 'bg-yellow-50 border-yellow-100 text-yellow-700' },
                                { statut: 'APPROUVEE',  label: 'Approuvée',   color: 'bg-green-50 border-green-100 text-green-700' },
                                { statut: 'REJETEE',    label: 'Rejetée',     color: 'bg-red-50 border-red-100 text-red-700' },
                                { statut: 'PLACEE',     label: 'Placée',      color: 'bg-blue-50 border-blue-100 text-blue-700' },
                                { statut: 'LIBEREE',    label: 'Libérée',     color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                            ].map(({ statut, label, color }) => (
                                <div key={statut} onClick={() => goToFiches(statut)}
                                     className={`rounded-2xl border p-4 text-center cursor-pointer hover:shadow-md transition ${color}`}>
                                    <p className="text-2xl font-bold">{myFiches.filter(f => f.statut === statut).length}</p>
                                    <p className="text-xs font-medium mt-1">{label}</p>
                                </div>
                            ))}
                        </div>

                        {myFiches.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="font-bold text-gray-800">Suivi de mes fiches</h3>
                                    <button onClick={() => navigate('/fiches')} className="text-blue-600 text-sm hover:underline flex items-center gap-1">Voir tout <ArrowRight size={14}/></button>
                                </div>
                                <div className="space-y-5">
                                    {myFiches.slice(0, 3).map(f => (
                                        <div key={f.id} onClick={() => navigate(`/fiches/${f.id}`)}
                                             className="border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-blue-200 hover:bg-blue-50 transition">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-gray-700">Fiche #{f.id}</p>
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statutColor[f.statut] || ''}`}>{f.statut}</span>
                                            </div>
                                            <MiniTimeline statut={f.statut} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {conteneurs.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="font-bold text-gray-800">Mes Conteneurs</h3>
                                    <button onClick={() => navigate('/conteneurs')} className="text-blue-600 text-sm hover:underline flex items-center gap-1">Voir tout <ArrowRight size={14}/></button>
                                </div>
                                <div className="space-y-3">
                                    {conteneurs.map(c => {
                                        const hours = dwellTimes[c.id] ?? null;
                                        const warn  = c.warningThreshold  || 72;
                                        const crit  = c.critiqueThreshold || 120;
                                        const isW   = hours != null && hours >= warn && hours < crit;
                                        const isC   = hours != null && hours >= crit;
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
                                                    <p className={`text-lg font-bold ${isC ? 'text-red-600' : isW ? 'text-yellow-600' : 'text-green-600'}`}>
                                                        {hours != null ? formatDwellTime(hours) : '—'}
                                                    </p>
                                                    <p className={`text-xs font-medium mt-0.5 ${isC ? 'text-red-400' : isW ? 'text-yellow-500' : 'text-green-500'}`}>
                                                        {hours == null ? 'Calcul...' : isC ? 'Dépassement critique' : isW ? 'Attention requise' : 'Dans les délais'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {avgDwell != null && (
                                    <div className={`mt-5 pt-4 border-t border-gray-100 flex items-center justify-between px-3 py-3 rounded-xl ${
                                        avgDwell >= 120 ? 'bg-red-50' : avgDwell >= 72 ? 'bg-yellow-50' : 'bg-green-50'
                                    }`}>
                                        <span className="text-sm font-medium text-gray-600">Dwell Time Moyen</span>
                                        <span className={`text-xl font-bold ${avgDwell >= 120 ? 'text-red-600' : avgDwell >= 72 ? 'text-yellow-600' : 'text-green-600'}`}>
                                            {formatDwellTime(avgDwell)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {myFiches.some(f => f.statut === 'REJETEE') && (
                            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3 flex items-center gap-2 text-sm text-red-600 font-medium">
                                <XCircle size={16}/> {myFiches.filter(f => f.statut === 'REJETEE').length} fiche(s) rejetée(s) — cliquez pour re-soumettre.
                            </div>
                        )}
                        {myFiches.some(f => f.statut === 'LIBEREE') && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-3 flex items-center gap-2 text-sm text-emerald-600 font-medium">
                                <CheckCircle size={16}/> 🎉 {myFiches.filter(f => f.statut === 'LIBEREE').length} fiche(s) libérée(s) — marchandise prête pour enlèvement !
                            </div>
                        )}
                    </>
                );
            }

            // ── ADII ──────────────────────────────────────────
            case 'ADII':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                            <StatCard title="À Valider"  value={fichesAValider.length}       icon={Clock}       color="text-yellow-600" bg="bg-yellow-50" subtitle="En attente de décision" />
                            <StatCard title="Approuvées" value={countByStatut('APPROUVEE')}  icon={ShieldCheck} color="text-green-600"  bg="bg-green-50"  onClick={() => goToFiches('APPROUVEE')} />
                            <StatCard title="Rejetées"   value={countByStatut('REJETEE')}    icon={XCircle}     color="text-red-600"    bg="bg-red-50"    onClick={() => goToFiches('REJETEE')} />
                        </div>

                        <GoalProgress
                            label="Objectif — Décisions ADII"
                            todayCount={adiiDecidedToday}
                            todayGoal={8}
                            weekCount={adiiDecidedWeek}
                            weekGoal={40}
                        />

                        {/* Re-soumissions — CRITIQUE priority banner */}
                        {fichesResoumises.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
                                <RefreshCw size={18} className="text-red-600 shrink-0"/>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-700">
                                        ⚠️ {fichesResoumises.length} fiche(s) re-soumise(s) après rejet — à traiter en priorité
                                    </p>
                                    <p className="text-xs text-red-500 mt-0.5">Ces fiches apparaissent en tête de liste ci-dessous</p>
                                </div>
                            </div>
                        )}

                        {fichesAValider.length > 0 ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-yellow-50 rounded-xl">
                                        <ClipboardList size={20} className="text-yellow-600"/>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Fiches à traiter</h3>
                                        <p className="text-xs text-gray-400">Triées par priorité — re-soumissions en tête</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {fichesAValider.map(f => {
                                        const priority  = getFichePriority(f);
                                        const resoumis  = isResoumis(f);
                                        return (
                                            <div key={f.id} onClick={() => navigate(`/fiches/${f.id}`)}
                                                 className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition ${
                                                     resoumis
                                                         ? 'bg-red-50 border-red-200 hover:border-red-400'
                                                         : 'bg-yellow-50 border-yellow-100 hover:border-yellow-300'
                                                 }`}>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                        Fiche #{f.id}
                                                        {resoumis && (
                                                            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-bold">
                                                                <RefreshCw size={10}/> RE-SOUMISE
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{f.importateurNom}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_BADGE[priority]}`}>
                                                        {priority}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString('fr-FR') : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center gap-3">
                                <CheckCircle size={20} className="text-green-500 shrink-0"/>
                                <div>
                                    <p className="text-sm font-semibold text-green-700">Tout est à jour !</p>
                                    <p className="text-xs text-green-600">Aucune fiche en attente de décision.</p>
                                </div>
                            </div>
                        )}
                    </>
                );

            // ── OPERATEUR ─────────────────────────────────────
            case 'OPERATEUR':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                            <StatCard title="Fiches à placer" value={fichesEnAttentePlacement.length} icon={MapPin}  color="text-orange-600" bg="bg-orange-50" onClick={() => goToFiches('APPROUVEE')} subtitle="Nouvelles fiches approuvées" />
                            <StatCard title="En cours"        value={conteneurStatutCount.EN_INSPECTION + conteneurStatutCount.STOCKE} icon={Package} color="text-blue-600" bg="bg-blue-50" subtitle="Stockés ou en inspection" onClick={() => navigate('/conteneurs')} />
                        </div>

                        <GoalProgress
                            label="Objectif — Placements Opérateur"
                            todayCount={operateurPlacedToday}
                            todayGoal={6}
                            weekCount={operateurPlacedWeek}
                            weekGoal={30}
                        />

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
                                        <div className="p-2 bg-orange-50 rounded-xl"><Truck size={20} className="text-orange-500"/></div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">Nouvelles fiches à placer</h3>
                                            <p className="text-xs text-gray-400">{fichesEnAttentePlacement.length} fiche(s) — cliquez pour assigner une place</p>
                                        </div>
                                    </div>
                                    <button onClick={() => navigate('/conteneurs')} className="text-orange-600 text-sm hover:underline flex items-center gap-1">Voir tout <ArrowRight size={14}/></button>
                                </div>
                                <div className="space-y-2">
                                    {fichesEnAttentePlacement
                                        .sort((a, b) => PRIORITY_ORDER[getFichePriority(a)] - PRIORITY_ORDER[getFichePriority(b)])
                                        .slice(0, 5)
                                        .map(f => {
                                            const priority = getFichePriority(f);
                                            const isPlacing = placingId === f.id;
                                            return (
                                                <div key={f.id} onClick={() => !isPlacing && handlePlacerFiche(f.id)}
                                                     className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 cursor-pointer transition">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                                            <ClipboardList size={15} className="text-orange-500"/>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-700">Fiche #{f.id}</p>
                                                            <p className="text-xs text-gray-400">{f.importateurNom}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {priority !== 'NORMALE' && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_BADGE[priority]}`}>{priority}</span>
                                                        )}
                                                        {isPlacing
                                                            ? <Loader2 size={16} className="animate-spin text-orange-500"/>
                                                            : <span className="text-xs bg-orange-600 text-white px-2.5 py-1 rounded-full font-semibold">Assigner →</span>
                                                        }
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </>
                );

            // ── INSPECTEUR ────────────────────────────────────
            case 'INSPECTEUR': {
                const pendingInspections = inspections
                    .filter(i => !i.resultat)
                    .sort((a, b) => {
                        const pa = PRIORITY_ORDER[a.priority || 'NORMALE'];
                        const pb = PRIORITY_ORDER[b.priority || 'NORMALE'];
                        if (pa !== pb) return pa - pb;
                        return (b.dwellTimeHours || 0) - (a.dwellTimeHours || 0);
                    });

                return (
                    <>
                        <div className="grid grid-cols-1 gap-5 mb-6">
                            <StatCard title="Inspections à faire" value={pendingInspections.length} icon={Clock} color="text-yellow-600" bg="bg-yellow-50" subtitle="Triées par priorité de marchandise" />
                        </div>

                        <GoalProgress
                            label="Objectif — Inspections complétées"
                            todayCount={inspectionsDoneToday}
                            todayGoal={5}
                            weekCount={inspectionsDoneWeek}
                            weekGoal={25}
                        />

                        {pendingInspections.length > 0 ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-yellow-50 rounded-xl"><ClipboardList size={20} className="text-yellow-600"/></div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">À faire — Inspections</h3>
                                        <p className="text-xs text-gray-400">Triées par priorité de marchandise</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {pendingInspections.map(i => (
                                        <div key={i.id} onClick={() => navigate(`/inspections/${i.id}`)}
                                             className="flex items-center justify-between px-4 py-3 bg-yellow-50 border border-yellow-100 rounded-xl hover:border-yellow-300 cursor-pointer transition">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                                    <ClipboardList size={15} className="text-yellow-600"/>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700">Inspection #{i.id}</p>
                                                    <p className="text-xs text-gray-400">Conteneur #{i.conteneurId}{i.organisme ? ` — ${i.organisme}` : ''}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {i.priority && i.priority !== 'NORMALE' && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_BADGE[i.priority]}`}>{i.priority}</span>
                                                )}
                                                {i.dwellTimeHours > 0 && (
                                                    <span className="text-xs text-gray-400">{formatDwellTime(i.dwellTimeHours)}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center gap-3">
                                <CheckCircle size={20} className="text-green-500 shrink-0"/>
                                <div>
                                    <p className="text-sm font-semibold text-green-700">Tout est à jour !</p>
                                    <p className="text-xs text-green-600">Aucune inspection en attente.</p>
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
            <Sidebar/>
            <div className="flex-1 ml-64">
                <Navbar title="Dashboard"/>
                <div className="p-6">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 mb-6 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Bonjour, {user?.nom || user?.email} 👋</h2>
                            <p className="text-blue-200 mt-1">Bienvenue sur le système de suivi portuaire</p>
                        </div>
                    </div>
                    {loading
                        ? <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                        : renderStats()
                    }
                </div>
            </div>
        </div>
    );
};

export default Dashboard;