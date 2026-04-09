
import React, { useEffect, useRef } from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
  scrollToStorno?: boolean;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack, scrollToStorno }) => {
  const stornoRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (scrollToStorno && stornoRef.current) {
      setTimeout(() => {
        stornoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [scrollToStorno]);
  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <header>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-lavrs-red transition-colors mb-6 uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          Zpět
        </button>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-lavrs-beige flex items-center justify-center text-lavrs-red">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-lavrs-dark uppercase">
              Obchodní podmínky
            </h2>
            <p className="text-gray-400 text-xs font-bold mt-1">LAVRS market &middot; Platné od: 10. 4. 2026</p>
          </div>
        </div>
      </header>

      <div className="bg-white border border-gray-100 shadow-sm divide-y divide-gray-100">

        {/* 1. Úvodní ustanovení */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">1. Úvodní ustanovení</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Tyto obchodní podmínky upravují vztah mezi:
          </p>
          <div className="bg-lavrs-beige/50 p-4 text-sm text-gray-700 space-y-1 mb-3">
            <p className="font-bold">We make brand s.r.o.</p>
            <p>IČO: 09852093</p>
            <p>DIČ: CZ09852093</p>
            <p>Sídlo: Velké Kunratické 1307/16, 148 00 Praha 4</p>
            <p className="text-gray-500 italic">(dále jen „Organizátor")</p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">a</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            fyzickou nebo právnickou osobou (dále jen „Vystavovatel"), která se registruje na platformě rezervace.lavrsmarket.cz (dále jen „Platforma") a podává přihlášku na akci LAVRS market (dále jen „Akce").
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            Registrací a podáním přihlášky Vystavovatel potvrzuje, že se s těmito podmínkami seznámil a souhlasí s nimi.
          </p>
        </section>

        {/* 2. Registrace a účet */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">2. Registrace a účet</h3>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-2">
            <li><strong>2.1</strong> Vystavovatel je povinen uvádět pravdivé a aktuální údaje.</li>
            <li><strong>2.2</strong> Vystavovatel odpovídá za zabezpečení přístupových údajů ke svému účtu.</li>
            <li><strong>2.3</strong> Organizátor si vyhrazuje právo účet zrušit v případě porušení podmínek nebo neaktivity delší než 24 měsíců.</li>
          </ul>
        </section>

        {/* 3. Přihláška a kurátorský výběr */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">3. Přihláška a kurátorský výběr</h3>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-2">
            <li><strong>3.1</strong> Podání přihlášky nezakládá nárok na účast na Akci.</li>
            <li>
              <strong>3.2</strong> Výběr vystavovatelů probíhá na základě interních kurátorských kritérií, zejména:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-gray-500">
                <li>kvalita a originalita nabídky</li>
                <li>vizuální úroveň značky</li>
                <li>vhodnost pro koncept Akce</li>
                <li>zastoupení kategorií</li>
              </ul>
            </li>
            <li>
              <strong>3.3</strong> Organizátor může přihlášku: schválit, zamítnout, nebo zařadit na čekací listinu.
            </li>
            <li><strong>3.4</strong> Rozhodnutí Organizátora není právně nárokovatelné a nemusí být odůvodněno.</li>
          </ul>
        </section>

        {/* 4. Uzavření smlouvy a platba */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">4. Uzavření smlouvy a platba</h3>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-2">
            <li><strong>4.1</strong> Po schválení přihlášky je vystavovateli vystavena faktura.</li>
            <li><strong>4.2</strong> Splatnost činí zpravidla 7 dní, pokud není uvedeno jinak.</li>
            <li><strong>4.3</strong> Smlouva o účasti vzniká až připsáním platby na účet Organizátora.</li>
            <li><strong>4.4</strong> V případě neuhrazení faktury ve stanovené lhůtě rezervace zaniká bez nároku na místo.</li>
          </ul>
        </section>

        {/* 5. Cena */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">5. Cena</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Cena za účast se liší dle velikosti stánku a kategorie vystavovatele. Cena je vždy sdělena při přihlášce a potvrzena ve faktuře.
          </p>
        </section>

        {/* 6. Storno podmínky */}
        <section className="p-6 md:p-8" id="storno" ref={stornoRef}>
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">6. Storno podmínky</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Vystavovatel může účast zrušit e-mailem. Výše refundace:
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border border-gray-200">
              <thead>
                <tr className="bg-lavrs-beige/50">
                  <th className="text-left p-3 font-black text-lavrs-dark uppercase tracking-wider">Doba před Akcí</th>
                  <th className="text-left p-3 font-black text-lavrs-dark uppercase tracking-wider">Vrácení poplatku</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-3 text-gray-700">více než 20 dní</td>
                  <td className="p-3 text-green-600 font-bold">100 %</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700">10–20 dní</td>
                  <td className="p-3 text-amber-600 font-bold">50 %</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700">méně než 10 dní</td>
                  <td className="p-3 text-red-600 font-bold">0 %</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-2">
            <li><strong>6.1</strong> Pokud se vystavovatel nedostaví bez předchozího storna („no-show"), poplatek se nevrací.</li>
            <li><strong>6.2</strong> Pokud je přihláška zamítnuta po zaplacení, vrací se 100 % uhrazené částky.</li>
            <li><strong>6.3</strong> Refundace probíhá do 14 dnů od potvrzení storna.</li>
          </ul>
        </section>

        {/* 7. Zrušení nebo změna Akce */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">7. Zrušení nebo změna Akce</h3>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-2">
            <li><strong>7.1</strong> Organizátor si vyhrazuje právo změnit termín nebo podobu Akce, případně Akci zrušit z důvodu vyšší moci nebo organizačních důvodů.</li>
            <li>
              <strong>7.2</strong> V takovém případě má vystavovatel právo:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-gray-500">
                <li>na vrácení 100 % uhrazené ceny</li>
                <li>nebo na převod účasti na náhradní termín</li>
              </ul>
            </li>
            <li><strong>7.3</strong> Organizátor neodpovídá za další náklady vzniklé vystavovateli.</li>
          </ul>
        </section>

        {/* 8. Povinnosti vystavovatele */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">8. Povinnosti vystavovatele</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">Vystavovatel se zavazuje:</p>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-1 list-disc list-inside ml-2 mb-4">
            <li>dodržovat pokyny Organizátora</li>
            <li>prezentovat pouze schválený sortiment</li>
            <li>dodržovat právní předpisy</li>
            <li>zajistit, že prodávané zboží je legální a neporušuje práva třetích stran</li>
            <li>odpovídat za pravost prodávaného zboží a jeho původ</li>
            <li>neprodávat padělky ani zboží porušující ochranné známky</li>
            <li>být přítomen po celou dobu konání Akce</li>
            <li>připravit stánek včas před otevřením Akce dle pokynů Organizátora</li>
            <li>dodržet otevírací dobu Akce a neukončit prodej dříve bez souhlasu Organizátora</li>
            <li>udržovat stánek v odpovídající kvalitě</li>
            <li>nepoškozovat dobré jméno Akce</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">Bez předchozího souhlasu Organizátora nesmí vystavovatel:</p>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-1 list-disc list-inside ml-2">
            <li>přenechat stánek třetí osobě</li>
            <li>sdílet stánek s jinou značkou</li>
            <li>rozšiřovat přidělený prostor</li>
            <li>měnit sortiment oproti přihlášce</li>
          </ul>
        </section>

        {/* 9. Práva organizátora */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">9. Práva Organizátora</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">Organizátor si vyhrazuje právo:</p>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-1 list-disc list-inside ml-2">
            <li>upravit rozložení stánků</li>
            <li>změnit organizaci Akce</li>
            <li>upravit program</li>
            <li>vyloučit vystavovatele při porušení podmínek</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">bez nároku na vrácení poplatku.</p>
        </section>

        {/* 10. Odpovědnost */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">10. Odpovědnost</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">Organizátor neodpovídá za:</p>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-1 list-disc list-inside ml-2 mb-3">
            <li>prodejní výsledky</li>
            <li>chování návštěvníků</li>
            <li>ztrátu nebo poškození zboží</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed">
            Vystavovatel odpovídá za své vybavení a činnost. Celková odpovědnost Organizátora je omezena výší zaplaceného poplatku.
          </p>
        </section>

        {/* 11. Marketing a licence */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">11. Marketing a licence</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">Vystavovatel souhlasí s použitím:</p>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-1 list-disc list-inside ml-2 mb-3">
            <li>názvu značky</li>
            <li>loga</li>
            <li>fotografií produktů</li>
            <li>fotografií a videozáznamů z Akce</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed">
            pro marketing Organizátora. Licence je bezplatná a nevýhradní. Vystavovatel souhlasí s pořizováním fotografií a videozáznamů během Akce a jejich použitím pro marketing.
          </p>
        </section>

        {/* 12. Spotřebitel */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">12. Spotřebitel</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Vystavovatel bere na vědomí, že dle §1837 písm. j) občanského zákoníku nelze odstoupit od smlouvy.
          </p>
        </section>

        {/* 13. Řešení sporů */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">13. Řešení sporů</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Právní vztahy se řídí právním řádem ČR.
          </p>
        </section>

        {/* 14. Závěrečná ustanovení */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">14. Závěrečná ustanovení</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Organizátor si vyhrazuje právo podmínky aktualizovat.
          </p>
          <p className="text-xs text-gray-400 mt-4">LAVRS market &middot; We make brand s.r.o. &middot; 10. 4. 2026</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
