-- ============================================
-- LAVRS Market — Supabase Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Profiles (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'EXHIBITOR' CHECK (role IN ('EXHIBITOR', 'ADMIN')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Events
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('open', 'closed', 'waitlist', 'draft')),
  image TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Brand Profiles
CREATE TABLE IF NOT EXISTS brand_profiles (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  brand_name TEXT NOT NULL,
  brand_description TEXT,
  instagram TEXT,
  website TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  zone TEXT,
  billing_name TEXT,
  ic TEXT,
  dic TEXT,
  billing_address TEXT,
  billing_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Applications
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  brand_name TEXT NOT NULL,
  brand_description TEXT,
  instagram TEXT,
  website TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  billing_name TEXT,
  ic TEXT,
  dic TEXT,
  billing_address TEXT,
  billing_email TEXT,
  zone TEXT NOT NULL DEFAULT 'M',
  zone_category TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'WAITLIST', 'PAID', 'EXPIRED', 'PAYMENT_REMINDER', 'PAYMENT_LAST_CALL', 'PAYMENT_UNDER_REVIEW', 'DELETED')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  images TEXT[] DEFAULT '{}',
  event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
  consent_gdpr BOOLEAN DEFAULT false,
  consent_org BOOLEAN DEFAULT false,
  consent_storno BOOLEAN DEFAULT false,
  consent_newsletter BOOLEAN DEFAULT false,
  curator_note TEXT,
  extra_note TEXT,
  payment_deadline TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  brand_profile_id TEXT REFERENCES brand_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure status constraint includes all app states (for existing DBs)
ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications
  ADD CONSTRAINT applications_status_check CHECK (
    status IN (
      'PENDING',
      'APPROVED',
      'REJECTED',
      'WAITLIST',
      'PAID',
      'EXPIRED',
      'PAYMENT_REMINDER',
      'PAYMENT_LAST_CALL',
      'PAYMENT_UNDER_REVIEW',
      'DELETED'
    )
  );


-- 5. Event Plans
CREATE TABLE IF NOT EXISTS event_plans (
  id TEXT PRIMARY KEY,
  event_id TEXT UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  grid_width INT NOT NULL DEFAULT 12,
  grid_height INT NOT NULL DEFAULT 8,
  prices JSONB DEFAULT '{}',
  equipment JSONB DEFAULT '{}',
  category_sizes JSONB DEFAULT '{}',
  extras JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Zones
CREATE TABLE IF NOT EXISTS zones (
  id TEXT PRIMARY KEY,
  event_plan_id TEXT REFERENCES event_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#EF4444',
  category TEXT,
  capacities JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Stands
CREATE TABLE IF NOT EXISTS stands (
  id TEXT PRIMARY KEY,
  event_plan_id TEXT REFERENCES event_plans(id) ON DELETE CASCADE,
  x INT NOT NULL,
  y INT NOT NULL,
  size TEXT NOT NULL CHECK (size IN ('S','M','L')),
  zone_id TEXT,
  occupant_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Banners
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image TEXT,
  tag TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  body TEXT,
  category TEXT CHECK (category IN ('application','payment','event')),
  enabled BOOLEAN DEFAULT true,
  last_edited TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Email Attachments
CREATE TABLE IF NOT EXISTS email_attachments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  template_id TEXT REFERENCES email_templates(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INT,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE stands ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public profiles are visible by everyone." ON profiles;
CREATE POLICY "Public profiles are visible by everyone." ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can edit own profile." ON profiles;
CREATE POLICY "Users can edit own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow all" ON events;
CREATE POLICY "Allow all" ON events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON categories;
CREATE POLICY "Allow all" ON categories FOR ALL USING (true) WITH CHECK (true);

-- Applications policies
DROP POLICY IF EXISTS "Individuals can view their own applications." ON applications;
CREATE POLICY "Individuals can view their own applications." ON applications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Individuals can insert their own applications." ON applications;
CREATE POLICY "Individuals can insert their own applications." ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all applications." ON applications;
CREATE POLICY "Admins can view all applications." ON applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

DROP POLICY IF EXISTS "Admins can update applications." ON applications;
CREATE POLICY "Admins can update applications." ON applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

DROP POLICY IF EXISTS "Admins can delete applications." ON applications;
CREATE POLICY "Admins can delete applications." ON applications FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Brand profiles policies
DROP POLICY IF EXISTS "Individuals can view their own brand profiles." ON brand_profiles;
CREATE POLICY "Individuals can view their own brand profiles." ON brand_profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Individuals can insert their own brand profiles." ON brand_profiles;
CREATE POLICY "Individuals can insert their own brand profiles." ON brand_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all brand profiles." ON brand_profiles;
CREATE POLICY "Admins can view all brand profiles." ON brand_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Fallback policies for other tables (admin or public)
DROP POLICY IF EXISTS "Allow all" ON event_plans;
CREATE POLICY "Allow all" ON event_plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON zones;
CREATE POLICY "Allow all" ON zones FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON stands;
CREATE POLICY "Allow all" ON stands FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON banners;
CREATE POLICY "Allow all" ON banners FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON email_templates;
CREATE POLICY "Allow all" ON email_templates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON email_attachments;
CREATE POLICY "Allow all" ON email_attachments FOR ALL USING (true) WITH CHECK (true);


-- ============================================
-- Trigger for automatic profile creation
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'EXHIBITOR');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();




-- ============================================
-- SEED DATA
-- ============================================

-- Events
INSERT INTO events (id, title, date, location, status, image) VALUES
  ('mini-1', 'LAVRS market', '21. 03. 2026', 'Vnitroblock, Holešovice', 'open', '/media/1cde43c8-e02d-43da-aa4c-2c21532f5797.webp'),
  ('mini-2', 'LAVRS market', '30. 05. 2026', 'Vnitroblock, Holešovice', 'open', '/media/LAVRSMarket-1681924565.png'),
  ('mini-3', 'LAVRS market', '25. 07. 2026', 'Vnitroblock, Holešovice', 'open', '/media/Lavrsmarket-2022-foto-Dominika-Hruba.jpg'),
  ('vianoce-mini-1', 'Vánoční LAVRS market', '28. 11. 2026', 'Radlická Kulturní Sportovna', 'closed', '/media/lavrs-bundy-foto-dominika-hruba-nahled.jpg'),
  ('lavrs-big-1', 'LAVRS market', '25.–26. 09. 2026', 'Garbe Holešovice', 'closed', '/media/lavrs-market.webp')
ON CONFLICT (id) DO NOTHING;

UPDATE events SET description = '1 booking = 2 dny. Přihláška se vztahuje na oba dny.' WHERE id = 'lavrs-big-1';

-- Categories
INSERT INTO categories (id, name, description) VALUES
  ('Secondhands', 'Secondhands', 'Vintage a second-hand móda'),
  ('České značky', 'České značky', 'Lokální české značky'),
  ('Designers', 'Designers', 'Designérské kousky'),
  ('Beauty ZONE', 'Beauty ZONE', 'Kosmetika a péče'),
  ('TATTOO', 'TATTOO', 'Tetování a body art'),
  ('Reuse', 'Reuse zone', 'Udržitelná a kreativní tvorba')
ON CONFLICT (id) DO NOTHING;

-- Brand Profiles
INSERT INTO brand_profiles (id, brand_name, brand_description, instagram, website, contact_person, phone, email, zone, billing_name, ic, billing_address, billing_email) VALUES
  ('brand-1', 'Vintage Soul', 'Výběrový vintage shop se zaměřením na 90. léta a lokální rework. Naše kousky pečlivě vybíráme a vdechujeme jim nový život.', '@vintage.soul', 'vintagesoul.cz', 'Tereza Nováková', '+420 777 123 456', 'tereza@vintagesoul.cz', 'M', 'Vintage Soul s.r.o.', '12345678', 'Vnitroblock, Holešovice, Praha', 'faktury@vintagesoul.cz')
ON CONFLICT (id) DO NOTHING;

-- Banners
INSERT INTO banners (id, title, subtitle, image, tag, sort_order) VALUES
  ('b1', 'Přípravy na Vánoce vrcholí', 'Nezapomeňte si včas rezervovat své místo na Vánočním LAVRS marketu. Kapacity se rychle plní!', '/media/1cde43c8-e02d-43da-aa4c-2c21532f5797.webp', 'DŮLEŽITÉ', 0),
  ('b2', 'Nová lokace v Holešovicích', 'Zářijový LAVRS market se přesouvá do úžasných prostor Garbe Holešovice. Máte se na co těšit.', '/media/lavrs-market.webp', 'NOVINKA', 1),
  ('b3', 'Workshop: Circular Fashion', 'Chcete se dozvědět více o tom, jak lépe prezentovat svou udržitelnou značku? Sledujte náš newsletter.', '/media/Lavrsmarket-2022-foto-Dominika-Hruba.jpg', 'WORKSHOP', 2)
ON CONFLICT (id) DO NOTHING;

-- Event Plan for mini-1
INSERT INTO event_plans (id, event_id, grid_width, grid_height, prices, equipment, category_sizes, extras) VALUES
  ('plan-mini-1', 'mini-1', 12, 8,
   '{"Secondhands":"2.500 Kč","České značky":"3.800 Kč","Designers":"4.200 Kč","Beauty ZONE":"3.500 Kč","TATTOO":"5.500 Kč","Reuse":"2.200 Kč"}',
   '{"Secondhands":["1x Stojan na šaty (vlastní)","1x Stůl","1x Židle"],"České značky":["1x Stojan na šaty","1x Stůl","2x Židle"],"Designers":["1x Stojan na šaty","1x Stůl","2x Židle","Zrcadlo"],"Beauty ZONE":["1x Stůl","2x Židle","Zrcadlo"],"TATTOO":["1x Stůl","2x Židle","Podložka"],"Reuse":["1x Stůl","2x Židle"]}',
   '{"Secondhands":"Spot M","České značky":"Spot S","Designers":"Spot M","Beauty ZONE":"Spot S","TATTOO":"Spot L","Reuse":"Spot M"}',
   '[{"id":"extra-chair","label":"Extra Židle","price":"200 Kč"},{"id":"extra-table","label":"Extra Stůl","price":"400 Kč"},{"id":"rack-rent","label":"Extra stojan","price":"300 Kč"},{"id":"electricity","label":"Přípojka elektřiny","price":"500 Kč"}]'
  )
ON CONFLICT (id) DO NOTHING;

-- Zones for mini-1
INSERT INTO zones (id, event_plan_id, name, color, category, capacities) VALUES
  ('z1', 'plan-mini-1', 'Hlavní sál', '#EF4444', 'Secondhands', '{"S":5,"M":10,"L":2}'),
  ('z2', 'plan-mini-1', 'Designers Zone', '#8B5CF6', 'Designers', '{"S":2,"M":5,"L":1}')
ON CONFLICT (id) DO NOTHING;

-- Stands for mini-1
INSERT INTO stands (id, event_plan_id, x, y, size, zone_id) VALUES
  ('s1', 'plan-mini-1', 1, 1, 'M', 'z1'),
  ('s2', 'plan-mini-1', 1, 2, 'M', 'z1'),
  ('s3', 'plan-mini-1', 2, 1, 'S', 'z1'),
  ('s4', 'plan-mini-1', 5, 5, 'L', 'z2')
ON CONFLICT (id) DO NOTHING;

-- Email Templates
INSERT INTO email_templates (id, name, subject, description, body, category, enabled) VALUES
  ('confirm-application', 'Potvrzení přihlášení', 'Přihláška přijata - {{event_name}}', 'Automatický email odeslaný po úspěšném podání přihlášky k eventu.', 'Dobrý den, {{contact_person}},

děkujeme za Vaši přihlášku na {{event_name}}!

Vaše přihláška za značku {{brand_name}} byla úspěšně přijata a nyní čeká na posouzení naším kurátorským týmem.

O výsledku Vás budeme informovat emailem do 5 pracovních dnů.

S pozdravem,
Tým LAVRS Market', 'application', true),

  ('application-approved', 'Schválení přihlášky + faktura', 'Gratulujeme! Vaše přihláška byla schválena', 'Email s potvrzením schválení a přiloženou fakturou k úhradě.', 'Dobrý den, {{contact_person}},

s radostí Vám oznamujeme, že Vaše přihláška za značku {{brand_name}} na {{event_name}} byla schválena! 🎉

Rezervovali jsme pro Vás spot velikosti {{zone_type}}.

Pro potvrzení Vaší účasti prosím uhraďte fakturu v příloze do {{payment_deadline}}.

Částka k úhradě: {{invoice_amount}}
Číslo faktury: {{invoice_number}}

S pozdravem,
Tým LAVRS Market', 'application', true),

  ('application-rejected', 'Zamítnutí přihlášky', 'Informace o vaší přihlášce na {{event_name}}', 'Zdvořilé zamítnutí přihlášky s možností zápisu na waitlist.', 'Dobrý den, {{contact_person}},

děkujeme za Váš zájem o účast na {{event_name}}.

Bohužel Vám musíme sdělit, že Vaše přihláška za značku {{brand_name}} nebyla tentokrát schválena.

Můžete se zapsat na waitlist — pokud se uvolní místo, ozveme se Vám.

S pozdravem,
Tým LAVRS Market', 'application', true),

  ('payment-confirmed', 'Potvrzení přijaté platby', 'Platba přijata - {{event_name}}', 'Potvrzení o úspěšném přijetí platby za event.', 'Dobrý den, {{contact_person}},

potvrzujeme přijetí Vaší platby za účast na {{event_name}}.

Částka: {{invoice_amount}}
Číslo faktury: {{invoice_number}}

Vaše místo (spot {{zone_type}}) je nyní závazně rezervováno.

S pozdravem,
Tým LAVRS Market', 'payment', true),

  ('payment-reminder', 'Platební upomínka', 'Připomínka platby - {{event_name}}', 'Upomínka na blížící se termín splatnosti faktury.', 'Dobrý den, {{contact_person}},

rádi bychom Vám připomněli blížící se termín splatnosti faktury za {{event_name}}.

Číslo faktury: {{invoice_number}}
Částka: {{invoice_amount}}
Splatnost: {{payment_deadline}}

S pozdravem,
Tým LAVRS Market', 'payment', true),

  ('payment-last-call', 'Platební upomínka - Last Call', 'URGENTNÍ: Poslední výzva k úhradě', 'Finální upomínka před zrušením rezervace místa.', 'Dobrý den, {{contact_person}},

toto je poslední upomínka k úhradě faktury za {{event_name}}.

⚠️ Pokud platba nebude připsána do konce dne splatnosti, Vaše místo bude automaticky uvolněno.

S pozdravem,
Tým LAVRS Market', 'payment', true),

  ('event-instructions', 'Organizační instrukce před akcí', 'Důležité informace k {{event_name}}', 'Praktické informace o průběhu eventu, příjezdu, setup času atd.', 'Dobrý den, {{contact_person}},

{{event_name}} se blíží! Zde jsou důležité organizační informace:

📍 Místo: {{event_location}}
📅 Datum: {{event_date}}
🕐 Příjezd a setup: 7:00 – 9:00

Váš spot: {{zone_type}}

S pozdravem,
Tým LAVRS Market', 'event', true),

  ('event-reminder', 'Reminder těsně před akcí', 'Už zítra! {{event_name}}', 'Připomínka den před konáním eventu.', 'Dobrý den, {{contact_person}},

připomínáme, že zítra se koná {{event_name}}! 🎪

📍 {{event_location}}
📅 {{event_date}}

Těšíme se na Vás!

S pozdravem,
Tým LAVRS Market', 'event', true),

  ('post-event', 'Post-event email', 'Děkujeme za účast na {{event_name}}', 'Poděkování po skončení eventu, možnost zpětné vazby a pozvánka na další akce.', 'Dobrý den, {{contact_person}},

děkujeme za Vaši účast na {{event_name}}! 🙏

Doufáme, že se Vám event líbil a byl pro Vás přínosný.

S pozdravem,
Tým LAVRS Market', 'event', true)
ON CONFLICT (id) DO NOTHING;
