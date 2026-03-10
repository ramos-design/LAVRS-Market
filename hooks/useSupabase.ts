/**
 * React hooks for fetching and mutating all Supabase data.
 * Each hook manages loading, error, and refetch states.
 */
import { useState, useEffect, useCallback } from 'react';
import {
    eventsDb, categoriesDb, brandProfilesDb, applicationsDb,
    eventPlansDb, bannersDb, emailTemplatesDb, emailAttachmentsDb,
    DbEvent, DbCategory, DbBrandProfile, DbApplication,
    DbEventPlan, DbZone, DbStand, DbBanner,
    DbEmailTemplate, DbEmailAttachment,
} from '../lib/database';

/* ─── Generic hook helper ────────────────────────────────── */

interface UseQueryResult<T> {
    data: T;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

function useQuery<T>(fetcher: () => Promise<T>, defaultValue: T, deps: unknown[] = []): UseQueryResult<T> {
    const [data, setData] = useState<T>(defaultValue);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetcher();
            setData(result);
        } catch (e: any) {
            console.error('Query error:', e);
            setError(e.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { data, loading, error, refetch: fetch };
}

/* ═══════════════════════════════════════════════════════════
   EVENTS
═══════════════════════════════════════════════════════════ */
export function useEvents() {
    const query = useQuery(() => eventsDb.getAll(), []);
    return {
        ...query,
        events: query.data,
        createEvent: async (event: Omit<DbEvent, 'created_at'>) => {
            await eventsDb.create(event);
            query.refetch();
        },
        updateEvent: async (id: string, updates: Partial<DbEvent>) => {
            await eventsDb.update(id, updates);
            query.refetch();
        },
        uploadEventImage: async (file: File, eventId: string) => {
            const result = await eventsDb.uploadImage(file, eventId);
            query.refetch();
            return result;
        },
        deleteEvent: async (id: string) => {
            await eventsDb.delete(id);
            query.refetch();
        },
    };
}

/* ═══════════════════════════════════════════════════════════
   CATEGORIES
═══════════════════════════════════════════════════════════ */
export function useCategories() {
    const query = useQuery(() => categoriesDb.getAll(), []);
    return {
        ...query,
        categories: query.data,
        createCategory: async (cat: Omit<DbCategory, 'created_at'>) => {
            await categoriesDb.create(cat);
            query.refetch();
        },
        updateCategory: async (id: string, updates: Partial<DbCategory>) => {
            await categoriesDb.update(id, updates);
            query.refetch();
        },
        deleteCategory: async (id: string) => {
            await categoriesDb.delete(id);
            query.refetch();
        },
    };
}

/* ═══════════════════════════════════════════════════════════
   BRAND PROFILES
═══════════════════════════════════════════════════════════ */
export function useBrandProfiles() {
    const query = useQuery(() => brandProfilesDb.getAll(), []);
    return {
        ...query,
        profiles: query.data,
        createProfile: async (profile: Omit<DbBrandProfile, 'created_at'>) => {
            await brandProfilesDb.create(profile);
            query.refetch();
        },
        updateProfile: async (id: string, updates: Partial<DbBrandProfile>) => {
            await brandProfilesDb.update(id, updates);
            query.refetch();
        },
        deleteProfile: async (id: string) => {
            await brandProfilesDb.delete(id);
            query.refetch();
        },
    };
}

/* ═══════════════════════════════════════════════════════════
   APPLICATIONS
═══════════════════════════════════════════════════════════ */
export function useApplications() {
    const query = useQuery(() => applicationsDb.getAll(), []);
    return {
        ...query,
        applications: query.data,
        createApplication: async (app: Omit<DbApplication, 'created_at'>) => {
            await applicationsDb.create(app);
            query.refetch();
        },
        updateStatus: async (id: string, status: string, paymentDeadline?: string, approvedAt?: string) => {
            const result = await applicationsDb.updateStatus(id, status, paymentDeadline, approvedAt);
            await query.refetch();
            return result;
        },
        updateApplication: async (id: string, updates: Partial<DbApplication>) => {
            await applicationsDb.update(id, updates);
            query.refetch();
        },
        deleteApplication: async (id: string) => {
            await applicationsDb.update(id, { status: 'DELETED' });
            query.refetch();
        },
    };
}

/* ═══════════════════════════════════════════════════════════
   EVENT PLANS (plan + zones + stands)
═══════════════════════════════════════════════════════════ */
export function useEventPlan(eventId: string | null) {
    const query = useQuery(
        async () => {
            if (!eventId) return { plan: null, zones: [], stands: [] };
            return eventPlansDb.getByEventId(eventId);
        },
        { plan: null as DbEventPlan | null, zones: [] as DbZone[], stands: [] as DbStand[] },
        [eventId]
    );

    return {
        ...query,
        plan: query.data.plan,
        zones: query.data.zones,
        stands: query.data.stands,
        savePlan: async (planData: Parameters<typeof eventPlansDb.savePlan>[1]) => {
            if (!eventId) return;
            await eventPlansDb.savePlan(eventId, planData);
            query.refetch();
        },
    };
}

/* ═══════════════════════════════════════════════════════════
   BANNERS
═══════════════════════════════════════════════════════════ */
export function useBanners() {
    const query = useQuery(() => bannersDb.getAll(), []);
    return {
        ...query,
        banners: query.data,
        createBanner: async (banner: Omit<DbBanner, 'created_at'>) => {
            await bannersDb.create(banner);
            query.refetch();
        },
        updateBanner: async (id: string, updates: Partial<DbBanner>) => {
            await bannersDb.update(id, updates);
            query.refetch();
        },
        deleteBanner: async (id: string) => {
            await bannersDb.delete(id);
            query.refetch();
        },
        replaceAllBanners: async (banners: Omit<DbBanner, 'created_at'>[]) => {
            await bannersDb.replaceAll(banners);
            query.refetch();
        },
    };
}

/* ═══════════════════════════════════════════════════════════
   EMAIL TEMPLATES + ATTACHMENTS
═══════════════════════════════════════════════════════════ */
export function useEmailTemplates() {
    const query = useQuery(() => emailTemplatesDb.getAll(), []);
    return {
        ...query,
        templates: query.data,
        createTemplate: async (template: Omit<DbEmailTemplate, 'created_at'>) => {
            await emailTemplatesDb.create(template);
            query.refetch();
        },
        updateTemplate: async (id: string, updates: Partial<DbEmailTemplate>) => {
            await emailTemplatesDb.update(id, updates);
            query.refetch();
        },
        deleteTemplate: async (id: string) => {
            await emailTemplatesDb.delete(id);
            query.refetch();
        },
    };
}

export function useEmailAttachments(templateId: string | null) {
    const query = useQuery(
        async () => {
            if (!templateId) return [];
            return emailAttachmentsDb.getByTemplateId(templateId);
        },
        [] as DbEmailAttachment[],
        [templateId]
    );

    return {
        ...query,
        attachments: query.data,
        uploadAttachment: async (file: File) => {
            if (!templateId) return;
            await emailAttachmentsDb.uploadFile(file, templateId);
            query.refetch();
        },
        deleteAttachment: async (id: string, storagePath: string) => {
            await emailAttachmentsDb.deleteWithFile(id, storagePath);
            query.refetch();
        },
    };
}
