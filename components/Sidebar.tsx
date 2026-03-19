
import React from 'react';
import { LayoutDashboard, FileText, CreditCard, User, Settings, Layers, DollarSign, Mail, Users, Image as ImageIcon, Tags, LogOut } from 'lucide-react';
import { ViewMode } from '../types';

import logo from '../media/LAVRSmarket_logo_white_transp1.png';

interface SidebarProps {
  role: ViewMode;
  activeItem: string;
  onNavigate: (screen: string) => void;
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, activeItem, onNavigate, onSignOut }) => {
  const menuItems = role === 'EXHIBITOR' ? [
    { id: 'DASHBOARD', label: 'Přehled', icon: LayoutDashboard },
    { id: 'APPLICATIONS', label: 'Moje Přihlášky', icon: FileText },
    { id: 'BILLING', label: 'Fakturace', icon: CreditCard },
    { id: 'PROFILE', label: 'Můj profil', icon: User },
  ] : [
    { id: 'DASHBOARD', label: 'Přehled', icon: LayoutDashboard },
    { id: 'CURATOR', label: 'Výběr přihlášek', icon: Layers },
    { id: 'APPROVED_APPS', label: 'Aktivní přihlášky', icon: FileText },
    { id: 'EVENTS_CONFIG', label: 'Správa Eventů', icon: Settings },
    { id: 'BRANDS', label: 'Seznam značek', icon: Users },
    { id: 'CATEGORIES', label: 'Kategorie značek', icon: Tags },
    { id: 'PAYMENTS', label: 'Platby & Fakturace', icon: DollarSign },
    { id: 'BANNERS', label: 'Správa bannerů', icon: ImageIcon },
    { id: 'EMAILS', label: 'Automatické emaily', icon: Mail },
  ];

  return (
    <aside className="hidden md:flex w-80 bg-lavrs-red flex-col py-10 px-8 shrink-0 h-screen sticky top-0 border-r border-white/5 shadow-2xl">
      <div className="mb-12 flex justify-center">
        <img src={logo} alt="LAVRS market" className="h-10 w-auto object-contain" />
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-none text-base font-bold transition-all group ${isActive
                ? 'bg-white text-lavrs-red shadow-lg shadow-black/5'
                : 'text-white hover:bg-white/10 transition-all'
                }`}
            >
              <Icon size={18} className={isActive ? 'text-lavrs-red' : 'text-white transition-colors'} />
              {item.label}
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t border-white/10">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-none text-base font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all group"
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            Odhlásit se
          </button>
        </div>
      </nav>

      {role === 'EXHIBITOR' && (
        <div className="mt-auto mb-4 flex justify-center pointer-events-none select-none overflow-visible px-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 shrink min-h-0">
          <img
            src="/media/leopard.png"
            alt="Mascot"
            className="w-full max-w-[220px] h-auto max-h-[150px] lg:max-h-[220px] xl:max-h-[280px] object-contain transition-all duration-500"
          />
        </div>
      )}

      <div className="pt-8 border-t border-white/10">

        <div className="grid grid-cols-1 gap-2">
          <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-white transition-colors">Zpracování osobních údajů</a>
          <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-white transition-colors">Obchodní podmínky</a>
          <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-white transition-colors">Storno podmínky</a>
          <button 
            onClick={() => onNavigate('CONTACT')}
            className="text-[10px] text-left uppercase font-bold tracking-widest text-white/60 hover:text-white transition-colors"
          >
            Kontaktujte nás
          </button>
        </div>
      </div>
    </aside>


  );
};

export default Sidebar;
