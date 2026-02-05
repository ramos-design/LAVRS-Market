import React, { useState, useEffect } from 'react';
import {
    Plus, Trash2, Users, Map, MousePointer2,
    Grid3X3, Layers, CheckCircle2, AlertCircle,
    ChevronLeft, LayoutDashboard, Info, Download,
    Search, Filter, Maximize2, Move
} from 'lucide-react';
import { Application, MarketEvent, EventPlan, Zone, Stand, SpotSize, AppStatus, ZoneCategory } from '../types';
import { EVENTS, MOCK_APPLICATIONS, MOCK_EVENT_PLANS, ZONE_DETAILS } from '../constants';

interface EventLayoutManagerProps {
    eventId: string;
    onBack: () => void;
    applications: Application[];
    onUpdateApplication?: (updatedApp: Application) => void;
}

const EventLayoutManager: React.FC<EventLayoutManagerProps> = ({
    eventId,
    onBack,
    applications: propApplications,
    onUpdateApplication
}) => {
    const event = EVENTS.find(e => e.id === eventId);
    const [plan, setPlan] = useState<EventPlan>(
        MOCK_EVENT_PLANS[eventId] || {
            eventId,
            gridSize: { width: 15, height: 10 },
            zones: [],
            stands: []
        }
    );

    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(plan.zones[0]?.id || null);
    const [activeTool, setActiveTool] = useState<'select' | 'place-s' | 'place-m' | 'place-l' | 'erase'>('select');
    const [selectedStandId, setSelectedStandId] = useState<string | null>(null);
    const [showExhibitorList, setShowExhibitorList] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter approved but unplaced exhibitors
    const unplacedExhibitors = propApplications.filter(app =>
        app.status === AppStatus.APPROVED || app.status === AppStatus.PAID
    ).filter(app => !plan.stands.some(s => s.occupantId === app.id));

    const placedExhibitors = propApplications.filter(app =>
        plan.stands.some(s => s.occupantId === app.id)
    );

    const handleCellClick = (x: number, y: number) => {
        if (activeTool.startsWith('place-') && selectedZoneId) {
            const sizeStr = activeTool.split('-')[1].toUpperCase() as SpotSize;
            const newStand: Stand = {
                id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                x,
                y,
                size: sizeStr,
                zoneId: selectedZoneId
            };

            // Check if space is occupied
            if (!plan.stands.some(s => s.x === x && s.y === y)) {
                setPlan(prev => ({
                    ...prev,
                    stands: [...prev.stands, newStand]
                }));
            }
        } else if (activeTool === 'erase') {
            setPlan(prev => ({
                ...prev,
                stands: prev.stands.filter(s => s.x !== x || s.y !== y)
            }));
        } else if (activeTool === 'select') {
            const stand = plan.stands.find(s => s.x === x && s.y === y);
            if (stand) {
                setSelectedStandId(stand.id);
            } else {
                setSelectedStandId(null);
            }
        }
    };

    const assignExhibitor = (standId: string, exhibitorId: string) => {
        setPlan(prev => ({
            ...prev,
            stands: prev.stands.map(s =>
                s.id === standId ? { ...s, occupantId: exhibitorId } : s
            )
        }));
        setSelectedStandId(null);
        setShowExhibitorList(false);
    };

    const removeExhibitor = (standId: string) => {
        setPlan(prev => ({
            ...prev,
            stands: prev.stands.map(s =>
                s.id === standId ? { ...s, occupantId: undefined } : s
            )
        }));
    };

    const deleteStand = (standId: string) => {
        setPlan(prev => ({
            ...prev,
            stands: prev.stands.filter(s => s.id !== standId)
        }));
        setSelectedStandId(null);
    };

    const getOccupant = (stand: Stand) => {
        return propApplications.find(app => app.id === stand.occupantId);
    };

    const getZone = (zoneId: string) => {
        return plan.zones.find(z => z.id === zoneId);
    };

    const addZone = () => {
        const newZone: Zone = {
            id: `z-${Date.now()}`,
            name: 'Nová zóna',
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            category: ZoneCategory.CESKE_ZNACKY,
            capacities: { S: 5, M: 5, L: 2 }
        };
        setPlan(prev => ({
            ...prev,
            zones: [...prev.zones, newZone]
        }));
        setSelectedZoneId(newZone.id);
    };

    const updateZone = (zoneId: string, updates: Partial<Zone>) => {
        setPlan(prev => ({
            ...prev,
            zones: prev.zones.map(z => z.id === zoneId ? { ...z, ...updates } : z)
        }));
    };

    const deleteZone = (zoneId: string) => {
        setPlan(prev => ({
            ...prev,
            zones: prev.zones.filter(z => z.id !== zoneId),
            stands: prev.stands.filter(s => s.zoneId !== zoneId)
        }));
        if (selectedZoneId === zoneId) setSelectedZoneId(null);
    };

    const updateGridSize = (width: number, height: number) => {
        setPlan(prev => ({
            ...prev,
            gridSize: { width: Math.max(1, width), height: Math.max(1, height) }
        }));
    };

    // Capacity monitoring
    const getCapacityInfo = (zoneId: string, size: SpotSize) => {
        const zone = plan.zones.find(z => z.id === zoneId);
        if (!zone) return { used: 0, total: 0 };

        const total = zone.capacities[size] || 0;
        const used = plan.stands.filter(s => s.zoneId === zoneId && s.size === size && s.occupantId).length;
        const placedStands = plan.stands.filter(s => s.zoneId === zoneId && s.size === size).length;

        return { used, total, placedStands };
    };

    const renderGrid = () => {
        const cells = [];
        for (let y = 0; y < plan.gridSize.height; y++) {
            for (let x = 0; x < plan.gridSize.width; x++) {
                const stand = plan.stands.find(s => s.x === x && s.y === y);
                const occupant = stand ? getOccupant(stand) : null;
                const zone = stand ? getZone(stand.zoneId) : null;

                cells.push(
                    <div
                        key={`${x}-${y}`}
                        onClick={() => handleCellClick(x, y)}
                        className={`
              relative aspect-square border border-gray-100 flex items-center justify-center transition-all cursor-crosshair
              ${!stand && activeTool.startsWith('place') ? 'hover:bg-lavrs-beige/50' : 'hover:bg-gray-50'}
              ${stand && selectedStandId === stand.id ? 'ring-2 ring-lavrs-red ring-inset z-10' : ''}
              ${stand ? 'bg-white shadow-sm' : 'bg-transparent'}
            `}
                    >
                        {stand && (
                            <div
                                className="w-full h-full p-1 flex flex-col justify-between overflow-hidden"
                                style={{ borderTop: `4px solid ${zone?.color || '#333'}` }}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-[8px] font-black text-gray-400 uppercase">{stand.size}</span>
                                    {occupant && <CheckCircle2 size={10} className="text-green-500" />}
                                </div>

                                <div className="flex-1 flex flex-col justify-center items-center text-center px-1">
                                    {occupant ? (
                                        <>
                                            <p className="text-[10px] font-bold leading-tight line-clamp-2 text-lavrs-dark">{occupant.brandName}</p>
                                            <p className="text-[8px] text-gray-400 font-medium truncate w-full">{occupant.zoneCategory}</p>
                                        </>
                                    ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Grid Coordinates (optional/subtle) */}
                        <span className="absolute bottom-0 right-0 text-[6px] text-gray-200 px-0.5 pointer-events-none">
                            {x},{y}
                        </span>
                    </div>
                );
            }
        }
        return cells;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="p-3 bg-white border border-gray-100 text-lavrs-dark hover:text-lavrs-red transition-all shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-lavrs-dark text-white px-2 py-0.5">ADMIN</span>
                            <h2 className="text-4xl font-extrabold tracking-tight text-lavrs-dark">{event?.title}</h2>
                        </div>
                        <p className="text-gray-500 flex items-center gap-2">
                            <Map size={14} className="text-lavrs-red" />
                            Interactive Layout Planner & Exhibitor Placement
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="bg-white border border-gray-100 text-lavrs-dark px-6 py-4 font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Download size={18} /> Export PDF
                    </button>
                    <button className="bg-lavrs-dark text-white px-8 py-4 font-bold hover:bg-lavrs-red transition-all flex items-center gap-2 shadow-lg">
                        <CheckCircle2 size={18} /> Uložit plánek
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Toolbar */}
                <div className="lg:col-span-3 space-y-6">

                    {/* Editor Tools */}
                    <div className="bg-white border border-gray-100 p-6 space-y-6 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-widest text-lavrs-dark border-b border-gray-100 pb-3 flex items-center gap-2">
                            <Grid3X3 size={14} className="text-lavrs-red" /> Nástroje editoru
                        </h3>

                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'select', label: 'Výběr', icon: MousePointer2 },
                                { id: 'place-s', label: 'Stánek S', icon: Plus },
                                { id: 'place-m', label: 'Stánek M', icon: Plus },
                                { id: 'place-l', label: 'Stánek L', icon: Plus },
                                { id: 'erase', label: 'Smazat', icon: Trash2 },
                            ].map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => setActiveTool(tool.id as any)}
                                    className={`
                    flex flex-col items-center justify-center p-3 border transition-all text-[10px] font-bold uppercase tracking-wider gap-2
                    ${activeTool === tool.id
                                            ? 'bg-lavrs-dark text-white border-lavrs-dark shadow-md scale-[1.02]'
                                            : 'bg-white text-gray-500 border-gray-100 hover:border-lavrs-red hover:text-lavrs-red'}
                  `}
                                >
                                    <tool.icon size={16} />
                                    {tool.label}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase">Aktivní zóna: {getZone(selectedZoneId || '')?.name || 'Vyberte zónu'}</p>
                                {selectedZoneId && (
                                    <button
                                        onClick={() => deleteZone(selectedZoneId)}
                                        className="text-gray-400 hover:text-lavrs-red"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>

                            {selectedZoneId && (
                                <input
                                    type="text"
                                    className="w-full text-xs font-bold border-gray-100 border p-2 mb-2 focus:border-lavrs-red outline-none"
                                    value={getZone(selectedZoneId)?.name}
                                    onChange={(e) => updateZone(selectedZoneId, { name: e.target.value })}
                                    placeholder="Název zóny"
                                />
                            )}
                            <div className="space-y-1">
                                {plan.zones.map(zone => (
                                    <button
                                        key={zone.id}
                                        onClick={() => setSelectedZoneId(zone.id)}
                                        className={`
                      w-full text-left p-3 border flex items-center justify-between group transition-all
                      ${selectedZoneId === zone.id ? 'border-lavrs-red bg-lavrs-beige/20' : 'border-gray-50 bg-gray-50'}
                    `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3" style={{ backgroundColor: zone.color }} />
                                            <span className="text-xs font-bold text-lavrs-dark">{zone.name}</span>
                                        </div>
                                        <Layers size={14} className={selectedZoneId === zone.id ? 'text-lavrs-red' : 'text-gray-300'} />
                                    </button>
                                ))}
                                <button
                                    onClick={addZone}
                                    className="w-full text-left p-3 border border-dashed border-gray-200 text-gray-400 hover:text-lavrs-dark hover:border-lavrs-dark transition-all text-xs font-bold flex items-center gap-2"
                                >
                                    <Plus size={14} /> Přidat zónu
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Capacity and Stats */}
                    <div className="bg-lavrs-dark text-white p-6 space-y-6 shadow-xl">
                        <h3 className="text-xs font-black uppercase tracking-widest border-b border-white/10 pb-3 flex items-center gap-2">
                            <Users size={14} /> Obsazenost zón
                        </h3>

                        <div className="space-y-4">
                            {plan.zones.map(zone => (
                                <div key={zone.id} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold">{zone.name}</span>
                                        <span className="text-[10px] text-white/50">{zone.category}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['S', 'M', 'L'] as SpotSize[]).map(size => {
                                            const { used, total, placedStands } = getCapacityInfo(zone.id, size);
                                            const percent = total > 0 ? (placedStands / total) * 100 : 0;
                                            return (
                                                <div key={size} className="bg-white/5 border border-white/10 p-2 text-center">
                                                    <p className="text-[8px] font-black text-white/40 mb-1">{size}</p>
                                                    <p className="text-xs font-bold">{placedStands}<span className="text-white/30 ml-0.5">/ {total}</span></p>
                                                    <div className="mt-1 w-full h-1 bg-white/10">
                                                        <div className="h-full bg-lavrs-red" style={{ width: `${Math.min(percent, 100)}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Grid Area */}
                <div className="lg:col-span-9 space-y-6">
                    <div className="bg-white border border-gray-100 p-1 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                        {/* Grid Header */}
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">ŽIVÝ PLÁN</span>
                                </div>
                                <span className="h-4 w-px bg-gray-200" />
                                <div className="text-[10px] font-bold text-gray-400">
                                    GRID: {plan.gridSize.width} x {plan.gridSize.height} | CELKEM STÁNKŮ: {plan.stands.length}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-gray-400 hover:text-lavrs-dark"><Maximize2 size={16} /></button>
                                <button className="p-2 text-gray-400 hover:text-lavrs-dark"><Filter size={16} /></button>
                            </div>
                        </div>

                        {/* The Grid */}
                        <div className="flex-1 p-8 bg-gray-100/30 overflow-auto">
                            <div
                                className="grid mx-auto bg-white border border-gray-200 shadow-2xl transition-all"
                                style={{
                                    gridTemplateColumns: `repeat(${plan.gridSize.width}, minmax(40px, 1fr))`,
                                    width: 'fit-content',
                                    minWidth: '100%'
                                }}
                            >
                                {renderGrid()}
                            </div>
                        </div>
                    </div>

                    {/* Stand Operations Panel (Overlay when selected) */}
                    {selectedStandId && (
                        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 animate-fadeIn">
                            <div className="bg-lavrs-dark text-white p-6 shadow-2xl border border-white/10 flex items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 border-2 border-white/20 flex flex-col items-center justify-center p-2">
                                        <span className="text-[10px] font-black text-white/40 mb-1">STÁNEK</span>
                                        <span className="text-xl font-black">{plan.stands.find(s => s.id === selectedStandId)?.size}</span>
                                    </div>

                                    <div>
                                        {getOccupant(plan.stands.find(s => s.id === selectedStandId)!) ? (
                                            <>
                                                <h4 className="text-xl font-bold flex items-center gap-2">
                                                    {getOccupant(plan.stands.find(s => s.id === selectedStandId)!)?.brandName}
                                                    <CheckCircle2 size={16} className="text-green-500" />
                                                </h4>
                                                <p className="text-xs text-white/60 font-medium">
                                                    {getOccupant(plan.stands.find(s => s.id === selectedStandId)!)?.contactPerson} · {getOccupant(plan.stands.find(s => s.id === selectedStandId)!)?.phone}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <h4 className="text-xl font-bold text-white/40 italic">Neobsazeno</h4>
                                                <p className="text-xs text-white/40">Zóna: {getZone(plan.stands.find(s => s.id === selectedStandId)!.zoneId)?.name}</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    {getOccupant(plan.stands.find(s => s.id === selectedStandId)!) ? (
                                        <button
                                            onClick={() => removeExhibitor(selectedStandId)}
                                            className="px-6 py-3 border border-white/20 text-white font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                                        >
                                            Uvolnit stánek
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowExhibitorList(true)}
                                            className="px-6 py-3 bg-white text-lavrs-dark font-black hover:bg-lavrs-red hover:text-white transition-all flex items-center gap-2"
                                        >
                                            <Users size={16} /> Přiřadit vystavovatele
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteStand(selectedStandId)}
                                        className="p-3 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <button
                                        onClick={() => setSelectedStandId(null)}
                                        className="p-3 bg-white/10 text-white/40 hover:text-white transition-all"
                                    >
                                        <Plus size={20} className="rotate-45" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Exhibitor Selection Modal */}
            {showExhibitorList && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-lavrs-dark/80 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl relative">
                        <button
                            onClick={() => setShowExhibitorList(false)}
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-lavrs-red"
                        >
                            <Plus size={24} className="rotate-45" />
                        </button>

                        <div className="p-8 border-b border-gray-100 bg-lavrs-beige/10">
                            <h3 className="text-2xl font-black text-lavrs-dark mb-4 uppercase tracking-tight">Výběr vystavovatele</h3>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Hledat podle názvu značky, osoby nebo kategorie..."
                                    className="w-full pl-12 pr-6 py-4 border border-gray-200 focus:border-lavrs-red outline-none shadow-inner"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {unplacedExhibitors.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <AlertCircle size={48} className="mb-4 opacity-20" />
                                    <p className="font-bold">Žádní schválení vystavovatelé k dispozici</p>
                                    <p className="text-sm">Všichni schválení vystavovatelé jsou již umístěni nebo zatím nejsou schválení.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {unplacedExhibitors
                                        .filter(app => app.brandName.toLowerCase().includes(searchTerm.toLowerCase()) || app.zoneCategory?.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(app => (
                                            <div
                                                key={app.id}
                                                className="group border border-gray-100 p-4 hover:border-lavrs-dark hover:bg-lavrs-beige/10 transition-all flex items-center justify-between gap-4 cursor-pointer"
                                                onClick={() => assignExhibitor(selectedStandId!, app.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-lavrs-pink flex items-center justify-center font-bold text-lavrs-red">
                                                        {app.brandName[0]}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-lavrs-dark group-hover:text-lavrs-red transition-colors">{app.brandName}</h5>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-black uppercase text-gray-400">{app.zoneCategory}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                            <span className={`text-[10px] font-black uppercase ${app.zone === plan.stands.find(s => s.id === selectedStandId)?.size ? 'text-green-600' : 'text-amber-600'}`}>
                                                                Požadováno: {app.zone}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button className="p-2 bg-gray-50 text-gray-400 group-hover:bg-lavrs-dark group-hover:text-white transition-all">
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50">
                            <button
                                onClick={() => setShowExhibitorList(false)}
                                className="px-8 py-3 bg-white border border-gray-200 text-gray-500 font-bold hover:bg-gray-100 transition-all uppercase text-xs"
                            >
                                Zavřít
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Exhibitor List Table (Below the Plan) */}
            <div className="bg-white border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="text-xl font-bold text-lavrs-dark">Seznam všech vystavovatelů</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Kompletní přehled přihlášek pro tuto akci</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400 pr-6 border-r border-gray-100">
                            <div className="flex flex-col items-center">
                                <span className="text-lavrs-dark text-lg leading-tight">{placedExhibitors.length}</span>
                                <span>Umístěno</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-lavrs-red text-lg leading-tight">{unplacedExhibitors.length}</span>
                                <span>K umístění</span>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 text-lavrs-red text-xs font-bold uppercase tracking-widest hover:underline">
                            <Download size={14} /> Export XLS
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                                <th className="px-8 py-4">Vystavovatel</th>
                                <th className="px-8 py-4">Kategorie</th>
                                <th className="px-8 py-4">Požadovaný Spot</th>
                                <th className="px-8 py-4">Reálný Spot</th>
                                <th className="px-8 py-4">Stav Umístění</th>
                                <th className="px-8 py-4">Stav Platby</th>
                                <th className="px-8 py-4 text-right">Akce</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {propApplications.map(app => {
                                const stand = plan.stands.find(s => s.occupantId === app.id);
                                return (
                                    <tr key={app.id} className="group hover:bg-lavrs-beige/10 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                    {app.brandName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-lavrs-dark">{app.brandName}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">{app.contactPerson}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-600">
                                                {app.zoneCategory}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 font-black text-sm text-lavrs-dark">{app.zone}</td>
                                        <td className="px-8 py-6">
                                            {stand ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-sm text-lavrs-red">{stand.size}</span>
                                                    <span className="text-[10px] items-center gap-1 font-bold text-gray-400 px-1.5 py-0.5 border border-gray-100">
                                                        {getZone(stand.zoneId)?.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 italic text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            {stand ? (
                                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase">
                                                    <CheckCircle2 size={12} /> Umístěno
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase">
                                                    <AlertCircle size={12} /> Neumístěno
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider ${app.status === AppStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {app.status === AppStatus.PAID ? 'Zaplaceno' : 'Čeká na platbu'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 text-gray-400 hover:text-lavrs-dark">
                                                <Info size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Help / Info */}
            <div className="bg-lavrs-beige/20 border-l-4 border-lavrs-red p-6 flex items-start gap-4">
                <div className="p-2 bg-lavrs-red text-white flex-shrink-0">
                    <Info size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-lavrs-dark mb-1 underline decoration-lavrs-red/30">Nápověda pro plánování</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Vyberte nástroj pro umístění stánku (S, M nebo L) a klikněte do mřížky. Poté klikněte na umístěný stánek a přiřaďte mu schváleného vystavovatele.
                        Systém automaticky hlídá kapacity jednotlivých zón. Pro smazání stánku použijte nástroj "Smazat" nebo křížek v detailu stánku.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EventLayoutManager;
