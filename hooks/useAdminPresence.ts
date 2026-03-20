/**
 * Admin presence tracking via Supabase Presence API.
 * Tracks which admins are online and what screen they are viewing.
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminPresenceState {
    userId: string;
    fullName: string;
    email: string;
    screen: string;
    lastSeen: string;
}

const SCREEN_LABELS: Record<string, string> = {
    DASHBOARD: 'Přehled',
    CURATOR: 'Výběr přihlášek',
    APPROVED_APPS: 'Aktivní přihlášky',
    EVENTS_CONFIG: 'Správa Eventů',
    EVENT_PLAN: 'Plán eventu',
    BRANDS: 'Seznam značek',
    CATEGORIES: 'Kategorie',
    PAYMENTS: 'Platby',
    BANNERS: 'Správa bannerů',
    EMAILS: 'Emaily',
    PROFILE: 'Profil',
    CONTACT: 'Kontakt',
};

export function getScreenLabel(screen: string): string {
    return SCREEN_LABELS[screen] || screen;
}

export function useAdminPresence(
    userId: string | null,
    fullName: string,
    email: string,
    currentScreen: string,
    enabled: boolean
) {
    const [onlineAdmins, setOnlineAdmins] = useState<AdminPresenceState[]>([]);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Set up presence channel
    useEffect(() => {
        if (!enabled || !userId) return;

        const channel = supabase.channel('admin_presence', {
            config: { presence: { key: userId } },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState<AdminPresenceState>();
                const admins: AdminPresenceState[] = [];
                for (const key of Object.keys(state)) {
                    const presences = state[key] as unknown as AdminPresenceState[];
                    if (presences.length > 0) {
                        admins.push(presences[0]);
                    }
                }
                // Filter out self
                setOnlineAdmins(admins.filter(a => a.userId !== userId));
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        userId,
                        fullName,
                        email,
                        screen: currentScreen,
                        lastSeen: new Date().toISOString(),
                    });
                }
            });

        channelRef.current = channel;

        return () => {
            channel.untrack();
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, userId]);

    // Update presence when screen changes
    useEffect(() => {
        if (!channelRef.current || !userId) return;
        channelRef.current.track({
            userId,
            fullName,
            email,
            screen: currentScreen,
            lastSeen: new Date().toISOString(),
        });
    }, [currentScreen, userId, fullName, email]);

    return { onlineAdmins };
}
