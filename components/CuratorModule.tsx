import React, { useState } from 'react';
import { Instagram, Globe, Check, X, Mail, Phone, Building, MapPin, Calendar, User, Package, Maximize2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Application, AppStatus, ZoneCategory } from '../types';
import { EVENTS, ZONE_DETAILS } from '../constants';

interface CuratorModuleProps {
  onBack: () => void;
  applications: Application[];
  onUpdateStatus: (id: string, status: AppStatus) => void;
}

const CuratorModule: React.FC<CuratorModuleProps> = ({ onBack, applications, onUpdateStatus }) => {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(applications.length > 0 ? applications[0].id : null);

  const selectedApp = applications.find(a => a.id === selectedAppId) || (applications.length > 0 ? applications[0] : null);

  const handleAction = (id: string, newStatus: AppStatus) => {
    onUpdateStatus(id, newStatus);

    // Move to next application
    const currentIndex = applications.findIndex(a => a.id === id);
    if (currentIndex < applications.length - 1) {
      setSelectedAppId(applications[currentIndex + 1].id);
    }
  };

  const getEventDetails = (eventId: string) => {
    return EVENTS.find(e => e.id === eventId);
  };

  const getZoneCategoryLabel = (category?: ZoneCategory) => {
    if (!category) return 'Neuvedeno';
    switch (category) {
      case ZoneCategory.SECONDHANDS:
        return 'Secondhands – Vintage a second-hand móda';
      case ZoneCategory.CESKE_ZNACKY:
        return 'České značky – Lokální české značky';
      case ZoneCategory.DESIGNERS:
        return 'Designers – Designérské kousky';
      case ZoneCategory.BEAUTY:
        return 'Beauty ZONE – Kosmetika a péče';
      case ZoneCategory.TATTOO:
        return 'TATTOO – Tetování a body art';
      default:
        return category;
    }
  };

  const getStatusBadge = (status: AppStatus) => {
    switch (status) {
      case AppStatus.APPROVED:
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Schváleno' };
      case AppStatus.REJECTED:
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Zamítnuto' };
      case AppStatus.WAITLIST:
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Waitlist' };
      default:
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Čeká' };
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('cs-CZ');
  const getDaysLeft = (iso: string) => {
    const diffMs = new Date(iso).getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const pendingCount = applications.filter(a => a.status === AppStatus.PENDING).length;
  const rejectedCount = applications.filter(a => a.status === AppStatus.REJECTED).length;
  const waitlistCount = applications.filter(a => a.status === AppStatus.WAITLIST).length;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header with Stats */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-lavrs-dark mb-2">Aktivní přihlášky</h2>
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
        </div>
      </header>

      <div className="flex gap-8 flex-1 overflow-hidden">
        {/* Left: Applications List */}
        <div className="w-96 bg-white rounded-none border border-gray-100 flex flex-col overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-50">
            <h3 className="font-bold text-lavrs-dark">Přihlášky k posouzení</h3>
            <p className="text-xs text-gray-500 mt-1">Klikněte na přihlášku pro zobrazení detailu</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Žádné přihlášky</p>
              </div>
            ) : (
              applications.map(app => {
                const statusInfo = getStatusBadge(app.status);
                const event = getEventDetails(app.eventId);
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`w-full text-left p-4 rounded-none transition-all border-2 ${selectedApp?.id === app.id
                      ? 'bg-lavrs-red text-white border-lavrs-red shadow-lg'
                      : 'hover:bg-lavrs-beige/50 border-transparent'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm truncate pr-2">{app.brandName}</h4>
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded uppercase bg-lavrs-red text-white">
                        {app.zone}
                      </span>
                    </div>
                    <p className={`text-xs mb-2 truncate ${selectedApp?.id === app.id ? 'opacity-80' : 'text-gray-500'}`}>
                      {event?.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] ${selectedApp?.id === app.id ? 'opacity-60' : 'text-gray-400'}`}>
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
                  <div className={`px-4 py-2 rounded-none text-xs font-bold uppercase ${getStatusBadge(selectedApp.status).bg} ${getStatusBadge(selectedApp.status).text}`}>
                    {getStatusBadge(selectedApp.status).label}
                  </div>
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
                      <p className="text-base font-bold text-lavrs-dark">{getEventDetails(selectedApp.eventId)?.date}</p>
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
                    <div className="bg-white p-5 rounded-none border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Maximize2 size={16} className="text-lavrs-red" />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Velikost místa</p>
                      </div>
                      <p className="text-base font-bold text-lavrs-dark">
                        {ZONE_DETAILS[selectedApp.zone]?.label || `Zóna ${selectedApp.zone}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ZONE_DETAILS[selectedApp.zone]?.dimensions || ''}
                      </p>
                    </div>
                    <div className="bg-lavrs-beige/30 p-5 rounded-none border border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Package size={16} className="text-lavrs-red" />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Požadavky na místo</p>
                      </div>
                      <p className="text-sm font-medium text-lavrs-dark">Standardní setup (Stůl + Stojan)</p>
                      <p className="text-xs text-gray-500 mt-1">Žádné speciální požadavky</p>
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
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <button
                    onClick={() => handleAction(selectedApp.id, AppStatus.APPROVED)}
                    disabled={selectedApp.status === AppStatus.APPROVED}
                    className="bg-green-600 text-white py-5 rounded-none font-bold flex items-center justify-center gap-3 hover:bg-green-700 transition-all shadow-lg hover:shadow-green-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={20} /> SCHVÁLIT
                  </button>
                  <button
                    onClick={() => handleAction(selectedApp.id, AppStatus.REJECTED)}
                    disabled={selectedApp.status === AppStatus.REJECTED}
                    className="bg-white text-red-600 border-2 border-red-200 py-5 rounded-none font-bold flex items-center justify-center gap-3 hover:bg-red-50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={20} /> ZAMÍTNOUT
                  </button>
                  <button
                    onClick={() => handleAction(selectedApp.id, AppStatus.WAITLIST)}
                    disabled={selectedApp.status === AppStatus.WAITLIST}
                    className="bg-blue-600 text-white py-5 rounded-none font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    WAITLIST
                  </button>
                </div>
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

export default CuratorModule;
