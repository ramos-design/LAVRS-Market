/**
 * Custom toast notification system for admin collaboration.
 * Subscribes to Supabase Realtime INSERTs on admin_activity_log
 * and shows toasts for OTHER admins' actions (not self).
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { DbActivityLog } from '../lib/database';
import { X } from 'lucide-react';

interface Toast {
    id: string;
    message: string;
    adminName: string;
    timestamp: number;
}

const AUTO_DISMISS_MS = 5000;
const MAX_TOASTS = 5;

const ToastProvider: React.FC<{
    currentUserId: string | null;
    enabled: boolean;
    children: React.ReactNode;
}> = ({ currentUserId, enabled, children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const mountedRef = useRef(true);
    const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const removeToast = useCallback((id: string) => {
        // Clear the specific toast's timer
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Per-toast auto-dismiss with individual timers
    // Each toast gets its own setTimeout instead of global setInterval
    useEffect(() => {
        toasts.forEach(toast => {
            // Skip if timer already exists for this toast
            if (timersRef.current.has(toast.id)) return;

            // Set individual timeout for this toast
            const timeout = setTimeout(() => {
                if (mountedRef.current) {
                    removeToast(toast.id);
                }
            }, AUTO_DISMISS_MS);

            timersRef.current.set(toast.id, timeout);
        });

        // Cleanup on unmount
        return () => {
            timersRef.current.forEach(timer => clearTimeout(timer));
            timersRef.current.clear();
        };
    }, [toasts, removeToast]);

    // Subscribe to Realtime INSERTs on admin_activity_log
    useEffect(() => {
        if (!enabled || !currentUserId) return;
        mountedRef.current = true;

        const channel = supabase
            .channel('toast_notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'admin_activity_log',
            }, (payload) => {
                if (!mountedRef.current) return;
                const row = payload.new as DbActivityLog;
                // Only show toasts for OTHER admins' actions
                if (row.admin_id === currentUserId) return;
                const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                setToasts(prev => [{ id, message: row.description, adminName: row.admin_name, timestamp: Date.now() }, ...prev].slice(0, MAX_TOASTS));
            })
            .subscribe((status, err) => {
                if (err) console.warn('[ToastProvider] Realtime subscribe error:', err);
            });

        return () => {
            mountedRef.current = false;
            supabase.removeChannel(channel).catch(() => {});
        };
    }, [enabled, currentUserId]);

    return (
        <>
            {children}
            {/* Toast container - fixed bottom-right */}
            {toasts.length > 0 && (
                <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm">
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            className="bg-lavrs-dark text-white px-5 py-4 shadow-2xl border border-white/10 animate-fadeIn flex items-start gap-3"
                        >
                            <div className="w-7 h-7 rounded-full bg-lavrs-red text-white font-black text-[9px] flex items-center justify-center shrink-0 uppercase">
                                {toast.adminName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-0.5">{toast.adminName}</p>
                                <p className="text-sm font-medium">{toast.message}</p>
                            </div>
                            <button onClick={() => removeToast(toast.id)} className="text-white/40 hover:text-white shrink-0 mt-0.5">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default ToastProvider;
