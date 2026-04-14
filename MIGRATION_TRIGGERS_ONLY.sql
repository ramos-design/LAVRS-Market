-- ═══════════════════════════════════════════════════════════════
-- DATABASE TRIGGERS PRO EMAIL WEBHOOKY (2026-04-14)
-- ═══════════════════════════════════════════════════════════════
-- TENTO SCRIPT VYTVÁŘÍ POSTGERSQL TRIGGERY KTERÉ VOLAJÍ EDGE FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- 1. Aktivuj pg_net extension (pokud ještě není)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1b. Přidej is_paid sloupec do invoices tabulky, pokud ještě není
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

-- 2. Vytvoř trigger funkci pro email webhooky
CREATE OR REPLACE FUNCTION public.trigger_send_email_webhook()
RETURNS TRIGGER AS $$
DECLARE
  service_role_key text;
BEGIN
  -- Získej service_role_key z Vault (Supabase secret management)
  -- Alternativně: nastav jako GUC proměnnou v DB settings
  SELECT decrypted_secret INTO service_role_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;

  -- Fallback: pokud není ve Vault, zkus current_setting
  IF service_role_key IS NULL THEN
    BEGIN
      service_role_key := current_setting('app.settings.service_role_key', true);
    EXCEPTION WHEN OTHERS THEN
      service_role_key := NULL;
    END;
  END IF;

  -- Zavolej edge function přes HTTP POST
  PERFORM net.http_post(
    url := 'https://wllstifewvjtdrzfgbxj.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := jsonb_build_object(
      'type', CASE WHEN TG_OP = 'INSERT' THEN 'INSERT' ELSE 'UPDATE' END,
      'table', 'applications',
      'record', row_to_json(NEW),
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    ),
    is_json := true
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error ale neprůstav exception
  RAISE NOTICE 'Webhook error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2b. Trigger funkce pro označení faktury jako zaplacené
CREATE OR REPLACE FUNCTION public.mark_invoice_as_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Update invoice table to mark as paid when status becomes PAID
  UPDATE public.invoices
  SET is_paid = true,
      updated_at = NOW()
  WHERE application_id = NEW.id
    AND is_paid IS NOT TRUE;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error ale neprůstav exception
  RAISE NOTICE 'Mark invoice as paid error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger na INSERT - když se vytvoří nová aplikace
DROP TRIGGER IF EXISTS applications_send_email_insert ON public.applications;
CREATE TRIGGER applications_send_email_insert
  AFTER INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_email_webhook();

-- 4. Trigger na UPDATE - když se změní status (jen když se status změní)
DROP TRIGGER IF EXISTS applications_send_email_update ON public.applications;
CREATE TRIGGER applications_send_email_update
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trigger_send_email_webhook();

-- 5. Special handling for PAID status - mark invoice as paid
-- When status changes to PAID, update the invoice record to mark it as paid
DROP TRIGGER IF EXISTS applications_mark_invoice_paid ON public.applications;
CREATE TRIGGER applications_mark_invoice_paid
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'PAID')
  EXECUTE FUNCTION public.mark_invoice_as_paid();

-- ═══════════════════════════════════════════════════════════════
-- KOŠ PRO ZNAČKY (BRAND TRASH) — 2026-04-14
-- ═══════════════════════════════════════════════════════════════

-- Přidej trashed_at sloupec do brand_profiles (soft-delete / koš)
ALTER TABLE public.brand_profiles
ADD COLUMN IF NOT EXISTS trashed_at TIMESTAMPTZ DEFAULT NULL;

-- Index pro rychlé filtrování koše
CREATE INDEX IF NOT EXISTS idx_brand_profiles_trashed_at
ON public.brand_profiles (trashed_at)
WHERE trashed_at IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- PLACENÁ FAKTURA (DAŇOVÝ DOKLAD) — 2026-04-14
-- ═══════════════════════════════════════════════════════════════

-- Rozšíření invoices tabulky o sloupce pro placenou verzi faktury
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS paid_pdf_storage_path TEXT DEFAULT NULL;

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS paid_pdf_url TEXT DEFAULT NULL;

-- Index pro rychlé filtrování placených faktur
CREATE INDEX IF NOT EXISTS idx_invoices_is_paid
ON public.invoices (is_paid)
WHERE is_paid = true;

-- ═══════════════════════════════════════════════════════════════
-- OVĚŘENÍ
-- ═══════════════════════════════════════════════════════════════
-- Po aplikaci tohoto scriptu, spusť tyto SQL queries aby ověřil:

-- 1. Zkontroluj Extension:
--    SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- 2. Zkontroluj Triggers:
--    SELECT trigger_name, event_object_table FROM information_schema.triggers
--    WHERE trigger_schema = 'public' AND trigger_name LIKE 'applications_%';

-- 3. Zkontroluj Trigger funkci:
--    SELECT routine_name FROM information_schema.routines
--    WHERE routine_schema = 'public' AND routine_name = 'trigger_send_email_webhook';

-- 4. Zkontroluj Invoice sloupce:
--    SELECT column_name, data_type FROM information_schema.columns
--    WHERE table_name = 'invoices' AND column_name IN ('is_paid', 'paid_at', 'paid_pdf_storage_path', 'paid_pdf_url');

-- ═══════════════════════════════════════════════════════════════
-- VÝSLEDEK:
-- ✅ Email templates - jsou v DB
-- ✅ Edge functions - send-email je nasazená
-- ✅ Database triggers - BUDOU VYTVOŘENY TÍMTO SCRIPTEM
-- ✅ Invoice paid columns - is_paid, paid_at, paid_pdf_storage_path, paid_pdf_url
-- ✅ Email system - BUDE FUNKČNÍ
-- ═══════════════════════════════════════════════════════════════
