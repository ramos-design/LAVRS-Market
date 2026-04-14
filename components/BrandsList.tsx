import React from 'react';
import { Heart, Search, AlertTriangle, Camera, ChevronDown, ChevronUp, Sparkles, CreditCard, Instagram, Globe, Mail, Phone, Building2, MapPin, Check, X, Save, Loader, Trash2 } from 'lucide-react';
import { sanitizePhoneInput, validatePhone } from '../lib/phoneValidation';
import { AppStatus, ZoneCategory, Application, BrandProfile, MarketEvent } from '../types';
import ImageLightbox from './ImageLightbox';

interface BrandsListProps {
  applications: Application[];
  brands: BrandProfile[];
  events: MarketEvent[];
  onDeleteBrand: (brandProfileId: string) => Promise<void>;
  onUpdateBrand: (brand: BrandProfile) => Promise<void>;
  onTrashBrand?: (brandProfileId: string, brandName: string) => Promise<void>;
}

const zoneCategoryTabs: { id: 'ALL' | string; label: string }[] = [
  { id: 'ALL', label: 'Vše' },
  { id: 'Secondhands', label: 'Secondhands' },
  { id: 'České značky', label: 'České značky' },
  { id: 'Designers', label: 'Designers' },
  { id: 'Beauty ZONE', label: 'Beauty ZONE' },
  { id: 'TATTOO', label: 'TATTOO' },
  { id: 'Reuse', label: 'Reuse zone' }
];

const getZoneCategoryLabel = (category?: ZoneCategory) => {
  if (!category) return 'Neuvedeno';
  switch (category) {
    case 'Secondhands':
      return 'Secondhands';
    case 'České značky':
      return 'České značky';
    case 'Designers':
      return 'Designers';
    case 'Beauty ZONE':
      return 'Beauty ZONE';
    case 'TATTOO':
      return 'TATTOO';
    case 'Reuse':
      return 'Reuse zone';
    default:
      return category;
  }
};

const BrandsList: React.FC<BrandsListProps> = ({ applications, brands, events, onDeleteBrand, onUpdateBrand, onTrashBrand }) => {

  const [tab, setTab] = React.useState<'ALL' | string>('ALL');
  const [query, setQuery] = React.useState('');
  const [deletingBrandId, setDeletingBrandId] = React.useState<string | null>(null);
  const [trashConfirm, setTrashConfirm] = React.useState<{ profileId: string; name: string } | null>(null);
  const [trashing, setTrashing] = React.useState(false);
  const [expandedBrand, setExpandedBrand] = React.useState<string | null>(null);
  const [lightbox, setLightbox] = React.useState<{ images: string[]; index: number } | null>(null);
  const [editingBrandId, setEditingBrandId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<BrandProfile | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Map brand name (lowercase) to brand profile for gallery/logo lookup
  const brandProfileMap = React.useMemo(() => {
    const map = new Map<string, BrandProfile>();
    brands.forEach(bp => map.set(bp.brandName.toLowerCase(), bp));
    return map;
  }, [brands]);

  const rows = React.useMemo(() => {
    const profileIdByBrandName = new Map<string, string>();
    brands.forEach((brand) => {
      const key = (brand.brandName || '').trim().toLowerCase();
      if (key && !profileIdByBrandName.has(key)) {
        profileIdByBrandName.set(key, brand.id);
      }
    });

    const byName = new Map<string, {
      id: string;
      profileId?: string;
      brandName: string;
      contactPerson?: string;
      email?: string;
      instagram?: string;
      website?: string;
      zoneCategory?: ZoneCategory;
      zone?: string;
      lastEventTitle?: string;
      statusLabel?: string;
      isApproved?: boolean;
      source: 'APP' | 'PROFILE';
      billingName?: string;
      ic?: string;
      dic?: string;
      billingAddress?: string;
      billingEmail?: string;
      deletionRequestedAt?: string;
    }>();

    const isApprovedStatus = (status?: string) => {
      const normalized = (status || '').toString().toUpperCase();
      return (
        normalized === AppStatus.APPROVED ||
        normalized === AppStatus.PAID ||
        normalized === AppStatus.PAYMENT_REMINDER ||
        normalized === AppStatus.PAYMENT_LAST_CALL
      );
    };

    applications.filter(app => (app.status || '').toUpperCase() !== 'DELETED').forEach(app => {
      const key = app.brandName.toLowerCase();
      const existing = byName.get(key);
      byName.set(key, {
        id: app.id,
        profileId: existing?.profileId || profileIdByBrandName.get(key),
        brandName: app.brandName,
        contactPerson: app.contactPerson,
        email: app.email,
        instagram: app.instagram,
        website: app.website,
        zoneCategory: app.zoneCategory,
        lastEventTitle: events.find(e => e.id === app.eventId)?.title,
        statusLabel: app.status,
        isApproved: Boolean(existing?.isApproved) || isApprovedStatus(app.status),
        source: 'APP',
        billingName: app.billingName || existing?.billingName,
        ic: app.ic || existing?.ic,
        dic: app.dic || existing?.dic,
        billingAddress: app.billingAddress || existing?.billingAddress,
        billingEmail: app.billingEmail || existing?.billingEmail,
      });
    });

    brands.forEach(brand => {
      const key = (brand.brandName || '').toLowerCase();
      if (!key) return;
      if (!byName.has(key)) {
        byName.set(key, {
          id: brand.id,
          profileId: brand.id,
          brandName: brand.brandName,
          contactPerson: brand.contactPerson,
          email: brand.email,
          instagram: brand.instagram,
          website: brand.website,
          zoneCategory: undefined,
          lastEventTitle: 'Historie',
          statusLabel: 'Profil',
          isApproved: false,
          source: 'PROFILE',
          billingName: brand.billingName,
          ic: brand.ic,
          dic: brand.dic,
          billingAddress: brand.billingAddress,
          billingEmail: brand.billingEmail,
          deletionRequestedAt: brand.deletionRequestedAt,
        });
      } else {
        const existing = byName.get(key)!;
        byName.set(key, {
          ...existing,
          profileId: existing.profileId || brand.id,
          billingName: existing.billingName || brand.billingName,
          ic: existing.ic || brand.ic,
          dic: existing.dic || brand.dic,
          billingAddress: existing.billingAddress || brand.billingAddress,
          billingEmail: existing.billingEmail || brand.billingEmail,
          deletionRequestedAt: existing.deletionRequestedAt || brand.deletionRequestedAt,
        });
      }
    });

    return Array.from(byName.values());
  }, [applications, brands, events]);

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

  const handleDeleteBrand = async (row: (typeof rows)[number]) => {
    const profileId = row.profileId;
    if (!profileId) {
      alert('Tuto značku nelze smazat, protože k ní není přiřazen profil značky.');
      return;
    }

    if (!window.confirm(`Opravdu chcete smazat značku "${row.brandName}"? Tato akce je nevratná.`)) {
      return;
    }

    setDeletingBrandId(profileId);
    try {
      await onDeleteBrand(profileId);
    } catch (error: any) {
      const msg = error?.message || 'Smazání značky se nezdařilo.';
      alert(msg);
    } finally {
      setDeletingBrandId(null);
    }
  };

  const startEditing = (row: (typeof rows)[number]) => {
    const bp = brandProfileMap.get(row.brandName.toLowerCase());
    const profile: BrandProfile = bp
      ? { ...bp }
      : {
          id: row.profileId || row.id,
          brandName: row.brandName,
          brandDescription: '',
          instagram: row.instagram || '',
          website: row.website || '',
          contactPerson: row.contactPerson || '',
          phone: '',
          email: row.email || '',
          billingName: row.billingName || '',
          ic: row.ic || '',
          dic: row.dic || '',
          billingAddress: row.billingAddress || '',
          billingEmail: row.billingEmail || '',
          logoUrl: '',
          galleryUrls: [],
        };
    setEditForm(profile);
    setEditingBrandId(row.id);
    setExpandedBrand(null);
  };

  const cancelEditing = () => {
    setEditingBrandId(null);
    setEditForm(null);
  };

  const updateFormField = (field: keyof BrandProfile, value: any) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  const handleSaveEdit = async () => {
    if (!editForm || !editForm.brandName.trim()) return;
    setSaving(true);
    try {
      await onUpdateBrand(editForm);
      setEditingBrandId(null);
      setEditForm(null);
    } catch (error: any) {
      alert(error?.message || 'Uložení se nezdařilo.');
    } finally {
      setSaving(false);
    }
  };

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

      <div className="bg-white border border-gray-100 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-lavrs-beige/50 text-gray-500 text-[10px] uppercase tracking-widest">
            <tr>
              <th className="text-left px-6 py-4">Značka</th>
              <th className="text-left px-6 py-4">Kontakt</th>
              <th className="text-left px-6 py-4">Kategorie zóny</th>
              <th className="text-left px-6 py-4">Akce / Stav</th>
              <th className="text-right px-6 py-4 w-[120px]">Akce</th>
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
              filtered.map((row) => {
                const bp = brandProfileMap.get(row.brandName.toLowerCase());
                const gallery = bp?.galleryUrls || [];
                const hasMedia = gallery.length > 0 || !!bp?.logoUrl;
                const isExpanded = expandedBrand === row.id;
                const rowKey = `${row.source}-${row.id}`;
                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      className={`border-t border-gray-50 hover:bg-lavrs-beige/20 transition-colors ${hasMedia ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-lavrs-beige/20' : ''}`}
                      onClick={() => hasMedia && setExpandedBrand(isExpanded ? null : row.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {bp?.logoUrl ? (
                            <div className="w-7 h-7 rounded-none overflow-hidden border border-gray-200 shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); setLightbox({ images: [bp.logoUrl!], index: 0 }); }}>
                              <img src={bp.logoUrl} alt="" className="w-full h-full object-contain" />
                            </div>
                          ) : null}
                          <div className="font-bold text-lavrs-dark">{row.brandName}</div>
                          {row.isApproved && (
                            <Heart size={14} className="text-lavrs-red fill-lavrs-red flex-shrink-0" />
                          )}
                          {hasMedia && (
                            <Camera size={12} className="text-gray-300 flex-shrink-0" />
                          )}
                        </div>
                        {row.deletionRequestedAt ? (
                          <div className="flex items-center gap-1.5 mt-1 px-2 py-1 bg-amber-50 border border-amber-200 w-fit">
                            <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
                            <span className="text-[11px] font-semibold text-amber-600">Vystavovatel žádá o smazání</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-400">{row.instagram || row.website || '—'}</div>
                        )}
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
                        <div className="flex items-center justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); editingBrandId === row.id ? cancelEditing() : startEditing(row); }}
                            className={`px-3 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-widest border transition-colors ${editingBrandId === row.id ? 'border-lavrs-red text-lavrs-red bg-red-50' : 'border-gray-200 text-gray-600 hover:border-lavrs-red hover:text-lavrs-red'}`}
                          >
                            {editingBrandId === row.id ? 'Zavřít' : 'Upravit'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Gallery Row */}
                    {isExpanded && hasMedia && editingBrandId !== row.id && (
                      <tr className="border-t border-lavrs-red/10">
                        <td colSpan={5} className="px-6 py-5 bg-lavrs-beige/10">
                          <div className="flex items-start gap-6">
                            {bp?.logoUrl && (
                              <div className="shrink-0">
                                <p className="text-[9px] text-gray-400 uppercase font-bold mb-2">Logo</p>
                                <div className="w-16 h-16 rounded-none overflow-hidden border border-gray-200 bg-white cursor-pointer" onClick={(e) => { e.stopPropagation(); setLightbox({ images: [bp.logoUrl!], index: 0 }); }}>
                                  <img src={bp.logoUrl} alt={row.brandName} className="w-full h-full object-contain hover:scale-105 transition-transform" />
                                </div>
                              </div>
                            )}
                            {gallery.length > 0 && (
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] text-gray-400 uppercase font-bold mb-2 flex items-center gap-1.5">
                                  <Camera size={11} /> Fotogalerie ({gallery.length})
                                </p>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                  {gallery.map((url, i) => (
                                    <div key={url} className="w-20 h-20 shrink-0 bg-white border border-gray-100 overflow-hidden rounded-none cursor-pointer" onClick={(e) => { e.stopPropagation(); setLightbox({ images: gallery, index: i }); }}>
                                      <img src={url} alt={`${row.brandName} ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Inline Edit Form Row */}
                    {editingBrandId === row.id && editForm && (
                      <tr className="border-t-2 border-lavrs-red/20">
                        <td colSpan={5} className="p-0">
                          <div className="bg-lavrs-beige/10 p-6 md:p-8 space-y-8 animate-fadeIn">
                            {/* Gallery preview */}
                            {hasMedia && (
                              <div className="flex items-start gap-6 pb-6 border-b border-gray-100">
                                {bp?.logoUrl && (
                                  <div className="shrink-0">
                                    <p className="text-[9px] text-gray-400 uppercase font-bold mb-2">Logo</p>
                                    <div className="w-16 h-16 rounded-none overflow-hidden border border-gray-200 bg-white cursor-pointer" onClick={(e) => { e.stopPropagation(); setLightbox({ images: [bp.logoUrl!], index: 0 }); }}>
                                      <img src={bp.logoUrl} alt={row.brandName} className="w-full h-full object-contain hover:scale-105 transition-transform" />
                                    </div>
                                  </div>
                                )}
                                {gallery.length > 0 && (
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[9px] text-gray-400 uppercase font-bold mb-2 flex items-center gap-1.5">
                                      <Camera size={11} /> Fotogalerie ({gallery.length})
                                    </p>
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                      {gallery.map((url, i) => (
                                        <div key={url} className="w-16 h-16 shrink-0 bg-white border border-gray-100 overflow-hidden rounded-none cursor-pointer" onClick={(e) => { e.stopPropagation(); setLightbox({ images: gallery, index: i }); }}>
                                          <img src={url} alt={`${row.brandName} ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Brand Info Section */}
                            <div className="space-y-5">
                              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <Sparkles size={16} className="text-lavrs-red" />
                                <h4 className="text-xs font-bold text-lavrs-dark uppercase tracking-tight">Informace o značce</h4>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-3">Název značky <span className="text-lavrs-red">*</span></label>
                                  <input
                                    value={editForm.brandName}
                                    onChange={(e) => updateFormField('brandName', e.target.value)}
                                    maxLength={40}
                                    className={`w-full bg-white px-4 py-3 rounded-none border-2 focus:border-lavrs-red font-bold transition-all text-sm ${!editForm.brandName.trim() ? 'border-lavrs-red/40' : 'border-gray-100'}`}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-3">Popis značky</label>
                                  <input
                                    value={editForm.brandDescription || ''}
                                    onChange={(e) => updateFormField('brandDescription', e.target.value)}
                                    className="w-full bg-white px-4 py-3 rounded-none border-2 border-gray-100 focus:border-lavrs-red transition-all text-sm"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-3">Instagram</label>
                                  <div className="relative">
                                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                                    <input
                                      value={editForm.instagram || ''}
                                      onChange={(e) => updateFormField('instagram', e.target.value)}
                                      className="w-full bg-white pl-10 pr-4 py-3 rounded-none border-2 border-gray-100 focus:border-lavrs-red transition-all text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-3">Web</label>
                                  <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                                    <input
                                      value={editForm.website || ''}
                                      onChange={(e) => updateFormField('website', e.target.value)}
                                      className="w-full bg-white pl-10 pr-4 py-3 rounded-none border-2 border-gray-100 focus:border-lavrs-red transition-all text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-3">Kontaktní osoba</label>
                                  <input
                                    value={editForm.contactPerson || ''}
                                    onChange={(e) => updateFormField('contactPerson', e.target.value)}
                                    className="w-full bg-white px-4 py-3 rounded-none border-2 border-gray-100 focus:border-lavrs-red transition-all text-sm"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-3">E-mail</label>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                                    <input
                                      value={editForm.email || ''}
                                      onChange={(e) => updateFormField('email', e.target.value)}
                                      className="w-full bg-white pl-10 pr-4 py-3 rounded-none border-2 border-gray-100 focus:border-lavrs-red transition-all text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-3">Telefon</label>
                                  <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                                    <input
                                      value={editForm.phone || ''}
                                      onChange={(e) => updateFormField('phone', sanitizePhoneInput(e.target.value))}
                                      type="tel"
                                      maxLength={16}
                                      className={`w-full bg-white pl-10 pr-4 py-3 rounded-none border-2 transition-all text-sm ${editForm.phone && validatePhone(editForm.phone) ? 'border-red-300 focus:border-red-500' : 'border-gray-100 focus:border-lavrs-red'}`}
                                    />
                                  </div>
                                  {editForm.phone && validatePhone(editForm.phone) && (
                                    <p className="text-[10px] text-red-500 font-semibold ml-3 mt-1">{validatePhone(editForm.phone)}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Billing Info Section */}
                            <div className="space-y-5 pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <CreditCard size={16} className="text-lavrs-red" />
                                <h4 className="text-xs font-bold text-lavrs-dark uppercase tracking-tight">Fakturační údaje</h4>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-3">Firma / Jméno</label>
                                  <input
                                    value={editForm.billingName || ''}
                                    onChange={(e) => updateFormField('billingName', e.target.value)}
                                    className="w-full bg-white px-4 py-3 rounded-none border-2 border-gray-100 focus:border-lavrs-red transition-all text-sm font-semibold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-3">IČ</label>
                                  <input
                                    value={editForm.ic || ''}
                                    onChange={(e) => updateFormField('ic', e.target.value)}
                                    className="w-full bg-white px-4 py-3 rounded-none border-2 border-gray-100 focus:border-lavrs-red transition-all text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-3">DIČ</label>
                                  <input
                                    value={editForm.dic || ''}
                                    onChange={(e) => updateFormField('dic', e.target.value)}
                                    className="w-full bg-white px-4 py-3 rounded-none border-2 border-gray-100 focus:border-lavrs-red transition-all text-sm"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-3">Fakturační adresa</label>
                                  <input
                                    value={editForm.billingAddress || ''}
                                    onChange={(e) => updateFormField('billingAddress', e.target.value)}
                                    className="w-full bg-white px-4 py-3 rounded-none border-2 border-gray-100 focus:border-lavrs-red transition-all text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-3">Fakturační e-mail</label>
                                  <input
                                    value={editForm.billingEmail || ''}
                                    onChange={(e) => updateFormField('billingEmail', e.target.value)}
                                    className="w-full bg-white px-4 py-3 rounded-none border-2 border-gray-100 focus:border-lavrs-red transition-all text-sm"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                              {onTrashBrand && row.profileId ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setTrashConfirm({ profileId: row.profileId!, name: row.brandName }); }}
                                  className="px-5 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                >
                                  <Trash2 size={14} />
                                  Přesunout do koše
                                </button>
                              ) : <div />}
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                                  className="px-6 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-lavrs-dark transition-colors"
                                >
                                  Zrušit
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                                  disabled={!editForm.brandName.trim() || saving}
                                  className={`px-8 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${!editForm.brandName.trim() || saving ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-lavrs-red text-white hover:bg-lavrs-dark shadow-lg'}`}
                                >
                                  {saving ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                                  {saving ? 'Ukládám...' : 'Uložit úpravy'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          currentIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(i) => setLightbox({ ...lightbox, index: i })}
        />
      )}

      {/* Trash confirmation dialog */}
      {trashConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !trashing && setTrashConfirm(null)}>
          <div className="bg-white p-8 shadow-2xl max-w-md w-full mx-4 border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-extrabold text-lavrs-dark">Přesunout do koše?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Značka <strong className="text-lavrs-dark">{trashConfirm.name}</strong> a všechny její přihlášky budou přesunuty do koše.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Značku můžete později obnovit nebo trvale smazat v sekci Koš.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setTrashConfirm(null)}
                disabled={trashing}
                className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 hover:border-gray-300 transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                Zrušit
              </button>
              <button
                onClick={async () => {
                  if (!onTrashBrand || trashing) return;
                  setTrashing(true);
                  try {
                    await onTrashBrand(trashConfirm.profileId, trashConfirm.name);
                    setTrashConfirm(null);
                  } catch (err) {
                    console.error('Trash brand failed:', err);
                    alert('Přesunutí do koše selhalo.');
                  } finally {
                    setTrashing(false);
                  }
                }}
                disabled={trashing}
                className="px-5 py-2.5 bg-red-600 text-white hover:bg-red-700 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
              >
                {trashing ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {trashing ? 'Mažu...' : 'Přesunout do koše'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandsList;

