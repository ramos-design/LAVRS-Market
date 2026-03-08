
import React, { useState } from 'react';
import { ChevronLeft, CreditCard, Apple, Landmark, CheckCircle2, ChevronDown, Building2, MapPin, Mail, ChevronRight } from 'lucide-react';

import { BrandProfile } from '../types';

interface PaymentPageProps {
  onBack: () => void;
  initialBillingDetails?: Partial<BrandProfile>;
  onSaveBilling?: (details: Partial<BrandProfile>) => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ onBack, initialBillingDetails, onSaveBilling }) => {
  const [step, setStep] = useState(1);
  
  // Billing Form State initialized from props
  const [billingName, setBillingName] = useState(initialBillingDetails?.billingName || '');
  const [ic, setIc] = useState(initialBillingDetails?.ic || '');
  const [dic, setDic] = useState(initialBillingDetails?.dic || '');
  const [billingAddress, setBillingAddress] = useState(initialBillingDetails?.billingAddress || '');
  const [billingEmail, setBillingEmail] = useState(initialBillingDetails?.billingEmail || '');

  const handleNextStep = () => {
    if (onSaveBilling) {
      onSaveBilling({
        billingName,
        ic,
        dic,
        billingAddress,
        billingEmail
      });
    }
    setStep(2);
  };

  const isBillingValid = billingName && ic && billingAddress && billingEmail;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="flex items-center gap-4">
        <button 
          onClick={step === 1 ? onBack : () => setStep(1)} 
          className="p-2 hover:bg-lavrs-pink rounded-none transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            {step === 1 ? 'Fakturační údaje' : 'Potvrzení a platba'}
          </h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Objednávka č. LVRS-2024-001</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

        {/* Left Panel: Summary (Always visible) */}
        <div className="bg-white p-10 rounded-none border border-gray-100 shadow-sm space-y-8">
          <h3 className="text-xl font-bold">Rekapitulace</h3>

          <div className="space-y-6">
            <div className="flex justify-between pb-6 border-b border-gray-50">
              <div>
                <p className="font-semibold">Hunting Season 2026</p>
                <p className="text-xs text-gray-400 font-medium">Veletržní palác, Praha</p>
              </div>
              <p className="font-bold">20. 05. 2026</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">Typ místa (Zóna M)</span>
                <span className="font-bold">4.200 Kč</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">Vybavení (Stůl, Štěndr)</span>
                <span className="text-green-600 text-xs font-bold uppercase">V CENĚ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">Administrativní poplatek</span>
                <span className="font-bold">150 Kč</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xl font-bold tracking-tight">Celkem k úhradě</span>
              <span className="text-3xl font-extrabold text-lavrs-red tracking-tight">4.350 Kč</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center p-4 bg-lavrs-pink/20 rounded-none border border-lavrs-pink/30">
              <span className="text-xs font-bold uppercase tracking-widest">Zbývající čas</span>
              <span className="text-lg font-bold text-lavrs-red">4 : 21 : 15 : 08</span>
            </div>
            <p className="text-[10px] text-gray-400 text-center font-medium">Po vypršení časového limitu bude vaše místo nabídnuto náhradníkům z waitlistu.</p>
          </div>
        </div>

        {/* Right Panel: Conditional Content */}
        <div className="space-y-8">
          {step === 1 ? (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Fakturační jméno / Firma *</label>
                  <div className="relative">
                    <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      value={billingName} 
                      onChange={(e) => setBillingName(e.target.value)} 
                      type="text" 
                      placeholder="Např. Design Studio s.r.o." 
                      className="w-full bg-white pl-14 pr-6 py-5 rounded-none border-2 border-gray-100 focus:outline-none focus:border-lavrs-red font-semibold transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">IČ *</label>
                    <input 
                      value={ic} 
                      onChange={(e) => setIc(e.target.value)} 
                      type="text" 
                      placeholder="12345678" 
                      className="w-full bg-white px-6 py-5 rounded-none border-2 border-gray-100 focus:outline-none focus:border-lavrs-red font-semibold transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">DIČ (pokud jste plátci)</label>
                    <input 
                      value={dic} 
                      onChange={(e) => setDic(e.target.value)} 
                      type="text" 
                      placeholder="CZ12345678" 
                      className="w-full bg-white px-6 py-5 rounded-none border-2 border-gray-100 focus:outline-none focus:border-lavrs-red font-semibold transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Adresa sídla *</label>
                  <div className="relative">
                    <MapPin className="absolute left-6 top-8 text-gray-300" size={18} />
                    <textarea 
                      value={billingAddress} 
                      onChange={(e) => setBillingAddress(e.target.value)} 
                      rows={2} 
                      placeholder="Ulice, č.p., PSČ a město" 
                      className="w-full bg-white pl-14 pr-6 py-6 rounded-none border-2 border-gray-100 focus:outline-none focus:border-lavrs-red resize-none font-semibold transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">E-mail pro fakturaci *</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      value={billingEmail} 
                      onChange={(e) => setBillingEmail(e.target.value)} 
                      type="email" 
                      placeholder="faktury@vase-studio.cz" 
                      className="w-full bg-white pl-14 pr-6 py-5 rounded-none border-2 border-gray-100 focus:outline-none focus:border-lavrs-red font-semibold transition-all" 
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleNextStep}
                disabled={!isBillingValid}
                className={`w-full py-6 rounded-none font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl ${
                  isBillingValid 
                  ? 'bg-lavrs-dark text-white hover:bg-lavrs-red hover:translate-y-[-2px] active:translate-y-0' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Pokračovat k platbě <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              <h3 className="text-xl font-bold">Způsob platby</h3>

              <div className="space-y-4">
                <button className="w-full p-6 bg-lavrs-dark text-white rounded-none flex items-center justify-center gap-3 hover:bg-lavrs-red transition-all shadow-xl hover:shadow-lavrs-red/20 active:scale-[0.98]">
                  <Apple size={24} fill="white" /> <span className="font-bold">Apple Pay</span>
                </button>
                <button className="w-full p-6 bg-white border-2 border-gray-100 rounded-none flex items-center justify-center gap-3 hover:border-lavrs-red transition-all active:scale-[0.98]">
                  <div className="w-6 h-6 bg-blue-600 rounded-none flex items-center justify-center text-white font-bold text-[8px]">G</div> <span className="font-bold">Google Pay</span>
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <div className="relative flex justify-center"><span className="px-4 bg-lavrs-beige text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">nebo</span></div>
              </div>

              <div className="space-y-4">
                <button className="w-full p-6 bg-white border border-gray-100 rounded-none flex items-center justify-between group hover:border-lavrs-red transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-lavrs-beige rounded-none flex items-center justify-center text-gray-400 group-hover:bg-lavrs-pink group-hover:text-lavrs-red transition-colors">
                      <CreditCard size={20} />
                    </div>
                    <span className="font-bold">Platební karta</span>
                  </div>
                  <ChevronLeft size={18} className="rotate-180 text-gray-300" />
                </button>

                <button className="w-full p-6 bg-white border border-gray-100 rounded-none flex items-center justify-between group hover:border-lavrs-red transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-lavrs-beige rounded-none flex items-center justify-center text-gray-400 group-hover:bg-lavrs-pink group-hover:text-lavrs-red transition-colors">
                      <Landmark size={20} />
                    </div>
                    <span className="font-bold">Bankovní převod</span>
                  </div>
                  <ChevronLeft size={18} className="rotate-180 text-gray-300" />
                </button>
              </div>

              <div className="flex gap-4 p-6 bg-white/50 rounded-none border border-white">
                <CheckCircle2 size={24} className="text-green-500 shrink-0" />
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  <strong>Zabezpečení:</strong> Vaše platba je šifrována pomocí protokolu TLS 1.3. LAVRS neuchovává kompletní údaje o vaší platební kartě.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PaymentPage;