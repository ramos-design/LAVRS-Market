/**
 * Admin activity logging utility.
 * Called from mutation handlers to record admin actions.
 * Fire-and-forget: never blocks the actual mutation on logging failure.
 */
import { activityLogDb, DbActivityLog } from './database';
import { supabase } from './supabase';

export type AdminActionType =
    | 'application_status_changed'
    | 'application_deleted'
    | 'application_restored'
    | 'event_created'
    | 'event_deleted'
    | 'event_updated'
    | 'event_plan_saved'
    | 'all_trash_permanently_deleted'
    | 'brand_trashed'
    | 'brand_restored'
    | 'brand_permanently_deleted'
    | 'awaiting_order_reminder_sent';

function translateStatus(status: string): string {
    const map: Record<string, string> = {
        PENDING: 'Čeká na schválení',
        APPROVED: 'Schváleno',
        REJECTED: 'Zamítnuto',
        WAITLIST: 'Waitlist',
        PAID: 'Zaplaceno',
        PAYMENT_REMINDER: 'Upomínka platby',
        PAYMENT_LAST_CALL: 'Poslední výzva',
        EXPIRED: 'Expirováno',
        PAYMENT_UNDER_REVIEW: 'Platba ke kontrole',
        DELETED: 'Smazáno',
    };
    return map[status] || status;
}

const ACTION_DESCRIPTIONS: Record<AdminActionType, (meta: Record<string, any>) => string> = {
    application_status_changed: (m) =>
        `Změnil/a stav přihlášky „${m.brandName || '?'}" na ${translateStatus(m.newStatus)}`,
    application_deleted: (m) =>
        `Smazal/a přihlášku „${m.brandName || '?'}"`,
    application_restored: (m) =>
        `Obnovil/a přihlášku „${m.brandName || '?'}"`,
    event_created: (m) =>
        `Vytvořil/a nový event „${m.eventTitle || 'Nový event'}"`,
    event_deleted: (m) =>
        `Smazal/a event „${m.eventTitle || '?'}"`,
    event_updated: (m) =>
        `Upravil/a event „${m.eventTitle || '?'}"`,
    event_plan_saved: (m) =>
        `Uložil/a plán pro event „${m.eventTitle || '?'}"`,
    all_trash_permanently_deleted: () =>
        `Trvale smazal/a všechny přihlášky z koše`,
    brand_trashed: (m) =>
        `Přesunul/a značku „${m.brandName || '?'}" do koše`,
    brand_restored: (m) =>
        `Obnovil/a značku „${m.brandName || '?'}" z koše`,
    brand_permanently_deleted: (m) =>
        `Trvale smazal/a značku „${m.brandName || '?'}"`,
    awaiting_order_reminder_sent: (m) =>
        `Odeslal/a připomenutí potvrzení objednávky pro „${m.brandName || '?'}"${m.recipient ? ` (${m.recipient})` : ''}`,
};

export interface LogActionParams {
    adminId: string;
    adminName: string;
    action: AdminActionType;
    entityType: DbActivityLog['entity_type'];
    entityId?: string;
    metadata?: Record<string, any>;
}

export async function logAdminAction(params: LogActionParams): Promise<void> {
    const { adminId, adminName, action, entityType, entityId, metadata = {} } = params;

    const descriptionFn = ACTION_DESCRIPTIONS[action];
    const description = descriptionFn ? descriptionFn(metadata) : action;

    try {
        await activityLogDb.log({
            admin_id: adminId,
            admin_name: adminName,
            action,
            description,
            entity_type: entityType,
            entity_id: entityId || null,
            metadata,
        });
    } catch (err) {
        // Fire-and-forget: never block the actual mutation on logging failure
        console.error('Activity log failed (non-blocking):', err);
    }
}

/**
 * Check if a record has been modified since a known timestamp.
 * Used for optimistic locking to prevent concurrent overwrites.
 */
export async function checkVersionConflict(
    table: 'applications' | 'events',
    id: string,
    knownUpdatedAt: string | undefined
): Promise<{ conflict: boolean; currentUpdatedAt: string | null }> {
    if (!knownUpdatedAt) {
        return { conflict: false, currentUpdatedAt: null };
    }

    const { data, error } = await supabase
        .from(table)
        .select('updated_at')
        .eq('id', id)
        .single();

    if (error || !data) {
        return { conflict: false, currentUpdatedAt: null };
    }

    const currentUpdatedAt = (data as any).updated_at as string;
    const conflict = currentUpdatedAt !== knownUpdatedAt;

    return { conflict, currentUpdatedAt };
}
