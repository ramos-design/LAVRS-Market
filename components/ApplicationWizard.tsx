import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Info, Instagram, Globe, Upload, Check, User, Mail, Phone, Building2, MapPin, CreditCard, ShieldCheck, Sparkles, Image as ImageIcon, Save, PlusCircle, History } from 'lucide-react';
import { sanitizePhoneInput } from '../lib/phoneValidation';
import { ZoneCategory, BrandProfile, Application, AppStatus, EventPlan, Category } from '../types';
import { useEvents, useBrandProfiles, useCategories } from '../hooks/useSupabase';
import { dbEventToApp, dbBrandProfileToApp, dbCategoryToApp, appBrandProfileToDb, formatEventDate, formatEventDateRange } from '../lib/mappers';
import HeartLoader from './HeartLoader';

interface ApplicationWizardProps {
  eventId: string;
  onCancel: () => void;
  onApply: (app: Application) => void;
  eventPlan?: EventPlan;
  userId?: string;
  userEmail?: string;
}

const ApplicationWizardInner: React.FC<ApplicationWizardProps> = ({
  eventId,
  onCancel,
  onApply,
  eventPlan,
  userId,
  userEmail,
}) => {
  const { profiles: dbProfiles, createProfile } = useBrandProfiles();
  const savedBrands = React.useMemo(() => dbProfiles.map(dbBrandProfileToApp), [dbProfiles]);
  const { categories: dbCategories } = useCategories();
  const categories = React.useMemo(() => dbCategories.map(dbCategoryToApp), [dbCategories]);

  const [step, setStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(6);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [currentBrandId, setCurrentBrandId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(userEmail || '');

  const [selectedZoneCategory, setSelectedZoneCategory] = useState<ZoneCategory | null>(null); // Brand category

  const [billingName, setBillingName] = useState('');
  const [ic, setIc] = useState('');
  const [dic, setDic] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingEmail, setBillingEmail] = useState('');

  // Effect to initialize with first brand if available
  useEffect(() => {
    if (savedBrands.length > 0 && !currentBrandId && !brandName) {
      handleBrandSelect(savedBrands[0].id);
    }
  }, [savedBrands]);

  const [extras, setExtras] = useState<{ [key: string]: number }>({});
  const [extraNote, setExtraNote] = useState('');

  // Consents State
  const [consentGDPR, setConsentGDPR] = useState(false);
  const [consentOrg, setConsentOrg] = useState(false);
  const [consentStorno, setConsentStorno] = useState(false);
  const [declineNewsletter, setDeclineNewsletter] = useState(false);
  const [showCatError, setShowCatError] = useState(false);
  const [showBrandError, setShowBrandError] = useState(false);

  const { events: dbEvents } = useEvents();
  const events = React.useMemo(() => dbEvents.map(dbEventToApp), [dbEvents]);

  const event = events.find(e => e.id === eventId);
  const isWaitlist = event?.status === 'waitlist' || event?.status === 'closed';
  const isSoldout = event?.status === 'soldout';

  useEffect(() => {
    setTotalSteps(isWaitlist ? 1 : 5);
  }, [isWaitlist]);

  const extrasList = eventPlan?.extras || [
    { id: 'extra-chair', label: 'Extra Židle', price: '200 Kč' },
    { id: 'extra-table', label: 'Extra Stůl', price: '400 Kč' },
    { id: 'rack-rent', label: 'Extra stojan', price: '300 Kč' },
    { id: 'electricity', label: 'Přípojka elektřiny', price: '500 Kč' }
  ];

  const getCategoryPriceText = (cat: ZoneCategory | null): string => {
    if (!cat) return '0 Kč';
    const raw = eventPlan?.prices?.[cat];
    if (!raw) return '0 Kč';
    // If the value contains any digit, ensure it ends with "Kč"
    if (/\d/.test(raw)) {
      return raw.includes('Kč') ? raw : `${raw} Kč`;
    }
    // Pure text (e.g. "domluvou") — display as-is
    return raw;
  };

  const getCategoryPrice = (cat: ZoneCategory | null) => {
    if (!cat) return 0;
    if (eventPlan?.prices?.[cat]) {
      return parseInt(eventPlan.prices[cat].replace(/[^\d]/g, '')) || 0;
    }
    return 0;
  };

  const calculateTotal = () => {
    const base = getCategoryPrice(selectedZoneCategory);
    const extrasTotal = extrasList.reduce((sum, item) => {
      const count = extras[item.id] || 0;
      if (count <= 0) return sum;
      const price = parseInt(item.price.replace(/[^\d]/g, '')) || 0;
      return sum + (price * count);
    }, 0);
    return base + extrasTotal;
  };

  const selectedExtras = extrasList.filter(extra => extras[extra.id]);

  const handleBrandSelect = useCallback((brandId: string | 'new') => {
    if (brandId === 'new') {
      setCurrentBrandId(null);
      setBrandName('');
      setBrandDescription('');
      setInstagram('');
      setWebsite('');
      setContactPerson('');
      setPhone('');
      setEmail(userEmail || '');
      setBillingName('');
      setIc('');
      setDic('');
      setBillingAddress('');
      setBillingEmail('');
    } else {
      const brand = savedBrands.find(b => b.id === brandId);
      if (brand) {
        setCurrentBrandId(brand.id);
        setBrandName(brand.brandName);
        setBrandDescription(brand.brandDescription || '');
        setInstagram(brand.instagram || '');
        setWebsite(brand.website || '');
        setContactPerson(brand.contactPerson || '');
        setPhone(brand.phone || '');
        setEmail(brand.email || '');
        setBillingName(brand.billingName || '');
        setIc(brand.ic || '');
        setDic(brand.dic || '');
        setBillingAddress(brand.billingAddress || '');
        setBillingEmail(brand.billingEmail || '');
      }
    }
  }, [savedBrands, userEmail]);

  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // 1. Generate a stable ID for new brands or use existing
      const brandId = currentBrandId || `brand-${userId || 'anon'}-${Date.now()}`;

      const brandData: BrandProfile = {
        id: brandId,
        brandName,
        brandDescription,
        instagram,
        website,
        contactPerson,
        phone,
        email,
        billingName,
        ic,
        dic,
        billingAddress,
        billingEmail
      };

      // 2. Only save to profile if requested AND it's new or modified
      if (saveToProfile) {
        await createProfile(appBrandProfileToDb(brandData, userId));
        // Update local state so if they somehow submit again, it's an update
        if (!currentBrandId) setCurrentBrandId(brandId);
      }

      // 3. Create the application
      const newApp: Application = {
        ...brandData,
        id: `APP-${Date.now()}`,
        brandDescription: brandDescription || '',
        instagram: instagram || '',
        website: website || '',
        contactPerson: contactPerson || '',
        phone: phone || '',
        email: email || '',
        billingName: billingName || '',
        ic: ic || '',
        billingAddress: billingAddress || '',
        billingEmail: billingEmail || '',
        zoneCategory: selectedZoneCategory || undefined,
        status: isWaitlist ? AppStatus.WAITLIST : AppStatus.PENDING,
        submittedAt: new Date().toISOString(),
        images: ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400'],
        eventId,
        consentGDPR,
        consentOrg,
        consentStorno,
        consentNewsletter: !declineNewsletter,
        extraNote
      };

      await onApply(newApp);
    } catch (err) {
      console.error("Final submit failed:", err);
      alert("Nepodařilo se odeslat přihlášku. Zkuste to prosím znovu.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, currentBrandId, userId, brandName, brandDescription, instagram, website, contactPerson, phone, email, billingName, ic, dic, billingAddress, billingEmail, saveToProfile, createProfile, selectedZoneCategory, isWaitlist, isSoldout, eventId, consentGDPR, consentOrg, consentStorno, declineNewsletter, extraNote, onApply]);

  const checkIsFull = (category: ZoneCategory | null) => {
    const plan = eventPlan;
    if (!plan || !category) return false;

    const zone = plan.zones.find((z: any) => z.category === category);
    if (!zone) return false;

    const total = (zone.capacities.S || 0) + (zone.capacities.M || 0) + (zone.capacities.L || 0);
    const used = plan.stands.filter((s: any) => s.zoneId === zone.id && s.occupantId).length;

    return used >= total;
  };

  const isZoneFull = selectedZoneCategory ? checkIsFull(selectedZoneCategory) : false;

  const isZoneCategoryEmpty = !isWaitlist && step === 2 && !selectedZoneCategory;
  const isBrandIncomplete = !isWaitlist && step === 4 && (!brandName.trim() || !contactPerson.trim() || !email.trim());
  const nextStep = () => {
    if (isZoneCategoryEmpty) {
      setShowCatError(true);
      return;
    }
    if (isBrandIncomplete) {
      setShowBrandError(true);
      return;
    }
    setShowCatError(false);
    setShowBrandError(false);
    setStep(s => Math.min(s + 1, totalSteps));
    window.scrollTo(0, 0);
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  // Logic for showing the save/update box - exclude selectedZone as it's now event-specific
  const selectedBrand = savedBrands.find(b => b.id === currentBrandId);
  const isNewBrand = !currentBrandId && brandName.trim().length > 0;
  const isModified = currentBrandId && selectedBrand && (
    brandName !== selectedBrand.brandName ||
    brandDescription !== (selectedBrand.brandDescription || '') ||
    instagram !== (selectedBrand.instagram || '') ||
    website !== (selectedBrand.website || '') ||
    contactPerson !== (selectedBrand.contactPerson || '') ||
    phone !== (selectedBrand.phone || '') ||
    email !== (selectedBrand.email || '') ||
    billingName !== (selectedBrand.billingName || '') ||
    ic !== (selectedBrand.ic || '') ||
    dic !== (selectedBrand.dic || '') ||
    billingAddress !== (selectedBrand.billingAddress || '') ||
    billingEmail !== (selectedBrand.billingEmail || '')
  );

  const showSaveBox = isNewBrand || isModified;

  // When event is sold out, prevent registration
  if (isSoldout) {
    return (
      <div className="bg-white rounded-none flex flex-col items-center justify-center shadow-sm border border-gray-100 min-h-[85vh] p-8">
        <div className="text-center max-w-md">
          <div className="mb-6 text-6xl">🔒</div>
          <h2 className="text-4xl font-bold text-lavrs-dark mb-4">Event je vyprodáno</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Bohužel tento event dosáhl své kapacity a nejsou dostupné další místa pro vystavovatele.
          </p>
          <button
            onClick={onCancel}
            className="px-8 py-3 bg-lavrs-dark text-white font-bold hover:bg-lavrs-red transition-all rounded-none"
          >
            Zpět na dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-none flex flex-col md:flex-row overflow-hidden shadow-sm border border-gray-100 min-h-[85vh] -mx-4 md:mx-0">
      {/* Left Panel - Progress & Info */}
      <div className="w-full md:w-1/3 bg-lavrs-beige px-4 py-5 md:p-16 flex flex-col justify-between shrink-0">
        <div>
          {/* Mobile: back button + badge/steps on same row; Desktop: stacked */}
          <div className="flex items-center justify-between mb-4 md:block md:mb-12">
            <button onClick={onCancel} className="flex items-center gap-2 text-gray-400 hover:text-lavrs-dark transition-colors">
              <ChevronLeft size={20} /> Zpět na dashboard
            </button>
            <div className="flex flex-col items-end md:hidden">
              <div className="mb-1 flex gap-2">
                <span className="text-white bg-lavrs-red px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest">
                  {event?.id.includes('mini') ? 'Event' : 'Velký market'}
                </span>
                {isWaitlist && (
                  <span className="bg-white text-lavrs-red border border-lavrs-red px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest">
                    Waitlist režim
                  </span>
                )}
              </div>
              <p className="text-lavrs-red font-bold uppercase tracking-widest text-[10px]">Krok {step} z {totalSteps}</p>
            </div>
          </div>

          <div className={!isWaitlist ? 'md:block' : ''}>
          {/* Desktop only: badge + steps (hidden on mobile, shown in top row instead) */}
          <div className="hidden md:block">
            <div className="mb-2 flex gap-2">
              <span className="text-white bg-lavrs-red px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest">
                {event?.id.includes('mini') ? 'Event' : 'Velký market'}
              </span>
              {isWaitlist && (
                <span className="bg-white text-lavrs-red border border-lavrs-red px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest">
                  Waitlist režim
                </span>
              )}
            </div>
            <p className="text-lavrs-red font-bold uppercase tracking-widest text-[10px] mb-4">Krok {step} z {totalSteps}</p>
          </div>

          {/* Step title - centered on mobile */}
          {!isWaitlist && (
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight text-lavrs-dark mb-0 md:mb-8">
                {step === 1 ? "O akci" : ""}
                {step === 2 && "Kategorie zóny"}
                {step === 3 && "Cena a vybavení"}
                {step === 4 && "Informace o značce"}
                {step === 5 && "Vizuály a souhlasy"}
              </h2>
            </div>
          )}
          {isWaitlist && (
            <h2 className="text-2xl md:text-4xl font-bold leading-tight text-lavrs-dark mb-4 md:mb-8 text-center md:text-left">
              Chci na Waitlist
            </h2>
          )}

          <div className="space-y-6">
            {isWaitlist ? (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Název značky *</label>
                  <input value={brandName} onChange={(e) => setBrandName(e.target.value)} type="text" maxLength={40} placeholder="Vintage Soul" className="w-full bg-white/50 px-6 py-4 rounded-none border border-lavrs-pink/50 shadow-sm focus:outline-none focus:border-lavrs-red font-semibold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Kontaktní osoba *</label>
                  <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} type="text" placeholder="Tereza Nováková" className="w-full bg-white/50 px-6 py-4 rounded-none border border-lavrs-pink/50 shadow-sm focus:outline-none focus:border-lavrs-red font-semibold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">E-mail *</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tereza@vintagesoul.cz" className="w-full bg-white/50 px-6 py-4 rounded-none border border-lavrs-pink/50 shadow-sm focus:outline-none focus:border-lavrs-red font-semibold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Instagram</label>
                  <input value={instagram} onChange={(e) => setInstagram(e.target.value)} type="text" placeholder="@brand_name" className="w-full bg-white/50 px-6 py-4 rounded-none border border-lavrs-pink/50 shadow-sm focus:outline-none focus:border-lavrs-red font-semibold text-sm" />
                </div>
                <div className="p-4 bg-white/30 rounded-none border border-lavrs-red/10 flex gap-3 mt-6">
                  <ShieldCheck className="text-lavrs-red shrink-0" size={20} />
                  <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                    Vaše údaje budou bezpečně uloženy pro případ uvolnění kapacity akce.
                  </p>
                </div>

                <button
                  onClick={handleFinalSubmit}
                  disabled={!brandName || !contactPerson || !email}
                  className={`w-full mt-8 py-5 rounded-none font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${(!brandName || !contactPerson || !email)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-lavrs-dark text-white hover:bg-lavrs-red hover:translate-y-[-2px] active:translate-y-0'
                    }`}
                >
                  Zařadit na waitlist <ChevronRight size={18} />
                </button>
              </div>
            ) : (
              <>
                <div className="p-5 md:p-8 bg-white rounded-none border-2 border-lavrs-pink/20 shadow-md">
                  <div className="flex items-start gap-4 md:block">
                    {/* Left: label + title */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] md:text-[11px] text-lavrs-red font-black uppercase tracking-[0.3em] mb-1 md:mb-4">VYBRANÁ AKCE</p>
                      <h3 className="text-base md:text-3xl font-black text-lavrs-dark leading-tight mb-0 md:mb-6">{event?.title}</h3>
                    </div>
                    {/* Right: date + location (mobile) / below (desktop) */}
                    <div className="shrink-0 md:mt-0 space-y-2 md:space-y-4 text-right md:text-left">
                      <div className="flex items-center justify-end md:justify-start gap-3">
                        <span className="bg-lavrs-red text-white px-3 py-1 text-[10px] md:text-[11px] font-black uppercase tracking-widest leading-none whitespace-nowrap">
                          {event ? formatEventDateRange(event.date, event?.endDate) : ''}
                        </span>
                      </div>
                      <div className="flex items-start justify-end md:justify-start gap-2 text-lavrs-dark font-black uppercase tracking-widest text-[10px] md:text-xs">
                        <MapPin size={14} className="text-lavrs-dark shrink-0 mt-0.5" />
                        <span className="md:inline">
                          {event?.location?.includes(',') ? (
                            <>
                              <span className="block md:inline">{event.location.split(',')[0].trim()}</span>
                              <span className="hidden md:inline">, </span>
                              <span className="block md:inline">{event.location.split(',').slice(1).join(',').trim()}</span>
                            </>
                          ) : event?.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="flex gap-2 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const s = i + 1;
              return (
                <div key={s} className={`h-1 flex-1 rounded-none transition-all duration-500 ${s <= step ? 'bg-lavrs-red' : 'bg-white'}`} />
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">KROK {step} Z {totalSteps}</p>
        </div>
      </div>

      {/* Right Panel - Interactive Content */}
      <div className="flex-1 overflow-y-auto bg-[#FDFBFA] flex flex-col px-4 md:px-0">
        <div className="flex-1">

          {/* Step 2+ or Right Panel in Waitlist */}
          {(step === 1 && isWaitlist && event) ? (
            <div className="animate-fadeIn h-full flex flex-col">
              <div className="relative h-[220px] md:h-[300px] overflow-hidden shrink-0 -mx-4 w-[calc(100%+2rem)] md:mx-0 md:w-full">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-lavrs-dark/80 via-transparent to-transparent flex items-end">
                  <div className="p-5 md:p-12 text-white">
                    <h1 className="text-2xl md:text-4xl font-bold mb-2">{event.title}</h1>
                    <p className="text-sm opacity-90 italic">Unikátní setkání lokálních tvůrců a milovníků cirkulární módy.</p>
                  </div>
                </div>
              </div>

              <div className="max-w-xl mx-auto py-8 md:py-12 px-5 md:px-8">
                <section className="space-y-4">
                  <h3 className="text-xs font-black text-lavrs-red uppercase tracking-[0.2em]">O akci</h3>
                  <div className="prose prose-sm text-gray-600 leading-relaxed text-base italic">
                    <p>LAVRS market v prostorách {event.location} je kurátorovaný výběr nejlepších lokálních značek.</p>
                    <p className="mt-4">Kapacita pro přímé přihlašování je vyčerpána, ale budeme rádi, když se zapíšete na waitlist – o uvolněných místech informujeme přednostně.</p>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: O akci (Normal) */}
              {step === 1 && event && (
                <div className="animate-fadeIn">
                  <div className="relative h-[250px] md:h-[400px] overflow-hidden -mx-4 w-[calc(100%+2rem)] md:mx-0 md:w-full">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-lavrs-dark/80 via-transparent to-transparent flex items-end">
                      <div className="p-6 md:p-12 text-white">
                        <h1 className="text-2xl md:text-5xl font-bold mb-1 md:mb-2">{event.title}</h1>
                        {event.subtitle && <p className="text-sm md:text-lg opacity-90 italic">{event.subtitle}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="max-w-2xl mx-auto py-8 md:py-16 px-5 md:px-8">
                    <section className="space-y-4 md:space-y-6 mb-8 md:mb-16">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">O tomto eventu</h3>
                      <div className="prose prose-sm text-gray-600 leading-relaxed text-base md:text-lg italic">
                        {event.description ? (
                          event.description.split('\n').filter(p => p.trim()).map((paragraph, i) => (
                            <p key={i} className={i > 0 ? 'mt-4' : ''}>{paragraph}</p>
                          ))
                        ) : (
                          <p>Popis eventu nebyl zatím vyplněn.</p>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Kategorie zóny */}
          {!isWaitlist && step === 2 && (
            <div className="max-w-2xl mx-auto py-8 md:py-20 px-5 md:px-8">
              <div className="space-y-6 md:space-y-12 animate-fadeIn">
                <header className="text-center">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Vyberte kategorii, do které patříte</h3>
                </header>

                <div className="grid grid-cols-2 gap-3 md:gap-6">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedZoneCategory(cat.id);
                      }}
                      className={`p-4 md:p-10 rounded-none border-2 text-left transition-all ${selectedZoneCategory === cat.id
                        ? 'border-lavrs-red bg-white shadow-xl scale-[1.02]'
                        : 'border-white bg-white/60 hover:border-lavrs-pink'
                        }`}
                    >
                      <div className="mb-1 md:mb-2">
                        <p className="text-base md:text-2xl font-black text-lavrs-dark leading-tight">{cat.name}</p>
                      </div>
                      <p className="text-xs md:text-sm text-gray-500 font-medium">{cat.description}</p>
                    </button>
                  ))}
                </div>

                {showCatError && !selectedZoneCategory && (
                  <p className="text-center text-sm text-lavrs-red font-bold animate-bounce pt-12">
                    Vyberte prosím kategorii zóny pro pokračování.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Cena a informace */}
          {!isWaitlist && step === 3 && (
            <div className="max-w-xl mx-auto py-8 md:py-20 px-5 md:px-8">
              <div className="space-y-6 md:space-y-12 animate-fadeIn">
                <section className="space-y-4 md:space-y-6">
                  <header>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Cena a podmínky</h3>
                    <p className="text-xs md:text-sm text-gray-500">Základní cena vaší účasti v kategorii <span className="text-lavrs-dark font-bold">{selectedZoneCategory}</span>.</p>
                  </header>

                  <div className="p-6 md:p-10 bg-white border-2 border-lavrs-red/10 rounded-none shadow-sm text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Předpokládaná cena</p>
                    <p className="text-3xl md:text-5xl font-black text-lavrs-dark mb-2">
                      {getCategoryPriceText(selectedZoneCategory)}
                    </p>
                    <p className="text-xs text-gray-500 font-medium italic">Cena bez DPH · včetně základního vybavení dle kategorie</p>
                  </div>
                </section>

                {selectedZoneCategory && eventPlan?.equipment?.[selectedZoneCategory]?.length > 0 ? (
                  <div className="p-6 bg-white border border-gray-100 rounded-none shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Vybavení v ceně</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-11">
                      {eventPlan.equipment[selectedZoneCategory].map((item, idx) => (
                        <span key={idx} className="bg-lavrs-beige/60 border border-lavrs-pink/20 text-lavrs-dark px-3 py-1.5 text-[10px] font-black uppercase tracking-wider">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-white border border-gray-100 rounded-none shadow-sm flex gap-4 items-center">
                    <div className="w-10 h-10 bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <Check size={20} strokeWidth={3} />
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Základní balíček je automaticky zahrnut v ceně vaší vybrané kategorie.
                    </p>
                  </div>
                )}

                {selectedZoneCategory && eventPlan?.categorySizes?.[selectedZoneCategory] && (
                  <div className="p-6 bg-lavrs-beige/50 border border-lavrs-pink/20 rounded-none">
                    <div className="flex items-start gap-3">
                      <Info size={18} className="text-lavrs-red mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Informace o spotu</p>
                        <p className="text-sm text-gray-700 font-medium">
                          {eventPlan.categorySizes[selectedZoneCategory]}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-lavrs-beige/50 p-5 md:p-8 rounded-none border border-lavrs-pink/20 space-y-4">
                  <div className="flex gap-4">
                    <Info size={24} className="text-lavrs-red shrink-0" />
                    <div>
                      <h4 className="font-bold text-lavrs-dark text-sm mb-2">Extra vybavení a speciální požadavky</h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        Jakékoli další doplňky nebo speciální technické požadavky se budou řešit individuálně s možným doplatkem přímo na místě konání akce.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-lavrs-pink/20">
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      Máte-li specifický požadavek již nyní, zašlete nám jej prosím e-mailem na <a href="mailto:lavrs@lavrs.cz" className="text-lavrs-red font-bold hover:underline">lavrs@lavrs.cz</a> s uvedením názvu vaší značky.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Informace o značce */}
          {step === 4 && (
            <div className="max-w-xl mx-auto py-8 md:py-20 px-5 md:px-8">
              <div className="space-y-6 md:space-y-10 animate-fadeIn">
                {/* Brand Selection from History */}
                {savedBrands.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <History size={16} className="text-lavrs-red" />
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Moje uložené značky</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {savedBrands.map(brand => (
                        <button
                          key={brand.id}
                          onClick={() => handleBrandSelect(brand.id)}
                          className={`group p-4 rounded-none border-2 transition-all flex items-center justify-between ${currentBrandId === brand.id
                            ? 'border-lavrs-red bg-white'
                            : 'border-gray-100 bg-white hover:border-lavrs-pink'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-none flex items-center justify-center transition-colors ${currentBrandId === brand.id ? 'bg-lavrs-red text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-lavrs-pink/10 group-hover:text-lavrs-red'}`}>
                              <Sparkles size={16} />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-lavrs-dark">{brand.brandName}</p>
                              <p className="text-[10px] text-gray-400">{brand.instagram || brand.website || 'Bez odkazu'}</p>
                            </div>
                          </div>
                          {currentBrandId === brand.id && <Check size={18} className="text-lavrs-red" strokeWidth={3} />}
                        </button>
                      ))}
                      <button
                        onClick={() => handleBrandSelect('new')}
                        className={`group p-4 rounded-none border-2 border-dashed transition-all flex items-center gap-3 ${!currentBrandId
                          ? 'border-lavrs-red bg-lavrs-pink/5'
                          : 'border-gray-200 bg-white hover:border-lavrs-red/30 hover:bg-lavrs-pink/5'
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-none flex items-center justify-center transition-colors ${!currentBrandId ? 'bg-lavrs-red text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-lavrs-red group-hover:text-white'}`}>
                          <PlusCircle size={16} />
                        </div>
                        <p className="text-sm font-bold text-lavrs-dark">Vytvořit novou značku</p>
                      </button>
                    </div>
                  </section>
                )}

                <div className="space-y-4 md:space-y-6 pt-4 md:pt-6 border-t border-gray-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Název Značky <span className="text-lavrs-red">*</span></label>
                    <input value={brandName} onChange={(e) => setBrandName(e.target.value)} type="text" maxLength={40} placeholder="Vaše značka" className="w-full bg-white p-4 md:p-6 rounded-none border-2 border-gray-200 shadow-sm focus:outline-none focus:border-lavrs-red font-bold text-base md:text-xl transition-all" />
                  </div>


                  {/* Category selection removed from here as it's now Step 2 */}


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Kontaktní osoba <span className="text-lavrs-red">*</span></label>
                      <div className="relative">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} type="text" placeholder="Jméno a příjmení" className="w-full bg-white pl-14 pr-6 py-3 md:py-5 rounded-none border-2 border-gray-200 shadow-sm focus:outline-none focus:border-lavrs-red transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Telefon</label>
                      <div className="relative">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input value={phone} onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))} type="tel" maxLength={16} placeholder="+420 000 000 000" className="w-full bg-white pl-14 pr-6 py-3 md:py-5 rounded-none border-2 border-gray-200 shadow-sm focus:outline-none focus:border-lavrs-red transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">E-mail <span className="text-lavrs-red">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="prijmeni@email.cz" className="w-full bg-white pl-14 pr-6 py-3 md:py-5 rounded-none border-2 border-gray-200 shadow-sm focus:outline-none focus:border-lavrs-red transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Instagram</label>
                      <div className="relative">
                        <Instagram className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input value={instagram} onChange={(e) => setInstagram(e.target.value)} type="text" placeholder="@vas_brand" className="w-full bg-white pl-14 pr-6 py-3 md:py-5 rounded-none border-2 border-gray-200 shadow-sm focus:outline-none focus:border-lavrs-red transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Web (volitelné)</label>
                      <div className="relative">
                        <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input value={website} onChange={(e) => setWebsite(e.target.value)} type="text" placeholder="www.vas-brand.cz" className="w-full bg-white pl-14 pr-6 py-3 md:py-5 rounded-none border-2 border-gray-200 shadow-sm focus:outline-none focus:border-lavrs-red transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Popis značky pro kurátorský výběr</label>
                    <textarea
                      rows={5}
                      value={brandDescription}
                      onChange={(e) => setBrandDescription(e.target.value)}
                      placeholder="Jaký je příběh vaší značky? Co můžeme u vašeho spotu čekat? Napište nám co nejvíce detailů..."
                      className="w-full p-6 rounded-none bg-white border-2 border-gray-200 shadow-sm focus:outline-none focus:border-lavrs-red resize-none text-sm leading-relaxed transition-all"
                    />
                  </div>
                </div>

                {showBrandError && (!brandName.trim() || !contactPerson.trim() || !email.trim()) && (
                  <p className="text-center text-sm text-lavrs-red font-bold animate-bounce pt-4">
                    Vyplňte prosím všechna povinná pole (název značky, kontaktní osoba, e-mail).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Billing Info Step Removed - Moved to post-approval phase */}


          {/* Step 5: Souhlasy & Vizuály */}
          {step === 5 && (
            <div className="max-w-xl mx-auto py-8 md:py-20 px-5 md:px-8">
              <div className="space-y-6 md:space-y-10 animate-fadeIn">
                {/* Price Confirmation Note */}
                <div className="p-6 md:p-10 bg-lavrs-dark text-white rounded-none border-l-8 border-lavrs-red shadow-2xl relative overflow-hidden animate-fadeIn">
                  <h4 className="text-[10px] md:text-[11px] font-black text-lavrs-pink uppercase tracking-[0.3em] mb-4 md:mb-6">REKAPITULACE PLATBY</h4>
                  <div className="space-y-3 md:space-y-4">
                    {(() => {
                      const priceText = getCategoryPriceText(selectedZoneCategory);
                      const isTextPrice = selectedZoneCategory && eventPlan?.prices?.[selectedZoneCategory] && !/\d/.test(eventPlan.prices[selectedZoneCategory]);
                      if (isTextPrice) {
                        return (
                          <>
                            <p className="text-xs md:text-sm opacity-80 leading-relaxed max-w-sm">
                              Cena za vaši kategorii je stanovena:
                            </p>
                            <p className="text-3xl md:text-5xl font-black text-white tracking-tighter">
                              {priceText}
                            </p>
                            <p className="text-xs md:text-sm opacity-80 leading-relaxed max-w-sm pt-2">
                              Po schválení přihlášky vás budeme kontaktovat e-mailem s konkrétní výší platby.
                            </p>
                            <div className="pt-4 flex items-center gap-2 border-t border-white/10">
                              <div className="w-1.5 h-1.5 bg-lavrs-red rounded-full" />
                              <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest leading-none">
                                Kategorie {selectedZoneCategory} — cena bude upřesněna
                              </p>
                            </div>
                          </>
                        );
                      }
                      return (
                        <>
                          <p className="text-xs md:text-sm opacity-80 leading-relaxed max-w-sm">
                            Pokud bude vaše přihláška schválena kurátorským týmem, vystavíme vám výzvu k platbě ve výši:
                          </p>
                          <p className="text-3xl md:text-5xl font-black text-white tracking-tighter">
                            {calculateTotal().toLocaleString('cs-CZ')} Kč
                          </p>
                          <div className="pt-4 flex items-center gap-2 border-t border-white/10">
                            <div className="w-1.5 h-1.5 bg-lavrs-red rounded-full" />
                            <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest leading-none">
                              Zahrnuje základní balíček kategorie {selectedZoneCategory}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <section className="space-y-4 border-t border-gray-100 pt-6 md:pt-10">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Závěrečné souhlasy</h4>

                  <div className="space-y-4">
                    {[
                      { id: 'gdpr', label: 'Souhlasím se zpracováním osobních údajů (GDPR)', required: true, state: consentGDPR, setState: setConsentGDPR },
                      { id: 'org', label: 'Souhlasím se zasíláním organizačních informací k akci', required: true, state: consentOrg, setState: setConsentOrg },
                      { id: 'storno', label: 'Souhlasím se STORNO podmínkami LAVRS market', required: true, state: consentStorno, setState: setConsentStorno },
                      { id: 'newsletter', label: 'Nepřeji si dostávat newsletter LAVRS market (novinky, termíny)', required: false, state: declineNewsletter, setState: setDeclineNewsletter }
                    ].map(consent => (
                      <label key={consent.id} className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative w-6 h-6 shrink-0">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={consent.state}
                            onChange={(e) => consent.setState(e.target.checked)}
                          />
                          <div className="absolute inset-0 border-2 border-gray-200 rounded-none peer-checked:bg-lavrs-red peer-checked:border-lavrs-red transition-all" />
                          <Check className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity" size={14} strokeWidth={4} />
                        </div>
                        <span className="text-sm text-gray-500 group-hover:text-lavrs-dark transition-colors">
                          {consent.label} {consent.required && <span className="text-lavrs-red">*</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </section>

                {/* Save to Profile Option - Only show if new or modified */}
                {showSaveBox && (
                  <section className="p-6 bg-lavrs-beige rounded-none border-2 border-lavrs-red/10 space-y-4 animate-fadeIn">
                    <div className="flex gap-4">
                      <div className="relative w-10 h-10 bg-white rounded-none flex items-center justify-center shrink-0 shadow-sm border border-lavrs-red/10">
                        <Save className="text-lavrs-red" size={20} />
                      </div>
                      <div>
                        <h5 className="font-bold text-lavrs-dark text-sm">
                          {isNewBrand ? "Uložit novou značku do profilu" : "Aktualizovat údaje v profilu"}
                        </h5>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          {isNewBrand
                            ? "Vypadá to, že vytváříte novou značku. Chcete si ji přidat do své historie?"
                            : "Zjistili jsme, že jste v údajích udělali změny oproti minulé akci. Chcete je propsat do profilu?"}
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-white rounded-none border border-lavrs-red/5 hover:border-lavrs-red/20 transition-all select-none">
                      <div className="relative w-6 h-6 shrink-0">
                        <input
                          type="checkbox"
                          checked={saveToProfile}
                          onChange={(e) => setSaveToProfile(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="absolute inset-0 border-2 border-gray-200 rounded-none peer-checked:bg-lavrs-red peer-checked:border-lavrs-red transition-all" />
                        <Check className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity" size={14} strokeWidth={4} />
                      </div>
                      <span className="text-xs font-bold text-lavrs-dark">
                        {isNewBrand ? "Ano, přidat novou značku" : "Ano, aktualizovat můj profil"}
                      </span>
                    </label>
                  </section>
                )}

                <div className="bg-lavrs-beige p-6 rounded-none flex gap-4 border border-gray-100">
                  <ShieldCheck className="text-lavrs-red shrink-0" size={24} />
                  <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                    Vaše přihláška bude nyní odeslána k posouzení našim kurátorům. O výsledku vás budeme informovat e-mailem standardně do 7 pracovních dní.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isWaitlist && (
            <div className="pb-6 md:pb-12 px-5 md:px-8 flex justify-between items-center max-w-2xl mx-auto w-full mt-auto">
              {step > 1 ? (
                <button onClick={prevStep} className="px-4 md:px-8 py-3 md:py-4 rounded-none font-bold text-gray-400 hover:text-lavrs-dark transition-colors">
                  Zpět
                </button>
              ) : <div />}

              <button
                onClick={step === totalSteps ? handleFinalSubmit : nextStep}
                disabled={
                  isSubmitting || (step === totalSteps && (!consentGDPR || !consentOrg || !consentStorno))
                }
                className={`px-8 md:px-12 py-4 md:py-5 rounded-none font-bold transition-all flex items-center gap-2 shadow-xl text-sm md:text-base ${(isSubmitting || (step === totalSteps && (!consentGDPR || !consentOrg || !consentStorno)))
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-lavrs-dark text-white hover:bg-lavrs-red hover:translate-y-[-2px] active:translate-y-[0px]'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <HeartLoader size={20} className="text-white" />
                    Odesílám...
                  </>
                ) : (
                  <>
                    {step === totalSteps ? "Odeslat přihlášku" : "Pokračovat"} <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div >
    </div >
  );
};

// Memoize to prevent unnecessary re-renders when parent updates
const ApplicationWizard = React.memo(ApplicationWizardInner);

export default ApplicationWizard;
