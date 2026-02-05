
import React, { useState } from 'react';
import { ChevronLeft, Instagram, Globe, Check, X, AlertCircle, MessageSquare, Edit2, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { MOCK_APPLICATIONS } from '../constants';
import { Application, AppStatus, ZoneType } from '../types';

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

    // Simulate moving to next
    const currentIndex = applications.findIndex(a => a.id === id);
    if (currentIndex < applications.length - 1) {
      setSelectedAppId(applications[currentIndex + 1].id);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-lavrs-pink rounded-none transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Casting Dashboard</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Hunting Season 2026 — 42 Nových přihlášek</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-2 rounded-none border border-gray-100 flex items-center gap-4 shadow-sm">
            <Users size={16} className="text-gray-400" />
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Kapacita</p>
              <p className="text-sm font-bold">85%</p>
            </div>
          </div>
          <div className="bg-white px-6 py-2 rounded-none border border-gray-100 flex items-center gap-4 shadow-sm">
            <TrendingUp size={16} className="text-green-500" />
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Obrátka</p>
              <p className="text-sm font-bold">1.2M Kč</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex gap-8 flex-1 overflow-hidden">

        {/* Left: Applications List */}
        <div className="w-80 bg-white rounded-none border border-gray-100 flex flex-col overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold">Fronta k posouzení</h3>
            <span className="bg-lavrs-pink text-lavrs-red text-[10px] font-bold px-2 py-0.5 rounded-none">NOVÉ</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {applications.map(app => (
              <button
                key={app.id}
                onClick={() => setSelectedAppId(app.id)}
                className={`w-full text-left p-4 rounded-none transition-all ${selectedApp?.id === app.id
                  ? 'bg-lavrs-dark text-white shadow-lg translate-x-1'
                  : 'hover:bg-lavrs-beige'
                  }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-sm truncate pr-2">{app.brandName}</h4>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${app.zone === ZoneType.L ? 'bg-indigo-500 text-white' :
                    app.zone === ZoneType.M ? 'bg-amber-500 text-white' : 'bg-gray-400 text-white'
                    }`}>
                    {app.zone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] opacity-60">Před 2 hod</span>
                  {app.status !== AppStatus.PENDING && (
                    <div className={`w-2 h-2 rounded-none ${app.status === AppStatus.APPROVED ? 'bg-green-500' : 'bg-red-500'}`} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Preview & Curation Panel */}
        <div className="flex-1 bg-white rounded-none border border-gray-100 shadow-sm flex overflow-hidden">
          {!selectedApp ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest">
              Žádné přihlášky k posouzení
            </div>
          ) : (
            <>
              {/* Visual Feed Section */}
              <div className="flex-1 p-8 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-none bg-lavrs-pink flex items-center justify-center text-lavrs-red font-bold text-2xl">
                      {selectedApp.brandName[0]}
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold tracking-tight">{selectedApp.brandName}</h3>
                      <div className="flex gap-4 mt-1">
                        <a href="#" className="flex items-center gap-1 text-xs text-gray-400 hover:text-lavrs-red transition-colors">
                          <Instagram size={14} /> {selectedApp.instagram}
                        </a>
                        <a href="#" className="flex items-center gap-1 text-xs text-gray-400 hover:text-lavrs-red transition-colors">
                          <Globe size={14} /> {selectedApp.website}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-3 bg-gray-50 rounded-none text-gray-400 hover:text-lavrs-dark transition-colors">
                      <Edit2 size={20} />
                    </button>
                    <button className="p-3 bg-gray-50 rounded-none text-gray-400 hover:text-lavrs-dark transition-colors">
                      <MessageSquare size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-8 overflow-y-auto pr-4">
                  <section>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Popis konceptu</h4>
                    <p className="text-lg leading-relaxed text-gray-700 font-medium">"{selectedApp.brandDescription}"</p>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Vizuální portfolium</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedApp.images.map((img, i) => (
                        <div key={i} className="aspect-square rounded-none overflow-hidden group relative">
                          <img src={img} alt="Portfolio" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-lavrs-dark/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-bold uppercase tracking-widest">Zvětšit</span>
                          </div>
                        </div>
                      ))}
                      {/* Mock Insta Feed Grid */}
                      {[1, 2, 3, 4].map(i => (
                        <div key={`m-${i}`} className="aspect-square rounded-none bg-gray-100 animate-pulse" />
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              {/* Decision Sidebar */}
              <div className="w-96 bg-lavrs-beige/30 border-l border-gray-100 p-8 flex flex-col">
                <div className="flex-1 space-y-10">

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detail Místa</h4>
                    <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Zóna</span>
                        <select className="bg-transparent font-bold focus:outline-none">
                          <option>Zóna {selectedApp.zone}</option>
                          <option>Zóna S</option>
                          <option>Zóna M</option>
                          <option>Zóna L</option>
                        </select>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Požadavek</span>
                        <span className="text-sm text-gray-500">Standardní (Stůl + Štěndr)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Interní Poznámky</h4>
                    <textarea
                      className="w-full bg-white p-6 rounded-none border border-gray-100 shadow-sm focus:outline-none focus:border-lavrs-red text-sm resize-none h-32"
                      placeholder="Zadejte poznámku pro tým..."
                    />
                  </div>

                  <div className="bg-lavrs-red/5 p-6 rounded-none border border-lavrs-red/20 space-y-3">
                    <div className="flex items-center gap-2 text-lavrs-red">
                      <AlertCircle size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">AI Curation Insight</span>
                    </div>
                    <p className="text-xs text-lavrs-red/80 font-medium">
                      Značka vizuálně odpovídá segmentu "Minimalist Luxury". Vysoká pravděpodobnost konverze na základě minulých marketů.
                    </p>
                  </div>
                </div>

                <div className="pt-8 space-y-3">
                  <button
                    onClick={() => handleAction(selectedApp.id, AppStatus.APPROVED)}
                    className="w-full bg-green-600 text-white py-5 rounded-none font-bold flex items-center justify-center gap-3 hover:bg-green-700 transition-all shadow-lg hover:shadow-green-500/20 active:scale-[0.98]"
                  >
                    <Check size={24} /> SCHVÁLIT ZNAČKU
                  </button>
                  <button
                    onClick={() => handleAction(selectedApp.id, AppStatus.REJECTED)}
                    className="w-full bg-white text-gray-400 border border-gray-200 py-5 rounded-none font-bold flex items-center justify-center gap-3 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all active:scale-[0.98]"
                  >
                    <X size={24} /> ZAMÍTNOUT
                  </button>
                  <button className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-lavrs-dark transition-colors">
                    PŘESUNOUT NA WAITLIST
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default CuratorModule;