/**
 * Mappers: convert between Supabase DB format (snake_case)
 * and the existing app TypeScript types (camelCase).
 */
import { Application, AppStatus, BrandProfile, MarketEvent, Banner, Category, Zone, Stand, EventPlan, SpotSize, ExtraItem } from '../types';
import { DbEvent, DbApplication, DbBrandProfile, DbBanner, DbCategory, DbZone, DbStand, DbEventPlan } from '../lib/database';

export function formatEventDate(dateStr: string): string {
    if (!dateStr) return '';

    // Handle specific range format if it exists (like 25.–26. 09. 2026)
    // If it's not a standard ISO, we might need more logic, but for now let's try to parse it.
    const date = new Date(dateStr);

    // If it's an invalid date (might happen with ranges), return as is or handle
    if (isNaN(date.getTime())) {
        return dateStr;
    }

    return new Intl.DateTimeFormat('cs-CZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

export function formatEventDateRange(dateStr: string, endDateStr?: string): string {
    if (!dateStr) return '';

    // If no end date or same as start date, just return single date
    if (!endDateStr || dateStr === endDateStr) {
        return formatEventDate(dateStr);
    }

    const startDate = new Date(dateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return dateStr + (endDateStr ? ` – ${endDateStr}` : '');
    }

    // Format: "25. – 26. září 2026"
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const startMonth = new Intl.DateTimeFormat('cs-CZ', { month: 'long' }).format(startDate);
    const endMonth = new Intl.DateTimeFormat('cs-CZ', { month: 'long' }).format(endDate);
    const year = endDate.getFullYear();

    if (startMonth === endMonth) {
        // Same month: "25.–26. září 2026"
        return `${startDay}.–${endDay}. ${endMonth} ${year}`;
    } else {
        // Different months: "25. srpna – 26. září 2026"
        return `${startDay}. ${startMonth} – ${endDay}. ${endMonth} ${year}`;
    }
}

/* ─── Events ─────────────────────────────────────────────── */

export function dbEventToApp(e: DbEvent): MarketEvent {
    return {
        id: e.id,
        title: e.title,
        date: e.date,
        endDate: (e as any).end_date || undefined,
        location: e.location,
        status: e.status,
        image: e.image || '',
        description: e.description || undefined,
        capacity: e.capacity || undefined,
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
        capacity: e.capacity || null,
        end_date: e.endDate || null,
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
        approvedAt: a.approved_at || undefined,
    };
}

export function appApplicationToDb(a: Application, userId?: string | null): Omit<DbApplication, 'created_at'> {
    return {
        id: a.id,
        user_id: userId || null,
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

export function appBrandProfileToDb(p: BrandProfile, userId?: string | null): Omit<DbBrandProfile, 'created_at'> {
    return {
        id: p.id,
        user_id: userId || null,
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
    const rawCaps = z.capacities && typeof z.capacities === 'object' ? z.capacities : {};
    return {
        id: z.id,
        name: z.name,
        color: z.color,
        category: z.category || '',
        capacities: {
            S: Number((rawCaps as any).S || 0),
            M: Number((rawCaps as any).M || 0),
            L: Number((rawCaps as any).L || 0),
        },
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
        label: s.label || undefined,
        widthCells: s.width_cells || 1,
        heightCells: s.height_cells || 1,
        rotation: s.rotation === 90 ? 90 : 0,
        locked: !!s.locked,
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
        layoutMeta: {
            backgroundImageUrl: plan.layout_meta?.backgroundImageUrl || '',
            backgroundOpacity: typeof plan.layout_meta?.backgroundOpacity === 'number' ? plan.layout_meta.backgroundOpacity : 0.35,
            cellSize: typeof plan.layout_meta?.cellSize === 'number' ? plan.layout_meta.cellSize : 28,
            originOffset: {
                x: typeof plan.layout_meta?.originOffset?.x === 'number' ? plan.layout_meta.originOffset.x : 0,
                y: typeof plan.layout_meta?.originOffset?.y === 'number' ? plan.layout_meta.originOffset.y : 0,
            },
        },
        prices: plan.prices,
        equipment: plan.equipment,
        categorySizes: plan.category_sizes as { [key: string]: string } | undefined,
        extras: plan.extras as ExtraItem[],
        zones: zones.map(dbZoneToApp),
        stands: stands.map(dbStandToApp),
    };
}
