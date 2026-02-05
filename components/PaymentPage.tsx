
import React from 'react';
import { ChevronLeft, CreditCard, Apple, Landmark, CheckCircle2, ChevronDown } from 'lucide-react';

interface PaymentPageProps {
  onBack: () => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ onBack }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-lavrs-pink rounded-none transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Potvrzení Rezervace</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Objednávka č. LVRS-2024-001</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

        {/* Order Recalculation */}
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

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-none flex justify-between items-center group cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Storno podmínky</span>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-8">
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

      </div>
    </div>
  );
};

export default PaymentPage;