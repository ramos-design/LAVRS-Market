import React, { useState, useCallback } from 'react';
import { Instagram, Globe, Check, X, Mail, Phone, Building, MapPin, Calendar, User, Package, CheckCircle, XCircle, Clock, CreditCard, Trash2, AlertCircle, Heart } from 'lucide-react';
import { Application, AppStatus, ZoneCategory, MarketEvent } from '../types';
import { DbApplication } from '../lib/database';

interface CuratorModuleProps {
  onBack: () => void;
  events: MarketEvent[];
  applications: Application[];
  planPrices?: Array<{ event_id: string; prices: Record<string, string> }>;
  onUpdateStatus: (id: string, status: AppStatus) => void;
  onUpdateApplication: (id: string, updates: Partial<DbApplication>) => Promise<void>;
  onDeleteApplication: (id: string) => void;
  onRestoreApplication: (id: string) => void;
  onPermanentDeleteAllTrash: () => Promise<void>;
}

const CuratorModuleInner: React.FC<CuratorModuleProps> = ({ onBack, events, applications, planPrices, onUpdateStatus, onUpdateApplication, onDeleteApplication, onRestoreApplication, onPermanentDeleteAllTrash }) => {
  const normalizeStatus = (status?: string) => (status || '').toString().toUpperCase();

  // Create a map for O(1) event lookups instead of O(n) find()
  const eventsMap = React.useMemo(() => {
    const map = new Map<string, MarketEvent>();
    events.forEach(e => map.set(e.id, e));
    return map;
  }, [events]);

  const deletedApplications = applications.filter(a => normalizeStatus(a.status) === AppStatus.DELETED);
  // Filter out applications that are already paid (those move to the event manager)
  const activeApplications = applications.filter(a => {
    const s = normalizeStatus(a.status);
    return s !== AppStatus.PAID && s !== AppStatus.DELETED;
  });

  const [viewMode, setViewMode] = useState<'ACTIVE' | 'TRASH'>('ACTIVE');
  const displayedApplications = viewMode === 'TRASH' ? deletedApplications : activeApplications;
  const displayedIds = React.useMemo(() => displayedApplications.map(app => app.id).join('|'), [displayedApplications]);

  const [selectedAppId, setSelectedAppId] = useState<string | null>(displayedApplications.length > 0 ? displayedApplications[0].id : null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [priceInput, setPriceInput] = useState<string>('');
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceSaved, setPriceSaved] = useState(false);

  React.useEffect(() => {
    if (selectedAppId && displayedApplications.find(a => a.id === selectedAppId)) return;
    setSelectedAppId(displayedApplications.length > 0 ? displayedApplications[0].id : null);
  }, [viewMode, displayedIds, selectedAppId, displayedApplications]);

  const selectedApp = displayedApplications.find(a => a.id === selectedAppId) || (displayedApplications.length > 0 ? displayedApplications[0] : null);

  // Get category price string from plan prices for an application
  const getCategoryPrice = useCallback((app: Application | null): string | null => {
    if (!app?.zoneCategory || !planPrices) return null;
    const plan = planPrices.find(p => p.event_id === app.eventId);
    return plan?.prices?.[app.zoneCategory] || null;
  }, [planPrices]);

  // Parse numeric value from category price string (returns null if non-numeric like "domluvou")
  const parseCategoryPrice = useCallback((priceStr: string | null): number | null => {
    if (!priceStr) return null;
    const digits = priceStr.replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : null;
  }, []);

  // Sync price input when selected application changes
  React.useEffect(() => {
    if (selectedApp?.customPrice != null) {
      setPriceInput(String(selectedApp.customPrice));
    } else {
      // Pre-fill from category price if it's numeric
      const catPrice = getCategoryPrice(selectedApp);
      const numPrice = parseCategoryPrice(catPrice);
      setPriceInput(numPrice ? String(numPrice) : '');
    }
    setPriceSaved(false);
  }, [selectedApp?.id, selectedApp?.customPrice, getCategoryPrice, parseCategoryPrice]);

  const handleSavePrice = useCallback(async () => {
    if (!selectedApp) return;
    const parsed = priceInput.replace(/[^\d]/g, '');
    const value = parsed ? parseInt(parsed, 10) : null;
    setPriceSaving(true);
    try {
      await onUpdateApplication(selectedApp.id, { custom_price: value });
      setPriceSaved(true);
      setTimeout(() => setPriceSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save price:', error);
      alert('Chyba při ukládání částky.');
    } finally {
      setPriceSaving(false);
    }
  }, [selectedApp, priceInput, onUpdateApplication]);

  const handleAction = useCallback(async (id: string, newStatus: AppStatus) => {
    setIsProcessing(true);
    try {
      await onUpdateStatus(id, newStatus);

      // If it becomes PAID, it will be filtered out, so select next one
      if (newStatus === AppStatus.PAID) {
        const currentIndex = activeApplications.findIndex(a => a.id === id);
        if (currentIndex < activeApplications.length - 1) {
          setSelectedAppId(activeApplications[currentIndex + 1].id);
        } else if (activeApplications.length > 1) {
          setSelectedAppId(activeApplications[0].id);
        } else {
          setSelectedAppId(null);
        }
      } else {
        // Just stay or move to next
        const currentIndex = activeApplications.findIndex(a => a.id === id);
        if (currentIndex < activeApplications.length - 1) {
          setSelectedAppId(activeApplications[currentIndex + 1].id);
        }
      }
    } catch (error) {
      console.error('Update failed:', error);
      alert('Chyba při aktualizaci stavu. Pravděpodobně nemáte dostatečná oprávnění nebo databáze nezná tento stav.');
    } finally {
      setIsProcessing(false);
    }
  }, [activeApplications, onUpdateStatus]);

  const getEventDetails = useCallback((eventId: string) => {
    return eventsMap.get(eventId);
  }, [eventsMap]);

  const getZoneCategoryLabel = (category?: ZoneCategory) => category || 'Neuvedeno';

  const getStatusBadge = (status: AppStatus) => {
    switch (normalizeStatus(status)) {
      case AppStatus.DELETED:
        return { bg: 'bg-gray-200', text: 'text-gray-600', label: 'V koši' };
      case AppStatus.APPROVED:
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Schváleno (Čeká na platbu)' };
      case AppStatus.PAID:
        return { bg: 'bg-green-600', text: 'text-white', label: 'Zaplaceno' };
      case AppStatus.PAYMENT_REMINDER:
        return { bg: 'bg-amber-500', text: 'text-white', label: 'Upomínka odeslána' };
      case AppStatus.PAYMENT_LAST_CALL:
        return { bg: 'bg-red-500', text: 'text-white', label: 'Last Call odeslán' };
      case AppStatus.PAYMENT_UNDER_REVIEW:
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Platba se zpracovává' };
      case AppStatus.EXPIRED:
        return { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Expirováno' };
      case AppStatus.REJECTED:
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Zamítnuto' };
      case AppStatus.WAITLIST:
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Waitlist' };
      default:
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Čeká' };
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('cs-CZ');
  const formatEventDateLong = (dateStr?: string) => {
    if (!dateStr) return '';
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const getDaysLeft = (iso: string) => {
    const diffMs = new Date(iso).getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const pendingCount = applications.filter(a => normalizeStatus(a.status) === AppStatus.PENDING).length;
  const rejectedCount = applications.filter(a => normalizeStatus(a.status) === AppStatus.REJECTED).length;
  const waitlistCount = applications.filter(a => normalizeStatus(a.status) === AppStatus.WAITLIST).length;
  const trashCount = deletedApplications.length;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header with Stats */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-lavrs-dark mb-2">Výběr přihlášek</h2>
          <p className="text-sm text-gray-500">Správa a posuzování přihlášek vystavovatelů</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-none border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-amber-600" />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Čeká na posouzení</p>
                <p className="text-2xl font-extrabold text-lavrs-dark">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white px-6 py-3 rounded-none border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <XCircle size={18} className="text-red-600" />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Zamítnuto</p>
                <p className="text-2xl font-extrabold text-lavrs-dark">{rejectedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white px-6 py-3 rounded-none border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-blue-600" />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Waitlist</p>
                <p className="text-2xl font-extrabold text-lavrs-dark">{waitlistCount}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'TRASH' ? 'ACTIVE' : 'TRASH')}
            className={`px-6 py-3 rounded-none border shadow-sm transition-all text-left ${viewMode === 'TRASH'
              ? 'bg-lavrs-pink/40 border-lavrs-red/20'
              : 'bg-white border-gray-100 hover:border-lavrs-red/20 hover:bg-lavrs-pink/20'}`}
          >
            <div className="flex items-center gap-3">
              <Trash2 size={18} className="text-lavrs-red" />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Koš</p>
                <p className="text-2xl font-extrabold text-lavrs-dark">{trashCount}</p>
              </div>
            </div>
          </button>
        </div>
      </header>

      <div className="flex gap-8 flex-1 overflow-hidden">
        {/* Left: Applications List */}
        <div className="w-96 bg-white rounded-none border border-gray-100 flex flex-col overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-50 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-lavrs-dark">
                {viewMode === 'TRASH' ? 'Koš přihlášek' : 'Přihlášky k posouzení'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Klikněte na přihlášku pro zobrazení detailu</p>
            </div>
            {viewMode === 'TRASH' && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('ACTIVE')}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-gray-200 text-gray-600 hover:border-lavrs-red hover:text-lavrs-red transition-colors"
                >
                  Zpět
                </button>
                {deletedApplications.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Opravdu chcete TRVALE smazat všech ${deletedApplications.length} přihlášek z koše? Tuto akci nelze vrátit zpět!`)) return;
                      setIsProcessing(true);
                      try {
                        await onPermanentDeleteAllTrash();
                        setSelectedAppId(null);
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-red-300 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1.5">
                      <Trash2 size={12} /> Smazat vše trvale
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {displayedApplications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">
                  {viewMode === 'TRASH' ? 'Koš je prázdný' : 'Žádné aktivní přihlášky'}
                </p>
                <p className="text-[10px] text-gray-400 mt-2">
                  {viewMode === 'TRASH' ? 'Zatím jste nic nepřesunuli do koše' : 'Vše je posouzeno nebo zaplaceno'}
                </p>
              </div>
            ) : (
              displayedApplications.map(app => {
                const statusInfo = getStatusBadge(app.status);
                const event = getEventDetails(app.eventId);
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`w-full text-left p-4 rounded-none transition-all border-2 ${selectedApp?.id === app.id
                      ? 'bg-lavrs-pink/60 text-lavrs-dark border-lavrs-pink shadow-sm'
                      : 'bg-white hover:bg-lavrs-beige/50 border-transparent'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 pr-2 min-w-0">
                        <h4 className="font-bold text-sm truncate">{app.brandName}</h4>
                        {app.status === AppStatus.APPROVED && (
                          <Heart size={14} className="text-lavrs-red fill-lavrs-red shrink-0" />
                        )}
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-2 text-xs mb-2 px-2 py-1 rounded-none border ${selectedApp?.id === app.id ? 'bg-lavrs-pink/60 border-lavrs-red/10 text-lavrs-red' : 'bg-lavrs-pink/40 border-lavrs-red/10 text-lavrs-red/80'}`}>
                      <span className="truncate">{event?.title}</span>
                      {event?.date && (
                        <span className="text-[10px] font-bold uppercase whitespace-nowrap">
                          {formatEventDateLong(event.date)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] ${selectedApp?.id === app.id ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(app.submittedAt).toLocaleDateString('cs-CZ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-none text-[9px] font-bold uppercase ${statusInfo.bg} ${statusInfo.text}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Application Detail */}
        <div className="flex-1 bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden">
          {!selectedApp ? (
            <div className="flex-1 flex items-center justify-center h-full text-gray-400 font-bold uppercase tracking-widest text-sm">
              Vyberte přihlášku pro zobrazení detailu
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-8 border-b border-gray-100 bg-lavrs-beige/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-none bg-lavrs-red flex items-center justify-center text-white font-black text-3xl shadow-lg">
                      {selectedApp.brandName[0]}
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold tracking-tight text-lavrs-dark mb-2">{selectedApp.brandName}</h3>
                      <div className="flex gap-4">
                        {selectedApp.instagram && (
                          <a href="#" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-lavrs-red transition-colors">
                            <Instagram size={14} /> {selectedApp.instagram}
                          </a>
                        )}
                        {selectedApp.website && (
                          <a href="#" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-lavrs-red transition-colors">
                            <Globe size={14} /> {selectedApp.website}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const statusBadge = getStatusBadge(selectedApp.status);
                    return (
                      <div className={`px-4 py-2 rounded-none text-xs font-bold uppercase ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {/* Event Info - Expanded */}
                <section>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Calendar size={14} className="text-lavrs-red" />
                    Informace o eventu
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-none border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar size={16} className="text-lavrs-red" />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Event</p>
                      </div>
                      <p className="text-base font-bold text-lavrs-dark">{getEventDetails(selectedApp.eventId)?.title}</p>
                    </div>
                    <div className="bg-white p-5 rounded-none border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar size={16} className="text-lavrs-red" />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Datum</p>
                      </div>
                      <p className="text-base font-bold text-lavrs-dark">{formatEventDateLong(getEventDetails(selectedApp.eventId)?.date)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-none border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin size={16} className="text-lavrs-red" />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Místo</p>
                      </div>
                      <p className="text-base font-bold text-lavrs-dark">{getEventDetails(selectedApp.eventId)?.location}</p>
                    </div>
                    <div className="bg-white p-5 rounded-none border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Package size={16} className="text-lavrs-red" />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Kategorie zóny</p>
                      </div>
                      <p className="text-base font-bold text-lavrs-dark">{getZoneCategoryLabel(selectedApp.zoneCategory)}</p>
                    </div>
                  </div>
                </section>

                {/* Brand Description */}
                <section>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Popis značky</h4>
                  <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm">
                    <p className="text-base leading-relaxed text-gray-700">{selectedApp.brandDescription}</p>
                  </div>
                </section>

                {/* Contact Information */}
                <section>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User size={14} className="text-lavrs-red" />
                    Kontaktní údaje
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-none border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <User size={16} className="text-lavrs-red" />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Kontaktní osoba</p>
                      </div>
                      <p className="text-sm font-bold text-lavrs-dark">{selectedApp.contactPerson}</p>
                    </div>
                    <div className="bg-white p-5 rounded-none border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail size={16} className="text-lavrs-red" />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Email</p>
                      </div>
                      <p className="text-sm font-bold text-lavrs-dark truncate">{selectedApp.email}</p>
                    </div>
                    <div className="bg-white p-5 rounded-none border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Phone size={16} className="text-lavrs-red" />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Telefon</p>
                      </div>
                      <p className="text-sm font-bold text-lavrs-dark">{selectedApp.phone}</p>
                    </div>
                  </div>
                </section>

                {/* Billing Information */}
                <section>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Building size={14} className="text-lavrs-red" />
                    Fakturační údaje
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-none border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Building size={16} className="text-lavrs-red" />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Název firmy</p>
                      </div>
                      <p className="text-sm font-bold text-lavrs-dark">{selectedApp.billingName}</p>
                    </div>
                    <div className="bg-white p-5 rounded-none border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-4 h-4 bg-lavrs-red/20 rounded-none" />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">IČO</p>
                      </div>
                      <p className="text-sm font-bold text-lavrs-dark">{selectedApp.ic}</p>
                    </div>
                    {selectedApp.dic && (
                      <div className="bg-white p-5 rounded-none border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-4 h-4 bg-lavrs-red/20 rounded-none" />
                          <p className="text-[10px] text-gray-400 uppercase font-bold">DIČ</p>
                        </div>
                        <p className="text-sm font-bold text-lavrs-dark">{selectedApp.dic}</p>
                      </div>
                    )}
                    <div className={`bg-white p-5 rounded-none border border-gray-100 shadow-sm ${selectedApp.dic ? '' : 'col-span-2'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin size={16} className="text-lavrs-red" />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Adresa</p>
                      </div>
                      <p className="text-sm font-bold text-lavrs-dark">{selectedApp.billingAddress}</p>
                    </div>
                  </div>
                </section>

                {/* Custom Price */}
                <section>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CreditCard size={14} className="text-lavrs-red" />
                    Částka k fakturaci
                  </h4>
                  <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-3">
                      Částka bez DPH (Kč) — bude použita na faktuře
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={priceInput}
                          onChange={e => {
                            setPriceSaved(false);
                            setPriceInput(e.target.value.replace(/[^\d]/g, ''));
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') handleSavePrice(); }}
                          placeholder="např. 6900"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-none text-lg font-bold text-lavrs-dark focus:outline-none focus:border-lavrs-red transition-colors pr-12"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Kč</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSavePrice}
                        disabled={priceSaving}
                        className={`px-6 py-3 rounded-none font-bold text-xs uppercase tracking-widest transition-all ${priceSaved
                          ? 'bg-green-600 text-white'
                          : 'bg-lavrs-dark text-white hover:bg-black'
                        } disabled:opacity-50`}
                      >
                        {priceSaving ? 'Ukládám...' : priceSaved ? 'Uloženo' : 'Uložit'}
                      </button>
                    </div>
                    {selectedApp.customPrice != null && (
                      <p className="text-xs text-green-600 mt-2 font-semibold">
                        Nastavená částka: {selectedApp.customPrice.toLocaleString('cs-CZ')} Kč bez DPH
                      </p>
                    )}
                    {(() => {
                      const catPrice = getCategoryPrice(selectedApp);
                      const numPrice = parseCategoryPrice(catPrice);
                      const isNonNumeric = catPrice && !numPrice;
                      return (
                        <>
                          {catPrice && numPrice && !selectedApp.customPrice && (
                            <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                              <AlertCircle size={12} />
                              Cena z ceníku kategorie: {numPrice.toLocaleString('cs-CZ')} Kč
                            </p>
                          )}
                          {isNonNumeric && !selectedApp.customPrice && (
                            <p className="text-xs text-red-600 mt-2 flex items-center gap-1 font-semibold">
                              <AlertCircle size={12} />
                              Ceník kategorie: „{catPrice}" — je nutné doplnit konkrétní částku!
                            </p>
                          )}
                          {!catPrice && !priceInput && !selectedApp.customPrice && (
                            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                              <AlertCircle size={12} />
                              Částka není nastavena — ceník kategorie nenalezen
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </section>

                {/* Payment Deadline */}
                {selectedApp.status === AppStatus.APPROVED && selectedApp.paymentDeadline && (
                  <section>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Clock size={14} className="text-lavrs-red" />
                      Splatnost faktury
                    </h4>
                    <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Termín úhrady</p>
                        <p className="text-base font-bold text-lavrs-dark">{formatDate(selectedApp.paymentDeadline)}</p>
                      </div>
                      <div className="text-right">
                        {getDaysLeft(selectedApp.paymentDeadline) >= 0 ? (
                          <>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Zbývá</p>
                            <p className="text-base font-bold text-lavrs-red">{getDaysLeft(selectedApp.paymentDeadline)} dní</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Stav</p>
                            <p className="text-base font-bold text-red-600">Po splatnosti</p>
                          </>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* Internal Notes */}
                <section>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Interní poznámky</h4>
                  <textarea
                    className="w-full bg-white p-6 rounded-none border-2 border-gray-100 focus:outline-none focus:border-lavrs-red text-sm resize-none h-32 shadow-sm"
                    placeholder="Zadejte poznámku pro tým..."
                    defaultValue={selectedApp.curatorNote || ''}
                  />
                </section>
              </div>

              {/* Action Buttons */}
              <div className="p-8 border-t border-gray-100 bg-lavrs-beige/20">
                {normalizeStatus(selectedApp.status) === AppStatus.DELETED ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <button
                      onClick={async () => {
                        setIsProcessing(true);
                        try {
                          await onRestoreApplication(selectedApp.id);
                          setViewMode('ACTIVE');
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      disabled={isProcessing}
                      className="bg-lavrs-dark text-white py-4 rounded-none font-bold text-xs flex flex-col items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                    >
                      <Check size={18} /> OBNOVIT
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <button
                      onClick={() => handleAction(selectedApp.id, AppStatus.APPROVED)}
                      disabled={isProcessing || normalizeStatus(selectedApp.status) === AppStatus.APPROVED || normalizeStatus(selectedApp.status) === AppStatus.PAID}
                      className="bg-green-600 text-white py-4 rounded-none font-bold text-xs flex flex-col items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check size={18} /> SCHVÁLIT
                    </button>

                    <button
                      onClick={() => handleAction(selectedApp.id, AppStatus.PAID)}
                      disabled={isProcessing || (![AppStatus.APPROVED, AppStatus.PAYMENT_REMINDER, AppStatus.PAYMENT_LAST_CALL].includes(normalizeStatus(selectedApp.status) as AppStatus))}
                      className={`py-4 rounded-none font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${normalizeStatus(selectedApp.status) === AppStatus.APPROVED || normalizeStatus(selectedApp.status).includes('PAYMENT_')
                        ? 'bg-lavrs-dark text-white hover:bg-black'
                        : 'bg-gray-100 text-gray-400 border border-gray-200 shadow-none'
                        }`}
                    >
                      <CreditCard size={18} /> POTVRDIT PLATBU
                    </button>

                    <button
                      onClick={() => handleAction(selectedApp.id, AppStatus.PAYMENT_REMINDER)}
                      disabled={isProcessing || normalizeStatus(selectedApp.status) !== AppStatus.APPROVED}
                      className={`py-4 rounded-none font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${normalizeStatus(selectedApp.status) === AppStatus.APPROVED
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-gray-100 text-gray-400 border border-gray-200 shadow-none'
                        }`}
                    >
                      <Mail size={18} /> ODESLAT UPOMÍNKU
                    </button>

                    <button
                      onClick={() => handleAction(selectedApp.id, AppStatus.PAYMENT_LAST_CALL)}
                      disabled={isProcessing || (![AppStatus.APPROVED, AppStatus.PAYMENT_REMINDER].includes(normalizeStatus(selectedApp.status) as AppStatus))}
                      className={`py-4 rounded-none font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${[AppStatus.APPROVED, AppStatus.PAYMENT_REMINDER].includes(normalizeStatus(selectedApp.status) as AppStatus)
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-gray-100 text-gray-400 border border-gray-200 shadow-none'
                        }`}
                    >
                      <AlertCircle size={18} /> ODESLAT LAST CALL
                    </button>

                    <button
                      onClick={() => handleAction(selectedApp.id, AppStatus.REJECTED)}
                      disabled={isProcessing || normalizeStatus(selectedApp.status) === AppStatus.REJECTED}
                      className="bg-white text-red-600 border-2 border-red-200 py-4 rounded-none font-bold text-xs flex flex-col items-center justify-center gap-2 hover:bg-red-50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={18} /> ZAMÍTNOUT
                    </button>
                    <button
                      onClick={() => handleAction(selectedApp.id, AppStatus.WAITLIST)}
                      disabled={isProcessing || normalizeStatus(selectedApp.status) === AppStatus.WAITLIST}
                      className="bg-blue-600 text-white py-4 rounded-none font-bold text-xs flex flex-col items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Clock size={18} /> WAITLIST
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Opravdu chcete tuto přihlášku přesunout do koše?')) return;
                        setIsProcessing(true);
                        try {
                          await onDeleteApplication(selectedApp.id);
                          setSelectedAppId(null);
                          setViewMode('TRASH');
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      disabled={isProcessing}
                      className="bg-white text-red-600 border-2 border-red-600 py-4 rounded-none font-bold text-xs flex flex-col items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <Trash2 size={18} /> SMAZAT
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <button className="py-3 bg-white text-gray-600 border border-gray-200 rounded-none font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                    <Mail size={18} /> Odeslat email
                  </button>
                  <button className="py-3 bg-white text-gray-600 border border-gray-200 rounded-none font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                    <Phone size={18} /> Zavolat
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders when parent updates
const CuratorModule = React.memo(CuratorModuleInner);

export default CuratorModule;
