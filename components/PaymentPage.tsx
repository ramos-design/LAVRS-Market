import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  Building2, 
  MapPin, 
  Mail, 
  CheckCircle2, 
  Plus, 
  Minus, 
  QrCode,
  Sparkles
} from 'lucide-react';

import { BrandProfile, MarketEvent, Application, Category, ExtraItem, AppStatus } from '../types';
import { useEventPlan } from '../hooks/useSupabase';
import { formatEventDate } from '../lib/mappers';
import HeartLoader from './HeartLoader';

interface PaymentPageProps {
  onBack: () => void;
  initialBillingDetails?: Partial<BrandProfile>;
  onSaveBilling?: (details: Partial<BrandProfile>) => void;
  onUpdateStatus?: (id: string, status: AppStatus) => Promise<any>;
  activeEvent?: MarketEvent | null;
  activeApp?: Application | null;
  categories?: Category[];
}

const PaymentPage: React.FC<PaymentPageProps> = ({ onBack, initialBillingDetails, onSaveBilling, onUpdateStatus, activeEvent, activeApp, categories }) => {
  const [step, setStep] = useState(1);
  const [now, setNow] = React.useState(Date.now());
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  
  const { plan: eventPlan } = useEventPlan(activeEvent?.id || null);

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const parsePrice = (priceStr: string) => {
    return parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
  };

  const formatPrice = (num: number) => {
    return new Intl.NumberFormat('cs-CZ').format(num) + ' Kč';
  };
  
  // Get pricing and categories
  const categoryPriceStr = activeApp?.zoneCategory && eventPlan?.prices?.[activeApp.zoneCategory] ? eventPlan.prices[activeApp.zoneCategory] : '0 Kč';
  const basePrice = parsePrice(categoryPriceStr);
  
  const selectedExtrasList = eventPlan?.extras.filter(extra => selectedExtras.has(extra.id)) || [];
  const extrasTotal = selectedExtrasList.reduce((sum, extra) => sum + parsePrice(extra.price), 0);
  const totalAmount = basePrice + extrasTotal;

  // Time remaining logic
  const getRemaining = (deadlineIso?: string) => {
    if (!deadlineIso) return null;
    const diffMs = new Date(deadlineIso).getTime() - now;
    if (diffMs <= 0) return { overdue: true, days: 0, hours: 0, minutes: 0 };
    
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    
    return { overdue: false, days, hours, minutes };
  };

  const remaining = getRemaining(activeApp?.paymentDeadline);

  // Billing Form State
  const [billingName, setBillingName] = useState(initialBillingDetails?.billingName || '');
  const [ic, setIc] = useState(initialBillingDetails?.ic || '');
  const [dic, setDic] = useState(initialBillingDetails?.dic || '');
  const [billingAddress, setBillingAddress] = useState(initialBillingDetails?.billingAddress || '');
  const [billingEmail, setBillingEmail] = useState(initialBillingDetails?.billingEmail || '');
  const [specialNote, setSpecialNote] = useState('');

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [confirmedPayment, setConfirmedPayment] = useState(false);

  const getVariableSymbol = () => {
    if (!activeEvent) return '';
    const date = new Date(activeEvent.date);
    const dd = date.getDate().toString().padStart(2, '0');
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${dd}${mm}${ic}`;
  };

  const toggleExtra = (id: string) => {
    const newSet = new Set(selectedExtras);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedExtras(newSet);
  };

  const handleNextStep = () => {
    if (step === 2 && onSaveBilling) {
      onSaveBilling({ billingName, ic, dic, billingAddress, billingEmail });
    }
    setStep(step + 1);
  };

  const isBillingValid = billingName && ic && billingAddress && billingEmail;

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Doplňkové vybavení';
      case 2: return 'Speciální požadavky';
      case 3: return 'Fakturační údaje';
      case 4: return 'Způsob platby';
      default: return '';
    }
  };

  const variableSymbol = getVariableSymbol();

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="flex items-center gap-4">
        <button 
          onClick={step === 1 ? onBack : () => {
            if (step === 4 && confirmedPayment) {
              setConfirmedPayment(false);
            } else {
              setStep(step - 1);
            }
          }} 
          className="p-2 hover:bg-lavrs-pink rounded-none transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            {getStepTitle()}
          </h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            OBJEDNÁVKA Č. LVRS-2026-{activeApp?.id.slice(0, 4)} — KROK {step} ZE 4
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

        {/* Left Panel: Summary */}
        <div className="bg-white p-10 rounded-none border border-gray-100 shadow-sm space-y-8">
          <h3 className="text-xl font-bold">Rekapitulace</h3>

          <div className="space-y-6">
            <div className="flex justify-between pb-6 border-b border-gray-50">
              <div>
                <p className="font-semibold">{activeEvent?.title || 'Event'}</p>
                <p className="text-xs text-gray-400 font-medium">{activeEvent?.location || 'Místo'}</p>
              </div>
              <p className="font-bold">{activeEvent ? formatEventDate(activeEvent.date) : ''}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">Místo ({activeApp?.zoneCategory || 'Zóna'})</span>
                <span className="font-bold">{categoryPriceStr}</span>
              </div>
              
              {selectedExtrasList.map(extra => (
                <div key={extra.id} className="flex justify-between items-center animate-fadeIn">
                  <span className="text-gray-500 text-sm font-medium">{extra.label}</span>
                  <span className="font-bold">{extra.price}</span>
                </div>
              ))}

              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">Základní vybavení</span>
                <span className="text-green-600 text-xs font-bold uppercase">V CENĚ</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xl font-bold tracking-tight">Celkem k úhradě</span>
              <span className="text-3xl font-extrabold text-lavrs-red tracking-tight">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center p-5 bg-lavrs-red rounded-none border border-black/5 shadow-inner">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Zbývající čas</span>
              <span className="text-xl font-bold text-white tracking-wider">
                {remaining ? (
                  remaining.overdue ? 'EXPIROVÁNO' : `${remaining.days}d : ${remaining.hours}h : ${remaining.minutes}m`
                ) : '—'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 text-center font-medium">Po vypršení limitu bude místo nabídnuto náhradníkům.</p>
          </div>
        </div>

        {/* Right Panel: Step Content */}
        <div className="space-y-8">
          
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-lavrs-beige/30 p-6 border-l-4 border-lavrs-dark">
                <p className="text-sm font-medium leading-relaxed">
                  Vyberte si doplňkové vybavení pro váš stánek. Tyto položky budou připočteny k vaší finální faktuře.
                </p>
              </div>
              
              <div className="space-y-3">
                {eventPlan?.extras.map(extra => {
                  const isSelected = selectedExtras.has(extra.id);
                  return (
                    <button
                      key={extra.id}
                      onClick={() => toggleExtra(extra.id)}
                      className={`w-full p-6 border-2 transition-all flex items-center justify-between group ${
                        isSelected ? 'border-lavrs-red bg-lavrs-red/5' : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 border-2 rounded-none flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-lavrs-red border-lavrs-red text-white' : 'border-gray-200 text-gray-300 group-hover:border-lavrs-red'
                        }`}>
                          {isSelected ? <Minus size={18} /> : <Plus size={18} />}
                        </div>
                        <div className="text-left">
                          <p className={`font-bold uppercase tracking-widest text-[11px] ${isSelected ? 'text-lavrs-red' : 'text-gray-500'}`}>
                            {extra.label}
                          </p>
                          <p className="font-black text-lg">{extra.price}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className={`transition-transform ${isSelected ? 'rotate-90 text-lavrs-red' : 'text-gray-200'}`} />
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full py-6 bg-lavrs-dark text-white rounded-none font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl hover:bg-lavrs-red hover:translate-y-[-2px]"
              >
                Pokračovat k údajům <ChevronRight size={20} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-lavrs-beige/30 p-6 border-l-4 border-lavrs-dark">
                <p className="text-sm font-medium leading-relaxed">
                  Máte specifický dotaz k místu, potřebujete atypické vybavení nebo máte jiné přání? Napište nám ho sem.
                </p>
              </div>
              
              <div className="bg-white p-8 border-2 border-gray-100 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={20} className="text-lavrs-red" />
                  <h3 className="font-bold text-lg uppercase tracking-tight">Vaše poznámka k objednávce</h3>
                </div>
                <textarea
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  rows={6}
                  placeholder="Např.: Potřebuji stánek blízko vstupu, budu mít vlastní stojany, potřebuji k dispozici přípojku na elektřinu (pokud je dostupná)..."
                  className="w-full bg-gray-50/50 px-6 py-5 rounded-none border border-gray-100 focus:outline-none focus:border-lavrs-red font-medium transition-all text-sm shadow-inner"
                />
              </div>

              <button 
                onClick={() => setStep(3)}
                className="w-full py-6 bg-lavrs-dark text-white rounded-none font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl hover:bg-lavrs-red hover:translate-y-[-2px]"
              >
                Pokračovat k údajům <ChevronRight size={20} />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Fakturační jméno / Firma *</label>
                  <div className="relative">
                    <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input value={billingName} onChange={(e) => setBillingName(e.target.value)} type="text" placeholder="Např. Design Studio s.r.o." className="w-full bg-white pl-14 pr-6 py-5 rounded-none border-2 border-gray-100 focus:outline-none focus:border-lavrs-red font-semibold transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">IČ *</label>
                    <input value={ic} onChange={(e) => setIc(e.target.value)} type="text" placeholder="12345678" className="w-full bg-white px-6 py-5 rounded-none border-2 border-gray-100 focus:outline-none focus:border-lavrs-red font-semibold transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">DIČ</label>
                    <input value={dic} onChange={(e) => setDic(e.target.value)} type="text" placeholder="CZ12345678" className="w-full bg-white px-6 py-5 rounded-none border-2 border-gray-100 focus:outline-none focus:border-lavrs-red font-semibold transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Adresa sídla *</label>
                  <div className="relative">
                    <MapPin className="absolute left-6 top-10 text-gray-300" size={18} />
                    <textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} rows={2} placeholder="Ulice, č.p., PSČ a město" className="w-full bg-white pl-14 pr-6 py-6 rounded-none border-2 border-gray-100 focus:outline-none focus:border-lavrs-red resize-none font-semibold transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">E-mail pro fakturaci *</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} type="email" placeholder="faktury@vase-studio.cz" className="w-full bg-white pl-14 pr-6 py-5 rounded-none border-2 border-gray-100 focus:outline-none focus:border-lavrs-red font-semibold transition-all" />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleNextStep}
                disabled={!isBillingValid}
                className={`w-full py-6 rounded-none font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl ${
                  isBillingValid ? 'bg-lavrs-dark text-white hover:bg-lavrs-red hover:translate-y-[-2px]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Potvrdit údaje <ChevronRight size={20} />
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-fadeIn">
              {!confirmedPayment ? (
                <>
                  <div className="bg-white border-2 border-gray-100 p-8 space-y-8">
                    <div className="flex flex-col items-center gap-6 text-center">
                      <div className="w-48 h-48 bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative group">
                        <QrCode size={80} className="text-gray-300" />
                        <div className="absolute inset-0 bg-lavrs-red/10 animate-pulse" />
                        <p className="absolute bottom-2 text-[8px] font-bold uppercase tracking-widest text-lavrs-red">Generuji QR...</p>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Platba převodem</h3>
                        <p className="text-sm text-gray-400 font-medium">Naskenujte QR kód ve své bankovní aplikaci.</p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-8 border-t border-gray-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Číslo účtu</span>
                        <span className="font-black tracking-wider">2900765432 / 2010</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Variabilní symbol</span>
                        <span className="font-black text-lavrs-red tracking-wider">{variableSymbol}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Částka</span>
                        <span className="font-black tracking-wider">{formatPrice(totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 p-6 bg-lavrs-beige/20 border border-lavrs-pink/50">
                    <CheckCircle2 size={24} className="text-green-500 shrink-0" />
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      Po obdržení platby vám zašleme potvrzení a daňový doklad na e-mail. Vaše místo bude definitivně potvrzeno.
                    </p>
                  </div>

                  <button 
                    disabled={isUpdatingStatus}
                    onClick={async () => {
                      if (activeApp && onUpdateStatus) {
                        setIsUpdatingStatus(true);
                        try {
                          await onUpdateStatus(activeApp.id, AppStatus.PAYMENT_UNDER_REVIEW);
                          setConfirmedPayment(true);
                        } catch (err: any) {
                          console.error("Status update error:", err);
                          const errorMsg = err.message || err.details || JSON.stringify(err);
                          alert(`Nepodařilo se uložit stav: ${errorMsg}`);
                        } finally {
                          setIsUpdatingStatus(false);
                        }
                      }
                    }}
                    className="w-full py-6 bg-lavrs-dark text-white rounded-none font-black uppercase tracking-[0.2em] transition-all hover:bg-lavrs-red shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isUpdatingStatus ? (
                      <div className="flex items-center justify-center gap-3">
                        <HeartLoader size={20} className="text-white" />
                        Ukládám...
                      </div>
                    ) : (
                      'Dokončit'
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-8 animate-fadeIn">
                  <div className="bg-white border-2 border-gray-100 p-12 text-center space-y-8">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={48} className="text-green-500" />
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-2xl font-black uppercase tracking-tight">Děkujeme za vaši platbu!</h3>
                      <div className="py-8 border-y-2 border-gray-100 max-w-sm mx-auto">
                        <p className="text-sm text-lavrs-dark font-bold leading-relaxed">
                          Jakmile vaši platbu schválíme a zpracujeme, <br /> zašleme vám finální fakturu na váš email.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={onBack}
                    className="w-full py-6 bg-green-600 text-white rounded-none font-black uppercase tracking-[0.2em] transition-all hover:bg-green-700 shadow-xl flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={20} /> Zpět na přehled
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
