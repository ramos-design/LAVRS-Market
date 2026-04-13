# ✉️ EMAIL SYSTEM - FINAL SETUP

**Status**: 🔴 **80% HOTOVO - Zbývá poslední krok!**  
**Datum**: 2026-04-14  
**Verze**: v1.0 - Production Ready

---

## 🎯 CO JE HOTOVO

✅ **Email Templates** - Všechny 11 templates jsou v DB:
- confirm-application ✅
- application-approved ✅
- application-rejected ✅
- application-waitlist ✅
- payment-confirmed ✅
- payment-reminder ✅
- payment-last-call ✅
- payment-submitted ✅
- invoice-notification ✅
- invoice-notification-admin ✅
- payment-approved-admin ✅

✅ **Edge Functions** - Nasazené a funkční:
- /functions/send-email ✅
- /functions/send-invoice-notification ✅

---

## ⏳ CO ZBÝVÁ - POSLEDNÍ KROK

**MUSÍŠ APLIKOVAT**: Database Triggers pro webhooky

Bez triggerů se email system **VŮBEC NESPOUŠTÍ**!

### 🔧 ŘEŠENÍ - Aplikuj SQL Triggery (5 minut)

**Soubor**: `MIGRATION_TRIGGERS_ONLY.sql` (v projektu)

#### Postup:

1. **Jdi na Supabase SQL Editor:**
   ```
   https://app.supabase.com/project/wllstifewvjtdrzfgbxj/sql/new
   ```

2. **Otevři soubor**: `MIGRATION_TRIGGERS_ONLY.sql`
   - Zkopíruj CELÝ obsah

3. **Vlož do SQL Editoru:**
   - Paste SQL do textového pole

4. **Klikni RUN:**
   - Ctrl+Enter nebo tlačítko "RUN"
   - Čekej na výsledek (mělo by být zelené "Success")

5. **Ověř:**
   - V SQL Editoru spusť kontrolu:
     ```sql
     SELECT trigger_name FROM information_schema.triggers
     WHERE trigger_schema = 'public' AND trigger_name LIKE 'applications_%';
     ```
   - Měl bys vidět 2 triggery:
     - applications_send_email_insert
     - applications_send_email_update

---

## 📋 JAK TO FUNGUJE - TECHNICKÉ DETAILY

Po aplikaci triggeru SQL:

```
┌─────────────────────────────────────────┐
│ VYSTAVOVATEL SE PŘIHLÁSÍ NA EVENT      │
└────────────┬────────────────────────────┘
             │
             ▼
  ┌──────────────────────┐
  │ INSERT do applications│
  │ (nový záznam)        │
  └────────┬─────────────┘
           │
           ▼
  ┌────────────────────────────────────────┐
  │ TRIGGER: applications_send_email_insert│
  │ (spustí se automaticky)               │
  └────────┬────────────────────────────────┘
           │
           ▼
  ┌────────────────────────────────────────┐
  │ Zavolej EDGE FUNCTION: /send-email    │
  │ (přes HTTP - pg_net)                  │
  └────────┬────────────────────────────────┘
           │
           ▼
  ┌────────────────────────────────────────┐
  │ Edge Function:                        │
  │ - Najde template "confirm-application"│
  │ - Doplní proměnné (email, jméno, atd) │
  │ - Pošle email přes SMTP               │
  └────────┬────────────────────────────────┘
           │
           ▼
  ┌────────────────────────────────────────┐
  │ ✉️ EMAIL NA EXHIBITORA                 │
  │ Subject: "Přihláška přijata - ..."    │
  └────────────────────────────────────────┘
```

---

## 🧪 TEST - Ověř že to funguje

### Test 1: Nová Aplikace (INSERT)

1. **Přihláš se jako NOVÝ exhibitor:**
   - https://rezervace.lavrsmarket.cz

2. **Vyber event a aplikuj:**
   - Vyplň všechny pole
   - Klikni "Odeslat"

3. **Zkontroluj email:**
   - Měl bys dostat email s subject:  
     **"Přihláška přijata - [Event Name]"**
   - Pokud PŘIJDE: ✅ **SYSTEM FUNGUJE!**

### Test 2: Schválení (UPDATE)

1. **Admin schválí aplikaci:**
   - Jdi do Admin Panelu
   - Najdi aplikaci → Status: APPROVED

2. **Zkontroluj email na exhibitora:**
   - Subject: **"Gratulujeme! Vaše přihláška byla schválena"**

### Test 3: Platba (UPDATE na PAID)

1. **Admin změní status na PAID:**
   - Aplikace → Status: PAID

2. **Zkontroluj:**
   - Exhibitor dostane: **"Potvrzení přijaté platby"**
   - Admin dostane: **"Platba ověřena (admin)"**

---

## 🔍 DEBUGGING - Pokud emaily nejdou

### Krok 1: Zkontroluj Triggers v DB

```sql
-- Spusť v Supabase SQL Editor:
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE 'applications_%';
```

**Měl bys vidět:**
- applications_send_email_insert | INSERT | applications
- applications_send_email_update | UPDATE | applications

**Pokud NEJSOU**: Aplikuj znovu SQL ze souboru `MIGRATION_TRIGGERS_ONLY.sql`

### Krok 2: Zkontroluj Edge Function Logs

1. Jdi na: https://app.supabase.com/project/wllstifewvjtdrzfgbxj/functions
2. Klikni na `send-email`
3. Jdi na "Invocations"
4. Měl bys vidět nové volání (log) když se vytvoří aplikace
5. Pokud vidíš ERROR → zkopíruj error message a debuguj

### Krok 3: Zkontroluj Templates v DB

```sql
SELECT id, name, enabled FROM email_templates 
WHERE enabled = true 
ORDER BY id;
```

**Měl bys vidět všechny templates jako `enabled: true`**

### Krok 4: Zkontroluj Email Logs

- Jdi na admin settings
- Zkontroluj SMTP config
- Zkontroluj jestli jsou SMTP klíče správně

---

## 📊 STAV EMAILŮ - CHECKLIST

| Komponenta | Status | ✅/❌ |
|-----------|--------|-------|
| Email Templates v DB | 11 templates | ✅ |
| Templates enabled | Všechny true | ✅ |
| Edge function send-email | Nasazená | ✅ |
| Edge function send-invoice-notification | Nasazená | ✅ |
| pg_net extension | K aktivaci v SQL | ⏳ |
| Database triggers | K vytvoření | ⏳ |
| Email system | READY | 🟡 |

---

## 🚀 FINAL CHECKLIST - PRODUKCE

- [ ] Aplikovány triggers z `MIGRATION_TRIGGERS_ONLY.sql`
- [ ] Email test #1 - Nová aplikace ✅
- [ ] Email test #2 - Schválení ✅
- [ ] Email test #3 - Platba ✅
- [ ] Zkontrolován Edge Function logs bez chyb
- [ ] Zkontrolován email logs bez chyb
- [ ] Email system ready for production ✅

---

## 📞 NEXT STEPS

1. **TEĎKA**: Aplikuj SQL `MIGRATION_TRIGGERS_ONLY.sql` v Supabase
2. **ZA 5 MINUT**: Otestuj - přihláš se na event
3. **ZA 10 MINUT**: Vše by mělo být funkční! 🎉

---

## 📝 REFERENCE

- **Project URL**: https://wllstifewvjtdrzfgbxj.supabase.co
- **SQL Editor**: https://app.supabase.com/project/wllstifewvjtdrzfgbxj/sql/new
- **Functions**: https://app.supabase.com/project/wllstifewvjtdrzfgbxj/functions
- **Migration File**: `MIGRATION_TRIGGERS_ONLY.sql`

---

**Status: READY TO DEPLOY** 🚀
