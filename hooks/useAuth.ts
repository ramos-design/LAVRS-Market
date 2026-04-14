import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { clearSupabaseQueryCache } from './useSupabase';

export type UserRole = 'EXHIBITOR' | 'ADMIN';

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
}

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
    const hasInit = useRef(false);

    const signOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        clearSupabaseQueryCache();
        setUser(null);
        setLoading(false);
    };

    const fetchProfile = async (userId: string, email: string) => {
        // 1. OKAMŽITĚ nastavíme provizorního uživatele, aby zmizel spinner!
        // Toto zajistí, že se uživatel dostane do aplikace hned.
        const provisionalUser: AuthUser = {
            id: userId,
            email: email,
            role: 'EXHIBITOR',
            fullName: email.split('@')[0],
        };

        setUser(prev => prev || provisionalUser);

        // 2. Spinner vypneme hned poté, co máme aspoň provizorní data
        setLoading(false);

        // 3. Na pozadí (non-blocking) zkusíme dotáhnout skutečnou roli
        try {
            const { data, error: dbError } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', userId)
                .maybeSingle();

            if (dbError) throw dbError;

            if (data) {
                // Pokud profil existuje, aktualizujeme data
                const mappedRole = (data.role as string || 'EXHIBITOR').toUpperCase() as UserRole;
                setUser({
                    id: userId,
                    email: email,
                    role: mappedRole,
                    fullName: data.full_name || email.split('@')[0],
                });
                setError(null);
            } else {
                // POKUD PROFIL NENÍ V DATABÁZI (Byl smazán nebo nikdy neexistoval)
                // Pokud uživatel už v aplikaci je (není to úplně první load bez session),
                // tak ho odhlásíme, protože jeho účet už v DB neexistuje.
                console.warn('Profil nenalezen v DB, odhlašuji uživatele.');
                signOut();
            }
        } catch (e: any) {
            console.error('Tichá chyba při načítání profilu:', e);
            setError(`Omezený režim: Nepodařilo se ověřit všechna práva (${e.message}).`);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                // Detekce recovery tokenu v URL při prvním načtení
                // Podporuje: implicit flow (hash), PKCE flow (code param), pathname /reset-password
                const hash = window.location.hash;
                const searchParams = new URLSearchParams(window.location.search);
                const hasHashRecovery = hash.includes('type=recovery') && hash.includes('access_token');
                const isRecoveryPath = window.location.pathname.includes('/reset-password');
                const hasCodeParam = searchParams.has('code');

                if (hasHashRecovery || isRecoveryPath) {
                    setIsPasswordRecovery(true);
                }

                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (!mounted) return;

                // Pokud session existuje a přišli jsme z recovery path/code, nastavíme recovery flag
                // (PASSWORD_RECOVERY event mohl být emitován před naším subscriptionem)
                if (session && (isRecoveryPath || hasCodeParam) && !hasInit.current) {
                    setIsPasswordRecovery(true);
                }
                hasInit.current = true;

                if (session) {
                    fetchProfile(session.user.id, session.user.email!);
                } else if (isRecoveryPath || hasCodeParam) {
                    // Čekáme na PKCE code exchange - necháme loading true
                    // onAuthStateChange to zachytí, ale dáme timeout pro případ selhání
                    setTimeout(() => {
                        if (mounted) setLoading(false);
                    }, 5000);
                } else {
                    setLoading(false);
                }
            } catch (e: any) {
                console.error('Kritická chyba auth:', e);
                if (mounted) setLoading(false);
            }
        };

        // Spustíme inicializaci
        initAuth();

        // Sledujeme změny stavu (přihlášení/odhlášení)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;

            if (event === 'PASSWORD_RECOVERY' && session) {
                setIsPasswordRecovery(true);
                fetchProfile(session.user.id, session.user.email!);
            } else if (event === 'SIGNED_IN' && session) {
                fetchProfile(session.user.id, session.user.email!);
            } else if (event === 'SIGNED_OUT') {
                clearSupabaseQueryCache();
                setUser(null);
                setError(null);
                setLoading(false);
            } else if (event === 'USER_UPDATED' && session) {
                fetchProfile(session.user.id, session.user.email!);
            }
        });

        // REÁLNÝ ČAS: Sledujeme, zda admin nesmazal náš profil
        let profileChannel: any = null;
        
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session && mounted) {
                profileChannel = supabase
                    .channel('profile_sync')
                    .on('postgres_changes', {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${session.user.id}`
                    }, () => {
                        console.log('Profil smazán z DB, odhlašuji...');
                        signOut();
                    })
                    .subscribe((status, err) => {
                        if (err) console.warn('[Auth] profile_sync subscribe error:', err);
                    });
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            if (profileChannel) {
                supabase.removeChannel(profileChannel).catch(() => {});
            }
        };
    }, []);

    return {
        user,
        loading,
        error,
        signOut,
        isPasswordRecovery,
        clearPasswordRecovery: () => setIsPasswordRecovery(false),
        refetch: () => user && fetchProfile(user.id, user.email)
    };
}
