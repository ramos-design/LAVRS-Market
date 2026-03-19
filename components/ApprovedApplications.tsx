import React, { useState } from 'react';
import { Instagram, Globe, Mail, Phone, Building, MapPin, Calendar, User, Package, CheckCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Application, AppStatus, ZoneCategory, MarketEvent } from '../types';

interface ApprovedApplicationsProps {
  onBack: () => void;
  events: MarketEvent[];
  applications: Application[];
}

const ApprovedApplicationsInner: React.FC<ApprovedApplicationsProps> = ({ onBack, events, applications }) => {
  const normalizeStatus = (status?: string) => (status || '').toString().toUpperCase();

  // Filter only approved and paid applications
  const approvedApplications = applications.filter(a => {
    const s = normalizeStatus(a.status);
    return s === AppStatus.APPROVED || s === AppStatus.PAID;
  });

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
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

  const filtered = approvedApplications.filter(app => {
    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase();
      const matchesQuery =
        app.brandName.toLowerCase().includes(q) ||
        (app.contactPerson || '').toLowerCase().includes(q) ||
        (app.email || '').toLowerCase().includes(q) ||
        (events.find(e => e.id === app.eventId)?.title || '').toLowerCase().includes(q);
      if (!matchesQuery) return false;
    }

    // Category filter
    if (selectedCategory !== 'ALL' && app.zoneCategory !== selectedCategory) return false;

    // Event filter
    if (selectedEventId !== 'ALL' && app.eventId !== selectedEventId) return false;

    return true;
  });

  const getEventDetails = (eventId: string) => {
    return events.find(e => e.id === eventId);
  };

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

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('cs-CZ');
  const formatEventDateLong = (dateStr?: string) => {
    if (!dateStr) return '';
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const approvedCount = applications.filter(a => normalizeStatus(a.status) === AppStatus.APPROVED).length;
  const paidCount = applications.filter(a => normalizeStatus(a.status) === AppStatus.PAID).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-lavrs-dark mb-2">Aktivní přihlášky</h2>
          <p className="text-gray-500">Přehled schválených a zaplacených přihlášek ({filtered.length})</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lavrs-red transition-colors" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat značku, kontakt, event..."
            className="pl-12 pr-6 py-3 bg-white border-2 border-gray-100 rounded-none focus:outline-none focus:border-lavrs-red transition-all text-sm w-64 shadow-sm"
          />
        </div>
      </header>

      {/* Filters */}
      <div className="flex items-center justify-between gap-6">
        {/* Category Filter - Left Side */}
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-5 py-2 rounded-none text-[11px] font-bold uppercase tracking-wider transition-all border-2 whitespace-nowrap ${selectedCategory === 'ALL'
              ? 'border-lavrs-red text-lavrs-red bg-white'
              : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:text-lavrs-dark'}`}
          >
            Všechny
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-none text-[11px] font-bold uppercase tracking-wider transition-all border-2 whitespace-nowrap ${selectedCategory === cat
                ? 'border-lavrs-red text-lavrs-red bg-white'
                : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:text-lavrs-dark'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Event Filter - Right Side */}
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="px-5 py-2 rounded-none text-sm font-semibold border-2 border-gray-100 bg-white text-gray-700 focus:outline-none focus:border-lavrs-red transition-all shadow-sm shrink-0"
        >
          <option value="ALL">Všechny eventy</option>
          {eventsList.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} ({formatEventDateLong(event.date)})
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-lavrs-beige/50 text-gray-500 text-[10px] uppercase tracking-widest border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4">Značka</th>
              <th className="text-left px-6 py-4">Kontakt</th>
              <th className="text-left px-6 py-4">Event</th>
              <th className="text-left px-6 py-4">Kategorie</th>
              <th className="text-left px-6 py-4">Stav</th>
              <th className="w-12"></th>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-lavrs-dark">{app.brandName}</div>
                          {normalizeStatus(app.status) === AppStatus.APPROVED && (
                            <Heart size={14} className="text-lavrs-red fill-lavrs-red shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400">{app.instagram || app.website || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-700">{app.contactPerson || '—'}</div>
                        <div className="text-[11px] text-gray-400">{app.email || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-700">{event?.title || '—'}</div>
                        <div className="text-[11px] text-gray-400">{formatEventDateLong(event?.date)}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{getZoneCategoryLabel(app.zoneCategory)}</td>
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
                              <div className="w-20 h-20 rounded-none bg-lavrs-red flex items-center justify-center text-white font-black text-3xl shadow-lg shrink-0">
                                {app.brandName[0]}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-2xl font-extrabold text-lavrs-dark mb-2">{app.brandName}</h3>
                                <div className="flex gap-4 flex-wrap">
                                  {app.instagram && (
                                    <a href="#" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-lavrs-red transition-colors">
                                      <Instagram size={16} /> {app.instagram}
                                    </a>
                                  )}
                                  {app.website && (
                                    <a href="#" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-lavrs-red transition-colors">
                                      <Globe size={16} /> {app.website}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {/* Event Info */}
                              <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Event</p>
                                <p className="font-semibold text-lavrs-dark">{event?.title || '—'}</p>
                              </div>

                              {/* Date Info */}
                              <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Datum</p>
                                <p className="font-semibold text-lavrs-dark">{formatEventDateLong(event?.date) || '—'}</p>
                              </div>

                              {/* Location */}
                              <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Místo</p>
                                <p className="font-semibold text-lavrs-dark">{event?.location || '—'}</p>
                              </div>

                              {/* Category */}
                              <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Kategorie zóny</p>
                                <p className="font-semibold text-lavrs-dark">{getZoneCategoryLabel(app.zoneCategory)}</p>
                              </div>

                              {/* Status */}
                              <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Stav</p>
                                <div className={`inline-block px-3 py-1 rounded-none text-[9px] font-bold uppercase ${getStatusBadge(app.status).bg} ${getStatusBadge(app.status).text}`}>
                                  {getStatusBadge(app.status).label}
                                </div>
                              </div>

                              {/* Submitted Date */}
                              <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Podáno</p>
                                <p className="font-semibold text-lavrs-dark">{formatDate(app.submittedAt)}</p>
                              </div>
                            </div>

                            {/* Description */}
                            {app.brandDescription && (
                              <div className="bg-white p-5 rounded-none border border-gray-100 shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Popis značky</p>
                                <p className="text-sm leading-relaxed text-gray-700">{app.brandDescription}</p>
                              </div>
                            )}

                            {/* Contact Information */}
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold mb-3">Kontaktní údaje</p>
                              <div className="grid grid-cols-3 gap-4">
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
                              <div className="grid grid-cols-2 gap-4">
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
                                <div className={`bg-white p-4 rounded-none border border-gray-100 shadow-sm ${app.dic ? '' : 'col-span-2'}`}>
                                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Adresa</p>
                                  <p className="font-semibold text-gray-700">{app.billingAddress || '—'}</p>
                                </div>
                              </div>
                            </div>
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
    </div>
  );
};

// Memoize to prevent unnecessary re-renders when parent updates
const ApprovedApplications = React.memo(ApprovedApplicationsInner);

export default ApprovedApplications;
