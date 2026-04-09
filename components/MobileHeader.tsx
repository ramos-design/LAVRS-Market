
import React, { useState, useEffect } from 'react';
import { Menu, X, User, LayoutDashboard, FileText, CreditCard, Layers, DollarSign, Settings, Mail, Users, Image as ImageIcon, Tags, LogOut } from 'lucide-react';
import { ViewMode } from '../types';
import logo from '../media/LAVRSmarket_logo_white_transp1.png';

interface MobileHeaderProps {
    role: ViewMode;
    activeItem: string;
    onNavigate: (screen: string) => void;
    onSignOut: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ role, activeItem, onNavigate, onSignOut }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

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
        { id: 'CATEGORIES', label: 'Kategorie značek', icon: Tags },
        { id: 'PAYMENTS', label: 'Platby & Fakturace', icon: DollarSign },
        { id: 'BANNERS', label: 'Správa bannerů', icon: ImageIcon },
        { id: 'EMAILS', label: 'Automatické emaily', icon: Mail },
    ];

    const handleNavigate = (id: string) => {
        onNavigate(id);
        setIsMenuOpen(false);
    };

    return (
        <div className="md:hidden">
            {/* Header Bar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-lavrs-red flex items-center justify-between px-4 z-[100] shadow-lg">
                <button
                    onClick={() => handleNavigate('PROFILE')}
                    className="p-2 text-white hover:bg-white/10 transition-colors"
                >
                    <User size={24} />
                </button>

                <button
                    onClick={() => handleNavigate('DASHBOARD')}
                    className="flex items-center justify-center"
                >
                    <img src={logo} alt="LAVRS market" className="h-8 w-auto object-contain" />
                </button>

                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 text-white hover:bg-white/10 transition-colors"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* SPACER to push content below fixed header */}
            <div className="h-16" />

            {/* Fullscreen Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 top-16 bg-lavrs-red z-[90] animate-fadeIn overflow-y-auto overscroll-contain">
                    <nav className="p-6 space-y-4">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeItem === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavigate(item.id)}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-none text-lg font-bold transition-all ${isActive
                                        ? 'bg-white text-lavrs-red shadow-lg'
                                        : 'text-white hover:bg-white/10'
                                        }`}
                                >
                                    <Icon size={20} className={isActive ? 'text-lavrs-red' : 'text-white'} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Logout and Footer info */}
                    <div className="absolute bottom-10 left-6 right-6 pt-6 border-t border-white/10 space-y-6">
                        <button
                            onClick={onSignOut}
                            className="flex items-center gap-4 px-6 py-4 w-full text-white/70 hover:text-white transition-colors"
                        >
                            <LogOut size={20} />
                            <span className="text-lg font-bold uppercase tracking-widest">Odhlásit se</span>
                        </button>

                        <div className="grid grid-cols-1 gap-1">
                            <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-white/60">Zpracování osobních údajů</a>
                            <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-white/60">Obchodní podmínky</a>
                            <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-white/60">Storno podmínky</a>
                            <a href="#" className="text-[10px] uppercase font-bold tracking-widest text-white/60">Kontaktujte nás</a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileHeader;
