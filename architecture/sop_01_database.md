# SOP-1: Database Architecture (Supabase)

## 📋 Goal
Establish a robust, relational database schema in Supabase to support the application lifecycle and manual curation workflow.

## 🏗️ Schema Details

### 1. `profiles` (Exhibitors)
- `id` (uuid, primary key, references auth.users)
- `brand_name` (text, required)
- `description` (text)
- `instagram_handle` (text)
- `website_url` (text)
- `status` (text: 'pending', 'verified', 'blocked')
- `created_at` (timestamptz)

### 2. `events`
- `id` (uuid, primary key)
- `name` (text, required)
- `date` (timestamptz, required)
- `location` (text)
- `registration_open` (boolean, default false)
- `status` (text: 'upcoming', 'ongoing', 'completed')

### 3. `event_zones`
- `id` (uuid, primary key)
- `event_id` (uuid, references events.id)
- `type` (text: 'S', 'M', 'L')
- `capacity` (int)
- `price_czk` (numeric)
- `description` (text)

### 4. `applications`
- `id` (uuid, primary key)
- `exhibitor_id` (uuid, references profiles.id)
- `event_id` (uuid, references events.id)
- `zone_id` (uuid, references event_zones.id)
- `status` (text: 'pending', 'approved', 'rejected', 'expired')
- `payment_status` (text: 'unpaid', 'paid')
- `approved_at` (timestamptz)
- `expires_at` (timestamptz) -- calculated as approved_at + 5 days
- `created_at` (timestamptz)

### 5. `audit_logs`
- `id` (uuid, primary key)
- `application_id` (uuid)
- `action` (text)
- `performed_by` (uuid)
- `payload` (jsonb)

## 🔒 Security (RLS)
- **Profiles**: Users can read/write their own profile. Admins can read all.
- **Events/Zones**: Publicly readable. Admin writable.
- **Applications**: Users can read their own. Admin can read/update all.

## ⚙️ Logic (Triggers)
- **Expiration Trigger**: A cron job or Edge Function check for `applications` where `status = 'approved'` AND `payment_status = 'unpaid'` AND `now() > expires_at`. Change to 'expired'.
