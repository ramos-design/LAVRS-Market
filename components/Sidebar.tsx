
import React from 'react';
import { LayoutDashboard, FileText, CreditCard, User, Settings, Layers, DollarSign, Mail, Users, Image as ImageIcon, Tags, LogOut, Trash2 } from 'lucide-react';
import { ViewMode } from '../types';
import { AdminPresenceState, getScreenLabel } from '../hooks/useAdminPresence';
import { prefetchScreen } from '../App';

import logo from '../media/LAVRSmarket_logo_white_transp1.png';

interface SidebarProps {
  role: ViewMode;
  activeItem: string;
  onNavigate: (screen: string) => void;
  onSignOut: () => void;
  onlineAdmins?: AdminPresenceState[];
}

const Sidebar: React.FC<SidebarProps> = ({ role, activeItem, onNavigate, onSignOut, onlineAdmins }) => {
  const menuItems = role === 'EXHIBITOR' ? [
    { id: 'DASHBOARD', label: 'Přehled', icon: LayoutDashboard },
    { id: 'APPLICATIONS', label: 'Moje Přihlášky', icon: FileText },
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
    <aside className="hidden md:block w-80 bg-lavrs-red shrink-0 h-screen sticky top-0 border-r border-white/5 shadow-2xl overflow-y-auto">
      <div className="flex flex-col min-h-full w-full py-6 lg:py-10 px-6 lg:px-8 pb-8">
        <div className="mb-6 lg:mb-12 flex justify-center">
          <img src={logo} alt="LAVRS market" className="h-10 w-auto object-contain" />
        </div>

        <nav className="space-y-1 lg:space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                onMouseEnter={() => prefetchScreen(item.id)}
                className={`w-full flex items-center gap-4 px-4 lg:px-6 py-3 lg:py-4 rounded-none text-sm lg:text-base font-bold transition-all group ${isActive
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
              className="w-full flex items-center gap-4 px-4 lg:px-6 py-3 lg:py-4 rounded-none text-sm lg:text-base font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all group"
            >
              <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
              Odhlásit se
            </button>
          </div>
        </nav>

        {/* Spacer - pushes bottom content down when there's room, collapses when not */}
        <div className="flex-1 min-h-4" />

        {role === 'EXHIBITOR' && (
          <div className="mb-4 flex justify-center pointer-events-none select-none overflow-visible px-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <img
              src="/media/leopard.png"
              alt="Mascot"
              className="w-full max-w-[220px] h-auto max-h-[150px] lg:max-h-[220px] xl:max-h-[280px] object-contain transition-all duration-500"
            />
          </div>
        )}

        {role === 'ADMIN' && onlineAdmins && onlineAdmins.length > 0 && (
          <div className="mb-4 px-2">
            <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-3">Online admini</p>
            <div className="space-y-2">
              {onlineAdmins.map(admin => (
                <div key={admin.userId} className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-white/20 text-white font-black text-[9px] flex items-center justify-center uppercase">
                      {admin.fullName.charAt(0)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-lavrs-red rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-bold truncate">{admin.fullName}</p>
                    <p className="text-white/50 text-[9px] truncate">{getScreenLabel(admin.screen)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 lg:pt-8 pb-2 border-t border-white/10">
          <div className="grid grid-cols-1 gap-2">
            {role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('BRAND_TRASH')}
                onMouseEnter={() => prefetchScreen('BRAND_TRASH')}
                className={`text-[10px] text-left uppercase font-bold tracking-widest transition-colors flex items-center gap-1.5 ${activeItem === 'BRAND_TRASH' ? 'text-white' : 'text-white/60 hover:text-white'}`}
              >
                <Trash2 size={10} />
                Koš značek
              </button>
            )}
            {role === 'EXHIBITOR' && (
              <>
                <button onClick={() => onNavigate('PRIVACY')} className="text-[10px] text-left uppercase font-bold tracking-widest text-white/60 hover:text-white transition-colors">Zpracování osobních údajů</button>
                <button onClick={() => onNavigate('TERMS')} className="text-[10px] text-left uppercase font-bold tracking-widest text-white/60 hover:text-white transition-colors">Obchodní podmínky</button>
                <button onClick={() => onNavigate('STORNO')} className="text-[10px] text-left uppercase font-bold tracking-widest text-white/60 hover:text-white transition-colors">Storno podmínky</button>
                <button onClick={() => onNavigate('CONTACT')} className="text-[10px] text-left uppercase font-bold tracking-widest text-white/60 hover:text-white transition-colors">Kontaktujte nás</button>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>


  );
};

export default Sidebar;
