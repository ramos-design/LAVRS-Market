
import React from 'react';
import { ArrowRight, Clock, CheckCircle2, AlertCircle, XCircle, Facebook, Instagram, ChevronRight, Sparkles, MapPin, Camera } from 'lucide-react';
import { MarketEvent, User, AppStatus, Application, BrandProfile, Banner } from '../types';
import { formatEventDateRange } from '../lib/mappers';
import CountdownDisplay from './CountdownDisplay';

interface ExhibitorDashboardProps {
  user: User;
  events: MarketEvent[];
  applications: Application[];
  brands: BrandProfile[];
  showGreeting?: boolean;
  onApply: (eventId: string) => void;
  onPayment: (appId: string) => void;
  onDismissApp: (appId: string) => void;
  onNavigate: (screen: string) => void;
  banners: Banner[];
}

const ExhibitorDashboardInner: React.FC<ExhibitorDashboardProps> = ({ user, events, applications, brands, showGreeting, onApply, onPayment, onDismissApp, onNavigate, banners }) => {
  // Debug: Check banner sizes
  React.useEffect(() => {
    banners.forEach((b, i) => {
      const sizeKb = (b.image?.length || 0) / 1024;
      const isDataUrl = b.image?.startsWith('data:');
      console.log(`Banner ${i}: ${isDataUrl ? 'DATA URL' : 'NORMAL URL'} - ${sizeKb.toFixed(1)}KB - ${b.title}`);
    });
  }, [banners]);

  const sortedEvents = React.useMemo(() => {
    const parsed = [...events];
    const parseDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d.getTime();
      const trimmed = dateStr.replace(/\s+/g, ' ').trim();
      const numeric = trimmed.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
      if (numeric) {
        const day = parseInt(numeric[1], 10);
        const month = parseInt(numeric[2], 10);
        const year = parseInt(numeric[3], 10);
        return new Date(year, month - 1, day).getTime();
      }
      const range = trimmed.match(/(\d{1,2})\.\s*[–-]\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(\d{4})/);
      if (range) {
        const day = parseInt(range[1], 10);
        const month = parseInt(range[3], 10);
        const year = parseInt(range[4], 10);
        return new Date(year, month - 1, day).getTime();
      }
      const monthMap: Record<string, number> = {
        ledna: 1, února: 2, března: 3, dubna: 4, května: 5, června: 6,
        července: 7, srpna: 8, září: 9, října: 10, listopadu: 11, prosince: 12
      };
      const named = trimmed.match(/(\d{1,2})\.\s*([a-zá-ž]+)\s*(\d{4})/i);
      if (named) {
        const day = parseInt(named[1], 10);
        const monthName = named[2].toLowerCase();
        const year = parseInt(named[3], 10);
        const month = monthMap[monthName];
        if (month) return new Date(year, month - 1, day).getTime();
      }
      return Number.NEGATIVE_INFINITY;
    };
    return parsed.sort((a, b) => parseDate(a.date) - parseDate(b.date));
  }, [events]);

  // Create a Map for O(1) event lookups (prevents N+1 queries)
  const eventsMap = React.useMemo(() => {
    const map = new Map<string, MarketEvent>();
    sortedEvents.forEach(event => map.set(event.id, event));
    return map;
  }, [sortedEvents]);
  const visibleEvents = React.useMemo(
    () => sortedEvents.filter(event => event.status !== 'draft'),
    [sortedEvents]
  );
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [now, setNow] = React.useState(Date.now());

  // Combine all payment-relevant apps for unified logic
  const paymentRequestedApps = React.useMemo(() => applications.filter(app =>
    [AppStatus.APPROVED, AppStatus.PAYMENT_REMINDER, AppStatus.PAYMENT_LAST_CALL, AppStatus.PAYMENT_UNDER_REVIEW].includes(app.status)
  ), [applications]);

  // Only apps that actually need a countdown (have a deadline and are not under review)
  const hasActiveCountdown = React.useMemo(() =>
    paymentRequestedApps.some(app => app.status !== AppStatus.PAYMENT_UNDER_REVIEW && app.paymentDeadline),
    [paymentRequestedApps]
  );

  const displayApp = paymentRequestedApps[0];
  const activeEvent = displayApp ? eventsMap.get(displayApp.eventId) : null;

  const slides = banners;


  React.useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides]); // Changed from [slides.length] to [slides] for proper dependency tracking

  React.useEffect(() => {
    if (!hasActiveCountdown) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasActiveCountdown]);

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

  const remaining = getRemaining(displayApp?.paymentDeadline);


  return (
    <div className="space-y-12">
      {/* Banner Slideshow */}
      {slides.length > 0 && (
        <div className="relative h-72 md:h-80 overflow-hidden group shadow-2xl border border-white/20 -mx-4 -mt-4 md:mx-0 md:mt-0 md:rounded-none">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}
            >
              <img
                src={slide.image}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding={index === 0 ? 'sync' : 'async'}
                fetchPriority={index === 0 ? 'high' : 'low'}
                className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[10s]"
                alt={slide.title}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-lavrs-dark/90 via-lavrs-dark/60 to-lavrs-dark/30 flex items-center px-5 md:px-12 py-6 md:py-8">
                <div className="w-full space-y-3 md:space-y-4 pr-4 md:pr-8">
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
          <div className="absolute bottom-4 left-5 md:bottom-6 md:left-12 flex gap-3 z-10">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-1 transition-all duration-300 ${i === currentSlide ? 'w-12 bg-lavrs-red' : 'w-4 bg-white/30'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Photo Gallery Reminder — slim bar right under the slideshow banner */}
      {(() => {
        const brandsNeedingPhotos = brands.filter(brand => {
          const hasApprovedApp = applications.some(app =>
            app.brandName.toLowerCase() === brand.brandName.toLowerCase() &&
            [AppStatus.APPROVED, AppStatus.PAID, AppStatus.PAYMENT_REMINDER, AppStatus.PAYMENT_LAST_CALL, AppStatus.PAYMENT_UNDER_REVIEW].includes(app.status)
          );
          const hasGallery = (brand.galleryUrls && brand.galleryUrls.length > 0) || !!brand.logoUrl;
          return hasApprovedApp && !hasGallery;
        });
        if (brandsNeedingPhotos.length === 0) return null;
        return (
          <div className="bg-lavrs-beige/50 border border-lavrs-pink/30 rounded-none px-4 py-3 md:px-6 md:py-3 flex items-center justify-between gap-3 -mt-8 animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <Camera size={16} className="text-lavrs-red shrink-0" />
              <p className="text-xs md:text-sm text-lavrs-dark font-semibold truncate">
                Doplňte logo a fotky vaší značky do <span className="font-bold">Můj profil</span>
              </p>
            </div>
            <button
              onClick={() => onNavigate('PROFILE')}
              className="bg-lavrs-dark text-white px-4 py-1.5 rounded-none font-bold uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-lavrs-red transition-all flex items-center gap-1.5 group shadow-sm whitespace-nowrap shrink-0"
            >
              Přejít <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        );
      })()}

      {showGreeting && (
        <header className="text-center md:text-left">
          <h2 className="text-2xl md:text-4xl font-bold mb-2 tracking-tight">Vítej, {user.name.split(' ')[0]}</h2>
        </header>
      )}

      {/* Action Required Widgets */}
      <div className="space-y-4">
        {paymentRequestedApps.map((app) => {
          const event = eventsMap.get(app.eventId);
          const isReview = app.status === AppStatus.PAYMENT_UNDER_REVIEW;
          const remaining = getRemaining(app.paymentDeadline);

          if (isReview) {
            return (
              <div key={app.id} className="bg-blue-50 border border-blue-100 rounded-none p-5 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 animate-fadeIn transition-all relative group/box">
                <div className="flex gap-3 md:gap-4 min-w-0 pr-8 md:pr-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-none flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                    <Clock size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-xl text-lavrs-dark leading-snug">
                      Platba za <span className="font-black">{event?.title || 'LAVRS market'} {event ? formatEventDateRange(event.date, event?.endDate) : ''}</span>
                    </h3>
                    <p className="text-blue-700 font-bold text-sm mt-1">Nyní čekáme na přijetí vaší platby. Jakmile ji zpracujeme, budeme vás informovat e-mailem a zašleme vám fakturu.</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => onDismissApp(app.id)}
                  className="absolute top-4 right-4 p-2 text-blue-300 hover:text-blue-600 hover:bg-blue-100 transition-all rounded-full"
                  title="Zavřít informaci"
                >
                  <XCircle size={20} />
                </button>
              </div>
            );
          }

          return (
            <div key={app.id} className="bg-lavrs-red/5 border border-lavrs-red/20 rounded-none p-5 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
              <div className="flex gap-3 md:gap-4 min-w-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-lavrs-red rounded-none flex items-center justify-center text-white shrink-0">
                  <Clock size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base md:text-xl text-lavrs-dark leading-snug">
                    Platba za <span className="font-black">{event?.title || 'LAVRS market'} {event ? formatEventDateRange(event.date, event?.endDate) : ''}</span>
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">Tvoje přihláška byla schválena! Proveď platbu pro potvrzení místa.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto shrink-0">
                <CountdownDisplay remaining={remaining} />
                <button
                  onClick={() => onPayment(app.id)}
                  className="bg-lavrs-dark text-white px-5 md:px-8 py-3 md:py-4 rounded-none font-bold uppercase tracking-widest text-xs hover:bg-lavrs-red transition-all flex items-center gap-2 group shadow-xl whitespace-nowrap flex-1 md:flex-none justify-center"
                >
                  Zaplatit nyní <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

        {/* Upcoming Events - Column 1 & 2 */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-lavrs-dark">Nadcházející Eventy</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-0">
            {visibleEvents.map(event => (
              <div key={event.id} className="group glass-card overflow-hidden">
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  <img
                    src={event.image}
                    loading="lazy"
                    decoding="async"
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    style={{ contentVisibility: 'auto' }}
                  />
                  <div
                    className="absolute top-4 right-4 px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-widest shadow-lg text-white"
                    style={{ backgroundColor: event.status === 'open' ? '#22C55E' : event.status === 'closed' ? '#DC2626' : event.status === 'soldout' ? '#DC2626' : '#EC4899' }}
                  >
                    {event.status === 'open' ? 'Otevřeno' : event.status === 'closed' ? 'Zavřeno' : event.status === 'soldout' ? 'Vyprodáno' : 'WAITLIST'}
                  </div>
                </div>
                <div className="pt-5 pb-6 px-5 md:pt-8 md:pb-10 md:px-8">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="bg-lavrs-red text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest leading-none">
                      {formatEventDateRange(event.date, event?.endDate)}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold mb-2 text-lavrs-dark">{event.title}</h4>
                  <span className="flex items-center gap-1.5 text-lavrs-dark text-[10px] font-bold uppercase tracking-widest mb-6">
                    <MapPin size={12} className="text-lavrs-dark" />
                    {event.location}
                  </span>
                  <button
                    onClick={() => onApply(event.id)}
                    disabled={event.status === 'soldout'}
                    className={`w-full py-4 rounded-none font-black uppercase tracking-[0.2em] text-sm transition-all shadow-md hover:shadow-2xl hover:translate-y-[-4px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md disabled:hover:translate-y-0 ${event.status === 'open'
                      ? 'bg-lavrs-red text-white hover:bg-lavrs-dark'
                      : event.status === 'soldout'
                        ? 'bg-gray-400 text-white'
                        : 'bg-lavrs-dark text-white hover:bg-[#F7C0BF] hover:text-lavrs-dark'
                      }`}
                  >
                    {event.status === 'open' ? 'Přihlásit se' : event.status === 'soldout' ? 'Vyprodáno' : 'Chci na Waitlist'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Column */}
        <div className="space-y-4 lg:space-y-8">
          {/* Application Status */}
          <div className="bg-white rounded-none p-5 md:p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6">
              Moje Aktivity
            </h3>
            <div className="space-y-4 md:space-y-6 relative">

              {/* Filter applications for dashboard view */}
              {(() => {
                const visibleApps = applications.filter(app =>
                  app.status === AppStatus.PENDING ||
                  app.status === AppStatus.APPROVED ||
                  app.status === AppStatus.REJECTED ||
                  app.status === AppStatus.WAITLIST ||
                  app.status === AppStatus.PAYMENT_REMINDER ||
                  app.status === AppStatus.PAYMENT_LAST_CALL ||
                  app.status === AppStatus.PAYMENT_UNDER_REVIEW
                );

                if (visibleApps.length === 0) {
                  return (
                    <div className="relative text-center py-4">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Zatím žádná aktivita</p>
                    </div>
                  );
                }

                return visibleApps.map((app, idx) => (
                  <div key={app.id} className="relative flex gap-3 md:gap-4 group">
                    <div className={`z-10 w-8 h-8 md:w-10 md:h-10 rounded-none flex items-center justify-center border-2 md:border-4 border-white shadow-sm shrink-0 ${
                        app.status === AppStatus.APPROVED || app.status === AppStatus.PAYMENT_REMINDER || app.status === AppStatus.PAYMENT_LAST_CALL ? 'bg-green-500' :
                        app.status === AppStatus.PAYMENT_UNDER_REVIEW ? 'bg-blue-500' :
                        app.status === AppStatus.PENDING ? 'bg-amber-400' :
                        app.status === AppStatus.WAITLIST ? 'bg-blue-500' :
                        app.status === AppStatus.PAID ? 'bg-green-600' :
                        app.status === AppStatus.EXPIRED ? 'bg-gray-400' : 'bg-red-500'
                      }`}>
                      {app.status === AppStatus.APPROVED || app.status === AppStatus.PAYMENT_REMINDER || app.status === AppStatus.PAYMENT_LAST_CALL ? <CheckCircle2 size={16} className="text-white" /> :
                        app.status === AppStatus.PAYMENT_UNDER_REVIEW ? <Clock size={16} className="text-white" /> :
                        app.status === AppStatus.PENDING ? <Clock size={16} className="text-white" /> :
                        app.status === AppStatus.WAITLIST ? <Clock size={16} className="text-white" /> :
                        app.status === AppStatus.PAID ? <CheckCircle2 size={16} className="text-white" /> :
                        app.status === AppStatus.EXPIRED ? <Clock size={16} className="text-white" /> : <XCircle size={16} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="font-bold text-[13px] truncate text-lavrs-dark">{app.brandName}</h4>
                        <span className="text-[9px] text-gray-400 font-bold tracking-tighter shrink-0">
                          {new Date(app.submittedAt).toLocaleDateString('cs-CZ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mb-1.5 truncate">
                        {eventsMap.get(app.eventId)?.title}
                      </p>
                      <span className={`px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-widest ${
                          app.status === AppStatus.APPROVED || app.status === AppStatus.PAYMENT_REMINDER || app.status === AppStatus.PAYMENT_LAST_CALL ? 'bg-green-100 text-green-700' :
                          app.status === AppStatus.PAYMENT_UNDER_REVIEW ? 'bg-blue-100 text-blue-700' :
                          app.status === AppStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                          app.status === AppStatus.WAITLIST ? 'bg-blue-100 text-blue-700' :
                          app.status === AppStatus.PAID ? 'bg-green-100 text-green-800' :
                          app.status === AppStatus.EXPIRED ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'
                        }`}>
                        {app.status === AppStatus.APPROVED || app.status === AppStatus.PAYMENT_REMINDER || app.status === AppStatus.PAYMENT_LAST_CALL ? 'Schváleno' :
                          app.status === AppStatus.PAYMENT_UNDER_REVIEW ? 'Platba se zpracovává' :
                          app.status === AppStatus.PENDING ? 'V posouzení' :
                          app.status === AppStatus.WAITLIST ? 'Waitlist' :
                          app.status === AppStatus.PAID ? 'Zaplaceno' :
                          app.status === AppStatus.EXPIRED ? 'Expirováno' : 'Zamítnuto'}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* My Brand + Social — side by side on mobile, stacked on desktop sidebar */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-8">
            {/* My Brand Box */}
            <div className="bg-white rounded-none p-4 md:p-8 shadow-sm border border-gray-100">
              <h3 className="text-sm md:text-xl font-bold mb-3 md:mb-6">Moje značka</h3>
              <div className="space-y-3">
                {brands.map(brand => (
                  <div key={brand.id} className="group p-3 md:p-5 bg-lavrs-beige/50 border border-transparent hover:border-lavrs-red/30 transition-all cursor-pointer" onClick={() => onNavigate('PROFILE')}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-xs md:text-sm uppercase tracking-wider text-lavrs-dark truncate">{brand.brandName}</h4>
                        <p className="text-[10px] md:text-[11px] text-gray-500 mt-0.5 font-medium italic hidden sm:block">Klikni pro editaci profilu</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-lavrs-red group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media Box */}
            <div className="bg-white rounded-none p-4 md:p-8 shadow-sm border border-gray-100">
              <h3 className="text-sm md:text-xl font-bold text-lavrs-dark mb-3 md:mb-6">Sociální sítě</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
                <a href="https://www.instagram.com/lavrsmarket/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 md:py-8 md:flex-col bg-lavrs-red text-white hover:bg-white hover:text-lavrs-red transition-all border border-lavrs-red/20 group">
                  <Instagram size={20} className="md:mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]">Instagram</span>
                </a>
                <a href="https://www.facebook.com/Lavrsmarket" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 md:py-8 md:flex-col bg-lavrs-red text-white hover:bg-white hover:text-lavrs-red transition-all border border-lavrs-red/20 group">
                  <Facebook size={20} className="md:mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]">Facebook</span>
                </a>
              </div>
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

// Memoize to prevent unnecessary re-renders when parent updates
const ExhibitorDashboard = React.memo(ExhibitorDashboardInner);

export default ExhibitorDashboard;
