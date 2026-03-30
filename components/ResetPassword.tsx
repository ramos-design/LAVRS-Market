import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import HeartLoader from './HeartLoader';

interface ResetPasswordProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onSuccess, onCancel }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [isValidRecoveryLink, setIsValidRecoveryLink] = useState(false);

    useEffect(() => {
        // Zkontroluj recovery token z URL fragmentu
        const checkRecoveryLink = async () => {
            try {
                // Supabase přidává token do fragmentu (hash): #access_token=...&type=recovery
                const hash = window.location.hash;
                const params = new URLSearchParams(hash.substring(1));
                const accessToken = params.get('access_token');
                const type = params.get('type');

                console.log('DEBUG - URL hash:', hash);
                console.log('DEBUG - Has access_token:', !!accessToken);
                console.log('DEBUG - Type:', type);

                if (!accessToken || type !== 'recovery') {
                    console.warn('DEBUG - Invalid recovery link');
                    setError('Neplatný odkaz na reset hesla. Zkuste obnovit heslo znovu.');
                    setSessionLoading(false);
                    return;
                }

                // Čekej na Supabase aby zpracoval token z URL
                // Supabase by měl automaticky vytvořit session
                await new Promise(resolve => setTimeout(resolve, 500));

                // Zkus refresh session
                console.log('DEBUG - Refreshing session...');
                const { error: refreshError } = await supabase.auth.refreshSession();
                if (refreshError) {
                    console.warn('Refresh error (non-critical):', refreshError);
                }

                // Ověř session - měl by být vytvořen automaticky z access_token
                const { data, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('Session error:', sessionError);
                    setError('Nepodařilo se ověřit relaci.');
                    setSessionLoading(false);
                    return;
                }

                if (!data.session) {
                    console.warn('No session found after refresh');
                    setError('Relace nenalezena. Zkuste obnovit heslo znovu.');
                    setSessionLoading(false);
                    return;
                }

                console.log('DEBUG - Valid recovery session found');
                setIsValidRecoveryLink(true);
            } catch (err) {
                console.error('Recovery check error:', err);
                setError('Nepodařilo se ověřit odkaz na reset hesla.');
            } finally {
                setSessionLoading(false);
            }
        };

        checkRecoveryLink();
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError('Hesla se neshodují.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Heslo musí mít alespoň 6 znaků.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
            }, 2000);
        } catch (err: any) {
            console.error('Reset error:', err);
            setError(err.message || 'Nepodařilo se změnit heslo.');
        } finally {
            setLoading(false);
        }
    };

    if (sessionLoading) {
        return (
            <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center p-6">
                <div className="text-center">
                    <HeartLoader size={40} className="text-lavrs-red mx-auto mb-4" />
                    <p className="text-gray-400">Ověřuji odkaz...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-lavrs-red/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-lavrs-pink/20 blur-[120px] rounded-full animate-pulse delay-700" />

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-10">
                    <img
                        src="/media/LAVRSmarket_logo_white_transp1.png"
                        alt="LAVRS market"
                        className="h-16 mx-auto mb-6 opacity-90"
                    />
                    <p className="text-gray-400 font-medium">Portál pro vystavovatele</p>
                </div>

                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-10 shadow-3xl relative">
                    {success ? (
                        <div className="text-center space-y-8 animate-fadeIn">
                            <div className="relative mx-auto w-24 h-24">
                                <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse" />
                                <div className="relative flex items-center justify-center w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full">
                                    <CheckCircle className="text-green-500" size={48} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-white">Heslo obnoveno!</h2>
                                <p className="text-gray-400 leading-relaxed font-medium">
                                    Vaše heslo bylo úspěšně změněno. Nyní se můžete přihlásit novým heslem.
                                </p>
                            </div>
                        </div>
                    ) : !isValidRecoveryLink ? (
                        <div className="text-center space-y-8 animate-fadeIn">
                            <div className="relative mx-auto w-24 h-24">
                                <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
                                <div className="relative flex items-center justify-center w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full">
                                    <AlertCircle className="text-red-500" size={48} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-white">Odkaz vypršel</h2>
                                <p className="text-gray-400 leading-relaxed font-medium">
                                    {error}
                                </p>
                            </div>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full bg-lavrs-red text-white py-4 rounded-none font-black uppercase tracking-widest text-xs hover:bg-lavrs-dark transition-all"
                            >
                                Zpět na přihlášení
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-black text-white mb-8">Obnovit heslo</h2>

                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-3 animate-fadeIn">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Nové heslo</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-lavrs-red transition-colors" size={18} />
                                        <input
                                            required
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-white/5 border border-white/10 text-white pl-14 pr-14 py-4 focus:outline-none focus:border-lavrs-red/50 transition-all font-medium placeholder:text-gray-600"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 hover:text-lavrs-red transition-colors group-focus-within:text-gray-400"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Potvrzení hesla</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-lavrs-red transition-colors" size={18} />
                                        <input
                                            required
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-white/5 border border-white/10 text-white pl-14 pr-14 py-4 focus:outline-none focus:border-lavrs-red/50 transition-all font-medium placeholder:text-gray-600"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 hover:text-lavrs-red transition-colors group-focus-within:text-gray-400"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full bg-lavrs-red text-white py-5 rounded-none font-black uppercase tracking-[0.2em] text-sm hover:bg-lavrs-dark hover:translate-y-[-2px] active:translate-y-0 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <HeartLoader size={20} className="text-white" />
                                            Obnovuji heslo...
                                        </>
                                    ) : (
                                        'Obnovit heslo'
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => window.location.href = '/'}
                                    className="w-full text-gray-400 py-2 text-xs font-bold uppercase tracking-widest hover:text-gray-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={14} />
                                    Zpět
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <p className="mt-8 text-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                    © 2026 — LAVRS market Protocol
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

export default ResetPassword;
