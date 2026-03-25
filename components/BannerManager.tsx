import React, { useEffect, useState, useRef } from 'react';
import { Banner } from '../types';
import { Camera, Plus, Trash2, GripVertical, CheckCircle, Info } from 'lucide-react';

interface BannerManagerProps {
  banners: Banner[];
  onUpdateBanners: (banners: Banner[]) => void;
}

const BannerManager: React.FC<BannerManagerProps> = ({ banners, onUpdateBanners }) => {
  const [localBanners, setLocalBanners] = useState<Banner[]>(banners);
  const [isSaved, setIsSaved] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalBanners(banners);
  }, [banners]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleAddBanner = () => {
    if (localBanners.length >= 10) return;
    const newBanner: Banner = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Novy banner',
      subtitle: 'Strucny popis banneru...',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80',
      tag: 'TIP',
    };
    setLocalBanners([...localBanners, newBanner]);
  };

  const handleRemoveBanner = (id: string) => {
    setLocalBanners(localBanners.filter((b) => b.id !== id));
  };

  const handleUpdate = (id: string, field: keyof Banner, value: string) => {
    setLocalBanners(localBanners.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const handleImageUpload = async (id: string, file?: File) => {
    if (!file) return;
    setUploadError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('Upload selhal'));
        reader.readAsDataURL(file);
      });

      setLocalBanners((prev) => prev.map((b) => (b.id === id ? { ...b, image: dataUrl } : b)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nahrani obrazku se nezdarilo.';
      setUploadError(msg);
    }
  };

  const handleSave = () => {
    onUpdateBanners(localBanners);
    setIsSaved(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-lavrs-dark">Sprava Banneru</h2>
          <p className="text-gray-500 font-medium">Spravujte bannery, ktere se zobrazuji vystavovatelum na dashboardu. (Max. 10)</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleAddBanner}
            disabled={localBanners.length >= 10}
            className="px-8 py-4 bg-white border-2 border-lavrs-dark text-lavrs-dark font-black uppercase tracking-wider text-xs hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> Pridat banner
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-4 bg-lavrs-red text-white font-black uppercase tracking-wider text-xs shadow-xl hover:translate-y-[-2px] transition-all flex items-center gap-2 active:translate-y-0"
          >
            {isSaved ? (
              <>
                <CheckCircle size={16} /> Ulozeno
              </>
            ) : (
              'Ulozit zmeny'
            )}
          </button>
        </div>
      </header>

      {localBanners.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 p-20 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
            <Info size={32} />
          </div>
          <p className="text-gray-400 font-medium italic">Zatim nejsou nastaveny zadne bannery.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {localBanners.map((banner, index) => (
            <div key={banner.id} className="bg-white border border-gray-100 shadow-sm flex flex-col md:flex-row overflow-hidden group">
              <div className="w-full md:w-80 h-48 relative shrink-0 bg-gray-100">
                <img src={banner.image} className="w-full h-full object-cover" alt={banner.title || 'Banner'} />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-lavrs-red hover:text-white transition-colors">
                    <Camera size={14} /> Zmenit foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        void handleImageUpload(banner.id, file);
                        e.currentTarget.value = '';
                      }}
                    />
                  </label>
                </div>
                <div className="absolute top-4 left-4 bg-lavrs-red text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-widest">
                  {banner.tag || 'TAG'}
                </div>
              </div>

              <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Nadpis banneru</label>
                    <input
                      type="text"
                      value={banner.title}
                      onChange={(e) => handleUpdate(banner.id, 'title', e.target.value)}
                      className="w-full text-xl font-bold border-b border-gray-100 py-2 focus:border-lavrs-red outline-none transition-colors"
                      placeholder="Hlavni sdeleni..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Kratky popis</label>
                    <textarea
                      value={banner.subtitle}
                      onChange={(e) => handleUpdate(banner.id, 'subtitle', e.target.value)}
                      className="w-full text-sm text-gray-500 border-b border-gray-100 py-2 focus:border-lavrs-red outline-none transition-colors resize-none h-20"
                      placeholder="Podrobnejsi informace..."
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Tag (barevny stitek)</label>
                    <input
                      type="text"
                      value={banner.tag}
                      onChange={(e) => handleUpdate(banner.id, 'tag', e.target.value)}
                      className="w-full text-sm font-bold border-b border-gray-100 py-2 focus:border-lavrs-red outline-none transition-colors uppercase tracking-widest"
                      placeholder="NOVINKA, DULEZITE..."
                    />
                  </div>

                  <div className="pt-6 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Poradi: #{index + 1}</span>
                    <button
                      onClick={() => handleRemoveBanner(banner.id)}
                      className="text-gray-300 hover:text-lavrs-red flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                      <Trash2 size={14} /> Smazat tento banner
                    </button>
                  </div>
                </div>

                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-200 cursor-grab active:cursor-grabbing md:block hidden">
                  <GripVertical size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-lavrs-beige/50 p-8 flex items-center gap-4 text-gray-500">
        <Info size={20} className="text-lavrs-red shrink-0" />
        <p className="text-sm font-medium italic">
          Tip: Bannery se na dashboardu vystavovatele stridaji kazdych 5 sekund. Doporucujeme pouzivat vyrazne nadpisy a kontrastni fotky.
        </p>
      </div>

      {uploadError && <div className="text-xs text-red-600 font-semibold">{uploadError}</div>}
    </div>
  );
};

export default BannerManager;
