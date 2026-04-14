import React, { useState, useCallback } from 'react';
import { Instagram, Globe, Mail, Phone, Building, MapPin, Calendar, User, Package, CheckCircle, ChevronDown, ChevronUp, Search, Heart, Camera, Image, Trash2, Archive } from 'lucide-react';
import { Application, AppStatus, ZoneCategory, MarketEvent, BrandProfile } from '../types';
import ImageLightbox from './ImageLightbox';

interface ApprovedApplicationsProps {
  onBack: () => void;
  events: MarketEvent[];
  applications: Application[];
  brandProfiles?: BrandProfile[];
  onTrashBrand?: (brandProfileId: string, brandName: string) => Promise<void>;
  onNavigateToTrash?: () => void;
  trashedCount?: number;
}

const ApprovedApplicationsInner: React.FC<ApprovedApplicationsProps> = ({ onBack, events, applications, brandProfiles, onTrashBrand, onNavigateToTrash, trashedCount = 0 }) => {
  const normalizeStatus = (status?: string) => (status || '').toString().toUpperCase();
  const [trashConfirm, setTrashConfirm] = useState<{ id: string; name: string } | null>(null);
  const [trashing, setTrashing] = useState(false);

  // Create a map for O(1) event lookups
  const eventsMap = React.useMemo(() => {
    const map = new Map<string, MarketEvent>();
    events.forEach(e => map.set(e.id, e));
    return map;
  }, [events]);

  // Map brand name (lowercase) to brand profile for gallery lookup
  const brandProfileMap = React.useMemo(() => {
    const map = new Map<string, BrandProfile>();
    (brandProfiles || []).forEach(bp => map.set(bp.brandName.toLowerCase(), bp));
    return map;
  }, [brandProfiles]);

  // Filter only approved and paid applications
  const approvedApplications = applications.filter(a => {
    const s = normalizeStatus(a.status);
    return s === AppStatus.APPROVED || s === AppStatus.PAID;
  });

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | string>('ALL');
  const [selectedEventId, setSelectedEventId] = useState<'ALL' | string>('ALL');

  const selectedApp = approvedApplications.find(a => a.id === selectedAppId) || null;

  // Get unique categories and events
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    approvedApplications.forEach(app => {
      if (app.zoneCategory) cats.add(app.zoneCategory);
    });
    return Array.from(cats).sort();
  }, [approvedApplications]);

  const eventsList = React.useMemo(() => {
    const evts = new Map<string, MarketEvent>();
    approvedApplications.forEach(app => {
      const event = events.find(e => e.id === app.eventId);
      if (event) evts.set(event.id, event);
    });
    return Array.from(evts.values()).sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
  }, [approvedApplications, events]);

  const filtered = React.useMemo(() => {
    return approvedApplications.filter(app => {
      // Search filter
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesQuery =
          app.brandName.toLowerCase().includes(q) ||
          (app.contactPerson || '').toLowerCase().includes(q) ||
          (app.email || '').toLowerCase().includes(q) ||
          (eventsMap.get(app.eventId)?.title || '').toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && app.zoneCategory !== selectedCategory) return false;

      // Event filter
      if (selectedEventId !== 'ALL' && app.eventId !== selectedEventId) return false;

      return true;
    });
  }, [approvedApplications, query, selectedCategory, selectedEventId, eventsMap]);

  const getEventDetails = React.useCallback((eventId: string) => {
    return eventsMap.get(eventId);
  }, [eventsMap]);

  const getZoneCategoryLabel = (category?: ZoneCategory) => category || 'Neuvedeno';

  const getStatusBadge = (status: AppStatus) => {
    switch (normalizeStatus(status)) {
      case AppStatus.APPROVED:
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Schváleno' };
      case AppStatus.PAID:
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Zaplaceno' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Neznámý stav' };
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('cs-CZ');
    } catch (e) {
      return iso;
    }
  };

  const formatEventDateLong = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) return dateStr;
      return parsed.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr || '';
    }
  };

  const approvedCount = applications.filter(a => normalizeStatus(a.status) === AppStatus.APPROVED).length;
  const paidCount = applications.filter(a => normalizeStatus(a.status) === AppStatus.PAID).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-lavrs-dark mb-1 md:mb-2">Aktivní přihlášky</h2>
          <p className="text-sm md:text-base text-gray-500">Přehled schválených a zaplacených přihlášek ({filtered.length})</p>
        </div>
        <div className="flex items-center gap-3">
          {onNavigateToTrash && (
            <button
              onClick={onNavigateToTrash}
              className="relative flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-100 text-gray-500 hover:border-lavrs-red hover:text-lavrs-red transition-all text-sm font-bold shadow-sm"
              title="Koš smazaných značek"
            >
              <Trash2 size={16} />
              <span className="hidden md:inline">Koš</span>
              {trashedCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-lavrs-red text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                  {trashedCount}
                </span>
              )}
            </button>
          )}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lavrs-red transition-colors" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hledat značku, kontakt, event..."
              className="pl-12 pr-6 py-3 bg-white border-2 border-gray-100 rounded-none focus:outline-none focus:border-lavrs-red transition-all text-sm w-full md:w-64 shadow-sm"
            />
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
        {/* Category Filter */}
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 md:px-5 py-2 rounded-none text-[11px] font-bold uppercase tracking-wider transition-all border-2 whitespace-nowrap ${selectedCategory === 'ALL'
              ? 'border-lavrs-red text-lavrs-red bg-white'
              : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:text-lavrs-dark'}`}
          >
            Všechny
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 md:px-5 py-2 rounded-none text-[11px] font-bold uppercase tracking-wider transition-all border-2 whitespace-nowrap ${selectedCategory === cat
                ? 'border-lavrs-red text-lavrs-red bg-white'
                : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:text-lavrs-dark'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Event Filter */}
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="px-4 md:px-5 py-2 rounded-none text-sm font-semibold border-2 border-gray-100 bg-white text-gray-700 focus:outline-none focus:border-lavrs-red transition-all shadow-sm w-full md:w-auto md:shrink-0"
        >
          <option value="ALL">Všechny eventy</option>
          {eventsList.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} ({formatEventDateLong(event.date)})
            </option>
          ))}
        </select>
      </div>

      {/* Mobile: Card layout */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-100 p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
            Nic nenalezeno
          </div>
        ) : (
          filtered.map((app) => {
            const statusInfo = getStatusBadge(app.status);
            const event = getEventDetails(app.eventId);
            const isSelected = selectedAppId === app.id;
            return (
              <div key={app.id} className={`bg-white border shadow-sm overflow-hidden ${isSelected ? 'border-lavrs-red/30' : 'border-gray-100'}`}>
                <button
                  onClick={() => setSelectedAppId(isSelected ? null : app.id)}
                  className="w-full p-4 text-left flex items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lavrs-dark truncate">{app.brandName}</span>
                      <Heart size={12} className="text-lavrs-red fill-lavrs-red shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                      <span className="truncate">{event?.title || '—'}</span>
                      <span>·</span>
                      <span className="shrink-0">{getZoneCategoryLabel(app.zoneCategory)}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-none text-[9px] font-bold uppercase shrink-0 ${statusInfo.bg} ${statusInfo.text}`}>
                    {statusInfo.label}
                  </span>
                  {isSelected ? <ChevronUp size={16} className="text-lavrs-red shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </button>

                {isSelected && (
                  <div className="p-4 pt-0 space-y-4 border-t border-gray-100 mt-0">
                    {/* Brand header */}
                    <div className="flex items-center gap-3 pt-4">
                      {(() => {
                        const bp = brandProfileMap.get(app.brandName.toLowerCase());
                        return bp?.logoUrl ? (
                          <div className="w-12 h-12 rounded-none overflow-hidden border border-gray-200 shrink-0">
                            <img src={bp.logoUrl} alt={app.brandName} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-none bg-lavrs-red flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
                            {app.brandName[0]}
                          </div>
                        );
                      })()}
                      <div className="min-w-0">
                        <h3 className="text-lg font-extrabold text-lavrs-dark truncate">{app.brandName}</h3>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 border border-gray-100">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Event</p>
                        <p className="font-semibold text-lavrs-dark text-xs">{event?.title || '—'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 border border-gray-100">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Datum</p>
                        <p className="font-semibold text-lavrs-dark text-xs">{formatEventDateLong(event?.date) || '—'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 border border-gray-100">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Kategorie</p>
                        <p className="font-semibold text-lavrs-dark text-xs">{getZoneCategoryLabel(app.zoneCategory)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 border border-gray-100">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Podáno</p>
                        <p className="font-semibold text-lavrs-dark text-xs">{formatDate(app.submittedAt)}</p>
                      </div>
                    </div>

                    {/* Web & Social */}
                    {(app.instagram || app.website) && (
                      <div className="space-y-2">
                        <p className="text-[9px] text-gray-400 uppercase font-bold">Web a sociální sítě</p>
                        <div className="grid grid-cols-1 gap-2">
                          {app.instagram && (
                            <div className="bg-gray-50 p-3 border border-gray-100 flex items-center gap-2">
                              <Instagram size={14} className="text-gray-400 shrink-0" />
                              <a href={`https://www.instagram.com/${app.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gray-700 hover:text-lavrs-red transition-colors truncate">
                                {app.instagram}
                              </a>
                            </div>
                          )}
                          {app.website && (
                            <div className="bg-gray-50 p-3 border border-gray-100 flex items-center gap-2">
                              <Globe size={14} className="text-gray-400 shrink-0" />
                              <a href={app.website.startsWith('http') ? app.website : `https://${app.website}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gray-700 hover:text-lavrs-red transition-colors truncate">
                                {app.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact */}
                    <div className="space-y-2">
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Kontakt</p>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="bg-gray-50 p-3 border border-gray-100 flex items-center gap-2">
                          <User size={14} className="text-gray-400 shrink-0" />
                          <span className="text-xs font-semibold text-gray-700 truncate">{app.contactPerson || '—'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 border border-gray-100 flex items-center gap-2">
                          <Mail size={14} className="text-gray-400 shrink-0" />
                          <span className="text-xs font-semibold text-gray-700 truncate">{app.email || '—'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 border border-gray-100 flex items-center gap-2">
                          <Phone size={14} className="text-gray-400 shrink-0" />
                          <span className="text-xs font-semibold text-gray-700">{app.phone || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Billing */}
                    <div className="space-y-2">
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Fakturace</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 p-3 border border-gray-100">
                          <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Firma</p>
                          <p className="text-xs font-semibold text-gray-700 truncate">{app.billingName || '—'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 border border-gray-100">
                          <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">IČO</p>
                          <p className="text-xs font-semibold text-gray-700">{app.ic || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Brand Gallery */}
                    {(() => {
                      const bp = brandProfileMap.get(app.brandName.toLowerCase());
                      const gallery = bp?.galleryUrls || [];
                      if (gallery.length === 0) return null;
                      return (
                        <div className="space-y-2">
                          <p className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1.5"><Camera size={12} /> Fotogalerie značky</p>
                          <div className="grid grid-cols-3 gap-2">
                            {gallery.map((url, i) => (
                              <div key={url} className="aspect-square bg-gray-50 border border-gray-100 overflow-hidden cursor-pointer" onClick={() => setLightbox({ images: gallery, index: i })}>
                                <img src={url} alt={`${app.brandName} ${i + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Trash brand action (mobile) */}
                    {onTrashBrand && (() => {
                      const bp = brandProfileMap.get(app.brandName.toLowerCase());
                      if (!bp) return null;
                      return (
                        <div className="pt-3 border-t border-gray-200 flex justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); setTrashConfirm({ id: bp.id, name: app.brandName }); }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100 transition-all text-[10px] font-bold uppercase tracking-wider"
                          >
                            <Trash2 size={12} />
                            Přesunout do koše
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block bg-white border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-lavrs-beige/50 text-gray-500 text-[10px] uppercase tracking-widest border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 w-[25%]">Značka</th>
              <th className="text-left px-6 py-4 w-[20%]">Kontakt</th>
              <th className="text-left px-6 py-4 w-[22%]">Event</th>
              <th className="text-left px-6 py-4 w-[13%]">Kategorie</th>
              <th className="text-left px-6 py-4 w-[12%]">Stav</th>
              <th className="w-[8%]"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-400 font-bold uppercase tracking-widest" colSpan={6}>
                  Nic nenalezeno
                </td>
              </tr>
            ) : (
              filtered.map((app) => {
                const statusInfo = getStatusBadge(app.status);
                const event = getEventDetails(app.eventId);
                const isSelected = selectedAppId === app.id;
                return (
                  <React.Fragment key={app.id}>
                    <tr
                      onClick={() => setSelectedAppId(isSelected ? null : app.id)}
                      className={`border-t border-gray-50 hover:bg-lavrs-beige/20 transition-colors cursor-pointer ${isSelected ? 'bg-lavrs-beige/30' : ''}`}
                    >
                      <td className="px-6 py-4 overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="font-bold text-lavrs-dark truncate">{app.brandName}</div>
                          {(normalizeStatus(app.status) === AppStatus.APPROVED || normalizeStatus(app.status) === AppStatus.PAID) && (
                            <Heart size={14} className="text-lavrs-red fill-lavrs-red shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">{app.instagram || app.website || '—'}</div>
                      </td>
                      <td className="px-6 py-4 overflow-hidden">
                        <div className="font-semibold text-gray-700 truncate">{app.contactPerson || '—'}</div>
                        <div className="text-[11px] text-gray-400 truncate">{app.email || '—'}</div>
                      </td>
                      <td className="px-6 py-4 overflow-hidden">
                        <div className="font-semibold text-gray-700 truncate">{event?.title || '—'}</div>
                        <div className="text-[11px] text-gray-400 truncate">{formatEventDateLong(event?.date)}</div>
                      </td>
                      <td className="px-6 py-4 overflow-hidden font-semibold text-gray-700 truncate">{getZoneCategoryLabel(app.zoneCategory)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-none text-[9px] font-bold uppercase ${statusInfo.bg} ${statusInfo.text}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isSelected ? <ChevronUp size={18} className="text-lavrs-red" /> : <ChevronDown size={18} className="text-gray-400" />}
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isSelected && (
                      <tr className="border-t-2 border-lavrs-red/20">
                        <td colSpan={6} className="px-6 py-8 bg-lavrs-beige/10">
                          <div className="max-w-5xl mx-auto space-y-6">
                            {/* Brand Header */}
                            <div className="flex items-start gap-6">
                              {(() => {
                                const bp = brandProfileMap.get(app.brandName.toLowerCase());
                                return bp?.logoUrl ? (
                                  <div className="w-20 h-20 rounded-none overflow-hidden border border-gray-200 shrink-0">
                                    <img src={bp.logoUrl} alt={app.brandName} className="w-full h-full object-contain" />
                                  </div>
                                ) : (
                                  <div className="w-20 h-20 rounded-none bg-lavrs-red flex items-center justify-center text-white font-black text-3xl shadow-lg shrink-0">
                                    {app.brandName[0]}
                                  </div>
                                );
                              })()}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-2xl font-extrabold text-lavrs-dark mb-0">{app.brandName}</h3>
                              </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Event</p>
                                <p className="font-semibold text-lavrs-dark">{event?.title || '—'}</p>
                              </div>
                              <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Datum</p>
                                <p className="font-semibold text-lavrs-dark">{formatEventDateLong(event?.date) || '—'}</p>
                              </div>
                              <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Místo</p>
                                <p className="font-semibold text-lavrs-dark">{event?.location || '—'}</p>
                              </div>
                              <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Kategorie zóny</p>
                                <p className="font-semibold text-lavrs-dark">{getZoneCategoryLabel(app.zoneCategory)}</p>
                              </div>
                              <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Stav</p>
                                <div className={`inline-block px-3 py-1 rounded-none text-[9px] font-bold uppercase ${getStatusBadge(app.status).bg} ${getStatusBadge(app.status).text}`}>
                                  {getStatusBadge(app.status).label}
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Podáno</p>
                                <p className="font-semibold text-lavrs-dark">{formatDate(app.submittedAt)}</p>
                              </div>
                            </div>

                            {/* Web & Social */}
                            {(app.instagram || app.website) && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-3">Web a sociální sítě</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {app.instagram && (
                                    <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Instagram</p>
                                      <a href={`https://www.instagram.com/${app.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-lavrs-dark hover:text-lavrs-red transition-colors flex items-center gap-1.5">
                                        <Instagram size={16} /> {app.instagram}
                                      </a>
                                    </div>
                                  )}
                                  {app.website && (
                                    <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Web</p>
                                      <a href={app.website.startsWith('http') ? app.website : `https://${app.website}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-lavrs-dark hover:text-lavrs-red transition-colors flex items-center gap-1.5 truncate">
                                        <Globe size={16} className="shrink-0" /> {app.website}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {app.brandDescription && (
                              <div className="bg-white p-5 rounded-none border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Popis značky</p>
                                <p className="text-sm leading-relaxed text-gray-700">{app.brandDescription}</p>
                              </div>
                            )}

                            {/* Contact Information */}
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold mb-3">Kontaktní údaje</p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Osoba</p>
                                  <p className="font-semibold text-gray-700">{app.contactPerson || '—'}</p>
                                </div>
                                <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Email</p>
                                  <p className="font-semibold text-gray-700 truncate">{app.email || '—'}</p>
                                </div>
                                <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Telefon</p>
                                  <p className="font-semibold text-gray-700">{app.phone || '—'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Billing Information */}
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold mb-3">Fakturační údaje</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Firma</p>
                                  <p className="font-semibold text-gray-700">{app.billingName || '—'}</p>
                                </div>
                                <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">IČO</p>
                                  <p className="font-semibold text-gray-700">{app.ic || '—'}</p>
                                </div>
                                {app.dic && (
                                  <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">DIČ</p>
                                    <p className="font-semibold text-gray-700">{app.dic}</p>
                                  </div>
                                )}
                                <div className={`bg-white p-4 rounded-none border border-gray-100 shadow-sm ${app.dic ? '' : 'sm:col-span-2'}`}>
                                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Adresa</p>
                                  <p className="font-semibold text-gray-700">{app.billingAddress || '—'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Brand Gallery */}
                            {(() => {
                              const bp = brandProfileMap.get(app.brandName.toLowerCase());
                              const gallery = bp?.galleryUrls || [];
                              if (gallery.length === 0) return null;
                              return (
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-3 flex items-center gap-1.5"><Camera size={14} /> Fotogalerie značky</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                    {gallery.map((url, i) => (
                                      <div key={url} className="aspect-square bg-white border border-gray-100 shadow-sm overflow-hidden rounded-none cursor-pointer" onClick={() => setLightbox({ images: gallery, index: i })}>
                                        <img src={url} alt={`${app.brandName} ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Trash brand action */}
                            {onTrashBrand && (() => {
                              const bp = brandProfileMap.get(app.brandName.toLowerCase());
                              if (!bp) return null;
                              return (
                                <div className="pt-4 border-t border-gray-200 flex justify-end">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setTrashConfirm({ id: bp.id, name: app.brandName }); }}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 transition-all text-xs font-bold uppercase tracking-wider"
                                  >
                                    <Trash2 size={14} />
                                    Přesunout do koše
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          currentIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(i) => setLightbox({ ...lightbox, index: i })}
        />
      )}

      {/* Trash confirmation dialog */}
      {trashConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !trashing && setTrashConfirm(null)}>
          <div className="bg-white p-8 shadow-2xl max-w-md w-full mx-4 border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-extrabold text-lavrs-dark">Přesunout do koše?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Značka <strong className="text-lavrs-dark">{trashConfirm.name}</strong> a všechny její přihlášky budou přesunuty do koše.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Značku můžete později obnovit nebo trvale smazat v sekci Koš.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setTrashConfirm(null)}
                disabled={trashing}
                className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 hover:border-gray-300 transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                Zrušit
              </button>
              <button
                onClick={async () => {
                  if (!onTrashBrand || trashing) return;
                  setTrashing(true);
                  try {
                    await onTrashBrand(trashConfirm.id, trashConfirm.name);
                    setTrashConfirm(null);
                    setSelectedAppId(null);
                  } catch (err) {
                    console.error('Trash brand failed:', err);
                    alert('Přesunutí do koše selhalo.');
                  } finally {
                    setTrashing(false);
                  }
                }}
                disabled={trashing}
                className="px-5 py-2.5 bg-red-600 text-white hover:bg-red-700 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
              >
                {trashing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mažu...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Přesunout do koše
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Error Boundary
class ApprovedApplicationsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : 'Neznámá chyba';
    console.error('ApprovedApplications error:', message);
    return { hasError: true, error: message };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('ApprovedApplications crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border border-red-200 p-8 shadow-sm rounded-none">
          <h3 className="text-xl font-bold text-red-700 mb-2">Chyba při načítání aktivních přihlášek</h3>
          <p className="text-sm text-gray-600">{this.state.error}</p>
          <p className="text-xs text-gray-400 mt-3">Prosím zkuste stránku znovu načíst.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Memoize to prevent unnecessary re-renders when parent updates
const ApprovedApplications = React.memo(ApprovedApplicationsInner);

export default (props: React.ComponentProps<typeof ApprovedApplications>) => (
  <ApprovedApplicationsErrorBoundary>
    <ApprovedApplications {...props} />
  </ApprovedApplicationsErrorBoundary>
);
