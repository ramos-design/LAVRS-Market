import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

    useEffect(() => {
        let mounted = true;

        // Safety timeout to prevent infinite spinner
        const timeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Auth initialization timed out, forcing loading to false');
                setLoading(false);
            }
        }, 5000);

        const fetchProfile = async (userId: string, email: string) => {
            // Logic to fetch with a timeout
            const fetchWithTimeout = async () => {
                const queryPromise = supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
                );

                return Promise.race([queryPromise, timeoutPromise]) as Promise<any>;
            };

            try {
                const { data, error } = await fetchWithTimeout();

                if (!mounted) return;

                if (data) {
                    setUser({
                        id: userId,
                        email: email,
                        role: (data.role as string || 'EXHIBITOR').toUpperCase() as UserRole,
                        fullName: data.full_name || email.split('@')[0],
                    });
                } else {
                    throw new Error('No profile data');
                }
            } catch (e) {
                console.warn('Profile fetch failed or timed out, using fallback:', e);
                if (mounted) {
                    setUser({
                        id: userId,
                        email: email,
                        role: 'EXHIBITOR',
                        fullName: email.split('@')[0],
                    });
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        // Check current session
        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (session) {
                    await fetchProfile(session.user.id, session.user.email!);
                } else {
                    if (mounted) setLoading(false);
                }
            } catch (e) {
                console.error('Error in initAuth:', e);
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                await fetchProfile(session.user.id, session.user.email!);
            } else if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setUser(null);
                    setLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return { user, loading, signOut };
}
