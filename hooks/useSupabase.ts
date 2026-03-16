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
    refetch: () => Promise<void>;
}

interface QueryOptions {
    staleMs?: number;
    enabled?: boolean;
}

const DEFAULT_STALE_MS = 60_000;
const queryCache = new Map<string, { data: unknown; ts: number }>();
const inflightQueries = new Map<string, Promise<unknown>>();

export function clearSupabaseQueryCache() {
    queryCache.clear();
    inflightQueries.clear();
}

function readCached<T>(queryKey: string, staleMs: number): T | undefined {
    const entry = queryCache.get(queryKey);
    if (!entry) return undefined;
    if (Date.now() - entry.ts > staleMs) return undefined;
    return entry.data as T;
}

function useQuery<T>(
    queryKey: string,
    fetcher: () => Promise<T>,
    defaultValue: T,
    deps: unknown[] = [],
    options: QueryOptions = {}
): UseQueryResult<T> {
    const staleMs = options.staleMs ?? DEFAULT_STALE_MS;
    const enabled = options.enabled ?? true;
    const initialCached = readCached<T>(queryKey, staleMs);

    const [data, setData] = useState<T>(initialCached ?? defaultValue);
    const [loading, setLoading] = useState(enabled && initialCached === undefined);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async (force = false) => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        if (!force) {
            const cached = readCached<T>(queryKey, staleMs);
            if (cached !== undefined) {
                setData(cached);
                setLoading(false);
                return;
            }
        }

        setLoading(true);
        setError(null);

        let promise = inflightQueries.get(queryKey) as Promise<T> | undefined;
        if (!promise || force) {
            promise = fetcher();
            inflightQueries.set(queryKey, promise);
        }

        try {
            const result = await promise;
            queryCache.set(queryKey, { data: result, ts: Date.now() });
            setData(result);
        } catch (e: any) {
            console.error('Query error:', e);
            setError(e.message || 'Unknown error');
        } finally {
            if (inflightQueries.get(queryKey) === promise) {
                inflightQueries.delete(queryKey);
            }
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryKey, staleMs, enabled, ...deps]);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        fetch();
    }, [fetch, enabled]);

    return { data, loading, error, refetch: () => (enabled ? fetch(true) : Promise.resolve()) };
}

/* ═══════════════════════════════════════════════════════════
   EVENTS
═══════════════════════════════════════════════════════════ */
export function useEvents() {
    const query = useQuery('events', () => eventsDb.getAll(), []);
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
export function useCategories(enabled = true) {
    const query = useQuery('categories', () => categoriesDb.getAll(), [], [], { enabled });
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
    const query = useQuery('brand_profiles', () => brandProfilesDb.getAll(), []);
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
    const query = useQuery('applications', () => applicationsDb.getAll(), []);
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
        `event_plan:${eventId || 'none'}`,
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
export function useBanners(enabled = true) {
    const query = useQuery('banners', () => bannersDb.getAll(), [], [], { enabled });
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
    const query = useQuery('email_templates', () => emailTemplatesDb.getAll(), []);
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
        `email_attachments:${templateId || 'none'}`,
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
