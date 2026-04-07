import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Plus, Trash2, Users, Map as MapIcon, MousePointer2,
    Grid3X3, CheckCircle2, AlertCircle,
    ChevronLeft, Info, Download,
    Search, Maximize2, Save,
    Calendar, MapPin, Image as ImageIcon, Type, Camera,
    XCircle, Clock, CreditCard, X, BarChart3, TrendingUp, PieChart,
    Lock, FileImage, FileText
} from 'lucide-react';
import { Zone, Stand, SpotSize, ZoneCategory, Application, AppStatus, EventPlan, Category } from '../types';
import { useEvents } from '../hooks/useSupabase';
import { dbEventToApp, formatEventDateRange } from '../lib/mappers';

interface EventLayoutManagerProps {
    eventId: string;
    onBack: () => void;
    applications: Application[];
    onUpdateApplication?: (updatedApp: Application) => void;
    initialPlan?: EventPlan;
    initialPlans?: EventPlan[];
    onSavePlan: (plan: EventPlan) => Promise<void> | void;
    onSavePlans?: (plans: EventPlan[]) => Promise<void> | void;
    categories: Category[];
}

const DEFAULT_GRID_WIDTH = 24;
const DEFAULT_GRID_HEIGHT = 16;
const CATEGORY_COLORS = ['#EF4444', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#6B7280', '#14B8A6'];

// Build auto-zones from categories (one zone per category, deterministic colors)
function buildAutoZones(categories: Category[]): Zone[] {
    return categories.map((cat, i) => ({
        id: `auto-zone-${cat.id}`,
        name: cat.name,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        category: cat.id,
        capacities: {},
        capacity: 0,
    }));
}

// Remap stands from old zones to auto-zones based on category
function remapStandsToAutoZones(stands: Stand[], oldZones: Zone[], autoZones: Zone[]): Stand[] {
    const categoryToAutoZoneId = new Map(autoZones.map(z => [z.category, z.id]));
    const oldZoneCategoryMap = new Map(oldZones.map(z => [z.id, z.category]));
    return stands.map(s => {
        if (categoryToAutoZoneId.has(s.zoneId)) return s; // already mapped
        const oldCategory = oldZoneCategoryMap.get(s.zoneId);
        const newZoneId = oldCategory ? categoryToAutoZoneId.get(oldCategory) : null;
        return newZoneId ? { ...s, zoneId: newZoneId } : s;
    });
}

const EventLayoutManagerInner: React.FC<EventLayoutManagerProps> = ({
    eventId,
    onBack,
    applications: allApplications,
    onUpdateApplication,
    initialPlan,
    initialPlans,
    onSavePlan,
    onSavePlans,
    categories
}) => {
    const normalizedEventId = React.useMemo(() => (eventId || '').trim().toLowerCase(), [eventId]);
    const propApplications = React.useMemo(
        () => allApplications.filter(app =>
            app.status === AppStatus.PAID &&
            ((app.eventId || '').trim().toLowerCase() === normalizedEventId)
        ),
        [allApplications, normalizedEventId]
    );

    const { events: dbEvents, updateEvent, uploadEventImage, uploadEventFloorplan } = useEvents();
    const events = React.useMemo(() => dbEvents.map(dbEventToApp), [dbEvents]);
    const currentEvent = events.find(e => e.id === eventId);

    const autoZones = React.useMemo(() => buildAutoZones(categories), [categories]);

    const makeEmptyPlan = (name: string): EventPlan => ({
        id: `plan-${eventId}-${Date.now()}`,
        name,
        eventId,
        gridSize: { width: DEFAULT_GRID_WIDTH, height: DEFAULT_GRID_HEIGHT },
        layoutMeta: {
            backgroundImageUrl: '',
            backgroundOpacity: 0.35,
            cellSize: 28,
            originOffset: { x: 0, y: 0 }
        },
        zones: autoZones,
        stands: [],
        prices: {},
        equipment: {},
        categorySizes: {},
        extras: []
    });

    // Initialize plans from props
    const initPlans = (): EventPlan[] => {
        if (initialPlans && initialPlans.length > 0) {
            return initialPlans.map(p => ({
                ...p,
                zones: autoZones,
                stands: remapStandsToAutoZones(p.stands, p.zones, autoZones),
            }));
        }
        if (initialPlan) {
            return [{
                ...initialPlan,
                zones: autoZones,
                stands: remapStandsToAutoZones(initialPlan.stands, initialPlan.zones, autoZones),
            }];
        }
        return [makeEmptyPlan('Plán 1')];
    };

    const [plans, setPlans] = useState<EventPlan[]>(initPlans);
    const [activePlanIdx, setActivePlanIdx] = useState(0);

    // Derived plan + setPlan wrapper (keeps all existing setPlan calls working)
    const plan = plans[activePlanIdx] || plans[0] || makeEmptyPlan('Plán 1');
    const setPlan = React.useCallback((updater: EventPlan | ((prev: EventPlan) => EventPlan)) => {
        setPlans(prev => prev.map((p, i) => i === activePlanIdx ? (typeof updater === 'function' ? updater(p) : updater) : p));
    }, [activePlanIdx]);

    // When initialPlans arrives after mount (async load), update state once
    const [planInitialized, setPlanInitialized] = useState(!!(initialPlans?.length || initialPlan));
    useEffect(() => {
        if (!planInitialized && (initialPlans?.length || initialPlan)) {
            const newPlans = initPlans();
            setPlans(newPlans);
            setPlanInitialized(true);
        }
    }, [initialPlan, initialPlans, planInitialized]);

    const [activeTab, setActiveTab] = useState<'info' | 'layout' | 'pricing' | 'exhibitors' | 'stats'>('info');
    const [eventDetails, setEventDetails] = useState({
        title: currentEvent?.title || '',
        date: currentEvent?.date || '',
        endDate: currentEvent?.endDate || '',
        location: currentEvent?.location || '',
        description: currentEvent?.description || 'LAVRS market je výběrový prodejní event, který propojuje lokální tvůrce, vintage shopy a milovníky udržitelné módy.',
        image: currentEvent?.image || 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80',
        status: currentEvent?.status === 'closed' ? 'waitlist' : (currentEvent?.status || 'draft')
    });
    const [eventDateType, setEventDateType] = useState<'single' | 'multi'>(currentEvent?.endDate ? 'multi' : 'single');
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(autoZones[0]?.id || null);
    const [activeTool, setActiveTool] = useState<'select' | 'place' | 'erase'>('select');
    const [selectedStandId, setSelectedStandId] = useState<string | null>(null);
    const [showExhibitorList, setShowExhibitorList] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [exhibitorFilter, setExhibitorFilter] = useState<string>('ALL');
    const [dateInput, setDateInput] = useState<string>('');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const floorplanInputRef = useRef<HTMLInputElement | null>(null);
    const [layoutZoom, setLayoutZoom] = useState(1);
    const [isPainting, setIsPainting] = useState(false);
    const hasUserSetEndDate = useRef(false);
    const lastSavedEndDate = useRef<string>('');

    // Synchronize eventDetails with currentEvent when it changes
    useEffect(() => {
        if (currentEvent) {
            setEventDetails(prev => {
                let finalEndDate = currentEvent.endDate || lastSavedEndDate.current || (hasUserSetEndDate.current ? prev.endDate : '');
                finalEndDate = normalizeDateFormat(finalEndDate);
                return {
                    title: currentEvent.title || '',
                    date: currentEvent.date || '',
                    endDate: finalEndDate,
                    location: currentEvent.location || '',
                    description: currentEvent.description || 'LAVRS market je výběrový prodejní event, který propojuje lokální tvůrce, vintage shopy a milovníky udržitelné módy.',
                    image: currentEvent.image || 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80',
                    status: currentEvent.status === 'closed' ? 'waitlist' : (currentEvent.status || 'draft')
                };
            });
            setEventDateType(prev => (currentEvent.endDate || hasUserSetEndDate.current) ? 'multi' : 'single');
        }
    }, [currentEvent]);

    useEffect(() => {
        setPlan(prev => ({
            ...prev,
            zones: autoZones,
            layoutMeta: {
                backgroundImageUrl: prev.layoutMeta?.backgroundImageUrl || '',
                backgroundOpacity: typeof prev.layoutMeta?.backgroundOpacity === 'number' ? prev.layoutMeta.backgroundOpacity : 0.35,
                cellSize: typeof prev.layoutMeta?.cellSize === 'number' ? prev.layoutMeta.cellSize : 28,
                originOffset: {
                    x: typeof prev.layoutMeta?.originOffset?.x === 'number' ? prev.layoutMeta.originOffset.x : 0,
                    y: typeof prev.layoutMeta?.originOffset?.y === 'number' ? prev.layoutMeta.originOffset.y : 0
                }
            },
            stands: prev.stands.map(s => ({
                ...s,
                widthCells: 1,
                heightCells: 1,
                rotation: 0 as const,
                locked: false
            }))
        }));
    }, []);

    const normalizeDateFormat = (dateStr: string | undefined): string => {
        if (!dateStr) return '';
        dateStr = dateStr.trim();
        if (!dateStr) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return '';
        }
    };

    const normalizedLayoutMeta = useMemo(() => ({
        backgroundImageUrl: plan.layoutMeta?.backgroundImageUrl || '',
        backgroundOpacity: typeof plan.layoutMeta?.backgroundOpacity === 'number' ? plan.layoutMeta.backgroundOpacity : 0.35,
        cellSize: typeof plan.layoutMeta?.cellSize === 'number' ? plan.layoutMeta.cellSize : 28,
        originOffset: {
            x: typeof plan.layoutMeta?.originOffset?.x === 'number' ? plan.layoutMeta.originOffset.x : 0,
            y: typeof plan.layoutMeta?.originOffset?.y === 'number' ? plan.layoutMeta.originOffset.y : 0
        }
    }), [plan.layoutMeta]);

    const updateLayoutMeta = (updates: Partial<NonNullable<EventPlan['layoutMeta']>>) => {
        setPlan(prev => ({
            ...prev,
            layoutMeta: {
                ...normalizedLayoutMeta,
                ...updates,
                originOffset: {
                    ...normalizedLayoutMeta.originOffset,
                    ...(updates.originOffset || {})
                }
            }
        }));
    };

    const isWithinGrid = (x: number, y: number) => x >= 0 && y >= 0 && x < plan.gridSize.width && y < plan.gridSize.height;

    const occupancyMap = useMemo(() => {
        const map = new Map<string, string>();
        plan.stands.forEach(stand => {
            map.set(`${stand.x}-${stand.y}`, stand.id);
        });
        return map;
    }, [plan.stands]);

    // Memoized helper to prevent re-creation on every render
    const getStandAtCell = React.useCallback((x: number, y: number) => {
        const id = occupancyMap.get(`${x}-${y}`);
        return id ? plan.stands.find(s => s.id === id) || null : null;
    }, [occupancyMap, plan.stands]);

    const toDateInputValue = (dateStr?: string) => {
        if (!dateStr) return '';
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) {
            const normalized = parseCzechDateToIso(dateStr);
            return normalized || '';
        }
        const yyyy = parsed.getFullYear();
        const mm = String(parsed.getMonth() + 1).padStart(2, '0');
        const dd = String(parsed.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const parseCzechDateToIso = (value: string): string | null => {
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        const normalized = trimmed
            .replace(/[–—]/g, '-')
            .replace(/\s+/g, ' ')
            .replace(/(\d)\.(\d)/g, '$1. $2')
            .replace(/(\d{1,2})\.\s*-\s*(\d{1,2})\./g, '$1.');
        const match = normalized.match(/(\d{1,2})\.\s*([^\d]+?)\s+(\d{4})/i);
        if (match) {
            const day = parseInt(match[1], 10);
            const monthStr = match[2].toLowerCase().trim();
            const year = parseInt(match[3], 10);
            const monthMap: Record<string, number> = {
                'leden': 1, 'ledna': 1, 'únor': 2, 'února': 2, 'unor': 2, 'unora': 2,
                'březen': 3, 'března': 3, 'brezen': 3, 'brezna': 3,
                'duben': 4, 'dubna': 4, 'květen': 5, 'května': 5, 'kveten': 5, 'kvetna': 5,
                'červen': 6, 'června': 6, 'cerven': 6, 'cervna': 6,
                'červenec': 7, 'července': 7, 'cervenec': 7, 'cervence': 7,
                'srpen': 8, 'srpna': 8, 'září': 9, 'zari': 9,
                'říjen': 10, 'října': 10, 'rijen': 10, 'rijna': 10,
                'listopad': 11, 'listopadu': 11, 'prosinec': 12, 'prosince': 12,
            };
            const month = monthMap[monthStr];
            if (month && day >= 1 && day <= 31) {
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
        const numericMatch = normalized.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
        if (numericMatch) {
            const day = parseInt(numericMatch[1], 10);
            const month = parseInt(numericMatch[2], 10);
            const year = parseInt(numericMatch[3], 10);
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
        return null;
    };

    useEffect(() => {
        if (!currentEvent) return;
        const nextDateInput = toDateInputValue(currentEvent.date);
        setDateInput(nextDateInput);
    }, [currentEvent]);

    const previewImage =
        eventDetails.image ||
        currentEvent?.image ||
        'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80';

    const formatPriceInput = (value: string) => {
        const cleanValue = value.replace(/[^\d]/g, '');
        if (!cleanValue) return '';
        const formatted = new Intl.NumberFormat('cs-CZ').format(parseInt(cleanValue)).replace(/\s/g, '.');
        return `${formatted} Kč`;
    };

    const unplacedExhibitors = propApplications.filter(app =>
        !plan.stands.some(s => s.occupantId === app.id)
    );

    const placedExhibitors = propApplications.filter(app =>
        plan.stands.some(s => s.occupantId === app.id)
    );

    // Memoized handler to prevent re-creation on every render
    const placeStandAt = React.useCallback((x: number, y: number) => {
        if (activeTool !== 'place' || !selectedZoneId) return;
        if (!isWithinGrid(x, y)) return;
        if (occupancyMap.has(`${x}-${y}`)) return;
        const newStand: Stand = {
            id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            x, y,
            size: SpotSize.M,
            zoneId: selectedZoneId,
            widthCells: 1,
            heightCells: 1,
            rotation: 0,
            locked: false,
            label: `${plan.stands.length + 1}`
        };
        setPlan(prev => ({ ...prev, stands: [...prev.stands, newStand] }));
    }, [activeTool, selectedZoneId, occupancyMap]);

    // Memoized handler to prevent re-creation on every render
    const handleCellClick = React.useCallback((x: number, y: number) => {
        if (activeTool === 'place') {
            placeStandAt(x, y);
            return;
        }
        if (activeTool === 'erase') {
            const stand = getStandAtCell(x, y);
            if (stand) {
                setPlan(prev => ({ ...prev, stands: prev.stands.filter(s => s.id !== stand.id) }));
            }
            return;
        }
        // select mode
        const stand = getStandAtCell(x, y);
        if (stand) {
            setSelectedStandId(stand.id);
            if (!stand.occupantId) {
                setShowExhibitorList(true);
            }
        } else {
            setSelectedStandId(null);
        }
    }, [activeTool, placeStandAt, getStandAtCell]);

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

    // Memoized handler to prevent re-creation on every render
    const deleteStand = React.useCallback((standId: string) => {
        setPlan(prev => ({
            ...prev,
            stands: prev.stands.filter(s => s.id !== standId)
        }));
        setSelectedStandId(null);
    }, []);

    // Memoized helper to prevent re-creation on every render
    const getOccupant = React.useCallback((stand: Stand) => {
        return propApplications.find(app => app.id === stand.occupantId);
    }, [propApplications]);

    // Memoized helper to prevent re-creation on every render
    const getZone = React.useCallback((zoneId: string) => {
        return plan.zones.find(z => z.id === zoneId);
    }, [plan.zones]);

    const focusStandOnMap = (standId: string) => {
        setActiveTab('layout');
        setSelectedStandId(standId);
        setActiveTool('select');
    };

    const selectedStand = selectedStandId ? plan.stands.find(s => s.id === selectedStandId) || null : null;
    const selectedStandOccupant = selectedStand
        ? propApplications.find(app => app.id === selectedStand.occupantId) || null
        : null;

    // Plan management helpers
    const addNewPlan = () => {
        const newPlan = makeEmptyPlan(`Plán ${plans.length + 1}`);
        setPlans(prev => [...prev, newPlan]);
        setActivePlanIdx(plans.length);
    };

    const renamePlan = (idx: number, name: string) => {
        setPlans(prev => prev.map((p, i) => i === idx ? { ...p, name } : p));
    };

    const removePlan = (idx: number) => {
        if (plans.length <= 1) return;
        setPlans(prev => prev.filter((_, i) => i !== idx));
        setActivePlanIdx(prev => prev >= idx ? Math.max(0, prev - 1) : prev);
    };

    // Category count per plan (no limits)
    const getCategoryStandCount = (categoryId: string) => {
        const zoneId = `auto-zone-${categoryId}`;
        return plan.stands.filter(s => s.zoneId === zoneId).length;
    };

    const totalStands = plan.stands.length;

    const validation = useMemo(() => {
        const collisions: string[] = [];
        const seen = new Map<string, string>();
        plan.stands.forEach(stand => {
            const key = `${stand.x}-${stand.y}`;
            if (seen.has(key) && seen.get(key) !== stand.id) {
                collisions.push(key);
            }
            seen.set(key, stand.id);
        });

        return { collisions, capacityOverflows: [] as string[] };
    }, [plan.stands]);

    useEffect(() => {
        const onMouseUp = () => setIsPainting(false);
        window.addEventListener('mouseup', onMouseUp);
        return () => window.removeEventListener('mouseup', onMouseUp);
    }, []);

    // Memoized grid rendering - avoid recalculating 144+ cells on every render
    // Only recalculate when actual data changes, not on every parent re-render
    const renderGrid = React.useMemo(() => {
        const cells = [];
        for (let y = 0; y < plan.gridSize.height; y++) {
            for (let x = 0; x < plan.gridSize.width; x++) {
                const stand = getStandAtCell(x, y);
                const occupant = stand ? getOccupant(stand) : null;
                const zone = stand ? getZone(stand.zoneId) : null;

                cells.push(
                    <div
                        key={`${x}-${y}`}
                        onClick={() => handleCellClick(x, y)}
                        onMouseDown={() => {
                            if (activeTool === 'place') {
                                setIsPainting(true);
                                placeStandAt(x, y);
                            }
                            if (activeTool === 'erase') {
                                setIsPainting(true);
                                const target = getStandAtCell(x, y);
                                if (target) deleteStand(target.id);
                            }
                        }}
                        onMouseEnter={() => {
                            if (!isPainting) return;
                            if (activeTool === 'place') placeStandAt(x, y);
                            if (activeTool === 'erase') {
                                const target = getStandAtCell(x, y);
                                if (target) deleteStand(target.id);
                            }
                        }}
                        onMouseUp={() => setIsPainting(false)}
                        className={`
                            relative aspect-square border border-gray-200/60 flex items-center justify-center transition-all cursor-pointer
                            ${!stand && activeTool === 'place' ? 'hover:bg-lavrs-beige/40' : ''}
                            ${!stand && activeTool === 'erase' ? 'hover:bg-red-50' : ''}
                            ${stand && selectedStandId === stand.id ? 'ring-2 ring-lavrs-red ring-inset z-10' : ''}
                            ${stand ? 'bg-white' : 'bg-transparent'}
                        `}
                    >
                        {stand && (
                            <div
                                className="w-full h-full p-0.5 flex flex-col justify-between overflow-hidden"
                                style={{
                                    borderTop: `3px solid ${zone?.color || '#333'}`,
                                    backgroundColor: `${zone?.color || '#111'}15`
                                }}
                            >
                                <div className="flex-1 flex flex-col justify-center items-center text-center px-0.5">
                                    {occupant ? (
                                        <>
                                            <CheckCircle2 size={8} className="text-green-500 mb-0.5" />
                                            <p className="text-[7px] font-bold leading-tight line-clamp-2 text-lavrs-dark">{occupant.brandName}</p>
                                        </>
                                    ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
        }
        return cells;
    }, [plan.gridSize, plan.stands, plan.zones, propApplications, activeTool, selectedStandId, isPainting, handleCellClick, getStandAtCell, getOccupant, getZone, placeStandAt, deleteStand]);

    const drawPlanCanvas = async () => {
        const cell = Math.max(20, normalizedLayoutMeta.cellSize || 28);
        const width = plan.gridSize.width * cell;
        const height = plan.gridSize.height * cell;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height + 120;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (normalizedLayoutMeta.backgroundImageUrl) {
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error('image'));
                    img.src = normalizedLayoutMeta.backgroundImageUrl || '';
                });
                ctx.globalAlpha = Math.min(1, Math.max(0, normalizedLayoutMeta.backgroundOpacity || 0.35));
                ctx.drawImage(img, normalizedLayoutMeta.originOffset?.x || 0, normalizedLayoutMeta.originOffset?.y || 0, width, height);
                ctx.globalAlpha = 1;
            } catch { /* ignore */ }
        }

        ctx.strokeStyle = '#d1d5db';
        for (let x = 0; x <= plan.gridSize.width; x++) {
            ctx.beginPath(); ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, height); ctx.stroke();
        }
        for (let y = 0; y <= plan.gridSize.height; y++) {
            ctx.beginPath(); ctx.moveTo(0, y * cell); ctx.lineTo(width, y * cell); ctx.stroke();
        }

        plan.stands.forEach(stand => {
            const zone = getZone(stand.zoneId);
            const occ = getOccupant(stand);
            const px = stand.x * cell;
            const py = stand.y * cell;
            ctx.fillStyle = `${zone?.color || '#111'}33`;
            ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
            ctx.strokeStyle = zone?.color || '#111';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, cell - 2, cell - 2);
            if (occ) {
                ctx.fillStyle = '#111827';
                ctx.font = '9px sans-serif';
                ctx.fillText(occ.brandName.slice(0, 12), px + 3, py + cell / 2 + 3);
            }
        });

        let legendY = height + 20;
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`${eventDetails.title || 'LAVRS layout'} - legenda`, 10, legendY);
        legendY += 18;
        plan.zones.forEach(zone => {
            ctx.fillStyle = zone.color;
            ctx.fillRect(10, legendY - 10, 10, 10);
            ctx.fillStyle = '#111827';
            ctx.font = '12px sans-serif';
            ctx.fillText(`${zone.name} (${zone.category})`, 26, legendY);
            legendY += 16;
        });
        return canvas;
    };

    const exportPng = async () => {
        const canvas = await drawPlanCanvas();
        if (!canvas) return;
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${(eventDetails.title || 'lavrs-plan').replace(/\s+/g, '-').toLowerCase()}.png`;
        link.click();
    };

    const exportPdf = async () => {
        const canvas = await drawPlanCanvas();
        if (!canvas) return;
        const image = canvas.toDataURL('image/png');
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`<html><body style="margin:0"><img src="${image}" style="width:100%;height:auto"/></body></html>`);
        w.document.close();
        w.focus();
        w.print();
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
                            <h2 className="text-4xl font-extrabold tracking-tight text-lavrs-dark">LAVRS market · {currentEvent?.date ? formatEventDateRange(currentEvent.date, currentEvent?.endDate) : ''}</h2>
                        </div>
                    </div>
                </div>

                <button
                    onClick={async () => {
                        if (validation.collisions.length > 0) {
                            alert('Nelze uložit: plánek obsahuje kolize stánků.');
                            return;
                        }
                        try {
                            if (typeof eventDetails.image === 'string' && /^data:/i.test(eventDetails.image.trim())) {
                                alert('Náhledový obrázek eventu je ve formátu data URL. Nahrajte ho prosím přes tlačítko "Změnit", aby se uložil do Supabase Storage jako URL.');
                                return;
                            }


                            const savePayload = {
                                title: eventDetails.title,
                                date: eventDetails.date,
                                end_date: eventDetails.endDate && eventDetails.endDate.trim() ? eventDetails.endDate : null,
                                location: eventDetails.location,
                                description: eventDetails.description,
                                image: eventDetails.image && eventDetails.image.trim() ? eventDetails.image : null,
                                status: eventDetails.status as any
                            };

                            await updateEvent(eventId, savePayload);

                            lastSavedEndDate.current = eventDetails.endDate || '';
                            setEventDateType(eventDetails.endDate ? 'multi' : 'single');

                            if (onSavePlans) {
                                await onSavePlans(plans.map(p => ({
                                    ...p,
                                    layoutMeta: p === plan ? normalizedLayoutMeta : p.layoutMeta,
                                    stands: p.stands.map(s => ({
                                        ...s,
                                        widthCells: 1,
                                        heightCells: 1,
                                        rotation: 0 as const,
                                        locked: false
                                    }))
                                })));
                            } else if (onSavePlan) {
                                await onSavePlan({
                                    ...plan,
                                    layoutMeta: normalizedLayoutMeta,
                                    stands: plan.stands.map(s => ({
                                        ...s,
                                        widthCells: 1,
                                        heightCells: 1,
                                        rotation: 0 as const,
                                        locked: false
                                    }))
                                });
                            }

                            setIsSaved(true);
                            setTimeout(() => setIsSaved(false), 2000);
                        } catch (error: any) {
                            console.error('Error saving event:', error);
                            const msg = error?.message || error?.details || (typeof error === 'string' ? error : JSON.stringify(error));
                            alert('Chyba při ukládání: ' + msg);
                        }
                    }}
                    className={`${isSaved ? 'bg-green-600' : 'bg-lavrs-dark'} text-white px-8 py-4 font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg min-w-[160px] justify-center`}
                >
                    {isSaved ? (
                        <><CheckCircle2 size={18} /> Uloženo!</>
                    ) : (
                        <><Save size={18} /> Uložit změny</>
                    )}
                </button>
            </header>

            {/* Tab Switcher */}
            <div className="flex border-b border-gray-200 bg-white">
                {[
                    { id: 'info', label: 'Základní info' },
                    { id: 'layout', label: 'Plán rozmístění' },
                    { id: 'pricing', label: 'Ceník a Extra' },
                    { id: 'exhibitors', label: 'Seznam vystavovatelů' },
                    { id: 'stats', label: 'Statistiky' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-lavrs-red border-b-2 border-lavrs-red bg-white' : 'text-gray-400 hover:text-lavrs-dark'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════
                ZÁKLADNÍ INFO TAB
            ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'info' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-3 space-y-6">
                            <div className="bg-white border border-gray-100 p-8 shadow-sm space-y-8">
                                <h3 className="text-xs font-black uppercase tracking-widest text-lavrs-dark border-b border-gray-100 pb-4 flex items-center gap-2">
                                    <Type size={14} className="text-lavrs-red" /> Podrobnosti akce
                                </h3>

                                <div className="space-y-8">
                                    {/* Status Selector */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Stav eventu</label>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            {[
                                                { id: 'draft', label: 'Nezveřejněno', icon: XCircle },
                                                { id: 'open', label: 'Otevřeno', icon: CheckCircle2 },
                                                { id: 'waitlist', label: 'Waitlist', icon: Clock },
                                                { id: 'soldout', label: 'Vyprodáno', icon: Lock }
                                            ].map((status) => (
                                                <button
                                                    key={status.id}
                                                    onClick={() => {
                                                        setEventDetails(prev => ({ ...prev, status: status.id as any }));
                                                    }}
                                                    className={`flex items-center justify-center gap-3 py-3 px-4 border-2 transition-all ${eventDetails.status === status.id
                                                        ? 'border-lavrs-red bg-lavrs-red/5'
                                                        : 'border-gray-100 hover:border-gray-200 bg-white'
                                                        }`}
                                                >
                                                    <status.icon size={16} className={eventDetails.status === status.id ? 'text-lavrs-red' : 'text-gray-400'} />
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${eventDetails.status === status.id ? 'text-lavrs-dark' : 'text-gray-400'}`}>
                                                        {status.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-gray-50">
                                        <div className="lg:col-span-4 space-y-3">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Náhledové foto (16:9)</label>
                                            <div className="aspect-video bg-gray-50 border border-gray-100 flex flex-col items-center justify-center relative group overflow-hidden">
                                                {previewImage ? (
                                                    <>
                                                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-lavrs-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => fileInputRef.current?.click()}
                                                                className="bg-white text-lavrs-dark px-3 py-1.5 font-bold text-[9px] uppercase tracking-widest flex items-center gap-2"
                                                            >
                                                                <Camera size={12} /> {isUploadingImage ? 'Nahrávám...' : 'Změnit'}
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <ImageIcon size={24} className="mx-auto text-gray-200 mb-2" />
                                                        <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Nahrát (16:9)</p>
                                                    </div>
                                                )}
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        setIsUploadingImage(true);
                                                        setUploadError(null);
                                                        try {
                                                            const { url } = await uploadEventImage(file, eventId);
                                                            setEventDetails(prev => ({ ...prev, image: url }));
                                                        } catch (err) {
                                                            console.error('Image upload failed', err);
                                                            const msg = err instanceof Error ? err.message : 'Nahrání obrázku se nezdařilo.';
                                                            setUploadError(msg);
                                                        } finally {
                                                            setIsUploadingImage(false);
                                                            e.currentTarget.value = '';
                                                        }
                                                    }}
                                                />
                                                {uploadError && (
                                                    <p className="mt-3 text-[10px] text-red-500 font-semibold">{uploadError}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Název události</label>
                                                <div className="relative">
                                                    <Type size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                                    <input type="text" value={eventDetails.title} onChange={(e) => setEventDetails(prev => ({ ...prev, title: e.target.value }))}
                                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 focus:border-lavrs-red outline-none font-bold text-lavrs-dark transition-all text-sm" placeholder="Název akce" />
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Typ eventu</label>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { setEventDateType('single'); hasUserSetEndDate.current = false; setEventDetails(prev => ({ ...prev, endDate: '' })); }}
                                                            className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${eventDateType === 'single' ? 'bg-lavrs-dark text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Jednodenní</button>
                                                        <button onClick={() => setEventDateType('multi')}
                                                            className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${eventDateType === 'multi' ? 'bg-lavrs-dark text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Vícedenní</button>
                                                    </div>
                                                </div>
                                                <div className={`grid ${eventDateType === 'multi' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">{eventDateType === 'multi' ? 'Od dne' : 'Datum'}</label>
                                                        <div className="relative">
                                                            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                                            <input type="date" value={eventDetails.date} onChange={(e) => setEventDetails(prev => ({ ...prev, date: e.target.value }))}
                                                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 focus:border-lavrs-red outline-none font-bold text-lavrs-dark transition-all text-sm" />
                                                        </div>
                                                    </div>
                                                    {(eventDateType === 'multi' || eventDetails.endDate) && (
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Do dne</label>
                                                            <div className="relative">
                                                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                                                <input type="date" value={eventDetails.endDate || ''}
                                                                    onChange={(e) => { hasUserSetEndDate.current = true; setEventDetails(prev => ({ ...prev, endDate: e.target.value })); }}
                                                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 focus:border-lavrs-red outline-none font-bold text-lavrs-dark transition-all text-sm" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Místo</label>
                                                <div className="relative">
                                                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                                    <input type="text" value={eventDetails.location} onChange={(e) => setEventDetails(prev => ({ ...prev, location: e.target.value }))}
                                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 focus:border-lavrs-red outline-none font-bold text-lavrs-dark transition-all text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-4 border-t border-gray-50">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Popis pro vystavovatele (perex)</label>
                                        <textarea rows={3} value={eventDetails.description} onChange={(e) => setEventDetails(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full p-4 bg-gray-50 border border-gray-100 focus:border-lavrs-red outline-none font-medium text-sm text-gray-600 leading-relaxed transition-all resize-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-lavrs-beige/20 border-l-4 border-lavrs-red p-6 flex items-start gap-6">
                        <div className="p-3 bg-lavrs-red text-white flex-shrink-0"><Info size={24} /></div>
                        <div className="space-y-2">
                            <h4 className="font-bold text-lavrs-dark text-lg">Proč na detailech záleží?</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Informace, které zde vyplníte, jsou tím prvním, co vystavovatel uvidí, když se rozhoduje o přihlášení na vaši akci.
                                Jasný popis, atraktivní fotka a přesná lokalita pomáhají budovat důvěru a profesionální dojem značky LAVRS.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                PLÁN ROZMÍSTĚNÍ TAB (SIMPLIFIED)
            ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'layout' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Toolbar */}
                        <div className="lg:col-span-3 space-y-6">
                            <div className="bg-white border border-gray-100 p-6 space-y-6 shadow-sm">
                                <h3 className="text-xs font-black uppercase tracking-widest text-lavrs-dark border-b border-gray-100 pb-3 flex items-center gap-2">
                                    <Grid3X3 size={14} className="text-lavrs-red" /> Nástroje
                                </h3>

                                {/* Tool Buttons */}
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'select' as const, label: 'Výběr', icon: MousePointer2 },
                                        { id: 'place' as const, label: 'Umístit', icon: Plus },
                                        { id: 'erase' as const, label: 'Smazat', icon: Trash2 },
                                    ].map(tool => (
                                        <button
                                            key={tool.id}
                                            onClick={() => setActiveTool(tool.id)}
                                            className={`flex flex-col items-center justify-center p-3 border transition-all text-[10px] font-bold uppercase tracking-wider gap-2 ${
                                                activeTool === tool.id
                                                    ? 'bg-lavrs-dark text-white border-lavrs-dark shadow-md'
                                                    : 'bg-white text-gray-500 border-gray-100 hover:border-lavrs-red hover:text-lavrs-red'
                                            }`}
                                        >
                                            <tool.icon size={16} />
                                            {tool.label}
                                        </button>
                                    ))}
                                </div>

                                {activeTool === 'place' && !selectedZoneId && (
                                    <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 border border-amber-100">
                                        Nejprve vyberte zónu, do které chcete umisťovat.
                                    </p>
                                )}

                                {/* Grid Size */}
                                <div className="space-y-2 border-t border-gray-100 pt-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Velikost mřížky (fix 16:9)</p>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={FIXED_GRID_WIDTH} disabled
                                            className="w-16 text-center text-sm font-bold border border-gray-200 py-1 bg-gray-100 text-gray-500 cursor-not-allowed" />
                                        <span className="text-gray-400 font-bold">×</span>
                                        <input type="number" value={FIXED_GRID_HEIGHT} disabled
                                            className="w-16 text-center text-sm font-bold border border-gray-200 py-1 bg-gray-100 text-gray-500 cursor-not-allowed" />
                                    </div>
                                </div>

                                {/* Zoom + Export */}
                                <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
                                    <button onClick={() => setLayoutZoom(prev => Math.max(0.5, Number((prev - 0.1).toFixed(2))))}
                                        className="px-2 py-1.5 text-[10px] font-bold border border-gray-200">-</button>
                                    <span className="text-[10px] font-black text-gray-500 w-10 text-center">{Math.round(layoutZoom * 100)}%</span>
                                    <button onClick={() => setLayoutZoom(prev => Math.min(2.5, Number((prev + 0.1).toFixed(2))))}
                                        className="px-2 py-1.5 text-[10px] font-bold border border-gray-200">+</button>
                                    <div className="flex-1" />
                                    <button onClick={exportPng} className="px-2 py-1.5 text-[10px] font-black uppercase border border-gray-200 hover:border-lavrs-red flex items-center gap-1">
                                        <FileImage size={11} /> PNG
                                    </button>
                                    <button onClick={exportPdf} className="px-2 py-1.5 text-[10px] font-black uppercase border border-gray-200 hover:border-lavrs-red flex items-center gap-1">
                                        <FileText size={11} /> PDF
                                    </button>
                                </div>

                                {/* Floorplan Background */}
                                <div className="space-y-2 border-t border-gray-100 pt-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Podklad mapy</p>
                                    <button type="button" onClick={() => floorplanInputRef.current?.click()}
                                        className="w-full py-2 px-3 text-[10px] font-bold border border-gray-200 hover:border-lavrs-red flex items-center justify-center gap-2">
                                        <ImageIcon size={12} /> {normalizedLayoutMeta.backgroundImageUrl ? 'Změnit floorplan' : 'Nahrát floorplan'}
                                    </button>
                                    <input ref={floorplanInputRef} type="file" accept="image/*" className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setIsUploadingImage(true);
                                            setUploadError(null);
                                            try {
                                                const { url } = await uploadEventFloorplan(file, eventId);
                                                updateLayoutMeta({ backgroundImageUrl: url });
                                            } catch (err) {
                                                const msg = err instanceof Error ? err.message : 'Nahrání floorplanu selhalo.';
                                                setUploadError(msg);
                                            } finally {
                                                setIsUploadingImage(false);
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                    <label className="text-[9px] font-bold uppercase text-gray-400">Opacity: {Math.round((normalizedLayoutMeta.backgroundOpacity || 0) * 100)}%</label>
                                    <input type="range" min={0} max={100}
                                        value={Math.round((normalizedLayoutMeta.backgroundOpacity || 0) * 100)}
                                        onChange={(e) => updateLayoutMeta({ backgroundOpacity: Number(e.target.value) / 100 })}
                                        className="w-full" />
                                </div>

                                {/* Zone Management */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-gray-50/50 p-2 border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {selectedZoneId ? `Editace: ${getZone(selectedZoneId)?.name}` : 'Správa zón'}
                                        </p>
                                        <button onClick={addZone} className="text-lavrs-red hover:bg-lavrs-red/10 p-1.5 transition-colors" title="Přidat novou zónu">
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    {selectedZoneId && (
                                        <div className="bg-white border-2 border-lavrs-dark/5 p-4 space-y-4 shadow-sm">
                                            <div className="grid grid-cols-4 gap-2">
                                                {['#EF4444', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#6B7280', '#000000'].map(c => (
                                                    <button key={c} onClick={() => updateZone(selectedZoneId, { color: c })}
                                                        className={`h-6 w-full transition-transform active:scale-90 ${getZone(selectedZoneId)?.color === c ? 'ring-2 ring-offset-1 ring-lavrs-dark scale-110 z-10' : 'opacity-70 hover:opacity-100'}`}
                                                        style={{ backgroundColor: c }} />
                                                ))}
                                            </div>

                                            <div className="space-y-3 pt-2">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Název zóny</label>
                                                    <input type="text"
                                                        className="w-full text-sm font-bold border-gray-100 border-b-2 p-2 focus:border-lavrs-red outline-none bg-gray-50/30 transition-all"
                                                        value={getZone(selectedZoneId)?.name}
                                                        onChange={(e) => updateZone(selectedZoneId, { name: e.target.value })}
                                                        placeholder="Např. Hlavní sál" />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Kategorie značek</label>
                                                    <select
                                                        className="w-full text-[10px] font-black uppercase border-gray-100 border-b-2 p-2 focus:border-lavrs-red outline-none bg-gray-50/30 tracking-widest cursor-pointer"
                                                        value={getZone(selectedZoneId)?.category}
                                                        onChange={(e) => updateZone(selectedZoneId, { category: e.target.value as ZoneCategory })}>
                                                        {categories.map(cat => (
                                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Kapacita (max. míst)</label>
                                                    <input type="number" min={0}
                                                        className="w-full text-sm font-bold border-gray-100 border-b-2 p-2 focus:border-lavrs-red outline-none bg-gray-50/30 transition-all"
                                                        value={getZone(selectedZoneId)?.capacity ?? 0}
                                                        onChange={(e) => updateZone(selectedZoneId, { capacity: parseInt(e.target.value) || 0 })} />
                                                </div>
                                            </div>

                                            <button onClick={() => deleteZone(selectedZoneId)}
                                                className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
                                                <Trash2 size={12} /> Odstranit zónu
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-2">
                                        {plan.zones.map(zone => {
                                            const info = getCapacityInfo(zone.id);
                                            const pct = info.total > 0 ? (info.placed / info.total) * 100 : 0;
                                            return (
                                                <button
                                                    key={zone.id}
                                                    onClick={() => setSelectedZoneId(zone.id)}
                                                    className={`group relative w-full text-left p-4 border-l-4 transition-all overflow-hidden ${
                                                        selectedZoneId === zone.id
                                                            ? 'bg-white shadow-md border-lavrs-red scale-[1.02] z-10'
                                                            : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:border-gray-300'
                                                    }`}
                                                    style={{ borderLeftColor: zone.color }}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-sm font-bold text-lavrs-dark leading-none mb-1">{zone.name}</h4>
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{zone.category}</p>
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-400">{info.placed}/{info.total}</span>
                                                    </div>
                                                    <div className="mt-3 h-1 w-full bg-gray-200">
                                                        <div className="h-full transition-all duration-500"
                                                            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 100 ? '#EF4444' : zone.color }} />
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Capacity Summary */}
                            <div className="bg-lavrs-dark text-white p-6 space-y-4 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><BarChart3 size={80} /></div>
                                <header className="flex justify-between items-center border-b border-white/10 pb-3">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-lavrs-red animate-pulse" /> Přehled
                                    </h3>
                                </header>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-2xl font-black">{plan.stands.length}<span className="text-white/20 text-sm ml-2">/ {totalCapacitySlots}</span></p>
                                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">Umístěno / Kapacita</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-green-400">
                                            {plan.zones.reduce((acc, z) => acc + getCapacityInfo(z.id).free, 0)}
                                        </p>
                                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">Volných míst</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Grid Area */}
                        <div className="lg:col-span-9 space-y-6">
                            <div className="bg-white border border-gray-100 p-4 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                                {/* Grid Header */}
                                <div className="p-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">ŽIVÝ PLÁN</span>
                                        </div>
                                        <span className="h-4 w-px bg-gray-200" />
                                        <div className="text-[10px] font-bold text-gray-400">
                                            GRID: {plan.gridSize.width} x {plan.gridSize.height} | CELKEM MÍST: {plan.stands.length} | OBSAZENO: {placedExhibitors.length}
                                        </div>
                                    </div>
                                </div>

                                {/* The Grid */}
                                <div className="flex-1 p-4 bg-gray-100/30 overflow-auto">
                                    <div
                                        className="grid mx-auto bg-white border border-gray-200 shadow-lg transition-all"
                                        style={{
                                            gridTemplateColumns: `repeat(${plan.gridSize.width}, minmax(${normalizedLayoutMeta.cellSize || 28}px, 1fr))`,
                                            width: 'fit-content',
                                            minWidth: '100%',
                                            transform: `scale(${layoutZoom})`,
                                            transformOrigin: 'top left',
                                            backgroundImage: normalizedLayoutMeta.backgroundImageUrl ? `linear-gradient(rgba(255,255,255,${1 - (normalizedLayoutMeta.backgroundOpacity || 0.35)}), rgba(255,255,255,${1 - (normalizedLayoutMeta.backgroundOpacity || 0.35)})), url(${normalizedLayoutMeta.backgroundImageUrl})` : undefined,
                                            backgroundSize: 'cover',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: `${normalizedLayoutMeta.originOffset?.x || 0}px ${normalizedLayoutMeta.originOffset?.y || 0}px`
                                        }}
                                    >
                                        {renderGrid}
                                    </div>
                                </div>
                            </div>

                            {(validation.collisions.length > 0 || validation.capacityOverflows.length > 0) && (
                                <div className="bg-amber-50 border border-amber-200 p-4 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Validace plánku</p>
                                    {validation.collisions.length > 0 && (
                                        <p className="text-xs text-amber-800">Kolize buněk: {validation.collisions.length}</p>
                                    )}
                                    {validation.capacityOverflows.length > 0 && (
                                        <p className="text-xs text-amber-800">Překročené kapacity: {validation.capacityOverflows.join(', ')}</p>
                                    )}
                                </div>
                            )}

                            {/* Stand Detail Panel */}
                            {selectedStandId && selectedStand && (
                                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 animate-fadeIn">
                                    <div className="bg-lavrs-dark text-white p-6 shadow-2xl border border-white/10 flex items-center justify-between gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 border-2 border-white/20 flex items-center justify-center"
                                                style={{ borderColor: getZone(selectedStand.zoneId)?.color }}>
                                                <div className="w-6 h-6" style={{ backgroundColor: getZone(selectedStand.zoneId)?.color + '40' }} />
                                            </div>

                                            <div>
                                                {selectedStandOccupant ? (
                                                    <>
                                                        <h4 className="text-xl font-bold flex items-center gap-2">
                                                            {selectedStandOccupant.brandName}
                                                            <CheckCircle2 size={16} className="text-green-500" />
                                                        </h4>
                                                        <p className="text-xs text-white/60 font-medium">
                                                            {selectedStandOccupant.contactPerson} · {getZone(selectedStand.zoneId)?.name}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <h4 className="text-xl font-bold text-white/40 italic">Neobsazeno</h4>
                                                        <p className="text-xs text-white/40">Zóna: {getZone(selectedStand.zoneId)?.name}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            {selectedStandOccupant ? (
                                                <button onClick={() => removeExhibitor(selectedStandId)}
                                                    className="px-6 py-3 border border-white/20 text-white font-bold hover:bg-white/10 transition-all flex items-center gap-2">
                                                    Uvolnit místo
                                                </button>
                                            ) : (
                                                <button onClick={() => setShowExhibitorList(true)}
                                                    className="px-6 py-3 bg-white text-lavrs-dark font-black hover:bg-lavrs-red hover:text-white transition-all flex items-center gap-2">
                                                    <Users size={16} /> Přiřadit vystavovatele
                                                </button>
                                            )}
                                            <button onClick={() => deleteStand(selectedStandId)}
                                                className="p-3 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all">
                                                <Trash2 size={20} />
                                            </button>
                                            <button onClick={() => setSelectedStandId(null)}
                                                className="p-3 bg-white/10 text-white/40 hover:text-white transition-all">
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
                                <button onClick={() => setShowExhibitorList(false)}
                                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-lavrs-red">
                                    <Plus size={24} className="rotate-45" />
                                </button>

                                <div className="p-8 border-b border-gray-100 bg-lavrs-beige/10">
                                    <h3 className="text-2xl font-black text-lavrs-dark mb-4 uppercase tracking-tight">Výběr vystavovatele</h3>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="text" placeholder="Hledat podle názvu značky, osoby nebo kategorie..."
                                            className="w-full pl-12 pr-6 py-4 border border-gray-200 focus:border-lavrs-red outline-none shadow-inner"
                                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4">
                                    {unplacedExhibitors.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                            <AlertCircle size={48} className="mb-4 opacity-20" />
                                            <p className="font-bold">Žádní vystavovatelé k dispozici</p>
                                            <p className="text-sm">Všichni vystavovatelé jsou již umístěni nebo zatím nejsou zaplacení.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {unplacedExhibitors
                                                .filter(app => app.brandName.toLowerCase().includes(searchTerm.toLowerCase()) || app.zoneCategory?.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(app => (
                                                    <div key={app.id}
                                                        className="group border border-gray-100 p-4 hover:border-lavrs-dark hover:bg-lavrs-beige/10 transition-all flex items-center justify-between gap-4 cursor-pointer"
                                                        onClick={() => selectedStandId && assignExhibitor(selectedStandId, app.id)}>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-lavrs-pink flex items-center justify-center font-bold text-lavrs-red">
                                                                {app.brandName[0]}
                                                            </div>
                                                            <div>
                                                                <h5 className="font-bold text-lavrs-dark group-hover:text-lavrs-red transition-colors">{app.brandName}</h5>
                                                                <span className="text-[10px] font-black uppercase text-gray-400">{app.zoneCategory}</span>
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
                                    <button onClick={() => setShowExhibitorList(false)}
                                        className="px-8 py-3 bg-white border border-gray-200 text-gray-500 font-bold hover:bg-gray-100 transition-all uppercase text-xs">
                                        Zavřít
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                SEZNAM VYSTAVOVATELŮ TAB
            ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'exhibitors' && (
                <div className="space-y-6">
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
                        <div className="px-8 py-4 border-b border-gray-50 flex flex-wrap gap-2 bg-gray-50/30">
                            <button onClick={() => setExhibitorFilter('ALL')}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all ${exhibitorFilter === 'ALL' ? 'border-lavrs-red text-lavrs-red bg-white shadow-sm' : 'border-transparent text-gray-400 hover:text-lavrs-dark'}`}>
                                Všechny značky
                            </button>
                            {categories.map(cat => (
                                <button key={cat.id} onClick={() => setExhibitorFilter(cat.id)}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all ${exhibitorFilter === cat.id ? 'border-lavrs-red text-lavrs-red bg-white shadow-sm' : 'border-transparent text-gray-400 hover:text-lavrs-dark'}`}>
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                                        <th className="px-8 py-4">Vystavovatel</th>
                                        <th className="px-8 py-4">Kategorie</th>
                                        <th className="px-8 py-4">Zóna</th>
                                        <th className="px-8 py-4">Stav Umístění</th>
                                        <th className="px-8 py-4 text-right">Akce</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {propApplications
                                        .filter(app => exhibitorFilter === 'ALL' || app.zoneCategory === exhibitorFilter)
                                        .map(app => {
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
                                                    <td className="px-8 py-6">
                                                        {stand ? (
                                                            <span className="text-sm font-bold text-lavrs-dark">{getZone(stand.zoneId)?.name || '—'}</span>
                                                        ) : (
                                                            <span className="text-sm text-gray-300">—</span>
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
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            {stand ? (
                                                                <>
                                                                    <button onClick={() => focusStandOnMap(stand.id)}
                                                                        className="px-2 py-1 text-[10px] font-bold border border-gray-200 hover:border-lavrs-red">
                                                                        Najít na mapě
                                                                    </button>
                                                                    <button onClick={() => removeExhibitor(stand.id)}
                                                                        className="px-2 py-1 text-[10px] font-bold border border-amber-200 text-amber-700 hover:bg-amber-50">
                                                                        Uvolnit
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button onClick={() => { setActiveTab('layout'); setShowExhibitorList(true); setSearchTerm(app.brandName); }}
                                                                    className="px-2 py-1 text-[10px] font-bold border border-gray-200 hover:border-lavrs-red">
                                                                    Přiřadit
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-lavrs-beige/20 border-l-4 border-lavrs-red p-6 flex items-start gap-4">
                        <div className="p-2 bg-lavrs-red text-white flex-shrink-0"><Info size={20} /></div>
                        <div>
                            <h4 className="font-bold text-lavrs-dark mb-1 underline decoration-lavrs-red/30">Nápověda</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Přejděte na záložku "Plán rozmístění", vyberte zónu a nástrojem "Umístit" klikněte do mřížky. Poté klikněte na umístěnou kostku a přiřaďte jí vystavovatele.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                CENÍK A EXTRA TAB (unchanged)
            ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'pricing' && (
                <div className="bg-white border border-gray-100 p-12 space-y-12 shadow-sm animate-fadeIn min-h-[600px]">
                    <div className="grid grid-cols-1 gap-12">
                        <div className="space-y-8">
                            <h3 className="text-xl font-black uppercase tracking-tight text-lavrs-dark border-b-2 border-lavrs-red pb-4 flex items-center gap-3">
                                <Maximize2 size={24} className="text-lavrs-red" /> Ceník a vybavení dle kategorií
                            </h3>
                            <div className="grid grid-cols-1 gap-8">
                                {categories.map(cat => {
                                    const category = cat.id;
                                    return (
                                        <div key={category} className="group bg-gray-50/50 hover:bg-white border border-gray-100 p-8 transition-all hover:shadow-xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 py-1 px-4 bg-lavrs-dark text-[9px] font-black text-white uppercase tracking-widest">ID: {category}</div>
                                            <div className="flex flex-col md:flex-row gap-8">
                                                <div className="md:w-1/3 space-y-2">
                                                    <h4 className="text-2xl font-black text-lavrs-dark leading-tight">{cat.name}</h4>
                                                    <p className="text-xs text-gray-400 font-medium italic">"{cat.description}"</p>
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Cena za balíček</label>
                                                        <div className="relative">
                                                            <input type="text" value={plan.prices[category] || ''}
                                                                onChange={(e) => {
                                                                    setPlan(prev => ({ ...prev, prices: { ...prev.prices, [category]: e.target.value } }));
                                                                }}
                                                                className="w-full p-4 border border-gray-200 focus:border-lavrs-red outline-none font-bold text-lg bg-white transition-all shadow-sm"
                                                                placeholder="Např. 2.500 Kč nebo 'domluvou'" />
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2"><CreditCard size={18} className="text-gray-200" /></div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Poznámka ke spotu</label>
                                                        <div className="relative">
                                                            <input type="text" value={plan.categorySizes?.[category] || ''}
                                                                onChange={(e) => setPlan(prev => ({ ...prev, categorySizes: { ...prev.categorySizes, [category]: e.target.value } }))}
                                                                className="w-full p-4 border border-gray-200 focus:border-lavrs-red outline-none font-semibold text-[14px] bg-white transition-all shadow-sm"
                                                                placeholder="Např. 2m stůl, 2 židle, prostor 2×1m" />
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2"><Info size={18} className="text-gray-200" /></div>
                                                        </div>
                                                    </div>
                                                    <div className="sm:col-span-2 pt-4">
                                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-3 tracking-widest">Vybavení v ceně</label>
                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                            {(plan.equipment?.[category] || []).map((item, idx) => (
                                                                <span key={idx} className="bg-white border border-gray-100 text-lavrs-dark px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-3 group/item hover:border-lavrs-red transition-colors shadow-sm">
                                                                    {item}
                                                                    <button onClick={() => {
                                                                        const newEquip = [...(plan.equipment?.[category] || [])];
                                                                        newEquip.splice(idx, 1);
                                                                        setPlan(prev => ({ ...prev, equipment: { ...prev.equipment, [category]: newEquip } }));
                                                                    }} className="text-gray-300 hover:text-lavrs-red transition-colors">
                                                                        <X size={12} strokeWidth={3} />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <input type="text" placeholder="+ Přidat vybavení a stisknout Enter"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                                    const val = e.currentTarget.value.trim();
                                                                    const current = plan.equipment?.[category] || [];
                                                                    if (!current.includes(val)) {
                                                                        setPlan(prev => ({ ...prev, equipment: { ...prev.equipment, [category]: [...current, val] } }));
                                                                    }
                                                                    e.currentTarget.value = '';
                                                                }
                                                            }}
                                                            className="w-full p-3 text-xs border-b-2 border-gray-100 outline-none focus:border-lavrs-red bg-transparent font-medium italic" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b-2 border-lavrs-red pb-4">
                                <h3 className="text-xl font-black uppercase tracking-tight text-lavrs-dark flex items-center gap-3">
                                    <Plus size={24} className="text-lavrs-red" /> Doplňkové vybavení
                                </h3>
                                <button onClick={() => setPlan(prev => ({ ...prev, extras: [...prev.extras, { id: `extra-${Date.now()}`, label: 'Nová položka', price: '0 Kč' }] }))}
                                    className="text-[10px] font-black uppercase tracking-widest text-lavrs-red hover:underline">
                                    + PŘIDAT POLOŽKU
                                </button>
                            </div>
                            <div className="space-y-3">
                                {plan.extras.map((extra, idx) => (
                                    <div key={extra.id} className="flex gap-4 items-start p-4 bg-gray-50 border border-gray-100 group hover:border-lavrs-dark transition-all">
                                        <div className="flex-1 space-y-3">
                                            <input type="text" placeholder="Název (např. Štender)" value={extra.label}
                                                onChange={(e) => {
                                                    const newExtras = [...plan.extras];
                                                    newExtras[idx].label = e.target.value;
                                                    setPlan(prev => ({ ...prev, extras: newExtras }));
                                                }}
                                                className="w-full bg-transparent font-bold text-lavrs-dark outline-none border-b border-transparent focus:border-gray-200" />
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase">CENA</span>
                                                <input type="text" value={extra.price}
                                                    onChange={(e) => {
                                                        const newExtras = [...plan.extras];
                                                        newExtras[idx].price = e.target.value;
                                                        setPlan(prev => ({ ...prev, extras: newExtras }));
                                                    }}
                                                    className="bg-transparent font-black text-lavrs-red outline-none w-24 border-b border-transparent focus:border-red-100" />
                                            </div>
                                        </div>
                                        <button onClick={() => setPlan(prev => ({ ...prev, extras: prev.extras.filter((_, i) => i !== idx) }))}
                                            className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {plan.extras.length === 0 && (
                                    <div className="py-12 text-center border-2 border-dashed border-gray-100 text-gray-400">
                                        <p className="text-sm font-bold">Žádné doplňkové vybavení není definováno.</p>
                                        <p className="text-[10px] uppercase mt-1">Klikněte na "Přidat položku" pro rozšíření ceníku.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-gray-100">
                        <div className="bg-lavrs-beige/20 p-8 border-l-4 border-lavrs-red flex items-start gap-6">
                            <div className="p-3 bg-lavrs-red text-white flex-shrink-0"><Info size={24} /></div>
                            <div>
                                <h4 className="font-bold text-lavrs-dark text-lg mb-2">Jak funguje ceník?</h4>
                                <p className="text-gray-600 leading-relaxed">
                                    Ceny, které zde nastavíte, se <strong>automaticky promítnou do přihlašovacího formuláře</strong> pro vystavovatele u tohoto konkrétního eventu.
                                    Vystavovatel po volbě své kategorie uvidí vaši aktuální cenu a stejně tak se mu nabídne seznam doplňkového vybavení, které zde definujete.
                                    Každé kategorii odpovídá jedna pevně daná konfigurace.
                                    Po uložení se změny ihned projeví u nových přihlášek.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                STATISTIKY TAB
            ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'stats' && (
                <div className="bg-white border border-gray-100 p-8 md:p-12 space-y-12 shadow-sm animate-fadeIn min-h-[600px]">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-lavrs-dark p-6 text-white group hover:scale-[1.02] transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-white/10 text-white"><CreditCard size={20} /></div>
                                <div className="flex items-center gap-1 text-[10px] font-black text-green-400">
                                    <TrendingUp size={12} /> +12%
                                </div>
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">CELKEM VYBRÁNO</h4>
                            <p className="text-2xl font-black">
                                {new Intl.NumberFormat('cs-CZ').format(
                                    propApplications.reduce((acc, app) => acc + parseInt(plan.prices[app.zoneCategory]?.replace(/[^\d]/g, '') || '0'), 0)
                                )} Kč
                            </p>
                            <p className="text-[9px] text-white/30 mt-2 italic font-medium">Pouze ze základního nájemného</p>
                        </div>

                        <div className="bg-gray-50 p-6 border border-gray-100 group hover:border-lavrs-red transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-lavrs-red text-white"><Users size={20} /></div>
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">POČET ZNAČEK</h4>
                            <p className="text-2xl font-black text-lavrs-dark">{propApplications.length}</p>
                            <p className="text-[9px] text-gray-400 mt-2 italic font-medium">Schválení a zaplacení vystavovatelé</p>
                        </div>

                        <div className="bg-gray-50 p-6 border border-gray-100 group hover:border-lavrs-red transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-amber-500 text-white"><PieChart size={20} /></div>
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">OBSAZENOST</h4>
                            <p className="text-2xl font-black text-lavrs-dark">
                                {Math.round((plan.stands.filter(s => s.occupantId).length / (totalCapacitySlots || 1)) * 100)}%
                            </p>
                            <div className="mt-2 w-full h-1 bg-gray-200">
                                <div className="h-full bg-amber-500" style={{ width: `${Math.min((plan.stands.filter(s => s.occupantId).length / (totalCapacitySlots || 1)) * 100, 100)}%` }} />
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 border border-gray-100 group hover:border-lavrs-red transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-lavrs-red text-white"><MapIcon size={20} /></div>
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">VOLNÉ KAPACITY</h4>
                            <p className="text-2xl font-black text-lavrs-dark">
                                {totalCapacitySlots - plan.stands.filter(s => s.occupantId).length}
                            </p>
                            <p className="text-[9px] text-gray-400 mt-2 italic font-medium">Zbývající místa k prodeji</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h3 className="text-lg font-black uppercase tracking-tight text-lavrs-dark border-b-2 border-lavrs-red pb-4 flex items-center gap-3">
                                <BarChart3 size={20} className="text-lavrs-red" /> Zastoupení kategorií
                            </h3>
                            <div className="space-y-4">
                                {categories.map(cat => {
                                    const count = propApplications.filter(app => app.zoneCategory === cat.id).length;
                                    const total = propApplications.length || 1;
                                    const percent = (count / total) * 100;
                                    return (
                                        <div key={cat.id} className="space-y-1.5">
                                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                                                <span className="text-lavrs-dark">{cat.name}</span>
                                                <span className="text-gray-400">{count} značek ({Math.round(percent)}%)</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-50 border border-gray-100 flex overflow-hidden">
                                                <div className="h-full bg-lavrs-dark transition-all duration-500" style={{ width: `${percent}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-black uppercase tracking-tight text-lavrs-dark border-b-2 border-lavrs-red pb-4 flex items-center gap-3">
                                <Maximize2 size={20} className="text-lavrs-red" /> Kapacity a umístění dle zón
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {plan.zones.map(zone => {
                                    const totalZoneCapacity = zone.capacity ?? 0;
                                    const occupiedStands = plan.stands.filter(s => s.zoneId === zone.id && s.occupantId).length;
                                    const occupancyRate = (occupiedStands / (totalZoneCapacity || 1)) * 100;
                                    return (
                                        <div key={zone.id} className="p-4 border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-2 h-10 flex-shrink-0" style={{ backgroundColor: zone.color }} />
                                                <div className="truncate">
                                                    <h4 className="font-black text-xs text-lavrs-dark uppercase">{zone.name}</h4>
                                                    <p className="text-[10px] text-gray-400 font-medium italic truncate">{zone.category}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black text-gray-400 leading-none mb-1">OBSAZENO</p>
                                                    <p className="text-lg font-black text-lavrs-dark leading-none">{occupiedStands}<span className="text-xs text-gray-300 ml-1">/ {totalZoneCapacity}</span></p>
                                                </div>
                                                <div className="w-16 h-16 relative">
                                                    <svg className="w-full h-full transform -rotate-90">
                                                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200" />
                                                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                            strokeDasharray={175.9}
                                                            strokeDashoffset={175.9 - (175.9 * Math.min(occupancyRate, 100)) / 100}
                                                            className="text-lavrs-red" />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center font-black text-[10px]">
                                                        {Math.round(occupancyRate)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="bg-lavrs-dark p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                        <div className="flex-1 space-y-2 text-center md:text-left">
                            <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 justify-center md:justify-start">
                                <TrendingUp className="text-lavrs-red" /> Finanční predikce
                            </h4>
                            <p className="text-sm text-white/50 leading-relaxed max-w-2xl">
                                Tyto statistiky vycházejí z <strong>aktuálně schválených a zaplacených přihlášek</strong> a vašeho nastavení ceníku.
                                Příjmy nezahrnují doplňkové vybavení a extra položky, pokud nebyly přímo součástí základního balíčku.
                            </p>
                        </div>
                        <div className="p-4 border border-white/10 bg-white/5 backdrop-blur-sm text-center min-w-[200px]">
                            <p className="text-[10px] font-black text-white/40 uppercase mb-2">POTENCIÁL AKCE</p>
                            <p className="text-3xl font-black text-white">
                                {new Intl.NumberFormat('cs-CZ').format(
                                    plan.zones.reduce((sum, z) => {
                                        const catPrice = parseInt(plan.prices[z.category]?.replace(/[^\d]/g, '') || '0');
                                        return sum + (catPrice * (z.capacity ?? 0));
                                    }, 0)
                                )} Kč
                            </p>
                            <p className="text-[9px] text-lavrs-red font-black mt-2 uppercase">Při 100% obsazenosti</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const EventLayoutManager = React.memo(EventLayoutManagerInner);

export default EventLayoutManager;
