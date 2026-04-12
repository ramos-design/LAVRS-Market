import React, { useState } from 'react';
import { User, Shield, Key, Bell, Save, Trash2, Plus, Sparkles, Instagram, Globe, Mail, Phone, Building2, MapPin, CreditCard, ChevronDown, ChevronUp, Check, Info, Eye, EyeOff, Lock, Pencil, Clock } from 'lucide-react';
import { BrandProfile } from '../types';
import { useBrandProfiles } from '../hooks/useSupabase';
import { useAuth } from '../hooks/useAuth';
import { dbBrandProfileToApp, appBrandProfileToDb } from '../lib/mappers';
import { supabase } from '../lib/supabase';

interface ProfileProps {
    initialBrands: BrandProfile[];
}

const BrandEditForm: React.FC<{
    editForm: BrandProfile;
    updateFormField: (field: keyof BrandProfile, value: any) => void;
    cancelEditing: () => void;
    handleSave: () => void;
    setBrandToDeleteId: (id: string) => void;
    deletionRequested?: boolean;
}> = ({ editForm, updateFormField, cancelEditing, handleSave, setBrandToDeleteId, deletionRequested }) => (
    <div className="p-5 md:p-8 space-y-8 md:space-y-10 animate-fadeIn">
        {/* Part 1: BRAND INFO */}
        <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Sparkles size={18} className="text-lavrs-red" />
                <h4 className="text-sm font-bold text-lavrs-dark uppercase tracking-tight">Informace o značce</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Název značky <span className="text-lavrs-red">*</span></label>
                    <input
                        value={editForm.brandName}
                        onChange={(e) => updateFormField('brandName', e.target.value)}
                        maxLength={40}
                        placeholder="Povinné pole"
                        className={`w-full bg-gray-50 px-6 py-4 rounded-none border-2 focus:bg-white focus:border-lavrs-red font-bold transition-all ${!editForm.brandName.trim() ? 'border-lavrs-red/40' : 'border-transparent'}`}
                    />
                    {!editForm.brandName.trim() && (
                        <p className="text-xs text-lavrs-red font-medium ml-4">Název značky je povinný údaj.</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Popis značky (pro kurátory)</label>
                <textarea
                    rows={4}
                    value={editForm.brandDescription}
                    onChange={(e) => updateFormField('brandDescription', e.target.value)}
                    className="w-full bg-gray-50 p-6 rounded-none border-2 border-transparent focus:bg-white focus:border-lavrs-red text-sm leading-relaxed transition-all resize-none"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Instagram</label>
                    <div className="relative">
                        <Instagram className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input
                            value={editForm.instagram}
                            onChange={(e) => updateFormField('instagram', e.target.value)}
                            className="w-full bg-gray-50 pl-14 pr-6 py-4 rounded-none border-2 border-transparent focus:bg-white focus:border-lavrs-red transition-all"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Web (volitelné)</label>
                    <div className="relative">
                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input
                            value={editForm.website}
                            onChange={(e) => updateFormField('website', e.target.value)}
                            className="w-full bg-gray-50 pl-14 pr-6 py-4 rounded-none border-2 border-transparent focus:bg-white focus:border-lavrs-red transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Kontaktní osoba</label>
                    <input
                        value={editForm.contactPerson}
                        onChange={(e) => updateFormField('contactPerson', e.target.value)}
                        className="w-full bg-gray-50 px-4 md:px-6 py-3 md:py-4 rounded-none border-2 border-transparent focus:bg-white focus:border-lavrs-red transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">E-mail</label>
                    <input
                        value={editForm.email}
                        onChange={(e) => updateFormField('email', e.target.value)}
                        className="w-full bg-gray-50 px-4 md:px-6 py-3 md:py-4 rounded-none border-2 border-transparent focus:bg-white focus:border-lavrs-red transition-all"
                    />
                </div>
                <div className="space-y-2 sm:col-span-2 md:col-span-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Telefon</label>
                    <input
                        value={editForm.phone}
                        onChange={(e) => updateFormField('phone', e.target.value)}
                        className="w-full bg-gray-50 px-4 md:px-6 py-3 md:py-4 rounded-none border-2 border-transparent focus:bg-white focus:border-lavrs-red transition-all"
                    />
                </div>
            </div>
        </div>

        {/* Part 2: BILLING INFO */}
        <div className="space-y-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <CreditCard size={18} className="text-lavrs-red" />
                <h4 className="text-sm font-bold text-lavrs-dark uppercase tracking-tight">Fakturační údaje</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Firma / Jméno</label>
                    <input
                        value={editForm.billingName}
                        onChange={(e) => updateFormField('billingName', e.target.value)}
                        className="w-full bg-gray-50 px-4 md:px-6 py-3 md:py-4 rounded-none border-2 border-transparent focus:bg-white focus:border-lavrs-red transition-all font-semibold"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">IČ</label>
                        <input
                            value={editForm.ic}
                            onChange={(e) => updateFormField('ic', e.target.value)}
                            className="w-full bg-gray-50 px-6 py-4 rounded-none border-2 border-transparent focus:bg-white focus:border-lavrs-red transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">DIČ</label>
                        <input
                            value={editForm.dic}
                            onChange={(e) => updateFormField('dic', e.target.value)}
                            className="w-full bg-gray-50 px-6 py-4 rounded-none border-2 border-transparent focus:bg-white focus:border-lavrs-red transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Fakturační adresa</label>
                    <input
                        value={editForm.billingAddress}
                        onChange={(e) => updateFormField('billingAddress', e.target.value)}
                        className="w-full bg-gray-50 px-4 md:px-6 py-3 md:py-4 rounded-none border-2 border-transparent focus:bg-white focus:border-lavrs-red transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Fakturační e-mail</label>
                    <input
                        value={editForm.billingEmail}
                        onChange={(e) => updateFormField('billingEmail', e.target.value)}
                        className="w-full bg-gray-50 px-4 md:px-6 py-3 md:py-4 rounded-none border-2 border-transparent focus:bg-white focus:border-lavrs-red transition-all"
                    />
                </div>
            </div>
        </div>

        {/* FORM ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 pt-6 mt-6 border-t border-gray-100">
            <button
                onClick={cancelEditing}
                className="px-6 md:px-8 py-3 md:py-4 rounded-none font-bold text-gray-400 hover:text-lavrs-dark transition-all order-2 sm:order-1"
            >
                Zrušit změny
            </button>
            <button
                onClick={handleSave}
                disabled={!editForm.brandName.trim()}
                className={`px-8 md:px-10 py-3 md:py-4 rounded-none font-bold transition-all shadow-xl flex items-center justify-center gap-2 order-1 sm:order-2 ${!editForm.brandName.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-lavrs-red text-white hover:bg-lavrs-dark'}`}
            >
                <Check size={18} /> Uložit úpravy
            </button>
            {deletionRequested ? (
                <div className="sm:ml-auto flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-600 text-xs font-semibold order-3 self-end">
                    <Clock size={16} />
                    Čeká na smazání
                </div>
            ) : (
                <button
                    onClick={() => setBrandToDeleteId(editForm.id)}
                    className="sm:ml-auto p-3 md:p-4 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-none transition-all order-3 self-end"
                    title="Požádat o smazání značky"
                >
                    <Trash2 size={20} />
                </button>
            )}
        </div>
    </div>
);

const ProfileInner: React.FC<ProfileProps> = () => {
    const { profiles: dbProfiles, createProfile, updateProfile, requestDeletion, loading } = useBrandProfiles();
    const brands = React.useMemo(() => dbProfiles.map(dbBrandProfileToApp), [dbProfiles]);

    const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
    const [brandToDeleteId, setBrandToDeleteId] = useState<string | null>(null);

    // Temporary state for the brand being edited
    const [editForm, setEditForm] = useState<BrandProfile | null>(null);

    const startEditing = (brand: BrandProfile) => {
        setEditingBrandId(brand.id);
        setEditForm({ ...brand });
    };

    const cancelEditing = () => {
        setEditingBrandId(null);
        setEditForm(null);
    };

    const handleAddNewBrand = () => {
        const newBrand: BrandProfile = {
            id: `brand-${Date.now()}`,
            brandName: '',
            brandDescription: '',
            instagram: '',
            website: '',
            contactPerson: '',
            phone: '',
            email: '',
            billingName: '',
            ic: '',
            dic: '',
            billingAddress: '',
            billingEmail: ''
        };
        startEditing(newBrand);
    };

    const handleSave = async () => {
        if (editForm) {
            if (!editForm.brandName.trim()) {
                alert('Název značky je povinný údaj.');
                return;
            }
            const dbBrand = appBrandProfileToDb(editForm, authUser?.id);
            const exists = brands.find(b => b.id === editForm.id);
            if (exists) {
                // Strip user_id from updates — it must never be overwritten
                const { user_id, ...safeUpdates } = dbBrand;
                await updateProfile(editForm.id, safeUpdates);
            } else {
                await createProfile(dbBrand);
            }

            // Sync billing data to all applications with the same brand name
            if (authUser?.id && editForm.brandName) {
                const billingUpdates: Record<string, any> = {
                    billing_name: editForm.billingName || null,
                    ic: editForm.ic || null,
                    dic: editForm.dic || null,
                    billing_address: editForm.billingAddress || null,
                    billing_email: editForm.billingEmail || null,
                };
                await supabase
                    .from('applications')
                    .update(billingUpdates)
                    .eq('user_id', authUser.id)
                    .eq('brand_name', editForm.brandName);
            }

            cancelEditing();
        }
    };

    const handleRequestDeletion = async () => {
        if (brandToDeleteId) {
            await requestDeletion(brandToDeleteId);
            setBrandToDeleteId(null);
            if (editingBrandId === brandToDeleteId) {
                cancelEditing();
            }
        }
    };

    const updateFormField = (field: keyof BrandProfile, value: any) => {
        if (editForm) {
            setEditForm({ ...editForm, [field]: value });
        }
    };

    const { user: authUser } = useAuth();

    // Password change state
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const passwordRequirements = {
        minLength: newPassword.length >= 8,
        hasUppercase: /[A-Z]/.test(newPassword),
        hasLowercase: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
    };
    const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

    const handlePasswordChange = async () => {
        setPasswordMessage(null);

        if (!allRequirementsMet) {
            setPasswordMessage({ type: 'error', text: 'Heslo musí mít alespoň 8 znaků, velké a malé písmeno a číslici.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Hesla se neshodují.' });
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setPasswordMessage({ type: 'success', text: 'Heslo bylo úspěšně změněno.' });
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setShowPasswordForm(false);
                setPasswordMessage(null);
            }, 2000);
        } catch (e: any) {
            setPasswordMessage({ type: 'error', text: e.message || 'Nepodařilo se změnit heslo.' });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="space-y-8 md:space-y-12 animate-fadeIn pb-40 pt-4 md:pt-0">
            <header>
                <h1 className="text-2xl md:text-4xl font-bold text-lavrs-dark mb-1 md:mb-2">Moje značka</h1>
                <p className="text-sm md:text-base text-gray-500">Správa vašich uložených profilů a vizitka značek.</p>
            </header>

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Moje uložené značky</h2>
                    <button
                        onClick={handleAddNewBrand}
                        className="flex items-center gap-2 bg-lavrs-dark text-white px-4 py-2 rounded-none text-xs font-bold hover:bg-lavrs-red transition-all shadow-md group"
                    >
                        <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Přidat novou značku
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Add NEW brand form (if it's not in the brands list yet) */}
                    {editingBrandId && !brands.find(b => b.id === editingBrandId) && editForm && (
                        <div className="bg-white rounded-none border border-lavrs-red shadow-xl overflow-hidden animate-fadeIn">
                            <div className="p-5 md:p-8 bg-lavrs-beige/30 border-b border-lavrs-red/10 flex items-center gap-4 md:gap-6">
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-none bg-lavrs-red text-white flex items-center justify-center shrink-0">
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-2xl font-bold text-lavrs-dark">Nová značka</h3>
                                    <p className="text-xs text-gray-400 mt-1">Vyplňte údaje pro vaši novou vizitku</p>
                                </div>
                            </div>
                            <BrandEditForm
                                editForm={editForm}
                                updateFormField={updateFormField}
                                cancelEditing={cancelEditing}
                                handleSave={handleSave}
                                setBrandToDeleteId={setBrandToDeleteId}
                            />
                        </div>
                    )}

                    {!loading && brands.length === 0 && !editingBrandId && (
                        <div className="bg-white border-2 border-dashed border-gray-200 p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 text-gray-300 flex items-center justify-center mx-auto mb-4">
                                <Sparkles size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-lavrs-dark mb-2">Zatím zde nemáte žádnou značku</h3>
                            <p className="text-sm text-gray-400 mb-6">Vytvořte si svůj první profil, který pak snadno nahrajete do přihlášky.</p>
                            <button
                                onClick={handleAddNewBrand}
                                className="inline-flex items-center gap-2 bg-lavrs-dark text-white px-8 py-3 rounded-none font-bold hover:bg-lavrs-red transition-all"
                            >
                                <Plus size={18} /> Vytvořit první značku
                            </button>
                        </div>
                    )}

                    {brands.map((brand) => (
                        <div key={brand.id} className={`bg-white rounded-none border transition-all overflow-hidden ${editingBrandId === brand.id ? 'border-lavrs-red shadow-xl' : 'border-gray-100 shadow-sm hover:border-lavrs-pink'}`}>

                            {/* BRAND HEADER (Read Mode) */}
                            <div className={`p-5 md:p-8 flex items-center justify-between ${editingBrandId === brand.id ? 'bg-lavrs-beige/30 border-b border-lavrs-red/10' : ''}`}>
                                <div className="flex items-center gap-4 md:gap-6 min-w-0">
                                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-none flex items-center justify-center transition-transform shrink-0 ${editingBrandId === brand.id ? 'bg-lavrs-red text-white' : 'bg-lavrs-beige text-lavrs-red'}`}>
                                        <Sparkles size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg md:text-2xl font-bold text-lavrs-dark truncate">{brand.brandName}</h3>
                                        {brand.deletionRequestedAt ? (
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Clock size={14} className="text-amber-500" />
                                                <span className="text-xs font-semibold text-amber-600">Zažádáno o smazání značky</span>
                                            </div>
                                        ) : (
                                            <div className="hidden md:flex gap-4 text-xs text-gray-400 mt-1">
                                                {brand.instagram && <span className="flex items-center gap-1"><Instagram size={14} /> {brand.instagram}</span>}
                                                {brand.website && <span className="flex items-center gap-1"><Globe size={14} /> {brand.website}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {editingBrandId !== brand.id && (
                                    <button
                                        onClick={() => startEditing(brand)}
                                        className="bg-white border-2 border-gray-100 text-gray-600 rounded-none hover:border-lavrs-red hover:text-lavrs-red transition-all px-3 py-3 md:px-6 md:py-3"
                                    >
                                        <Pencil size={18} className="md:hidden" />
                                        <span className="hidden md:inline text-xs font-bold">Upravit vše</span>
                                    </button>
                                )}
                            </div>

                            {/* EDIT FORM (Conditionally Rendered) */}
                            {editingBrandId === brand.id && editForm && (
                                <BrandEditForm
                                    editForm={editForm}
                                    updateFormField={updateFormField}
                                    cancelEditing={cancelEditing}
                                    handleSave={handleSave}
                                    setBrandToDeleteId={setBrandToDeleteId}
                                    deletionRequested={!!brand.deletionRequestedAt}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Account Settings at the Bottom */}
            <section className="bg-white p-5 md:p-8 rounded-none border border-gray-100 shadow-sm space-y-6 md:space-y-8 mt-8 md:mt-12">
                <div className="flex items-center gap-3">
                    <User className="text-lavrs-red" size={24} />
                    <h2 className="text-lg md:text-xl font-bold text-lavrs-dark">Osobní nastavení účtu</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Vaše jméno</label>
                        <input
                            readOnly
                            value={authUser?.fullName || ''}
                            className="w-full bg-gray-50 px-6 py-4 rounded-none border-2 border-transparent focus:outline-none font-medium text-gray-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Přihlašovací e-mail</label>
                        <input
                            readOnly
                            value={authUser?.email || ''}
                            className="w-full bg-gray-50 px-6 py-4 rounded-none border-2 border-transparent focus:outline-none font-medium text-gray-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => setShowPasswordForm(prev => !prev)}
                            className="w-full bg-white border-2 border-gray-200 text-lavrs-dark px-6 py-4 rounded-none text-xs font-bold hover:border-lavrs-red hover:text-lavrs-red transition-all flex items-center justify-center gap-2"
                        >
                            <Key size={16} /> Změnit heslo
                        </button>
                    </div>
                </div>

                {/* Password Change Form */}
                {showPasswordForm && (
                    <div className="border-t border-gray-100 pt-6 mt-2 space-y-4 animate-fadeIn">
                        <div className="flex items-center gap-2 pb-2">
                            <Lock size={16} className="text-lavrs-red" />
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Změna hesla</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Nové heslo</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min. 8 znaků, velké/malé písmeno, číslice"
                                        className="w-full bg-gray-50 px-6 py-4 pr-14 rounded-none border-2 border-transparent focus:bg-white focus:border-lavrs-red transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(v => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-lavrs-red transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {newPassword && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 ml-4 mt-1">
                                        <span className={`text-[11px] font-medium ${passwordRequirements.minLength ? 'text-green-500' : 'text-gray-400'}`}>
                                            {passwordRequirements.minLength ? '✓' : '○'} 8+ znaků
                                        </span>
                                        <span className={`text-[11px] font-medium ${passwordRequirements.hasUppercase ? 'text-green-500' : 'text-gray-400'}`}>
                                            {passwordRequirements.hasUppercase ? '✓' : '○'} Velké písmeno
                                        </span>
                                        <span className={`text-[11px] font-medium ${passwordRequirements.hasLowercase ? 'text-green-500' : 'text-gray-400'}`}>
                                            {passwordRequirements.hasLowercase ? '✓' : '○'} Malé písmeno
                                        </span>
                                        <span className={`text-[11px] font-medium ${passwordRequirements.hasNumber ? 'text-green-500' : 'text-gray-400'}`}>
                                            {passwordRequirements.hasNumber ? '✓' : '○'} Číslice
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Potvrzení hesla</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Zopakujte nové heslo"
                                        className="w-full bg-gray-50 px-6 py-4 pr-14 rounded-none border-2 border-transparent focus:bg-white focus:border-lavrs-red transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(v => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-lavrs-red transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {passwordMessage && (
                            <p className={`text-sm font-medium ml-1 ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                {passwordMessage.text}
                            </p>
                        )}
                        <div className="flex gap-4 pt-2">
                            <button
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setPasswordMessage(null);
                                }}
                                className="px-6 py-3 rounded-none font-bold text-gray-400 hover:text-lavrs-dark transition-all text-sm"
                            >
                                Zrušit
                            </button>
                            <button
                                onClick={handlePasswordChange}
                                disabled={passwordLoading || !newPassword || !confirmPassword || !allRequirementsMet}
                                className="bg-lavrs-red text-white px-8 py-3 rounded-none font-bold hover:bg-lavrs-dark transition-all shadow-lg flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {passwordLoading ? 'Ukládám...' : <><Check size={16} /> Uložit nové heslo</>}
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* Deletion Request Modal */}
            {brandToDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-lavrs-dark/40 backdrop-blur-sm animate-fadeIn"
                        onClick={() => setBrandToDeleteId(null)}
                    />
                    <div className="relative bg-white p-6 md:p-8 rounded-none shadow-2xl max-w-md w-full animate-fadeIn border border-gray-100 mx-4 md:mx-0">
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-none flex items-center justify-center mb-6 mx-auto">
                            <Info size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-lavrs-dark text-center mb-2">Požádat o smazání značky?</h3>
                        <p className="text-gray-500 text-center text-sm mb-8 leading-relaxed">
                            Chcete požádat administrátora o smazání vaší značky <strong>{brands.find(b => b.id === brandToDeleteId)?.brandName}</strong>?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setBrandToDeleteId(null)}
                                className="flex-1 px-6 py-4 rounded-none font-bold text-gray-500 hover:bg-gray-50 transition-all border-2 border-transparent"
                            >
                                Ne
                            </button>
                            <button
                                onClick={handleRequestDeletion}
                                className="flex-1 px-6 py-4 rounded-none font-bold bg-lavrs-red text-white hover:bg-lavrs-dark transition-all shadow-lg"
                            >
                                Ano
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Memoize to prevent unnecessary re-renders when parent updates
const Profile = React.memo(ProfileInner);

export default Profile;
