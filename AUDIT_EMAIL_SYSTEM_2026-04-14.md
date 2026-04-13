# 📋 EMAIL SYSTEM AUDIT & FIX REPORT
**Datum audit**: 2026-04-14  
**Auditor**: Claude Code  
**Projekt**: LAVRS Market  
**URL**: https://wllstifewvjtdrzfgbxj.supabase.co

---

## 🔴 VÝSLEDEK: KRITICKÉ PROBLÉMY NALEZENY

### Stav když jsi se přihlásil na event:
- ✅ Aplikace byla **vytvořena v DB** 
- ✅ Email template **existuje a je enabled**
- ❌ **WEBHOOK CHYBÍ** ← TO JE PROBLÉM!
- ❌ **Email se NEPOSÍLÁ** ← DŮSLEDEK

**Příčina**: Webhook není nastavený v Supabase, takže edge function `send-email` se NIKDY nevolá.

---

## 🔧 OPRAVY (Již Provedeny + TODO)

### ✅ HOTOVO:
1. **Migration.sql aktualizovaná**
   - Přidán chybějící template `payment-approved-admin`
   - Slouží pro admin notifikace když je platba potvrzena
   - Soubor: `supabase/migration.sql` (konec souboru)

2. **Všechny Email Templates v DB existují**
   - `confirm-application` - Při vytvoření aplikace
   - `application-approved` - Schválená aplikace
   - `application-rejected` - Zamítnutá aplikace
   - `application-waitlist` - Na waitlist
   - `payment-confirmed` - Platba přijata
   - `payment-reminder` - Připomínka
   - `payment-last-call` - Poslední výzva
   - `payment-submitted` - Potvrzení odeslání
   - `invoice-notification` - Notifikace (exhibitor)
   - `invoice-notification-admin` - Notifikace (admin)
   - `payment-approved-admin` - ✅ NOVĚ PŘIDÁNO

3. **Edge Functions existují v kódu**
   - `/functions/send-email/index.ts` - Webhook handler
   - `/functions/send-invoice-notification/index.ts` - Invoice endpoint

---

## ⚠️ MUSÍ SE NASTAVIT HNED!

### WEBHOOK V SUPABASE - KROK ZA KROKEM

**Projekt**: wllstifewvjtdrzfgbxj.supabase.co

#### Krok 1: Přihlas se do Supabase
- https://app.supabase.com/
- Vyber projekt LAVRS Market

#### Krok 2: Jdi na Webhooks
- **Menu**: Database → Webhooks
- Nebo přímý link: https://app.supabase.com/project/wllstifewvjtdrzfgbxj/database/webhooks

#### Krok 3: Vytvoř NOVÝ webhook
Klikni **"Create a new webhook"**

#### Krok 4: Nastav parametry

**Název webhooků** (vytvoř 2 webhooky - jeden pro INSERT, jeden pro UPDATE):

---

### 📍 WEBHOOK #1: Nová aplikace (INSERT)

| Parametr | Hodnota |
|----------|---------|
| **Name** | Send Email on Application Insert |
| **Table** | applications |
| **Events** | INSERT |
| **HTTP method** | POST |
| **URL** | `https://wllstifewvjtdrzfgbxj.supabase.co/functions/v1/send-email` |
| **Headers** | Content-Type: application/json |
| **Enabled** | ✅ ON |

---

### 📍 WEBHOOK #2: Změna statusu (UPDATE)

| Parametr | Hodnota |
|----------|---------|
| **Name** | Send Email on Application Status Change |
| **Table** | applications |
| **Events** | UPDATE |
| **HTTP method** | POST |
| **URL** | `https://wllstifewvjtdrzfgbxj.supabase.co/functions/v1/send-email` |
| **Headers** | Content-Type: application/json |
| **Enabled** | ✅ ON |

---

### ✅ Po vytvoření webhooků:

1. **Ověř vytvoření**:
   - Měly by se objevit v Webhooks sekci
   - Stav by měl být **"Active"**
   - Historie by měla být prázdná (ještě se nic neposílalo)

2. **Test**:
   - Přihláš se na event jako nový exhibitor
   - Měl bys dostat email s subject: **"Přihláška přijata - [Event Name]"**
   - Pokud email přijde: **✅ FIXED!**
   - Pokud ne: Zkontroluj Webhooks → History (budou tam error logy)

---

## 📊 EMAIL FLOW - CO SE STANE

```
┌─────────────────────────────────────────────────────────────┐
│ VYSTAVOVATEL SE PŘIHLÁSÍ NA EVENT                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────────┐
         │ INSERT into applications        │
         │ (DB - aplikace se vytvoří)     │
         └──────────────┬──────────────────┘
                        │
                        ▼
         ┌─────────────────────────────────┐
         │ WEBHOOK #1 spustí send-email    │
         │ (pokud je nastavený)            │
         └──────────────┬──────────────────┘
                        │
                        ▼
         ┌─────────────────────────────────┐
         │ Edge Function send-email        │
         │ - Najde template               │
         │ - Doplní proměnné              │
         │ - Pošle email přes SMTP        │
         └──────────────┬──────────────────┘
                        │
                        ▼
         ┌─────────────────────────────────┐
         │ ✉️ EMAIL NA EXHIBITORA          │
         │ "Přihláška přijata"             │
         └─────────────────────────────────┘
```

---

## 📧 VŠECHNY AUTOMATICKÉ EMAILY

| Spouštěč | Template | Příjemce | Požadavek |
|----------|----------|---------|-----------|
| Nová aplikace INSERT | `confirm-application` | Vystavovatel | Webhook #1 |
| Status = APPROVED | `application-approved` | Vystavovatel | Webhook #2 |
| Status = REJECTED | `application-rejected` | Vystavovatel | Webhook #2 |
| Status = WAITLIST | `application-waitlist` | Vystavovatel | Webhook #2 |
| Status = PAID | `payment-confirmed` | Vystavovatel | Webhook #2 |
| Status = PAID | `payment-approved-admin` | Admin | Webhook #2 |
| Status = PAYMENT_REMINDER | `payment-reminder` | Vystavovatel | Webhook #2 |
| Status = PAYMENT_LAST_CALL | `payment-last-call` | Vystavovatel | Webhook #2 |
| Status = PAYMENT_UNDER_REVIEW | `payment-submitted` | Vystavovatel | Webhook #2 |
| Invoice vygenerován | `invoice-notification` | Vystavovatel | Manual call |
| Invoice vygenerován | `invoice-notification-admin` | Admin | Manual call |

---

## 🧪 TESTING CHECKLIST

- [ ] Webhooky #1 a #2 vytvořeny v Supabase
- [ ] Oba webhooky jsou **"Active"**
- [ ] Přihláš se jako nový exhibitor na event
- [ ] Zkontroluj email inbox - měl bys dostat "Přihláška přijata"
- [ ] Pokud ne: Jdi do Webhooks → History a zkontroluj error logy
- [ ] Zkontroluj Edge Function logs: https://app.supabase.com/project/wllstifewvjtdrzfgbxj/functions

---

## 🔍 DIAGNOSTIKA - Jak Debug Problemů

### Problém: Email se neposílá

**Krok 1: Zkontroluj Webhook History**
- Supabase Dashboard → Database → Webhooks
- Klikni na konkrétní webhook
- Podívej se do záložky "History"
- Vidíš-li error? Zkontroluj error message

**Krok 2: Zkontroluj Edge Function Logs**
- https://app.supabase.com/project/wllstifewvjtdrzfgbxj/functions
- Klikni na `send-email`
- Podívej se do "Invocations"
- Jsou tam error logy?

**Krok 3: Zkontroluj Email Templates**
- Supabase: Tabulka `email_templates`
- Jsou templates `enabled: true`?

```sql
SELECT id, name, enabled FROM email_templates 
WHERE id IN ('confirm-application', 'payment-approved-admin') 
ORDER BY id;
```

### Problém: Webhooky neposílají
- Zkontroluj URL webhooků - musí být přesně: `https://wllstifewvjtdrzfgbxj.supabase.co/functions/v1/send-email`
- Zkontroluj že jsou nastaveny správné tabulky a events (INSERT, UPDATE)

---

## 📋 SOUHRN

| Co | Status | Akce |
|-----|--------|------|
| Email templates | ✅ OK | Žádná |
| Edge functions | ✅ OK | Žádná |
| Migration (payment-approved-admin) | ✅ HOTOVO | Nasazení |
| Webhooky v Supabase | ❌ CHYBI | **MUSÍ SE VYTVOŘIT HNED!** |

---

## ⏭️ NEXT STEPS

1. **URGENTNÍ**: Vytvoř webhooky #1 a #2 v Supabase (10 minut)
2. **TEST**: Přihláš se na event a ověř email (5 minut)
3. **DEPLOY**: Nasaď migration.sql do databáze (1 minuta)
4. **KOMUNIKACE**: Upozorni exhibitory že email system je nyní aktivní

---

## 📞 KONTAKT PRO POMOC

- **Supabase Docs**: https://supabase.com/docs/guides/database/webhooks
- **Edge Functions Logs**: https://app.supabase.com/project/wllstifewvjtdrzfgbxj/functions
- **Project URL**: https://wllstifewvjtdrzfgbxj.supabase.co
- **Dashboard**: https://app.supabase.com/

---

**Report vygenerován**: 2026-04-14  
**Verze**: v1.0  
**Status**: READY FOR IMPLEMENTATION
