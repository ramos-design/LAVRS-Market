# ⚡ Phase 2: Advanced Performance Optimization

**Status:** PŘIPRAVENO K ZAHÁJENÍ
**Cíl:** Dalších -40-50% výkonnosti bez zásahu do funkcionalit
**Přístup:** Měřit PŘED a PO, žádat schválení pro větší změny

---

## 📊 Métriky Phase 1 (Hotovo ✅)
- **Problém #1:** N+1 queries → **FIXED** (Map lookups - O(1))
- **Problém #2:** Lazy loading plans → **FIXED** (90% faster load)
- **Problém #3:** Memory leaks → **FIXED** (interval cleanup)
- **Problém #4:** React re-renders → **FIXED** (-30-40% s memo + useCallback)
- **Problém #5:** Filter iterations → **FIXED** (-80% s combined filters)

---

## 🎯 Phase 2: 4 Advanced Tasks

### Task #1: ExhibitorDashboard - Countdown Timer
**Složitost:** ⭐⭐ (Snadný)
**Benefit:** -90% re-renders v countdownu
**Čas:** ~15-20 minut

**Problém:**
- Countdown timer renderuje každou sekundu CELOU komponentu
- State se mění v přidání komponenty a vybere se znovu VŽDY

**Řešení:**
1. Extrahovat countdown do separátní komponenty
2. Memoizovat s React.memo
3. Používat useCallback pro callback
4. Timestamp se počítá v useEffect a mění se jen timer

**Soubory k úpravě:**
- `components/ExhibitorDashboard.tsx` - extrahovat countdown

**Měření:**
- DevTools Profiler: počet re-renders componentu
- Měl by jít z "re-renders each tick" na "jeden persistent timer"

---

### Task #2: AdminDashboard - Fix loadEventStats Loop
**Složitost:** ⭐⭐⭐ (Střední)
**Benefit:** -50% effect runs
**Čas:** ~30-40 minut

**Problém:**
- `loadEventStats` effect se spouští pokaždé, když se změní dependency
- Fetch se dělá zbytečně znovu

**Řešení:**
1. Přidat `eventId` do dependency array (správně)
2. UseMemo wrapper pro data aby se nerecomputely
3. useCallback pro handlery
4. Zajistit že effect se spouští jen změna eventId

**Soubory k úpravě:**
- `components/AdminDashboard.tsx` - useCallback, dependency cleanup

**Měření:**
- DevTools Profiler: počet spuštění effect
- Network tab: počet fetchů pro stejné eventId

---

### Task #3: EventLayoutManager - Memoize renderGrid
**Složitost:** ⭐⭐⭐⭐ (Těžší)
**Benefit:** -70% layout calculations
**Čas:** ~40-50 minut

**Problém:**
- `renderGrid()` je drahá funkce (loops, calculations)
- Volá se vícekrát i když se data nezmění

**Řešení:**
1. Dělat grid rendering v useMemo (s dependency: events, gridConfig)
2. Memoizovat child komponenty EventCard
3. useCallback pro event handlers
4. Zajistit strukturu dat (neměnit reference zbytečně)

**Soubory k úpravě:**
- `components/EventLayoutManager.tsx` - useMemo grid, memoize children

**Měření:**
- DevTools Profiler: Layout times (měly by klesnout)
- Performance tab: Rendering time

---

### Task #4: ToastProvider - Per-toast setTimeout
**Složitost:** ⭐⭐⭐ (Střední)
**Benefit:** -40% overhead z globálního timeru
**Čas:** ~25-35 minut

**Problém:**
- Všechny toasty sdílí jeden globální setTimeout/setInterval
- Když je 5 toastů, všechny se čekají navzájem

**Řešení:**
1. Každý toast má svůj setTimeout
2. Čistit timeout když se toast removes
3. useCallback na close handler
4. Zajistit že cleanup běží (useEffect cleanup)

**Soubory k úpravě:**
- `components/ToastProvider.tsx` - per-toast setTimeout, cleanup

**Měření:**
- DevTools: počet timer instances
- Performance: microseconds na toast dismiss

---

## ✅ Postup

1. **Vyberte Task** (která se chcete dělat jako první)
2. **Já vytvořím detailní plán** s konkrétním kódem
3. **Změním kód** s jasným před/po
4. **Změříme** DevTools Profiler PŘED a PO
5. **Commit** když je vše ok

---

## ⚠️ Pravidla

- ✅ Žádné API changes
- ✅ Žádné style changes
- ✅ Testujeme na application flow (Pending → Approved → Paid)
- ❌ Neměníme business logic
- ❌ Neměníme data struktur (bez schválení)

---

## 📝 Kdy se zastavit

Zastavuji se a ptám se vás když:
- Měním víc než 50 řádků v jednom souboru
- Měním dependency arrays (hrozí infinite loops)
- Měním effect logiku
- Něco selhá v build/test

---

**Připraven k zahájení?** Řekněte, kterým Task chcete začít: #1, #2, #3 nebo #4
