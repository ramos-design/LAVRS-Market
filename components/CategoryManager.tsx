import React, { useState } from 'react';
import { Category } from '../types';
import { Plus, Trash2, Edit, Save, X, Info } from 'lucide-react';
import { useCategories } from '../hooks/useSupabase';
import { dbCategoryToApp } from '../lib/mappers';

interface CategoryManagerProps {
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = () => {
  const { categories: dbCategories, createCategory, updateCategory, deleteCategory, loading } = useCategories();
  const categories = React.useMemo(() => dbCategories.map(dbCategoryToApp), [dbCategories]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCatId, setEditCatId] = useState('');

  const handleAdd = async () => {
    const newCat = {
      id: `cat-${Math.random().toString(36).substr(2, 5)}`,
      name: 'Nová kategorie',
      description: 'Popis kategorie...'
    };
    await createCategory(newCat);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Opravdu chcete smazat tuto kategorii?')) {
      await deleteCategory(id);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description);
    setEditCatId(cat.id);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    // If ID changed, delete old and create new
    if (editCatId !== editingId) {
      await deleteCategory(editingId);
      await createCategory({
        id: editCatId,
        name: editName,
        description: editDesc
      });
    } else {
      // If ID unchanged, just update name and desc
      await updateCategory(editingId, {
        name: editName,
        description: editDesc
      });
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-lavrs-dark">Kategorie značek</h2>
          <p className="text-gray-500 font-medium">Správa kategorií zón pro přihlášky na eventy.</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-8 py-4 bg-lavrs-red text-white font-black uppercase tracking-wider text-xs shadow-xl hover:translate-y-[-2px] transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Přidat kategorii
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && categories.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400">Načítám kategorie...</div>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white border border-gray-100 p-8 shadow-sm group hover:shadow-lg transition-all relative">
            {editingId === cat.id ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-lavrs-red uppercase tracking-widest block mb-1">ID Kategorie</label>
                  <input
                    type="text"
                    value={editCatId}
                    onChange={(e) => setEditCatId(e.target.value.toUpperCase())}
                    className="w-full text-sm font-bold border-b-2 border-lavrs-red outline-none py-1 uppercase"
                    placeholder="OSTATNI"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Jméno kategorie</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-lg font-bold border-b-2 border-lavrs-red outline-none py-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Popis</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full text-sm text-gray-500 border border-gray-100 p-2 outline-none h-24 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="bg-lavrs-dark text-white p-2 flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <Save size={14} /> Uložit
                  </button>
                  <button onClick={() => setEditingId(null)} className="bg-gray-100 text-gray-500 p-2 flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <X size={14} /> Zrušit
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <span className="text-[10px] font-black text-lavrs-red uppercase tracking-widest block mb-2">id: {cat.id}</span>
                  <h3 className="text-xl font-black text-lavrs-dark mb-2">{cat.name}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed italic">"{cat.description}"</p>
                </div>

                <div className="pt-6 border-t border-gray-50 flex gap-4">
                  <button
                    onClick={() => startEdit(cat)}
                    className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-400 hover:text-lavrs-dark"
                  >
                    <Edit size={14} /> Editovat
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-400 hover:text-lavrs-red"
                  >
                    <Trash2 size={14} /> Odstranit
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50/50 p-8 border border-blue-100/50 flex items-start gap-4">
        <Info size={24} className="text-blue-500 shrink-0 mt-1" />
        <div className="space-y-4">
          <p className="text-sm text-blue-800 font-medium">
            <strong>Tip pro adminy:</strong> Pokud přidáte novou kategorii, automaticky se nabídne všem vystavovatelům v druhém kroku přihlášky k eventu. Administrátorům se poté v sekci "Ceník" u každého eventu zobrazí pole pro zadání ceny a výběr vybavení pro tuto novou kategorii.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
