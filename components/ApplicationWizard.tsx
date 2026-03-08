import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Info, Instagram, Globe, Upload, Check, User, Mail, Phone, Building2, MapPin, CreditCard, ShieldCheck, Sparkles, Image as ImageIcon, Save, PlusCircle, History } from 'lucide-react';
import { ZoneType, ZoneCategory, SpotSize, BrandProfile, Application, AppStatus, EventPlan, Category } from '../types';
import { ZONE_DETAILS, EVENTS, MOCK_EVENT_PLANS } from '../constants';

interface ApplicationWizardProps {
  eventId: string;
  onCancel: () => void;
  savedBrands: BrandProfile[];
  onSaveBrand: (brand: BrandProfile) => void;
  onApply: (app: Application) => void;
  eventPlan?: EventPlan;
  categories: Category[];
}

const ApplicationWizard: React.FC<ApplicationWizardProps> = ({
  eventId,
  onCancel,
  savedBrands = [],
  onSaveBrand,
  onApply,
  eventPlan,
  categories
}) => {
  const [step, setStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(6);
  const [saveToProfile, setSaveToProfile] = useState(true);

  // Form State
  const [currentBrandId, setCurrentBrandId] = useState<string | null>(savedBrands.length > 0 ? savedBrands[0].id : null);
  const [brandName, setBrandName] = useState(savedBrands.length > 0 ? savedBrands[0].brandName : '');
  const [brandDescription, setBrandDescription] = useState(savedBrands.length > 0 ? savedBrands[0].brandDescription || '' : '');
  const [instagram, setInstagram] = useState(savedBrands.length > 0 ? savedBrands[0].instagram || '' : '');
  const [website, setWebsite] = useState(savedBrands.length > 0 ? savedBrands[0].website || '' : '');
  const [contactPerson, setContactPerson] = useState(savedBrands.length > 0 ? savedBrands[0].contactPerson || '' : '');
  const [phone, setPhone] = useState(savedBrands.length > 0 ? savedBrands[0].phone || '' : '');
  const [email, setEmail] = useState(savedBrands.length > 0 ? savedBrands[0].email || '' : '');
  const [selectedZone, setSelectedZone] = useState<SpotSize | null>(null); // Spot size (S/M/L)
  const [selectedZoneCategory, setSelectedZoneCategory] = useState<ZoneCategory | null>(null); // Brand category

  const [billingName, setBillingName] = useState(savedBrands.length > 0 ? savedBrands[0].billingName || '' : '');
  const [ic, setIc] = useState(savedBrands.length > 0 ? savedBrands[0].ic || '' : '');
  const [dic, setDic] = useState(savedBrands.length > 0 ? savedBrands[0].dic || '' : '');
  const [billingAddress, setBillingAddress] = useState(savedBrands.length > 0 ? savedBrands[0].billingAddress || '' : '');
  const [billingEmail, setBillingEmail] = useState(savedBrands.length > 0 ? savedBrands[0].billingEmail || '' : '');

  const [extras, setExtras] = useState<{ [key: string]: number }>({});
  const [extraNote, setExtraNote] = useState('');

  // Consents State
  const [consentGDPR, setConsentGDPR] = useState(false);
  const [consentOrg, setConsentOrg] = useState(false);
  const [consentStorno, setConsentStorno] = useState(false);
  const [consentNewsletter, setConsentNewsletter] = useState(false);
  const [showCatError, setShowCatError] = useState(false);

  const event = EVENTS.find(e => e.id === eventId) || EVENTS[0];
  const isWaitlist = event.status === 'closed';
  
  useEffect(() => {
    setTotalSteps(isWaitlist ? 1 : 5);
  }, [isWaitlist]);

  const extrasList = eventPlan?.extras || [
    { id: 'extra-chair', label: 'Extra Židle', price: '200 Kč' },
    { id: 'extra-table', label: 'Extra Stůl', price: '400 Kč' },
    { id: 'rack-rent', label: 'Extra stojan', price: '300 Kč' },
    { id: 'electricity', label: 'Přípojka elektřiny', price: '500 Kč' }
  ];

  const getCategoryPrice = (cat: ZoneCategory | null) => {
    if (!cat) return 0;
    
    // Use price from eventPlan if available
    if (eventPlan?.prices?.[cat]) {
      return parseInt(eventPlan.prices[cat].replace(/[^\d]/g, '')) || 0;
    }

    const mapping: { [key: string]: number } = {
      'Secondhands': 2500,
      'České značky': 3800,
      'Designers': 4200,
      'Beauty ZONE': 3500,
      'TATTOO': 5500
    };
    return mapping[cat] || 0;
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

  const handleBrandSelect = (brandId: string | 'new') => {
    if (brandId === 'new') {
      setCurrentBrandId(null);
      setBrandName('');
      setBrandDescription('');
      setInstagram('');
      setWebsite('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setSelectedZone(null);
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
        setSelectedZone(null);
        setBillingName(brand.billingName || '');
        setIc(brand.ic || '');
        setDic(brand.dic || '');
        setBillingAddress(brand.billingAddress || '');
        setBillingEmail(brand.billingEmail || '');
      }
    }
  };

  const handleFinalSubmit = () => {
    const brandData: BrandProfile = {
      id: currentBrandId || `brand-${Date.now()}`,
      brandName,
      brandDescription,
      instagram,
      website,
      contactPerson,
      phone,
      email,
      zone: selectedZone || undefined,
      billingName,
      ic,
      dic,
      billingAddress,
      billingEmail
    };

    if (saveToProfile) {
      onSaveBrand(brandData);
    }

    // Create the application
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
      zone: selectedZone || SpotSize.S,
      zoneCategory: selectedZoneCategory || undefined,
      status: isWaitlist ? AppStatus.WAITLIST : AppStatus.PENDING,
      submittedAt: new Date().toISOString(),
      images: ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400'],
      eventId,
      consentGDPR,
      consentOrg,
      consentStorno,
      consentNewsletter,
      extraNote
    };

    onApply(newApp);
  };

  const checkIsFull = (size: SpotSize, category: ZoneCategory | null) => {
    const plan = eventPlan || MOCK_EVENT_PLANS[eventId];
    if (!plan || !category) return false;

    const zone = plan.zones.find((z: any) => z.category === category);
    if (!zone) return false;

    const total = zone.capacities[size] || 0;
    // Count both placed stands and apps with same size/category
    const used = plan.stands.filter((s: any) => s.zoneId === zone.id && s.size === size && s.occupantId).length;

    return used >= total;
  };

  const isZoneFull = selectedZone && selectedZoneCategory ? checkIsFull(selectedZone, selectedZoneCategory) : false;

  const isZoneCategoryEmpty = !isWaitlist && step === 2 && !selectedZoneCategory;
  const nextStep = () => {
    if (isZoneCategoryEmpty) {
      setShowCatError(true);
      return;
    }
    setShowCatError(false);
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

  return (
    <div className="bg-white rounded-none flex flex-col md:flex-row overflow-hidden shadow-sm border border-gray-100 min-h-[85vh]">
      {/* Left Panel - Progress & Info */}
      <div className="w-full md:w-1/3 bg-lavrs-beige p-8 md:p-16 flex flex-col justify-between shrink-0">
        <div>
          <button onClick={onCancel} className="mb-12 flex items-center gap-2 text-gray-400 hover:text-lavrs-dark transition-colors">
            <ChevronLeft size={20} /> Zpět na dashboard
          </button>

          <div className="mb-2 flex gap-2">
            <span className="text-white bg-lavrs-red px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest">
              {event.id.includes('mini') ? 'Event' : 'Velký market'}
            </span>
            {event.status === 'closed' && (
              <span className="bg-white text-lavrs-red border border-lavrs-red px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest">
                Waitlist režim
              </span>
            )}
          </div>

          <p className="text-lavrs-red font-bold uppercase tracking-widest text-[10px] mb-4">Krok {step} z {totalSteps}</p>
          <h2 className="text-4xl font-bold leading-tight text-lavrs-dark mb-8">
            {isWaitlist ? "Chci na Waitlist" : (step === 1 ? "O akci" : "")}
            {!isWaitlist && step === 2 && "Kategorie zóny"}
            {!isWaitlist && step === 3 && "Doplňky a vybavení"}
            {!isWaitlist && step === 4 && "Informace o značce"}
            {!isWaitlist && step === 5 && "Vizuály a souhlasy"}
          </h2>

          {isZoneFull && step >= 3 && (
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-xs font-bold animate-fadeIn mb-8">
              Kapacita pro {selectedZoneCategory} ve velikosti {selectedZone} je momentálně plná. Vaše přihláška bude zařazena na waiting list.
            </div>
          )}

          <div className="space-y-6">
            {isWaitlist ? (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Název značky *</label>
                  <input value={brandName} onChange={(e) => setBrandName(e.target.value)} type="text" placeholder="Vintage Soul" className="w-full bg-white/50 px-6 py-4 rounded-none border border-lavrs-pink/50 shadow-sm focus:outline-none focus:border-lavrs-red font-semibold text-sm" />
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
                <div className="p-4 bg-white/50 rounded-none border border-lavrs-pink/30">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Vybraná akce</p>
                  <p className="font-bold text-lavrs-dark">{event.title}</p>
                  <p className="text-xs text-gray-500">{event.date} — {event.location}</p>
                  {event.description && (
                    <p className="mt-2 text-[10px] text-lavrs-red font-bold">{event.description}</p>
                  )}
                </div>

                {(step === totalSteps && selectedZoneCategory) && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="p-4 bg-lavrs-red text-white rounded-none shadow-lg border border-lavrs-red">
                      <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest mb-1">Předpokládaná cena</p>
                      <p className="text-2xl font-bold">{calculateTotal().toLocaleString('cs-CZ')} Kč</p>
                      <p className="text-[10px] opacity-80">včetně doplňků a vybavení</p>
                    </div>
                
                    {selectedExtras.length > 0 && (
                      <div className="p-4 bg-white rounded-none shadow-sm border border-lavrs-red/30">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Zvolené doplňky</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedExtras.map(extra => (
                            <span key={extra.id} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-none border border-lavrs-red/20 text-lavrs-dark bg-lavrs-red/5">
                              {extra.label} +{extra.price}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
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
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">LAVRS Application Protocol 2026</p>
        </div>
      </div>

      {/* Right Panel - Interactive Content */}
      <div className="flex-1 overflow-y-auto bg-[#FDFBFA] flex flex-col">
        <div className="flex-1">

          {/* Step 2+ or Right Panel in Waitlist */}
          {(step === 1 && isWaitlist) ? (
            <div className="animate-fadeIn h-full flex flex-col">
              <div className="relative h-[300px] w-full overflow-hidden shrink-0">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-lavrs-dark/80 via-transparent to-transparent flex items-end">
                  <div className="p-12 text-white">
                    <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
                    <p className="text-sm opacity-90 italic">Unikátní setkání lokálních tvůrců a milovníků cirkulární módy.</p>
                  </div>
                </div>
              </div>

              <div className="max-w-xl mx-auto py-12 px-8">
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
              {step === 1 && (
                <div className="animate-fadeIn">
                  <div className="relative h-[400px] w-full overflow-hidden">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-lavrs-dark/80 via-transparent to-transparent flex items-end">
                      <div className="p-12 text-white">
                        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] mb-4 text-lavrs-pink">
                          <Sparkles size={14} /> Připravujeme pro vás
                        </span>
                        <h1 className="text-5xl font-bold mb-2">{event.title}</h1>
                        <p className="text-lg opacity-90 italic">Unikátní setkání lokálních tvůrců a milovníků cirkulární módy.</p>
                      </div>
                    </div>
                  </div>

                  <div className="max-w-2xl mx-auto py-16 px-8">
                    <section className="space-y-6 mb-16">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">O tomto eventu</h3>
                      <div className="prose prose-sm text-gray-600 leading-relaxed text-lg italic">
                        <p>LAVRS market není jen prodejní akce. Je to komunita. Pro nadcházející edici v prostorách Vnitroblocku jsme připravili kurátorovaný výběr těch nejlepších lokálních značek, které kladou důraz na udržitelnost a kvalitu zpracování.</p>
                        <p className="mt-4">Čeká vás doprovodný program, workshopy zaměřené na upcyklaci a samozřejmě ta nejlepší atmosféra, kterou jinde nezažijete. Buďte součástí změny, kterou chcete vidět v módním průmyslu.</p>
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Kategorie zóny */}
          {!isWaitlist && step === 2 && (
            <div className="max-w-2xl mx-auto py-20 px-8">
              <div className="space-y-12 animate-fadeIn">
                <header className="text-center">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">KATEGORIE ZÓNY *</h3>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedZoneCategory(cat.id);
                        const configuredSize = eventPlan?.categorySizes?.[cat.id];
                        if (configuredSize) {
                          setSelectedZone(configuredSize);
                        } else {
                          // Default fallbacks for common categories
                          if (cat.name === 'Secondhands') setSelectedZone(SpotSize.M);
                          else if (cat.name === 'České značky') setSelectedZone(SpotSize.L);
                          else setSelectedZone(SpotSize.S);
                        }
                      }}
                      className={`p-10 rounded-none border-2 text-left transition-all ${selectedZoneCategory === cat.id
                        ? 'border-lavrs-red bg-white shadow-xl scale-[1.02]'
                        : 'border-white bg-white/60 hover:border-lavrs-pink'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-2xl font-black text-lavrs-dark leading-tight">{cat.name}</p>
                        {selectedZoneCategory === cat.id && (
                          <div className="w-6 h-6 bg-lavrs-red text-white flex items-center justify-center">
                            <Check size={16} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 font-medium">{cat.description}</p>
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

          {/* Step 3: Doplňky k místu */}
          {!isWaitlist && step === 3 && (
            <div className="max-w-xl mx-auto py-20 px-8">
              <div className="space-y-12 animate-fadeIn">
                <section className="space-y-6">
                  <header>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Doplňky k místu (Extra)</h3>
                    <p className="text-sm text-gray-500">Můžete si doobjednat vybavení nad rámec standardního balíčku.</p>
                  </header>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {extrasList.map(extra => (
                      <button
                        key={extra.id}
                        onClick={() => {
                          setExtras(prev => ({
                            ...prev,
                            [extra.id]: prev[extra.id] ? 0 : 1
                          }));
                        }}
                        className={`p-6 rounded-none border-2 flex justify-between items-center transition-all ${extras[extra.id]
                          ? 'border-lavrs-red bg-white shadow-md'
                          : 'border-gray-50 bg-white hover:border-gray-200'
                          }`}
                      >
                        <span className="text-sm font-bold text-lavrs-dark">{extra.label}</span>
                        <span className="text-xs font-bold text-lavrs-red">+{extra.price}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <header>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Vlastní doplňků nebo poznámka</h3>
                    <p className="text-sm text-gray-500">Pokud potřebujete něco, co v seznamu chybí, napište nám to zde.</p>
                  </header>
                  <textarea
                    rows={4}
                    value={extraNote}
                    onChange={(e) => setExtraNote(e.target.value)}
                    placeholder="Mám vlastní věšáky, potřebuji více místa pro převlékárnu..."
                    className="w-full p-6 rounded-none bg-white border-2 border-gray-200 shadow-sm focus:outline-none focus:border-lavrs-red resize-none text-sm transition-all"
                  />
                </section>

                <div className="flex gap-4 p-6 bg-lavrs-beige/50 rounded-none border border-lavrs-pink/20 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-lavrs-red/30" />
                  <Info size={20} className="text-lavrs-red shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                    <strong>Vybavení v ceně:</strong> Každé místo obsahuje základní balíček (stůl/židle) dle vybrané kategorie. Konkrétní seznam obdržíte v potvrzovacím e-mailu.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Informace o značce */}
          {step === 4 && (
            <div className="max-w-xl mx-auto py-20 px-8">
              <div className="space-y-10 animate-fadeIn">
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

                <div className="space-y-6 pt-6 border-t border-gray-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Název Značky</label>
                    <input value={brandName} onChange={(e) => setBrandName(e.target.value)} type="text" placeholder="Vaše značka" className="w-full bg-white p-6 rounded-none border-2 border-gray-200 shadow-sm focus:outline-none focus:border-lavrs-red font-bold text-xl transition-all" />
                  </div>


                  {/* Category selection removed from here as it's now Step 2 */}


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Kontaktní osoba</label>
                      <div className="relative">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} type="text" placeholder="Jméno a příjmení" className="w-full bg-white pl-14 pr-6 py-5 rounded-none border-2 border-gray-200 shadow-sm focus:outline-none focus:border-lavrs-red transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Telefon</label>
                      <div className="relative">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="text" placeholder="+420 000 000 000" className="w-full bg-white pl-14 pr-6 py-5 rounded-none border-2 border-gray-200 shadow-sm focus:outline-none focus:border-lavrs-red transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="prijmeni@email.cz" className="w-full bg-white pl-14 pr-6 py-5 rounded-none border-2 border-gray-200 shadow-sm focus:outline-none focus:border-lavrs-red transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Instagram</label>
                      <div className="relative">
                        <Instagram className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input value={instagram} onChange={(e) => setInstagram(e.target.value)} type="text" placeholder="@vas_brand" className="w-full bg-white pl-14 pr-6 py-5 rounded-none border-2 border-gray-200 shadow-sm focus:outline-none focus:border-lavrs-red transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Web (volitelné)</label>
                      <div className="relative">
                        <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input value={website} onChange={(e) => setWebsite(e.target.value)} type="text" placeholder="www.vas-brand.cz" className="w-full bg-white pl-14 pr-6 py-5 rounded-none border-2 border-gray-200 shadow-sm focus:outline-none focus:border-lavrs-red transition-all" />
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
              </div>
            </div>
          )}

          {/* Billing Info Step Removed - Moved to post-approval phase */}


          {/* Step 5: Souhlasy & Vizuály */}
          {step === 5 && (
            <div className="max-w-xl mx-auto py-20 px-8">
              <div className="space-y-10 animate-fadeIn">
                {/* Price Confirmation Note */}
                <div className="p-8 bg-lavrs-beige border-2 border-lavrs-red/10 rounded-none relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <CreditCard size={120} />
                  </div>
                  <h4 className="text-[10px] font-bold text-lavrs-red uppercase tracking-widest mb-4">REKAPITULACE</h4>
                  <div className="space-y-2 relative z-10">
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">
                      Pokud bude vaše přihláška schválena kurátorským týmem, bude vám zaslána výzva k platbě ve výši:
                    </p>
                    <p className="text-4xl font-black text-lavrs-dark">
                      {calculateTotal().toLocaleString('cs-CZ')} Kč
                    </p>
                    <p className="text-[11px] text-gray-400 italic">
                      (Základní balíček {selectedZoneCategory} + zvolené doplňky)
                    </p>
                  </div>
                </div>

                <section className="space-y-4 border-t border-gray-100 pt-10">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Závěrečné souhlasy</h4>

                  <div className="space-y-4">
                    {[
                      { id: 'gdpr', label: 'Souhlasím se zpracováním osobních údajů (GDPR)', required: true, state: consentGDPR, setState: setConsentGDPR },
                      { id: 'org', label: 'Souhlasím se zasíláním organizačních informací k akci', required: true, state: consentOrg, setState: setConsentOrg },
                      { id: 'storno', label: 'Souhlasím se STORNO podmínkami LAVRS market', required: true, state: consentStorno, setState: setConsentStorno },
                      { id: 'newsletter', label: 'Chci odebírat newsletter LAVRS market (novinky, termíny)', required: false, state: consentNewsletter, setState: setConsentNewsletter }
                    ].map(consent => (
                      <label key={consent.id} className="flex items-start gap-4 cursor-pointer group">
                        <div className="relative mt-1 w-6 h-6 shrink-0">
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
                    Vaše přihláška bude nyní odeslána k posouzení našim kurátorům. O výsledku vás budeme informovat e-mailem standardně do 5 pracovních dní.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isWaitlist && (
            <div className="pb-12 px-8 flex justify-between items-center max-w-2xl mx-auto w-full mt-auto">
              {step > 1 ? (
                <button onClick={prevStep} className="px-8 py-4 rounded-none font-bold text-gray-400 hover:text-lavrs-dark transition-colors">
                  Zpět
                </button>
              ) : <div />}

              <button
                onClick={step === totalSteps ? handleFinalSubmit : nextStep}
                disabled={
                  (step === totalSteps && (!consentGDPR || !consentOrg || !consentStorno))
                }
                className={`px-12 py-5 rounded-none font-bold transition-all flex items-center gap-2 shadow-xl ${(step === totalSteps && (!consentGDPR || !consentOrg || !consentStorno))
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-lavrs-dark text-white hover:bg-lavrs-red hover:translate-y-[-2px] active:translate-y-[0px]'
                  }`}
              >
                {step === totalSteps ? "Odeslat přihlášku" : "Pokračovat"} <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div >
    </div >
  );
};

export default ApplicationWizard;
