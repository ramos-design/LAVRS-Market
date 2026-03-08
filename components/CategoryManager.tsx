import React, { useState } from 'react';
import { Category } from '../types';
import { Plus, Trash2, Edit, Save, X, Info } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onUpdateCategories }) => {
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleAdd = () => {
    const newCat: Category = {
      id: `cat-${Math.random().toString(36).substr(2, 5)}`,
      name: 'Nová kategorie',
      description: 'Popis kategorie...'
    };
    const updated = [...localCategories, newCat];
    setLocalCategories(updated);
    onUpdateCategories(updated);
  };

  const handleDelete = (id: string) => {
    const updated = localCategories.filter(c => c.id !== id);
    setLocalCategories(updated);
    onUpdateCategories(updated);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updated = localCategories.map(c => 
      c.id === editingId ? { ...c, name: editName, description: editDesc } : c
    );
    setLocalCategories(updated);
    onUpdateCategories(updated);
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
        {localCategories.map((cat) => (
          <div key={cat.id} className="bg-white border border-gray-100 p-8 shadow-sm group hover:shadow-lg transition-all relative">
            {editingId === cat.id ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-lg font-bold border-b-2 border-lavrs-red outline-none py-1"
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full text-sm text-gray-500 border border-gray-100 p-2 outline-none h-24 resize-none"
                />
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
