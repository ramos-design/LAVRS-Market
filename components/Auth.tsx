import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, ArrowRight, Sparkles, ShieldCheck, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthProps {
    onSuccess?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const timeout = setTimeout(() => {
            setLoading(false);
            setError('Server Supabase neodpovídá včas. To se může stát při prvním spuštění po delší době. Zkuste to prosím znovu za malou chvíli.');
        }, 30000);

        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                if (!data.user) throw new Error('Uživatel nebyl nalezen.');
                onSuccess?.();
            } else {
                console.log('Attempting registration for:', email);
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });

                if (error) {
                    console.error('Supabase SignUp Error:', error);
                    throw error;
                }

                if (data.user && data.user.identities?.length === 0) {
                    throw new Error('Tento e-mail je již zaregistrován. Zkuste se přihlásit.');
                }

                setShowSuccess(true);
            }
        } catch (err: any) {
            console.error('Auth error detail:', err);
            setError(err.message || 'Akce se nezdařila. Zkontrolujte připojení k internetu.');
        } finally {
            clearTimeout(timeout);
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-lavrs-red/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-lavrs-pink/20 blur-[120px] rounded-full animate-pulse delay-700" />

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-10">
                    <img
                        src="/media/LAVRSmarket_logo_white_transp1.png"
                        alt="LAVRS Market"
                        className="h-16 mx-auto mb-6 opacity-90"
                    />
                    <p className="text-gray-400 font-medium">Portál pro vystavovatele</p>
                </div>

                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-10 shadow-3xl relative min-h-[400px] flex flex-col items-stretch justify-center">
                    {showSuccess ? (
                        <div className="text-center space-y-8 animate-fadeIn">
                            <div className="relative mx-auto w-24 h-24">
                                <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse" />
                                <div className="relative flex items-center justify-center w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full">
                                    <CheckCircle className="text-green-500" size={48} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-white">Účet vytvořen!</h2>
                                <p className="text-gray-400 leading-relaxed font-medium">
                                    Na vaši adresu <span className="text-white font-bold">{email}</span> jsme odeslali potvrzovací e-mail.
                                    <br /><br />
                                    Prosím, zkontrolujte svou schránku a potvrďte registraci kliknutím na odkaz.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setShowSuccess(false);
                                    setIsLogin(true);
                                }}
                                className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-none font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                            >
                                Zpět na přihlášení
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex gap-4 mb-8">
                                <button
                                    onClick={() => setIsLogin(true)}
                                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${isLogin ? 'border-lavrs-red text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    Přihlášení
                                </button>
                                <button
                                    onClick={() => setIsLogin(false)}
                                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${!isLogin ? 'border-lavrs-red text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    Registrace
                                </button>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-6">
                                {!isLogin && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Celé Jméno</label>
                                        <div className="relative group">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-lavrs-red transition-colors" size={18} />
                                            <input
                                                required
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Např. Jana Malá"
                                                className="w-full bg-white/5 border border-white/10 text-white pl-14 pr-6 py-4 focus:outline-none focus:border-lavrs-red/50 transition-all font-medium placeholder:text-gray-600"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">E-mail</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-lavrs-red transition-colors" size={18} />
                                        <input
                                            required
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="vystavovatel@seznam.cz"
                                            className="w-full bg-white/5 border border-white/10 text-white pl-14 pr-6 py-4 focus:outline-none focus:border-lavrs-red/50 transition-all font-medium placeholder:text-gray-600"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Heslo</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-lavrs-red transition-colors" size={18} />
                                        <input
                                            required
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-white/5 border border-white/10 text-white pl-14 pr-6 py-4 focus:outline-none focus:border-lavrs-red/50 transition-all font-medium placeholder:text-gray-600"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-3 animate-fadeIn">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full bg-lavrs-red text-white py-5 rounded-none font-black uppercase tracking-[0.2em] text-sm hover:bg-lavrs-dark hover:translate-y-[-2px] active:translate-y-0 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Zpracovávám...
                                        </>
                                    ) : (
                                        <>
                                            {isLogin ? 'Přihlásit se' : 'Vytvořit účet'}
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    <div className="mt-10 pt-8 border-t border-white/5 flex items-start gap-4">
                        <ShieldCheck className="text-gray-600 shrink-0" size={20} />
                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                            Zabezpečený přístup pomocí LAVRS Identity. Vaše data jsou chráněna v souladu se standardy Ochrany osobních údajů.
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                    © 2026 — LAVRS Market Protocol
                </p>
            </div>

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

export default Auth;
