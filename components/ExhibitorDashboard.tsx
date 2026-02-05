
import React from 'react';
import { ArrowRight, Clock, CheckCircle2, AlertCircle, XCircle, Facebook, Instagram, ChevronRight, Sparkles } from 'lucide-react';
import { MarketEvent, User, AppStatus, Application, BrandProfile } from '../types';
import { EVENTS } from '../constants';

interface ExhibitorDashboardProps {
  user: User;
  applications: Application[];
  brands: BrandProfile[];
  onApply: (eventId: string) => void;
  onPayment: () => void;
  onNavigate: (screen: string) => void;
}

const ExhibitorDashboard: React.FC<ExhibitorDashboardProps> = ({ user, applications, brands, onApply, onPayment, onNavigate }) => {
  const [filter, setFilter] = React.useState<'ALL' | 'MINI' | 'LARGE'>('ALL');
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [now, setNow] = React.useState(Date.now());
  const activeApp = applications.find(app => app.status === AppStatus.APPROVED);
  const activeEvent = activeApp ? EVENTS.find(e => e.id === activeApp.eventId) : null;

  const slides = [
    {
      title: "Přípravy na Vánoce vrcholí",
      subtitle: "Nezapomeňte si včas rezervovat své místo na Vánočním MINI LAVRS Marketu. Kapacity se rychle plní!",
      image: "/media/1cde43c8-e02d-43da-aa4c-2c21532f5797.webp",
      tag: "DŮLEŽITÉ"
    },
    {
      title: "Nová lokace v Holešovicích",
      subtitle: "Zářijový LAVRS Market se přesouvá do úžasných prostor Garbe Holešovice. Máte se na co těšit.",
      image: "/media/lavrs-market.webp",
      tag: "NOVINKA"
    },
    {
      title: "Workshop: Circular Fashion",
      subtitle: "Chcete se dozvědět více o tom, jak lépe prezentovat svou udržitelnou značku? Sledujte náš newsletter.",
      image: "/media/Lavrsmarket-2022-foto-Dominika-Hruba.jpg",
      tag: "WORKSHOP"
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const getRemaining = (deadlineIso?: string) => {
    if (!deadlineIso) return null;
    const diffMs = new Date(deadlineIso).getTime() - now;
    if (diffMs <= 0) {
      return { overdue: true, days: 0, hours: 0, minutes: 0 };
    }
    const totalMinutes = Math.ceil(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    return { overdue: false, days, hours, minutes };
  };

  const remaining = getRemaining(activeApp?.paymentDeadline);
  const filteredEvents = EVENTS.filter(event => {
    if (filter === 'ALL') return true;
    if (filter === 'MINI') return event.title.toLowerCase().includes('mini');
    if (filter === 'LARGE') return !event.title.toLowerCase().includes('mini');
    return true;
  });

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-4xl font-bold mb-2 tracking-tight">Vítej zpět, {user.name.split(' ')[0]}</h2>
        <p className="text-gray-500 font-medium">Tvůj kurátorský prostor pro cirkulární módu.</p>
      </header>

      {/* Banner Slideshow */}
      <div className="relative h-64 md:h-80 overflow-hidden group shadow-2xl border border-white/20">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
          >
            <img src={slide.image} className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[10s]" alt="" />
            <div className="absolute inset-0 bg-gradient-to-r from-lavrs-dark/90 via-lavrs-dark/40 to-transparent flex items-center p-12">
              <div className="max-w-md space-y-4">
                <span className="px-3 py-1 bg-lavrs-red text-white text-[10px] font-black tracking-widest uppercase">
                  {slide.tag}
                </span>
                <h3 className="text-3xl md:text-4xl font-black text-white leading-tight uppercase tracking-tighter">
                  {slide.title}
                </h3>
                <p className="text-white/80 text-sm md:text-base font-medium">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
        {/* Progress indicators */}
        <div className="absolute bottom-6 left-12 flex gap-3 z-10">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1 transition-all duration-300 ${i === currentSlide ? 'w-12 bg-lavrs-red' : 'w-4 bg-white/30'}`}
            />
          ))}
        </div>
      </div>

      {/* Action Required Widget */}
      {activeApp && (
        <div className="bg-lavrs-red/5 border border-lavrs-red/20 rounded-none p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-lavrs-red rounded-none flex items-center justify-center text-white shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-lavrs-dark">
                Platba za {activeEvent?.title || 'LAVRS Market'} {activeEvent?.date || ''}
              </h3>
              <p className="text-gray-600">Tvoje přihláška byla schválena! Proveď platbu pro potvrzení místa.</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Zbývá času</p>
              {remaining ? (
                remaining.overdue ? (
                  <p className="text-2xl font-bold text-red-600">Po splatnosti</p>
                ) : (
                  <p className="text-2xl font-bold text-lavrs-red">
                    {remaining.days}d : {remaining.hours}h : {remaining.minutes}m
                  </p>
                )
              ) : (
                <p className="text-2xl font-bold text-gray-400">—</p>
              )}
            </div>
            <button
              onClick={onPayment}
              className="bg-lavrs-dark text-white px-8 py-4 rounded-none font-semibold hover:bg-lavrs-red transition-all active:scale-95 flex items-center gap-2"
            >
              Zaplatit nyní <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Upcoming Events - Column 1 & 2 */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-lavrs-dark">Nadcházející Eventy</h3>
            </div>

            <div className="flex gap-2">
              {[
                { id: 'ALL', label: 'Všechny' },
                { id: 'MINI', label: 'MINI LAVRS Market' },
                { id: 'LARGE', label: 'LAVRS Market' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={`px-6 py-2 rounded-none text-[11px] font-bold uppercase tracking-wider transition-all border-2 ${filter === tab.id
                    ? 'border-lavrs-red text-lavrs-red bg-white'
                    : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:text-lavrs-dark'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map(event => (
              <div key={event.id} className="group glass-card overflow-hidden">
                <div className="relative h-64 overflow-hidden">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div
                    className="absolute top-4 right-4 px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-widest shadow-lg text-white"
                    style={{ backgroundColor: event.status === 'open' ? '#22C55E' : '#3B82F6' }}
                  >
                    {event.status === 'open' ? 'Přihlašování otevřeno' : 'PŘIPRAVUJE SE'}
                  </div>
                </div>
                <div className="pt-8 pb-10 px-8">
                  <p className="text-xs text-lavrs-red font-bold uppercase tracking-wider mb-2">{event.date} — {event.location}</p>
                  <h4 className="text-xl font-bold mb-6 text-lavrs-dark">{event.title}</h4>
                  <button
                    onClick={() => onApply(event.id)}
                    className={`w-full py-4 rounded-none font-black uppercase tracking-[0.2em] text-sm transition-all shadow-md hover:shadow-2xl hover:translate-y-[-4px] active:translate-y-0 ${event.status === 'open'
                      ? 'bg-lavrs-red text-white hover:bg-lavrs-dark'
                      : 'bg-lavrs-dark text-white hover:bg-[#F7C0BF] hover:text-lavrs-dark'
                      }`}
                  >
                    {event.status === 'open' ? 'Přihlásit se' : 'Chci na Waitlist'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Column */}
        <div className="space-y-8">
          {/* Application Status */}
          <div className="bg-white rounded-none p-8 shadow-sm border border-gray-100 space-y-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              Moje Aktivity
            </h3>
            <div className="space-y-8 relative">
              {/* Timeline Line */}
              <div className="absolute left-5 top-2 bottom-2 w-px bg-gray-100"></div>

              {applications.length === 0 ? (
                <div className="relative text-center py-6">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Zatím žádná aktivita</p>
                </div>
              ) : (
                applications.map((app, idx) => (
                  <div key={app.id} className="relative flex gap-6 pl-2 group">
                    <div className={`z-10 w-10 h-10 rounded-none flex items-center justify-center border-4 border-white shadow-sm transition-transform duration-300 group-hover:scale-110 ${app.status === AppStatus.APPROVED ? 'bg-green-500' :
                      app.status === AppStatus.PENDING ? 'bg-amber-400' :
                        app.status === AppStatus.WAITLIST ? 'bg-blue-500' : 'bg-gray-300'
                      }`}>
                      {app.status === AppStatus.APPROVED ? <CheckCircle2 size={18} className="text-white" /> :
                        app.status === AppStatus.PENDING ? <Clock size={18} className="text-white" /> :
                          app.status === AppStatus.WAITLIST ? <Clock size={18} className="text-white" /> : <XCircle size={18} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-bold text-[13px] truncate text-lavrs-dark">{app.brandName}</h4>
                        <span className="text-[9px] text-gray-400 font-bold tracking-tighter">
                          {new Date(app.submittedAt).toLocaleDateString('cs-CZ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mb-2 truncate">
                        {EVENTS.find(e => e.id === app.eventId)?.title}
                      </p>
                      <span className={`px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-widest ${app.status === AppStatus.APPROVED ? 'bg-green-100 text-green-700' :
                        app.status === AppStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                          app.status === AppStatus.WAITLIST ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {app.status === AppStatus.APPROVED ? 'Schváleno' :
                          app.status === AppStatus.PENDING ? 'V posouzení' :
                            app.status === AppStatus.WAITLIST ? 'Waitlist' : 'Zamítnuto'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Brand Box */}
          <div className="bg-white rounded-none p-8 shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-xl font-bold">Moje značka</h3>
            <div className="space-y-4">
              {brands.map(brand => (
                <div key={brand.id} className="group p-5 bg-lavrs-beige/50 border border-transparent hover:border-lavrs-red/30 transition-all cursor-pointer" onClick={() => onNavigate('PROFILE')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-wider text-lavrs-dark">{brand.brandName}</h4>
                      <p className="text-[11px] text-gray-500 mt-1 font-medium italic">Klikni pro editaci profilu</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-lavrs-red group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media Box */}
          <div className="bg-white rounded-none p-8 shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-xl font-bold text-lavrs-dark">Sleduj sociální sítě<br />LAVRS MARKET</h3>
            <div className="grid grid-cols-2 gap-4">
              <a href="#" className="flex flex-col items-center justify-center py-8 bg-lavrs-red text-white hover:bg-white hover:text-lavrs-red transition-all border border-lavrs-red/20 group">
                <Instagram size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Instagram</span>
              </a>
              <a href="#" className="flex flex-col items-center justify-center py-8 bg-lavrs-red text-white hover:bg-white hover:text-lavrs-red transition-all border border-lavrs-red/20 group">
                <Facebook size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Facebook</span>
              </a>
            </div>
          </div>
        </div>

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

export default ExhibitorDashboard;
