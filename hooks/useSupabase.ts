/**
 * React hooks for fetching and mutating all Supabase data.
 * Each hook manages loading, error, and refetch states.
 */
import { useState, useEffect, useCallback } from 'react';
import {
    eventsDb, categoriesDb, brandProfilesDb, applicationsDb,
    eventPlansDb, bannersDb, emailTemplatesDb, emailAttachmentsDb,
    invoicesDb, companySettingsDb,
    DbEvent, DbCategory, DbBrandProfile, DbApplication,
    DbEventPlan, DbZone, DbStand, DbBanner,
    DbEmailTemplate, DbEmailAttachment, DbInvoice, DbCompanySettings,
} from '../lib/database';
import { dbInvoiceToApp, dbCompanySettingsToApp } from '../lib/mappers';
import { Invoice, CompanySettings } from '../types';
import { queryEmitter } from '../lib/queryEmitter';

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

interface UserScopedQueryOptions {
    enabled?: boolean;
    userId?: string | null;
    role?: string | null;
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

    // Subscribe to cache invalidation events
    useEffect(() => {
        const unsubscribe = queryEmitter.subscribe(queryKey, () => {
            fetch(true); // force refresh
        });
        return unsubscribe;
    }, [queryKey, fetch]);

    return { data, loading, error, refetch: () => (enabled ? fetch(true) : Promise.resolve()) };
}

/* ═══════════════════════════════════════════════════════════
   EVENTS
═══════════════════════════════════════════════════════════ */
export function useEvents(enabled = true) {
    const query = useQuery('events', () => eventsDb.getAll(), [], [], { enabled });
    return {
        ...query,
        events: query.data,
        createEvent: async (event: Omit<DbEvent, 'created_at'>) => {
            const created = await eventsDb.create(event);
            queryEmitter.invalidate('events');
            return created;
        },
        updateEvent: async (id: string, updates: Partial<DbEvent>) => {
            await eventsDb.update(id, updates);
            queryEmitter.invalidate('events');
        },
        uploadEventImage: async (file: File, eventId: string) => {
            const result = await eventsDb.uploadImage(file, eventId);
            queryEmitter.invalidate('events');
            return result;
        },
        uploadEventFloorplan: async (file: File, eventId: string) => {
            return eventsDb.uploadFloorplan(file, eventId);
        },
        deleteEvent: async (id: string) => {
            await eventsDb.delete(id);
            queryEmitter.invalidate('events');
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
            queryEmitter.invalidate('categories');
        },
        updateCategory: async (id: string, updates: Partial<DbCategory>) => {
            await categoriesDb.update(id, updates);
            queryEmitter.invalidate('categories');
        },
        deleteCategory: async (id: string) => {
            await categoriesDb.delete(id);
            queryEmitter.invalidate('categories');
        },
    };
}

/* ═══════════════════════════════════════════════════════════
   BRAND PROFILES
═══════════════════════════════════════════════════════════ */
export function useBrandProfiles(options: UserScopedQueryOptions = {}) {
    const enabled = options.enabled ?? true;
    const userKey = options.userId ?? 'anon';
    const roleKey = options.role ? options.role.toUpperCase() : 'UNKNOWN';
    const query = useQuery(
        `brand_profiles:${userKey}:${roleKey}`,
        () => brandProfilesDb.getAll({ userId: options.userId, role: options.role }),
        [],
        [options.userId, options.role],
        { enabled }
    );
    return {
        ...query,
        profiles: query.data,
        createProfile: async (profile: Omit<DbBrandProfile, 'created_at'>) => {
            await brandProfilesDb.create(profile);
            queryEmitter.invalidatePattern(/^brand_profiles:/);
        },
        updateProfile: async (id: string, updates: Partial<DbBrandProfile>) => {
            await brandProfilesDb.update(id, updates);
            queryEmitter.invalidatePattern(/^brand_profiles:/);
        },
        deleteProfile: async (id: string) => {
            await brandProfilesDb.delete(id);
            queryEmitter.invalidatePattern(/^brand_profiles:/);
        },
    };
}

/* ═══════════════════════════════════════════════════════════
   APPLICATIONS
═══════════════════════════════════════════════════════════ */
export function useApplications(options: UserScopedQueryOptions = {}) {
    const enabled = options.enabled ?? true;
    const userKey = options.userId ?? 'anon';
    const roleKey = options.role ? options.role.toUpperCase() : 'UNKNOWN';
    const query = useQuery(
        `applications:${userKey}:${roleKey}`,
        () => applicationsDb.getAll({ userId: options.userId, role: options.role }),
        [],
        [options.userId, options.role],
        { enabled }
    );
    return {
        ...query,
        applications: query.data,
        createApplication: async (app: Omit<DbApplication, 'created_at'>) => {
            await applicationsDb.create(app);
            queryEmitter.invalidatePattern(/^applications:/);
        },
        updateStatus: async (id: string, status: string, paymentDeadline?: string, approvedAt?: string) => {
            const result = await applicationsDb.updateStatus(id, status, paymentDeadline, approvedAt);
            queryEmitter.invalidatePattern(/^applications:/);
            return result;
        },
        updateApplication: async (id: string, updates: Partial<DbApplication>) => {
            await applicationsDb.update(id, updates);
            queryEmitter.invalidatePattern(/^applications:/);
        },
        deleteApplication: async (id: string) => {
            await applicationsDb.update(id, { status: 'DELETED' });
            queryEmitter.invalidatePattern(/^applications:/);
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
            queryEmitter.invalidate(`event_plan:${eventId}`);
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
            queryEmitter.invalidate('banners');
        },
        updateBanner: async (id: string, updates: Partial<DbBanner>) => {
            await bannersDb.update(id, updates);
            queryEmitter.invalidate('banners');
        },
        deleteBanner: async (id: string) => {
            await bannersDb.delete(id);
            queryEmitter.invalidate('banners');
        },
        replaceAllBanners: async (banners: Omit<DbBanner, 'created_at'>[]) => {
            await bannersDb.replaceAll(banners);
            queryEmitter.invalidate('banners');
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
            queryEmitter.invalidate('email_templates');
        },
        updateTemplate: async (id: string, updates: Partial<DbEmailTemplate>) => {
            await emailTemplatesDb.update(id, updates);
            queryEmitter.invalidate('email_templates');
        },
        deleteTemplate: async (id: string) => {
            await emailTemplatesDb.delete(id);
            queryEmitter.invalidate('email_templates');
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
            queryEmitter.invalidate(`email_attachments:${templateId}`);
        },
        deleteAttachment: async (id: string, storagePath: string) => {
            await emailAttachmentsDb.deleteWithFile(id, storagePath);
            queryEmitter.invalidate(`email_attachments:${templateId}`);
        },
    };
}

/* ─── Invoices ───────────────────────────────────────────── */

export function useInvoices(options: QueryOptions = {}): UseQueryResult<Invoice[]> {
    return useQuery(
        'invoices',
        async () => {
            const invoices = await invoicesDb.getAll();
            return invoices.map(dbInvoiceToApp);
        },
        [],
        [],
        options
    );
}

/* ─── Company Settings ───────────────────────────────────── */

export function useCompanySettings(options: QueryOptions = {}): UseQueryResult<CompanySettings | null> {
    return useQuery(
        'company_settings',
        async () => {
            const cs = await companySettingsDb.get();
            return cs ? dbCompanySettingsToApp(cs) : null;
        },
        null,
        [],
        options
    );
}
