-- Performance indexes for common Supabase queries in LAVRS Market
-- Run once in Supabase SQL Editor

CREATE INDEX IF NOT EXISTS idx_applications_user_status_submitted
  ON applications (user_id, status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_event_submitted
  ON applications (event_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_status_submitted
  ON applications (status, submitted_at DESC);

-- Frequent exhibitor query: own apps excluding deleted, newest first
CREATE INDEX IF NOT EXISTS idx_applications_user_active_submitted
  ON applications (user_id, submitted_at DESC)
  WHERE status <> 'DELETED';

CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_brand
  ON brand_profiles (user_id, brand_name);

CREATE INDEX IF NOT EXISTS idx_event_plans_event_id
  ON event_plans (event_id);

CREATE INDEX IF NOT EXISTS idx_zones_event_plan_id
  ON zones (event_plan_id);

CREATE INDEX IF NOT EXISTS idx_stands_event_plan_id
  ON stands (event_plan_id);

CREATE INDEX IF NOT EXISTS idx_banners_sort_order
  ON banners (sort_order);

CREATE INDEX IF NOT EXISTS idx_categories_name
  ON categories (name);

CREATE INDEX IF NOT EXISTS idx_email_attachments_template_id
  ON email_attachments (template_id);
