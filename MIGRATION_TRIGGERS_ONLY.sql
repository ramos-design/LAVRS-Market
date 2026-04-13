-- ═══════════════════════════════════════════════════════════════
-- DATABASE TRIGGERS PRO EMAIL WEBHOOKY (2026-04-14)
-- ═══════════════════════════════════════════════════════════════
-- TENTO SCRIPT VYTVÁŘÍ POSTGERSQL TRIGGERY KTERÉ VOLAJÍ EDGE FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- 1. Aktivuj pg_net extension (pokud ještě není)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Vytvoř trigger funkci pro email webhooky
CREATE OR REPLACE FUNCTION public.trigger_send_email_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Zavolej edge function přes HTTP POST
  PERFORM net.http_post(
    url := 'https://wllstifewvjtdrzfgbxj.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
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

-- ═══════════════════════════════════════════════════════════════
-- VÝSLEDEK:
-- ✅ Email templates - jsou v DB
-- ✅ Edge functions - send-email je nasazená
-- ✅ Database triggers - BUDOU VYTVOŘENY TÍMTO SCRIPTEM
-- ✅ Email system - BUDE FUNKČNÍ
-- ═══════════════════════════════════════════════════════════════
