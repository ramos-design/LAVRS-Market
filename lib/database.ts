/**
 * Database CRUD operations for all LAVRS Market entities.
 * Talks to Supabase via the supabase-js client.
 */
import { supabase } from './supabase';

/* ─── Types matching DB schema (snake_case) ──────────────── */

export interface DbEvent {
    id: string;
    title: string;
    date: string;
    location: string;
    status: 'open' | 'closed' | 'waitlist' | 'draft';
    image: string | null;
    description: string | null;
    created_at?: string;
}

export interface DbCategory {
    id: string;
    name: string;
    description: string | null;
    created_at?: string;
}

export interface DbBrandProfile {
    id: string;
    user_id: string | null;
    brand_name: string;
    brand_description: string | null;
    instagram: string | null;
    website: string | null;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    zone: string | null;
    billing_name: string | null;
    ic: string | null;
    dic: string | null;
    billing_address: string | null;
    billing_email: string | null;
    created_at?: string;
}

export interface DbApplication {
    id: string;
    user_id: string | null;
    brand_name: string;
    brand_description: string | null;
    instagram: string | null;
    website: string | null;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    billing_name: string | null;
    ic: string | null;
    dic: string | null;
    billing_address: string | null;
    billing_email: string | null;
    zone: string;
    zone_category: string | null;
    status: string;
    submitted_at: string;
    images: string[];
    event_id: string | null;
    consent_gdpr: boolean;
    consent_org: boolean;
    consent_storno: boolean;
    consent_newsletter: boolean;
    curator_note: string | null;
    extra_note: string | null;
    payment_deadline: string | null;
    brand_profile_id: string | null;
    created_at?: string;
}

export interface DbEventPlan {
    id: string;
    event_id: string;
    grid_width: number;
    grid_height: number;
    prices: Record<string, string>;
    equipment: Record<string, string[]>;
    category_sizes: Record<string, string>;
    extras: Array<{ id: string; label: string; price: string }>;
    created_at?: string;
}

export interface DbZone {
    id: string;
    event_plan_id: string;
    name: string;
    color: string;
    category: string | null;
    capacities: Record<string, number>;
    created_at?: string;
}

export interface DbStand {
    id: string;
    event_plan_id: string;
    x: number;
    y: number;
    size: string;
    zone_id: string | null;
    occupant_id: string | null;
    created_at?: string;
}

export interface DbBanner {
    id: string;
    title: string;
    subtitle: string | null;
    image: string | null;
    tag: string | null;
    sort_order: number;
    created_at?: string;
}

export interface DbEmailTemplate {
    id: string;
    name: string;
    subject: string;
    description: string | null;
    body: string | null;
    category: string | null;
    enabled: boolean;
    last_edited: string | null;
    created_at?: string;
}

export interface DbEmailAttachment {
    id: string;
    template_id: string;
    file_name: string;
    file_size: number | null;
    file_type: string | null;
    storage_path: string;
    created_at?: string;
}

/* ═══════════════════════════════════════════════════════════
   EVENTS
═══════════════════════════════════════════════════════════ */
export const eventsDb = {
    async getAll(): Promise<DbEvent[]> {
        const { data, error } = await supabase.from('events').select('*').order('date');
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<DbEvent | null> {
        const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    },

    async create(event: Omit<DbEvent, 'created_at'>): Promise<DbEvent> {
        const { data, error } = await supabase.from('events').insert(event).select().single();
        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<DbEvent>): Promise<DbEvent> {
        const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;
    },
};

/* ═══════════════════════════════════════════════════════════
   CATEGORIES
═══════════════════════════════════════════════════════════ */
export const categoriesDb = {
    async getAll(): Promise<DbCategory[]> {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) throw error;
        return data || [];
    },

    async create(category: Omit<DbCategory, 'created_at'>): Promise<DbCategory> {
        const { data, error } = await supabase.from('categories').insert(category).select().single();
        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<DbCategory>): Promise<DbCategory> {
        const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
    },
};

/* ═══════════════════════════════════════════════════════════
   BRAND PROFILES
═══════════════════════════════════════════════════════════ */
export const brandProfilesDb = {
    async getAll(): Promise<DbBrandProfile[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('brand_profiles')
            .select('*')
            .eq('user_id', user.id)
            .order('brand_name');
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<DbBrandProfile | null> {
        const { data, error } = await supabase.from('brand_profiles').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    },

    async create(profile: Omit<DbBrandProfile, 'created_at'>): Promise<DbBrandProfile> {
        const { data: { user } } = await supabase.auth.getUser();
        const profileWithUser = { ...profile, user_id: user?.id || null };
        const { data, error } = await supabase.from('brand_profiles').insert(profileWithUser).select().single();
        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<DbBrandProfile>): Promise<DbBrandProfile> {
        const { data, error } = await supabase.from('brand_profiles').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('brand_profiles').delete().eq('id', id);
        if (error) throw error;
    },
};

/* ═══════════════════════════════════════════════════════════
   APPLICATIONS
═══════════════════════════════════════════════════════════ */
export const applicationsDb = {
    async getAll(): Promise<DbApplication[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Admin sees all, exhibitors see only theirs (RLS handles this but filter is safer)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        const isAdmin = profile?.role === 'ADMIN';

        let query = supabase.from('applications').select('*');
        if (!isAdmin) {
            query = query.eq('user_id', user.id);
        }

        const { data, error } = await query.order('submitted_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getByEventId(eventId: string): Promise<DbApplication[]> {
        const { data, error } = await supabase.from('applications').select('*').eq('event_id', eventId).order('submitted_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async create(app: Omit<DbApplication, 'created_at'>): Promise<DbApplication> {
        const { data: { user } } = await supabase.auth.getUser();
        const appWithUser = { ...app, user_id: user?.id || null };
        const { data, error } = await supabase.from('applications').insert(appWithUser).select().single();
        if (error) throw error;
        return data;
    },

    async updateStatus(id: string, status: string, paymentDeadline?: string): Promise<DbApplication> {
        const updates: Partial<DbApplication> = { status };
        if (paymentDeadline !== undefined) updates.payment_deadline = paymentDeadline;
        const { data, error } = await supabase.from('applications').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<DbApplication>): Promise<DbApplication> {
        const { data, error } = await supabase.from('applications').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('applications').delete().eq('id', id);
        if (error) throw error;
    },
};

/* ═══════════════════════════════════════════════════════════
   EVENT PLANS (with zones and stands)
═══════════════════════════════════════════════════════════ */
export const eventPlansDb = {
    async getByEventId(eventId: string): Promise<{
        plan: DbEventPlan | null;
        zones: DbZone[];
        stands: DbStand[];
    }> {
        const { data: plan, error: planError } = await supabase
            .from('event_plans')
            .select('*')
            .eq('event_id', eventId)
            .single();

        if (planError && planError.code !== 'PGRST116') throw planError; // PGRST116 = not found
        if (!plan) return { plan: null, zones: [], stands: [] };

        const [zonesResult, standsResult] = await Promise.all([
            supabase.from('zones').select('*').eq('event_plan_id', plan.id),
            supabase.from('stands').select('*').eq('event_plan_id', plan.id),
        ]);

        if (zonesResult.error) throw zonesResult.error;
        if (standsResult.error) throw standsResult.error;

        return {
            plan,
            zones: zonesResult.data || [],
            stands: standsResult.data || [],
        };
    },

    async savePlan(eventId: string, planData: {
        gridSize: { width: number; height: number };
        prices: Record<string, string>;
        equipment: Record<string, string[]>;
        categorySizes?: Record<string, string>;
        extras: Array<{ id: string; label: string; price: string }>;
        zones: DbZone[];
        stands: DbStand[];
    }): Promise<void> {
        // Upsert event plan
        const planId = `plan-${eventId}`;
        const { error: planError } = await supabase.from('event_plans').upsert({
            id: planId,
            event_id: eventId,
            grid_width: planData.gridSize.width,
            grid_height: planData.gridSize.height,
            prices: planData.prices,
            equipment: planData.equipment,
            category_sizes: planData.categorySizes || {},
            extras: planData.extras,
        });
        if (planError) throw planError;

        // Delete old zones and stands, then re-insert
        await supabase.from('stands').delete().eq('event_plan_id', planId);
        await supabase.from('zones').delete().eq('event_plan_id', planId);

        // Insert zones
        if (planData.zones.length > 0) {
            const zonesToInsert = planData.zones.map(z => ({
                id: z.id,
                event_plan_id: planId,
                name: z.name,
                color: z.color,
                category: z.category,
                capacities: z.capacities,
            }));
            const { error: zonesError } = await supabase.from('zones').insert(zonesToInsert);
            if (zonesError) throw zonesError;
        }

        // Insert stands
        if (planData.stands.length > 0) {
            const standsToInsert = planData.stands.map(s => ({
                id: s.id,
                event_plan_id: planId,
                x: s.x,
                y: s.y,
                size: s.size,
                zone_id: s.zone_id,
                occupant_id: s.occupant_id,
            }));
            const { error: standsError } = await supabase.from('stands').insert(standsToInsert);
            if (standsError) throw standsError;
        }
    },
};

/* ═══════════════════════════════════════════════════════════
   BANNERS
═══════════════════════════════════════════════════════════ */
export const bannersDb = {
    async getAll(): Promise<DbBanner[]> {
        const { data, error } = await supabase.from('banners').select('*').order('sort_order');
        if (error) throw error;
        return data || [];
    },

    async create(banner: Omit<DbBanner, 'created_at'>): Promise<DbBanner> {
        const { data, error } = await supabase.from('banners').insert(banner).select().single();
        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<DbBanner>): Promise<DbBanner> {
        const { data, error } = await supabase.from('banners').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('banners').delete().eq('id', id);
        if (error) throw error;
    },

    async replaceAll(banners: Omit<DbBanner, 'created_at'>[]): Promise<void> {
        // Delete all existing banners, then insert new ones
        await supabase.from('banners').delete().neq('id', '');
        if (banners.length > 0) {
            const { error } = await supabase.from('banners').insert(banners);
            if (error) throw error;
        }
    },
};

/* ═══════════════════════════════════════════════════════════
   EMAIL TEMPLATES
═══════════════════════════════════════════════════════════ */
export const emailTemplatesDb = {
    async getAll(): Promise<DbEmailTemplate[]> {
        const { data, error } = await supabase.from('email_templates').select('*').order('category').order('name');
        if (error) throw error;
        return data || [];
    },

    async create(template: Omit<DbEmailTemplate, 'created_at'>): Promise<DbEmailTemplate> {
        const { data, error } = await supabase.from('email_templates').insert(template).select().single();
        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<DbEmailTemplate>): Promise<DbEmailTemplate> {
        const { data, error } = await supabase.from('email_templates').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('email_templates').delete().eq('id', id);
        if (error) throw error;
    },
};

/* ═══════════════════════════════════════════════════════════
   EMAIL ATTACHMENTS (metadata — files go to Storage)
═══════════════════════════════════════════════════════════ */
export const emailAttachmentsDb = {
    async getByTemplateId(templateId: string): Promise<DbEmailAttachment[]> {
        const { data, error } = await supabase.from('email_attachments').select('*').eq('template_id', templateId);
        if (error) throw error;
        return data || [];
    },

    async create(attachment: Omit<DbEmailAttachment, 'created_at'>): Promise<DbEmailAttachment> {
        const { data, error } = await supabase.from('email_attachments').insert(attachment).select().single();
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('email_attachments').delete().eq('id', id);
        if (error) throw error;
    },

    async uploadFile(file: File, templateId: string): Promise<{ attachment: DbEmailAttachment; url: string }> {
        const filePath = `email-attachments/${templateId}/${Date.now()}-${file.name}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);
        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);

        // Create metadata record
        const attachment = await emailAttachmentsDb.create({
            id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            template_id: templateId,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            storage_path: filePath,
        });

        return { attachment, url: urlData.publicUrl };
    },

    async deleteWithFile(id: string, storagePath: string): Promise<void> {
        // Delete from storage
        await supabase.storage.from('attachments').remove([storagePath]);
        // Delete metadata
        await emailAttachmentsDb.delete(id);
    },
};
