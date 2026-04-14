import React, { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, ArrowLeft, Search } from 'lucide-react';
import { BrandProfile, Application } from '../types';

interface BrandTrashProps {
  trashedBrands: BrandProfile[];
  applications: Application[];
  onRestore: (brandProfileId: string) => Promise<void>;
  onPermanentDelete: (brandProfileId: string, brandName: string) => Promise<void>;
  onBack: () => void;
}

const BrandTrashInner: React.FC<BrandTrashProps> = ({ trashedBrands, applications, onRestore, onPermanentDelete, onBack }) => {
  const [query, setQuery] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'restore'; id: string; name: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return trashedBrands;
    const q = query.toLowerCase();
    return trashedBrands.filter(b =>
      b.brandName.toLowerCase().includes(q) ||
      (b.contactPerson || '').toLowerCase().includes(q) ||
      (b.email || '').toLowerCase().includes(q)
    );
  }, [trashedBrands, query]);

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const getRelatedAppsCount = (brandName: string) => {
    return applications.filter(a =>
      a.brandName.toLowerCase() === brandName.toLowerCase() &&
      a.status === 'DELETED'
    ).length;
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || processing) return;
    setProcessing(true);
    try {
      if (confirmAction.type === 'restore') {
        await onRestore(confirmAction.id);
      } else {
        await onPermanentDelete(confirmAction.id, confirmAction.name);
      }
      setConfirmAction(null);
    } catch (err) {
      console.error(`${confirmAction.type} failed:`, err);
      alert(confirmAction.type === 'restore' ? 'Obnovení selhalo.' : 'Trvalé smazání selhalo.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-lavrs-red transition-colors mb-3 font-bold"
          >
            <ArrowLeft size={16} />
            Zpět na aktivní přihlášky
          </button>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-lavrs-dark mb-1 md:mb-2 flex items-center gap-3">
            <Trash2 size={28} className="text-gray-400" />
            Koš
          </h2>
          <p className="text-sm md:text-base text-gray-500">
            Smazané značky a přihlášky ({filtered.length})
          </p>
        </div>
        {trashedBrands.length > 0 && (
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lavrs-red transition-colors" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hledat v koši..."
              className="pl-12 pr-6 py-3 bg-white border-2 border-gray-100 rounded-none focus:outline-none focus:border-lavrs-red transition-all text-sm w-full md:w-64 shadow-sm"
            />
          </div>
        )}
      </header>

      {/* Empty state */}
      {trashedBrands.length === 0 ? (
        <div className="bg-white border border-gray-100 p-16 text-center shadow-sm">
          <Trash2 size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Koš je prázdný</p>
          <p className="text-gray-300 text-xs">Smazané značky se zobrazí zde.</p>
        </div>
      ) : (
        <>
          {/* Mobile layout */}
          <div className="md:hidden space-y-3">
            {filtered.map((brand) => {
              const relatedApps = getRelatedAppsCount(brand.brandName);
              return (
                <div key={brand.id} className="bg-white border border-gray-100 shadow-sm p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {brand.logoUrl ? (
                      <div className="w-10 h-10 rounded-none overflow-hidden border border-gray-200 shrink-0">
                        <img src={brand.logoUrl} alt={brand.brandName} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-none bg-gray-300 flex items-center justify-center text-white font-black text-lg shrink-0">
                        {brand.brandName[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-lavrs-dark truncate">{brand.brandName}</p>
                      <p className="text-[10px] text-gray-400">Smazáno: {formatDate(brand.trashedAt)}</p>
                      {relatedApps > 0 && (
                        <p className="text-[10px] text-gray-400">{relatedApps} smazaných přihlášek</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmAction({ type: 'restore', id: brand.id, name: brand.brandName })}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 border-2 border-green-200 text-green-700 hover:bg-green-100 transition-all text-[10px] font-bold uppercase tracking-wider"
                    >
                      <RotateCcw size={12} />
                      Obnovit
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'delete', id: brand.id, name: brand.brandName })}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100 transition-all text-[10px] font-bold uppercase tracking-wider"
                    >
                      <Trash2 size={12} />
                      Smazat trvale
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 w-[30%]">Značka</th>
                  <th className="text-left px-6 py-4 w-[20%]">Kontakt</th>
                  <th className="text-left px-6 py-4 w-[20%]">Smazáno</th>
                  <th className="text-left px-6 py-4 w-[10%]">Přihlášky</th>
                  <th className="text-right px-6 py-4 w-[20%]">Akce</th>
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
                  filtered.map((brand) => {
                    const relatedApps = getRelatedAppsCount(brand.brandName);
                    return (
                      <tr key={brand.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 overflow-hidden">
                          <div className="flex items-center gap-3 min-w-0">
                            {brand.logoUrl ? (
                              <div className="w-10 h-10 rounded-none overflow-hidden border border-gray-200 shrink-0">
                                <img src={brand.logoUrl} alt={brand.brandName} className="w-full h-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-none bg-gray-300 flex items-center justify-center text-white font-black text-lg shrink-0">
                                {brand.brandName[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-lavrs-dark truncate">{brand.brandName}</div>
                              <div className="text-[11px] text-gray-400 truncate">{brand.email || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 overflow-hidden">
                          <div className="font-semibold text-gray-700 truncate">{brand.contactPerson || '—'}</div>
                          <div className="text-[11px] text-gray-400 truncate">{brand.phone || '—'}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {formatDate(brand.trashedAt)}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {relatedApps > 0 ? (
                            <span className="text-xs font-semibold">{relatedApps}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setConfirmAction({ type: 'restore', id: brand.id, name: brand.brandName })}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-50 border-2 border-green-200 text-green-700 hover:bg-green-100 transition-all text-[10px] font-bold uppercase tracking-wider"
                            >
                              <RotateCcw size={12} />
                              Obnovit
                            </button>
                            <button
                              onClick={() => setConfirmAction({ type: 'delete', id: brand.id, name: brand.brandName })}
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100 transition-all text-[10px] font-bold uppercase tracking-wider"
                            >
                              <Trash2 size={12} />
                              Smazat
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Confirmation dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !processing && setConfirmAction(null)}>
          <div className="bg-white p-8 shadow-2xl max-w-md w-full mx-4 border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 flex items-center justify-center ${confirmAction.type === 'delete' ? 'bg-red-100' : 'bg-green-100'}`}>
                {confirmAction.type === 'delete' ? (
                  <AlertTriangle size={20} className="text-red-600" />
                ) : (
                  <RotateCcw size={20} className="text-green-600" />
                )}
              </div>
              <h3 className="text-lg font-extrabold text-lavrs-dark">
                {confirmAction.type === 'delete' ? 'Trvale smazat?' : 'Obnovit značku?'}
              </h3>
            </div>

            {confirmAction.type === 'delete' ? (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  Značka <strong className="text-lavrs-dark">{confirmAction.name}</strong> bude <strong className="text-red-600">trvale smazána</strong> včetně všech přihlášek.
                </p>
                <p className="text-xs text-red-500 font-bold mb-6">
                  Tato akce je nevratná!
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  Značka <strong className="text-lavrs-dark">{confirmAction.name}</strong> bude obnovena zpět mezi aktivní značky.
                </p>
                <p className="text-xs text-gray-400 mb-6">
                  Přihlášky této značky budou obnoveny do stavu PENDING.
                </p>
              </>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={processing}
                className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 hover:border-gray-300 transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                Zrušit
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={processing}
                className={`px-5 py-2.5 text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 ${
                  confirmAction.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {processing ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : confirmAction.type === 'delete' ? (
                  <Trash2 size={14} />
                ) : (
                  <RotateCcw size={14} />
                )}
                {processing
                  ? (confirmAction.type === 'delete' ? 'Mažu...' : 'Obnovuji...')
                  : (confirmAction.type === 'delete' ? 'Smazat trvale' : 'Obnovit')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const BrandTrash = React.memo(BrandTrashInner);
export default BrandTrash;
