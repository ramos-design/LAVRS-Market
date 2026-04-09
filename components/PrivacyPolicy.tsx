
import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
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
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-lavrs-dark uppercase">
              Zásady ochrany osobních údajů
            </h2>
            <p className="text-gray-400 text-xs font-bold mt-1">LAVRS market &middot; rezervace.lavrsmarket.cz &middot; Platné od: 10. 4. 2026 | Verze 1.1</p>
          </div>
        </div>
      </header>

      <div className="bg-white border border-gray-100 shadow-sm divide-y divide-gray-100">

        {/* 1. Správce */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">1. Správce osobních údajů</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Správcem osobních údajů zpracovávaných prostřednictvím platformy rezervace.lavrsmarket.cz (dále jen „Platforma") je:
          </p>
          <div className="bg-lavrs-beige/50 p-4 text-sm text-gray-700 space-y-1">
            <p className="font-bold">We make brand s.r.o.</p>
            <p>IČO: 09852093</p>
            <p>DIČ: CZ09852093</p>
            <p>Sídlo: Velké Kunratické 1307/16</p>
            <p>E-mail: <a href="mailto:petra@lavrs.cz" className="text-lavrs-red hover:underline">petra@lavrs.cz</a></p>
            <p>Telefon: +420 775 594 971</p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            Správce není povinen jmenovat pověřence pro ochranu osobních údajů (DPO). V případě dotazů nebo uplatnění práv se obracejte na výše uvedený e-mail.
          </p>
        </section>

        {/* 2. Jaké osobní údaje */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">2. Jaké osobní údaje zpracováváme a proč</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Zpracováváme pouze osobní údaje nezbytné pro provoz Platformy a organizaci akcí LAVRS market (dále jen „Akce").
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-gray-200">
              <thead>
                <tr className="bg-lavrs-beige/50">
                  <th className="text-left p-3 font-black text-lavrs-dark uppercase tracking-wider">Účel zpracování</th>
                  <th className="text-left p-3 font-black text-lavrs-dark uppercase tracking-wider">Kategorie údajů</th>
                  <th className="text-left p-3 font-black text-lavrs-dark uppercase tracking-wider">Právní základ</th>
                  <th className="text-left p-3 font-black text-lavrs-dark uppercase tracking-wider">Doba uchovávání</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-3 text-gray-700">Registrace účtu a správa přístupu</td>
                  <td className="p-3 text-gray-600">Jméno, e-mail, heslo (hash)</td>
                  <td className="p-3 text-gray-600">Plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR)</td>
                  <td className="p-3 text-gray-600">Po dobu existence účtu + 3 roky</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700">Zpracování přihlášky na Akci</td>
                  <td className="p-3 text-gray-600">Jméno, e-mail, telefon, název značky, sociální sítě, fotografie produktů</td>
                  <td className="p-3 text-gray-600">Plnění smlouvy</td>
                  <td className="p-3 text-gray-600">3 roky od poslední účasti</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700">Prezentace a propagace Akce</td>
                  <td className="p-3 text-gray-600">Název značky, fotografie produktů, veřejné profily</td>
                  <td className="p-3 text-gray-600">Plnění smlouvy a oprávněný zájem</td>
                  <td className="p-3 text-gray-600">Po dobu trvání Akce a následné prezentace</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700">Fakturace a správa plateb</td>
                  <td className="p-3 text-gray-600">Obchodní jméno, IČO, DIČ, adresa, bankovní spojení</td>
                  <td className="p-3 text-gray-600">Právní povinnost</td>
                  <td className="p-3 text-gray-600">10 let</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700">Organizační komunikace</td>
                  <td className="p-3 text-gray-600">E-mail, telefon</td>
                  <td className="p-3 text-gray-600">Plnění smlouvy</td>
                  <td className="p-3 text-gray-600">Po dobu smluvního vztahu</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700">Marketing (newsletter)</td>
                  <td className="p-3 text-gray-600">E-mail, jméno</td>
                  <td className="p-3 text-gray-600">Souhlas</td>
                  <td className="p-3 text-gray-600">Do odvolání</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700">Bezpečnost a provoz Platformy</td>
                  <td className="p-3 text-gray-600">IP adresa, logy, technické cookies</td>
                  <td className="p-3 text-gray-600">Oprávněný zájem</td>
                  <td className="p-3 text-gray-600">12 měsíců</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mt-4">
            Poskytnutí osobních údajů je smluvním požadavkem. Bez jejich poskytnutí není možné vytvořit účet ani podat přihlášku na Akci.
          </p>
        </section>

        {/* 3. Cookies */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">3. Cookies a technologie sledování</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong>3.1</strong> Cookies jsou malé textové soubory ukládané ve Vašem zařízení.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3"><strong>3.2 Typy cookies:</strong></p>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-xs border border-gray-200">
              <thead>
                <tr className="bg-lavrs-beige/50">
                  <th className="text-left p-3 font-black text-lavrs-dark uppercase tracking-wider">Typ</th>
                  <th className="text-left p-3 font-black text-lavrs-dark uppercase tracking-wider">Účel</th>
                  <th className="text-left p-3 font-black text-lavrs-dark uppercase tracking-wider">Režim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-3 text-gray-700 font-medium">Nezbytné</td>
                  <td className="p-3 text-gray-600">Fungování Platformy (login, bezpečnost)</td>
                  <td className="p-3 text-gray-600">Nevyžadují souhlas</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700 font-medium">Funkční</td>
                  <td className="p-3 text-gray-600">Uživatelské preference</td>
                  <td className="p-3 text-gray-600">Souhlas</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700 font-medium">Analytické</td>
                  <td className="p-3 text-gray-600">Statistika návštěvnosti</td>
                  <td className="p-3 text-gray-600">Souhlas</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">
            Nepovinné cookies aktivujeme pouze na základě Vašeho souhlasu prostřednictvím cookie lišty.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong>3.3</strong> Souhlas můžete kdykoliv změnit nebo odvolat v nastavení cookies nebo ve Vašem prohlížeči.
          </p>
        </section>

        {/* 4. Příjemci */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">4. Příjemci a zpracovatelé</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Osobní údaje nepředáváme třetím stranám pro jejich marketing.
          </p>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-xs border border-gray-200">
              <thead>
                <tr className="bg-lavrs-beige/50">
                  <th className="text-left p-3 font-black text-lavrs-dark uppercase tracking-wider">Příjemce</th>
                  <th className="text-left p-3 font-black text-lavrs-dark uppercase tracking-wider">Účel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-3 text-gray-700">Supabase, Inc. (USA)</td>
                  <td className="p-3 text-gray-600">Hosting a databáze</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700">Poskytovatel e-mailových služeb</td>
                  <td className="p-3 text-gray-600">Transakční komunikace</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700">Účetní / daňový poradce</td>
                  <td className="p-3 text-gray-600">Účetnictví</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700">Orgány veřejné moci</td>
                  <td className="p-3 text-gray-600">Zákonné povinnosti</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Předávání do třetích zemí probíhá na základě standardních smluvních doložek (SCC). Přesto mohou existovat rizika spojená s právním prostředím těchto zemí.
          </p>
        </section>

        {/* 5. Marketing */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">5. Marketingová komunikace</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Pokud jste naším zákazníkem, můžeme Vám zasílat informace o podobných akcích bez Vašeho souhlasu v souladu s §7 odst. 3 zákona č. 480/2004 Sb. Vždy máte možnost se jednoduše odhlásit.
          </p>
        </section>

        {/* 6. Vaše práva */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">6. Vaše práva</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">Máte právo:</p>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-1 list-disc list-inside ml-2">
            <li>na přístup k údajům</li>
            <li>na opravu</li>
            <li>na výmaz</li>
            <li>na omezení zpracování</li>
            <li>na přenositelnost</li>
            <li>vznést námitku</li>
            <li>odvolat souhlas</li>
            <li>podat stížnost u ÚOOÚ</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            Žádosti zasílejte na: <a href="mailto:petra@lavrs.cz" className="text-lavrs-red hover:underline font-bold">petra@lavrs.cz</a>. Vyřídíme je do 1 měsíce.
          </p>
        </section>

        {/* 7. Zabezpečení */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">7. Zabezpečení</h3>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-1 list-disc list-inside ml-2">
            <li>HTTPS šifrování</li>
            <li>hashování hesel (bcrypt / argon2)</li>
            <li>omezený přístup k datům</li>
            <li>pravidelné zálohy</li>
            <li>monitoring přístupů</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            V případě incidentu Vás budeme informovat dle GDPR.
          </p>
        </section>

        {/* 8. Automatizované rozhodování */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">8. Automatizované rozhodování</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Neprovádíme automatizované rozhodování. Výběr vystavovatelů probíhá manuálně na základě kurátorských kritérií.
          </p>
        </section>

        {/* 9. Změny zásad */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">9. Změny zásad</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Zásady můžeme aktualizovat. O zásadních změnách Vás informujeme minimálně 14 dní předem.
          </p>
        </section>

        {/* 10. Kontakt */}
        <section className="p-6 md:p-8">
          <h3 className="text-sm font-black text-lavrs-dark uppercase tracking-widest mb-4">10. Kontakt</h3>
          <div className="bg-lavrs-beige/50 p-4 text-sm text-gray-700 space-y-1">
            <p className="font-bold">We make brand s.r.o.</p>
            <p>E-mail: <a href="mailto:petra@lavrs.cz" className="text-lavrs-red hover:underline">petra@lavrs.cz</a></p>
            <p>Telefon: +420 775 594 971</p>
          </div>
          <p className="text-xs text-gray-400 mt-4">LAVRS market &middot; We make brand s.r.o. &middot; 10. 4. 2026</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
