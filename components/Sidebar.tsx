
import React from 'react';
import { LayoutDashboard, FileText, CreditCard, User, Settings, Layers, DollarSign, Mail, Users } from 'lucide-react';
import { ViewMode } from '../types';

import logo from '../media/LAVRSmarket_logo_white_transp1.png';

interface SidebarProps {
  role: ViewMode;
  activeItem: string;
  onNavigate: (screen: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, activeItem, onNavigate }) => {
  const menuItems = role === 'EXHIBITOR' ? [
    { id: 'DASHBOARD', label: 'Přehled', icon: LayoutDashboard },
    { id: 'APPLICATIONS', label: 'Moje Přihlášky', icon: FileText },
    { id: 'BILLING', label: 'Fakturace', icon: CreditCard },
    { id: 'PROFILE', label: 'Můj profil', icon: User },
  ] : [
    { id: 'DASHBOARD', label: 'Přehled', icon: LayoutDashboard },
    { id: 'CURATOR', label: 'Aktivní přihlášky', icon: Layers },
    { id: 'EVENTS_CONFIG', label: 'Správa Eventů', icon: Settings },
    { id: 'BRANDS', label: 'Seznam značek', icon: Users },
    { id: 'PAYMENTS', label: 'Platby & Fakturace', icon: DollarSign },
    { id: 'EMAILS', label: 'Automatické emaily', icon: Mail },
  ];

  return (
    <aside className="hidden md:flex w-80 bg-lavrs-red flex-col py-10 px-8 shrink-0 h-screen sticky top-0 border-r border-white/5 shadow-2xl">
      <div className="mb-12 flex justify-center">
        <img src={logo} alt="LAVRS Market" className="h-10 w-auto object-contain" />
      </div>

      <nav className="flex-1 space-y-4">
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
      </nav>

      <div className="pt-6 border-t border-white/10 space-y-3">
        <div className="grid grid-cols-1 gap-2">
          <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-white transition-colors">Zpracování osobních údajů</a>
          <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-white transition-colors">Obchodní podmínky</a>
          <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-white transition-colors">Storno podmínky</a>
          <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-white transition-colors">Kontaktujte nás</a>
        </div>
      </div>
    </aside>


  );
};

export default Sidebar;
