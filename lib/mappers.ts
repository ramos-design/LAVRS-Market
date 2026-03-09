/**
 * Mappers: convert between Supabase DB format (snake_case)
 * and the existing app TypeScript types (camelCase).
 */
import { Application, AppStatus, BrandProfile, MarketEvent, Banner, Category, Zone, Stand, EventPlan, SpotSize, ExtraItem } from '../types';
import { DbEvent, DbApplication, DbBrandProfile, DbBanner, DbCategory, DbZone, DbStand, DbEventPlan } from '../lib/database';

/* ─── Events ─────────────────────────────────────────────── */

export function dbEventToApp(e: DbEvent): MarketEvent {
    return {
        id: e.id,
        title: e.title,
        date: e.date,
        location: e.location,
        status: e.status,
        image: e.image || '',
        description: e.description || undefined,
    };
}

export function appEventToDb(e: MarketEvent): Omit<DbEvent, 'created_at'> {
    return {
        id: e.id,
        title: e.title,
        date: e.date,
        location: e.location,
        status: e.status,
        image: e.image,
        description: e.description || null,
    };
}

/* ─── Applications ───────────────────────────────────────── */

export function dbApplicationToApp(a: DbApplication): Application {
    return {
        id: a.id,
        brandName: a.brand_name,
        brandDescription: a.brand_description || '',
        instagram: a.instagram || '',
        website: a.website || '',
        contactPerson: a.contact_person || '',
        phone: a.phone || '',
        email: a.email || '',
        billingName: a.billing_name || '',
        ic: a.ic || '',
        dic: a.dic || undefined,
        billingAddress: a.billing_address || '',
        billingEmail: a.billing_email || '',
        zone: (a.zone as SpotSize) || SpotSize.M,
        zoneCategory: a.zone_category || undefined,
        status: a.status as AppStatus,
        submittedAt: a.submitted_at,
        images: a.images || [],
        eventId: a.event_id || '',
        consentGDPR: a.consent_gdpr,
        consentOrg: a.consent_org,
        consentStorno: a.consent_storno,
        consentNewsletter: a.consent_newsletter,
        curatorNote: a.curator_note || undefined,
        extraNote: a.extra_note || undefined,
        paymentDeadline: a.payment_deadline || undefined,
    };
}

export function appApplicationToDb(a: Application): Omit<DbApplication, 'created_at'> {
    return {
        id: a.id,
        brand_name: a.brandName,
        brand_description: a.brandDescription || null,
        instagram: a.instagram || null,
        website: a.website || null,
        contact_person: a.contactPerson || null,
        phone: a.phone || null,
        email: a.email || null,
        billing_name: a.billingName || null,
        ic: a.ic || null,
        dic: a.dic || null,
        billing_address: a.billingAddress || null,
        billing_email: a.billingEmail || null,
        zone: a.zone,
        zone_category: a.zoneCategory || null,
        status: a.status,
        submitted_at: a.submittedAt,
        images: a.images || [],
        event_id: a.eventId || null,
        consent_gdpr: a.consentGDPR,
        consent_org: a.consentOrg,
        consent_storno: a.consentStorno,
        consent_newsletter: a.consentNewsletter,
        curator_note: a.curatorNote || null,
        extra_note: a.extraNote || null,
        payment_deadline: a.paymentDeadline || null,
        brand_profile_id: null,
    };
}

/* ─── Brand Profiles ─────────────────────────────────────── */

export function dbBrandProfileToApp(p: DbBrandProfile): BrandProfile {
    return {
        id: p.id,
        brandName: p.brand_name,
        brandDescription: p.brand_description || undefined,
        instagram: p.instagram || undefined,
        website: p.website || undefined,
        contactPerson: p.contact_person || undefined,
        phone: p.phone || undefined,
        email: p.email || undefined,
        zone: (p.zone as SpotSize) || undefined,
        billingName: p.billing_name || undefined,
        ic: p.ic || undefined,
        dic: p.dic || undefined,
        billingAddress: p.billing_address || undefined,
        billingEmail: p.billing_email || undefined,
    };
}

export function appBrandProfileToDb(p: BrandProfile): Omit<DbBrandProfile, 'created_at'> {
    return {
        id: p.id,
        brand_name: p.brandName,
        brand_description: p.brandDescription || null,
        instagram: p.instagram || null,
        website: p.website || null,
        contact_person: p.contactPerson || null,
        phone: p.phone || null,
        email: p.email || null,
        zone: p.zone || null,
        billing_name: p.billingName || null,
        ic: p.ic || null,
        dic: p.dic || null,
        billing_address: p.billingAddress || null,
        billing_email: p.billingEmail || null,
    };
}

/* ─── Banners ────────────────────────────────────────────── */

export function dbBannerToApp(b: DbBanner): Banner {
    return {
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || '',
        image: b.image || '',
        tag: b.tag || '',
    };
}

export function appBannerToDb(b: Banner, sortOrder: number = 0): Omit<DbBanner, 'created_at'> {
    return {
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || null,
        image: b.image || null,
        tag: b.tag || null,
        sort_order: sortOrder,
    };
}

/* ─── Categories ─────────────────────────────────────────── */

export function dbCategoryToApp(c: DbCategory): Category {
    return {
        id: c.id,
        name: c.name,
        description: c.description || '',
    };
}

export function appCategoryToDb(c: Category): Omit<DbCategory, 'created_at'> {
    return {
        id: c.id,
        name: c.name,
        description: c.description || null,
    };
}

/* ─── Zones ──────────────────────────────────────────────── */

export function dbZoneToApp(z: DbZone): Zone {
    return {
        id: z.id,
        name: z.name,
        color: z.color,
        category: z.category || '',
        capacities: z.capacities as { [key in SpotSize]?: number },
    };
}

/* ─── Stands ─────────────────────────────────────────────── */

export function dbStandToApp(s: DbStand): Stand {
    return {
        id: s.id,
        x: s.x,
        y: s.y,
        size: s.size as SpotSize,
        zoneId: s.zone_id || '',
        occupantId: s.occupant_id || undefined,
    };
}

/* ─── Event Plans ────────────────────────────────────────── */

export function dbEventPlanToApp(
    plan: DbEventPlan,
    zones: DbZone[],
    stands: DbStand[]
): EventPlan {
    return {
        eventId: plan.event_id,
        gridSize: { width: plan.grid_width, height: plan.grid_height },
        prices: plan.prices,
        equipment: plan.equipment,
        categorySizes: plan.category_sizes as { [key: string]: SpotSize } | undefined,
        extras: plan.extras as ExtraItem[],
        zones: zones.map(dbZoneToApp),
        stands: stands.map(dbStandToApp),
    };
}
