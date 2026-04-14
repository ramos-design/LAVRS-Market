/**
 * Hook for reading admin activity log entries with real-time updates.
 * Subscribes to Supabase Realtime INSERTs on admin_activity_log.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { activityLogDb, DbActivityLog } from '../lib/database';
import { supabase } from '../lib/supabase';

export interface ActivityEntry {
    id: string;
    adminId: string;
    adminName: string;
    action: string;
    description: string;
    entityType: string;
    entityId: string | null;
    metadata: Record<string, any>;
    createdAt: string;
}

function mapDbToActivity(row: DbActivityLog): ActivityEntry {
    return {
        id: row.id,
        adminId: row.admin_id,
        adminName: row.admin_name,
        action: row.action,
        description: row.description,
        entityType: row.entity_type,
        entityId: row.entity_id,
        metadata: row.metadata || {},
        createdAt: row.created_at,
    };
}

export function useAdminActivity(enabled = true) {
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const mountedRef = useRef(true);

    const fetchActivities = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        try {
            const data = await activityLogDb.getRecent(30);
            if (mountedRef.current) {
                setActivities(data.map(mapDbToActivity));
            }
        } catch (err) {
            console.error('Failed to load activity log:', err);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        mountedRef.current = true;
        fetchActivities();

        if (!enabled) return;

        // Subscribe to new inserts via Realtime to keep the list fresh
        const channel = supabase
            .channel('admin_activity_feed')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'admin_activity_log',
            }, (payload) => {
                if (mountedRef.current && payload.new) {
                    const newEntry = mapDbToActivity(payload.new as DbActivityLog);
                    setActivities(prev => [newEntry, ...prev].slice(0, 30));
                }
            })
            .subscribe((status, err) => {
                if (err) console.warn('[AdminActivity] Realtime subscribe error:', err);
            });

        return () => {
            mountedRef.current = false;
            supabase.removeChannel(channel).catch(() => {});
        };
    }, [fetchActivities, enabled]);

    return { activities, loading, refetch: fetchActivities };
}
