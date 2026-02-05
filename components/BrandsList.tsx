import React from 'react';
import { Search } from 'lucide-react';
import { Application, BrandProfile, ZoneCategory } from '../types';
import { EVENTS } from '../constants';

interface BrandsListProps {
  applications: Application[];
  brands: BrandProfile[];
}

const zoneCategoryTabs: { id: 'ALL' | ZoneCategory; label: string }[] = [
  { id: 'ALL', label: 'Vše' },
  { id: ZoneCategory.SECONDHANDS, label: 'Secondhands' },
  { id: ZoneCategory.CESKE_ZNACKY, label: 'České značky' },
  { id: ZoneCategory.DESIGNERS, label: 'Designers' },
  { id: ZoneCategory.BEAUTY, label: 'Beauty ZONE' },
  { id: ZoneCategory.TATTOO, label: 'TATTOO' }
];

const getZoneCategoryLabel = (category?: ZoneCategory) => {
  if (!category) return 'Neuvedeno';
  switch (category) {
    case ZoneCategory.SECONDHANDS:
      return 'Secondhands';
    case ZoneCategory.CESKE_ZNACKY:
      return 'České značky';
    case ZoneCategory.DESIGNERS:
      return 'Designers';
    case ZoneCategory.BEAUTY:
      return 'Beauty ZONE';
    case ZoneCategory.TATTOO:
      return 'TATTOO';
    default:
      return category;
  }
};

const BrandsList: React.FC<BrandsListProps> = ({ applications, brands }) => {
  const [tab, setTab] = React.useState<'ALL' | ZoneCategory>('ALL');
  const [query, setQuery] = React.useState('');

  const rows = React.useMemo(() => {
    const byName = new Map<string, {
      id: string;
      brandName: string;
      contactPerson?: string;
      email?: string;
      instagram?: string;
      website?: string;
      zoneCategory?: ZoneCategory;
      zone?: string;
      lastEventTitle?: string;
      statusLabel?: string;
      source: 'APP' | 'PROFILE';
    }>();

    applications.forEach(app => {
      byName.set(app.brandName.toLowerCase(), {
        id: app.id,
        brandName: app.brandName,
        contactPerson: app.contactPerson,
        email: app.email,
        instagram: app.instagram,
        website: app.website,
        zoneCategory: app.zoneCategory,
          zone: app.zone,
        lastEventTitle: EVENTS.find(e => e.id === app.eventId)?.title,
        statusLabel: app.status,
        source: 'APP'
      });
    });

    brands.forEach(brand => {
      const key = (brand.brandName || '').toLowerCase();
      if (!key) return;
      if (!byName.has(key)) {
        byName.set(key, {
          id: brand.id,
          brandName: brand.brandName,
          contactPerson: brand.contactPerson,
          email: brand.email,
          instagram: brand.instagram,
          website: brand.website,
          zoneCategory: undefined,
          zone: brand.zone,
          lastEventTitle: 'Historie',
          statusLabel: 'Profil',
          source: 'PROFILE'
        });
      }
    });

    return Array.from(byName.values());
  }, [applications, brands]);

  const filtered = rows.filter(row => {
    if (tab !== 'ALL' && row.zoneCategory !== tab) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      row.brandName.toLowerCase().includes(q) ||
      (row.contactPerson || '').toLowerCase().includes(q) ||
      (row.email || '').toLowerCase().includes(q) ||
      (row.instagram || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-lavrs-dark mb-2">Seznam značek</h1>
          <p className="text-gray-500">Přehled všech registrovaných značek, včetně historie.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lavrs-red transition-colors" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat značku..."
            className="pl-12 pr-6 py-3 bg-white border-2 border-gray-100 rounded-none focus:outline-none focus:border-lavrs-red transition-all text-sm w-64 shadow-sm"
          />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {zoneCategoryTabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`px-5 py-2 rounded-none text-[11px] font-bold uppercase tracking-wider transition-all border-2 ${tab === item.id
              ? 'border-lavrs-red text-lavrs-red bg-white'
              : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:text-lavrs-dark'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-lavrs-beige/50 text-gray-500 text-[10px] uppercase tracking-widest">
            <tr>
              <th className="text-left px-6 py-4">Značka</th>
              <th className="text-left px-6 py-4">Kontakt</th>
              <th className="text-left px-6 py-4">Kategorie zóny</th>
              <th className="text-left px-6 py-4">Akce / Stav</th>
              <th className="text-right px-6 py-4">Akce</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-400 font-bold uppercase tracking-widest" colSpan={5}>
                  Nic nenalezeno
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={`${row.source}-${row.id}`} className="border-t border-gray-50 hover:bg-lavrs-beige/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-lavrs-dark">{row.brandName}</div>
                    <div className="text-[11px] text-gray-400">{row.instagram || row.website || '—'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-700">{row.contactPerson || '—'}</div>
                    <div className="text-[11px] text-gray-400">{row.email || '—'}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">{getZoneCategoryLabel(row.zoneCategory)}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-700">{row.lastEventTitle || '—'}</div>
                    <div className="text-[11px] text-gray-400">{row.statusLabel || '—'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-widest border border-gray-200 text-gray-600 hover:border-lavrs-red hover:text-lavrs-red transition-colors">
                        Upravit
                      </button>
                      <button className="px-3 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-widest border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                        Smazat
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BrandsList;
