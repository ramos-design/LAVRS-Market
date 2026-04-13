import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Mail,
  CheckCircle2,
  Plus,
  Minus,
  QrCode,
  Sparkles,
  Loader,
  AlertCircle,
  CheckCircle,
  Download,
  FileText
} from 'lucide-react';

import { BrandProfile, MarketEvent, Application, Category, ExtraItem, AppStatus, CompanySettings, EventPlan } from '../types';
import { useEventPlan } from '../hooks/useSupabase';
import { formatEventDate, formatEventDateRange } from '../lib/mappers';
import HeartLoader from './HeartLoader';
import { fetchFromARES, isValidIcoFormat } from '../lib/aresAPI';
interface PaymentPageProps {
  onBack: () => void;
  initialBillingDetails?: Partial<BrandProfile>;
  onSaveBilling?: (details: Partial<BrandProfile>) => void;
  onUpdateStatus?: (id: string, status: AppStatus) => Promise<any>;
  activeEvent?: MarketEvent | null;
  activeApp?: Application | null;
  categories?: Category[];
  companySettings?: CompanySettings | null;
  allApplications?: Application[];
}

const PaymentPage: React.FC<PaymentPageProps> = ({
  onBack,
  initialBillingDetails,
  onSaveBilling,
  onUpdateStatus,
  activeEvent,
  activeApp,
  categories,
  companySettings,
  allApplications,
}) => {
  const [step, setStep] = useState(2);
  const [now, setNow] = React.useState(Date.now());
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());

  const { plan: eventPlan } = useEventPlan(activeEvent?.id || null);

  // Only run countdown timer if there's an active payment deadline
  const hasActiveCountdown = Boolean(activeApp?.paymentDeadline);

  React.useEffect(() => {
    if (!hasActiveCountdown) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasActiveCountdown]);

  const parsePrice = (priceStr: string) => {
    return parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
  };

  const formatPrice = (num: number) => {
    return new Intl.NumberFormat('cs-CZ').format(num) + ' Kč';
  };
  
  // Get pricing: use customPrice if set by curator, otherwise look up from category pricing
  const basePrice = activeApp?.customPrice != null && activeApp.customPrice > 0
    ? activeApp.customPrice
    : parsePrice(activeApp?.zoneCategory && eventPlan?.prices?.[activeApp.zoneCategory] ? eventPlan.prices[activeApp.zoneCategory] : '0 Kč');

  const selectedExtrasList = eventPlan?.extras?.filter(extra => selectedExtras.has(extra.id)) || [];
  const extrasTotal = selectedExtrasList.reduce((sum, extra) => sum + parsePrice(extra.price), 0);
  const totalBase = basePrice + extrasTotal;
  const totalDph = Math.round(totalBase * 0.21);
  const totalAmount = totalBase + totalDph;

  // Time remaining logic
  const getRemaining = (deadlineIso?: string) => {
    if (!deadlineIso) return null;
    const diffMs = new Date(deadlineIso).getTime() - now;
    if (diffMs <= 0) return { overdue: true, days: 0, hours: 0, minutes: 0 };
    
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    
    return { overdue: false, days, hours, minutes };
  };

  const remaining = getRemaining(activeApp?.paymentDeadline);

  // Billing Form State
  const [billingName, setBillingName] = useState(initialBillingDetails?.billingName || '');
  const [ic, setIc] = useState(initialBillingDetails?.ic || '');
  const [dic, setDic] = useState(initialBillingDetails?.dic || '');
  const [billingAddress, setBillingAddress] = useState(initialBillingDetails?.billingAddress || '');
  const [billingEmail, setBillingEmail] = useState(initialBillingDetails?.billingEmail || '');
  const [specialNote, setSpecialNote] = useState('');

  // DIČ validation error
  const [dicError, setDicError] = useState('');

  // IČO: allow only digits, max 8 characters
  const handleIcChange = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '').slice(0, 8);
    setIc(cleaned);
  };

  // DIČ: allow only letters and digits (no special chars)
  // Valid format: 2 uppercase letters (country code) + 8-10 digits
  const handleDicChange = (value: string) => {
    // Strip any character that isn't a letter or digit
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setDic(cleaned);

    // Validate format when user has typed something
    if (!cleaned) {
      setDicError('');
      return;
    }

    const letterPrefix = cleaned.match(/^[A-Z]*/)?.[0] || '';
    const rest = cleaned.slice(letterPrefix.length);

    if (letterPrefix.length > 2) {
      setDicError('DIČ začíná 2písmenným kódem země (např. CZ), následovaným číslicemi');
    } else if (letterPrefix.length === 2 && rest.length > 0 && !/^\d+$/.test(rest)) {
      setDicError('Po kódu země mohou následovat pouze číslice');
    } else if (letterPrefix.length === 1 && cleaned.length >= 3) {
      setDicError('Kód země musí být 2 písmena (např. CZ)');
    } else if (letterPrefix.length === 2 && rest.length > 0 && rest.length < 8) {
      setDicError('DIČ musí obsahovat 8–10 číslic za kódem země');
    } else if (rest.length > 10) {
      setDicError('DIČ může obsahovat maximálně 10 číslic za kódem země');
    } else {
      setDicError('');
    }
  };

  // ARES Lookup State
  const [aresLoading, setAresLoading] = useState(false);
  const [aresError, setAresError] = useState('');
  const [aresSuccess, setAresSuccess] = useState(false);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [confirmedPayment, setConfirmedPayment] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [generatedInvoiceNumber, setGeneratedInvoiceNumber] = useState('');
  const [invoiceQrDataUrl, setInvoiceQrDataUrl] = useState('');
  const [invoiceGenerating, setInvoiceGenerating] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [invoiceHtmlContent, setInvoiceHtmlContent] = useState('');
  const generatedInvoiceRef = React.useRef<any>(null);
  const invoiceIframeRef = React.useRef<HTMLIFrameElement>(null);

  // ARES Lookup with debounce
  React.useEffect(() => {
    if (!ic || !isValidIcoFormat(ic)) {
      setAresError('');
      setAresSuccess(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setAresLoading(true);
      setAresError('');
      setAresSuccess(false);

      try {
        const data = await fetchFromARES(ic);
        if (data) {
          // Auto-fill fields from ARES
          setBillingName(data.name);
          setBillingAddress(data.address);
          if (data.dic) {
            setDic(data.dic);
          }
          setAresSuccess(true);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Chyba při komunikaci s ARES';
        setAresError(errorMsg);
      } finally {
        setAresLoading(false);
      }
    }, 800); // Debounce 800ms

    return () => clearTimeout(timeout);
  }, [ic]);

  const toggleExtra = (id: string) => {
    const newSet = new Set(selectedExtras);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedExtras(newSet);
  };

  const handleNextStep = () => {
    if (step === 2 && onSaveBilling) {
      onSaveBilling({ billingName, ic, dic, billingAddress, billingEmail });
    }
    setStep(step + 1);
  };

  const isBillingValid = billingName && billingAddress && billingEmail;

  const getStepTitle = () => {
    switch (step) {
      case 2: return 'Fakturační údaje';
      case 3: return 'Způsob platby';
      default: return '';
    }
  };

  // Variable symbol = invoice number (from generated invoice data)
  const variableSymbol = generatedInvoiceNumber || '...';

  // Auto-generate invoice + QR when entering step 3
  // Use ref to prevent deadlock: state-based guards cause issues when useEffect cleanup
  // cancels a running generation (invoiceGenerating stays true forever)
  const generatingRef = React.useRef(false);

  const needsGeneration = step === 3 && !invoiceGenerated
    && !!eventPlan && !!activeEvent && !!companySettings && !!allApplications && !!activeApp;

  React.useEffect(() => {
    if (!needsGeneration || generatingRef.current) return;

    generatingRef.current = true;
    let cancelled = false;

    setInvoiceGenerating(true);
    setInvoiceError('');
    setPdfGenerating(false);
    setGeneratedPdfBlob(null);

    const generate = async () => {
      try {
        const appWithBillingData = {
          ...activeApp!,
          billingName: billingName || activeApp!.billingName,
          ic: ic || activeApp!.ic,
          dic: dic || activeApp!.dic,
          billingAddress: billingAddress || activeApp!.billingAddress,
          billingEmail: billingEmail || activeApp!.billingEmail,
        };

        // Phase 1: FAST — QR + numbers + XML (no PDF yet)
        const { prepareInvoiceData } = await import('../lib/invoice-generator');
        const result = await prepareInvoiceData({
          application: appWithBillingData,
          event: activeEvent!,
          eventPlan: eventPlan!,
          selectedExtraIds: Array.from(selectedExtras),
          companySettings: companySettings!,
          allApplications: allApplications!,
        });

        if (cancelled) return;

        generatedInvoiceRef.current = result;
        setGeneratedInvoiceNumber(result.invoiceNumber);
        setInvoiceQrDataUrl(result.qrDataUrl);
        setInvoiceGenerated(true);
        setInvoiceGenerating(false);

        // PDF is now generated on-demand via HTML print dialog (no background generation needed)
        if (!cancelled) setPdfGenerating(false);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Invoice preparation failed:', err);
        setInvoiceError(err.message || 'Chyba při generování objednávky');
        setInvoiceGenerating(false);
      }
    };

    generate();

    return () => {
      cancelled = true;
      // Reset ref so generation can restart on next mount/render
      generatingRef.current = false;
    };
  }, [needsGeneration]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build invoice props for HTML-based download
  const getInvoiceHtmlProps = () => {
    if (!generatedInvoiceRef.current || !activeApp || !activeEvent || !companySettings) return null;
    const r = generatedInvoiceRef.current;
    const p = (r as any)._pdfParams;
    if (!p) return null;
    return {
      invoiceNumber: p.invoiceNumber,
      sequenceNumber: p.sequenceNumber,
      issuedDate: p.issuedDate,
      taxPointDate: p.taxPointDate,
      dueDate: p.dueDate,
      variableSymbol: p.variableSymbol,
      issuerName: companySettings.companyName || 'LAVRS market',
      issuerAddress: companySettings.companyAddress || '',
      issuerIC: companySettings.ic || '',
      issuerDIC: companySettings.dic,
      issuerRegistration: companySettings.registrationInfo,
      issuerPhone: companySettings.phone,
      issuerEmail: companySettings.email,
      issuedBy: companySettings.issuedBy,
      bankAccount: p.bankAccount,
      bankIban: p.bankIban,
      customerName: billingName || activeApp.billingName || '',
      customerAddress: billingAddress || activeApp.billingAddress || '',
      customerIC: ic || activeApp.ic || '',
      customerDIC: dic || activeApp.dic,
      lineItems: p.lineItems,
      qrDataUrl: r.qrDataUrl,
      invoiceNote: companySettings.invoiceNote,
    };
  };

  const handleDownloadPdf = async () => {
    const props = getInvoiceHtmlProps();
    if (!props) return;
    const { downloadInvoiceAsPdf } = await import('../lib/invoice-html');
    downloadInvoiceAsPdf(props, `${generatedInvoiceNumber}.pdf`);
  };

  const generateInvoiceHtmlPreview = async () => {
    const props = getInvoiceHtmlProps();
    if (!props) return;
    const { generateInvoiceHtml } = await import('../lib/invoice-html');
    let html = generateInvoiceHtml(props);
    // Remove the built-in export bar — we have our own button outside the iframe
    html = html.replace(/<div class="pdf-export-bar">[\s\S]*?<\/div>\s*<\/body>/, '</body>');
    // Override screen styles: no gray bg/padding/shadow (embedded in page)
    html = html.replace(
      '@media screen {',
      '@media screen { body { background: #fff !important; padding: 0 !important; } .page { box-shadow: none !important; }'
    );
    setInvoiceHtmlContent(html);
  };

  const handlePrintInvoice = () => {
    const iframe = invoiceIframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="flex items-center gap-4">
        <button 
          onClick={step === 2 ? onBack : () => {
            if (step === 3 && confirmedPayment) {
              setConfirmedPayment(false);
            } else {
              setStep(step - 1);
            }
          }} 
          className="p-2 hover:bg-lavrs-pink rounded-none transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {getStepTitle()}
          </h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            KROK {step - 1} ZE 2
          </p>
        </div>
      </header>

      <div className={`grid gap-6 md:gap-12 items-start ${confirmedPayment && step === 3 ? 'grid-cols-1 max-w-3xl mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>

        {/* Left Panel: Summary — hidden after payment confirmed */}
        {!(confirmedPayment && step === 3) && (
        <div className="bg-white p-5 md:p-10 rounded-none border border-gray-100 shadow-sm space-y-6 md:space-y-8">
          <h3 className="text-lg md:text-xl font-bold">Rekapitulace</h3>

          <div className="space-y-6">
            <div className="flex justify-between pb-6 border-b border-gray-50">
              <div>
                <p className="font-semibold">{activeEvent?.title || 'Event'}</p>
                <p className="text-xs text-gray-400 font-medium">{activeEvent?.location || 'Místo'}</p>
              </div>
              <p className="font-bold">{activeEvent ? formatEventDateRange(activeEvent.date, activeEvent?.endDate) : ''}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">Místo ({activeApp?.zoneCategory || 'Zóna'})</span>
                <span className="font-bold">{formatPrice(basePrice)}</span>
              </div>
              
              {selectedExtrasList.map(extra => (
                <div key={extra.id} className="flex justify-between items-center animate-fadeIn">
                  <span className="text-gray-500 text-sm font-medium">{extra.label}</span>
                  <span className="font-bold">{extra.price}</span>
                </div>
              ))}

              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">Základní vybavení</span>
                <span className="text-green-600 text-xs font-bold uppercase">V CENĚ</span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <span className="text-gray-400 text-xs font-medium">Základ bez DPH</span>
                <span className="text-gray-500 text-sm">{formatPrice(totalBase)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs font-medium">DPH 21 %</span>
                <span className="text-gray-500 text-sm">{formatPrice(totalDph)}</span>
              </div>
            </div>

            <div className="pt-4 md:pt-6 border-t border-gray-100 flex justify-between items-center gap-2">
              <span className="text-base md:text-xl font-bold tracking-tight">Celkem k úhradě</span>
              <span className="text-2xl md:text-3xl font-extrabold text-lavrs-red tracking-tight">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center p-5 bg-lavrs-red rounded-none border border-black/5 shadow-inner">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Zbývající čas</span>
              <span className="text-xl font-bold text-white tracking-wider">
                {remaining ? (
                  remaining.overdue ? 'EXPIROVÁNO' : `${remaining.days}d : ${remaining.hours}h : ${remaining.minutes}m`
                ) : '—'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 text-center font-medium">Po vypršení limitu bude místo nabídnuto náhradníkům.</p>
          </div>
        </div>
        )}

        {/* Right Panel: Step Content */}
        <div className="space-y-8">
          
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-lavrs-beige/30 p-6 border-l-4 border-lavrs-dark">
                <p className="text-sm font-medium leading-relaxed">
                  Vyberte si doplňkové vybavení pro váš stánek. Tyto položky budou připočteny k vaší finální objednávce.
                </p>
              </div>
              
              <div className="space-y-3">
                {eventPlan?.extras.map(extra => {
                  const isSelected = selectedExtras.has(extra.id);
                  return (
                    <button
                      key={extra.id}
                      onClick={() => toggleExtra(extra.id)}
                      className={`w-full p-6 border-2 transition-all flex items-center justify-between group ${
                        isSelected ? 'border-lavrs-red bg-lavrs-red/5' : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 border-2 rounded-none flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-lavrs-red border-lavrs-red text-white' : 'border-gray-200 text-gray-300 group-hover:border-lavrs-red'
                        }`}>
                          {isSelected ? <Minus size={18} /> : <Plus size={18} />}
                        </div>
                        <div className="text-left">
                          <p className={`font-bold uppercase tracking-widest text-[11px] ${isSelected ? 'text-lavrs-red' : 'text-gray-500'}`}>
                            {extra.label}
                          </p>
                          <p className="font-black text-lg">{extra.price}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className={`transition-transform ${isSelected ? 'rotate-90 text-lavrs-red' : 'text-gray-200'}`} />
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full py-6 bg-lavrs-dark text-white rounded-none font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl hover:bg-lavrs-red hover:translate-y-[-2px]"
              >
                Pokračovat k údajům <ChevronRight size={20} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Fakturační jméno / Firma *</label>
                  <div className="relative">
                    <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input value={billingName} onChange={(e) => setBillingName(e.target.value)} type="text" placeholder="Např. Design Studio s.r.o." className="w-full bg-white pl-14 pr-6 py-5 rounded-none border-2 border-gray-100 focus:outline-none focus:border-lavrs-red font-semibold transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">IČ {aresLoading && <span className="text-lavrs-red">Vyhledávám v ARES...</span>}</label>
                    <div className="relative">
                      <input
                        value={ic}
                        onChange={(e) => handleIcChange(e.target.value)}
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        placeholder="12345678"
                        className={`w-full bg-white px-6 py-5 rounded-none border-2 focus:outline-none font-semibold transition-all ${
                          aresError ? 'border-red-400 focus:border-red-400' :
                          aresSuccess ? 'border-green-400 focus:border-green-400' :
                          'border-gray-100 focus:border-lavrs-red'
                        }`}
                      />
                      {aresLoading && (
                        <Loader size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-lavrs-red animate-spin" />
                      )}
                      {!aresLoading && aresSuccess && (
                        <CheckCircle size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-green-500" />
                      )}
                      {!aresLoading && aresError && (
                        <AlertCircle size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-red-500" />
                      )}
                    </div>
                    {aresError && (
                      <p className="text-xs text-red-500 ml-4 font-medium">{aresError}</p>
                    )}
                    {aresSuccess && (
                      <p className="text-xs text-green-600 ml-4 font-medium">✓ Data načtena z ARES</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">DIČ</label>
                    <div className="relative">
                      <input
                        value={dic}
                        onChange={(e) => handleDicChange(e.target.value)}
                        type="text"
                        maxLength={12}
                        placeholder="CZ12345678"
                        className={`w-full bg-white px-6 py-5 rounded-none border-2 focus:outline-none font-semibold transition-all ${
                          dicError ? 'border-red-400 focus:border-red-400' :
                          dic && !dicError ? 'border-gray-100 focus:border-lavrs-red' :
                          'border-gray-100 focus:border-lavrs-red'
                        }`}
                      />
                      {dic && !dicError && dic.length >= 10 && (
                        <CheckCircle size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-green-500" />
                      )}
                      {dicError && (
                        <AlertCircle size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-red-500" />
                      )}
                    </div>
                    {dicError && (
                      <p className="text-xs text-red-500 ml-4 font-medium">{dicError}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Adresa sídla *</label>
                  <div className="relative">
                    <MapPin className="absolute left-6 top-7 text-gray-300" size={18} />
                    <textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} rows={2} placeholder="Ulice, č.p., PSČ a město" className="w-full bg-white pl-14 pr-6 py-6 rounded-none border-2 border-gray-100 focus:outline-none focus:border-lavrs-red resize-none font-semibold transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">E-mail pro fakturaci *</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} type="email" placeholder="faktury@vase-studio.cz" className="w-full bg-white pl-14 pr-6 py-5 rounded-none border-2 border-gray-100 focus:outline-none focus:border-lavrs-red font-semibold transition-all" />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleNextStep}
                disabled={!isBillingValid}
                className={`w-full py-6 rounded-none font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl ${
                  isBillingValid ? 'bg-lavrs-dark text-white hover:bg-lavrs-red hover:translate-y-[-2px]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Potvrdit údaje <ChevronRight size={20} />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-fadeIn">
              {!confirmedPayment ? (
                <>
                  {/* Waiting for data (eventPlan, companySettings etc.) */}
                  {!invoiceGenerating && !invoiceGenerated && !invoiceError && (
                    <div className="bg-white border-2 border-gray-100 p-12 text-center space-y-4">
                      <HeartLoader size={40} className="text-lavrs-red mx-auto" />
                      <p className="font-bold text-lavrs-dark">Načítám data...</p>
                      <p className="text-xs text-gray-400">Připravuji podklady pro generování objednávky.</p>
                    </div>
                  )}

                  {/* Invoice generating state */}
                  {invoiceGenerating && (
                    <div className="bg-white border-2 border-gray-100 p-12 text-center space-y-4">
                      <HeartLoader size={40} className="text-lavrs-red mx-auto" />
                      <p className="font-bold text-lavrs-dark">Generuji objednávku a QR platbu...</p>
                      <p className="text-xs text-gray-400">Počkejte prosím, připravujeme vaši objednávku.</p>
                    </div>
                  )}

                  {/* Invoice error (Phase 1 or Phase 2 failed) */}
                  {invoiceError && (
                    <div className="bg-red-50 border-2 border-red-200 p-6 flex items-start gap-4">
                      <AlertCircle size={24} className="text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-red-700 mb-1">Chyba při generování objednávky</p>
                        <p className="text-sm text-red-600 mb-3">{invoiceError}</p>
                        <button
                          onClick={() => { setInvoiceError(''); setInvoiceGenerated(false); }}
                          className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                        >
                          Zkusit znovu
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Invoice generated — show QR + bank info + PDF download */}
                  {invoiceGenerated && (
                    <>
                      <div className="bg-white border-2 border-gray-100 p-5 md:p-8 space-y-6 md:space-y-8">
                        <div className="flex flex-col items-center gap-4 md:gap-6 text-center">
                          {invoiceQrDataUrl ? (
                            <img
                              src={invoiceQrDataUrl}
                              alt="QR platba"
                              className="w-36 h-36 md:w-48 md:h-48 border border-gray-200"
                            />
                          ) : (
                            <div className="w-36 h-36 md:w-48 md:h-48 bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                              <QrCode size={60} className="text-gray-300" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2">Platba převodem</h3>
                            <p className="text-sm text-gray-400 font-medium">Naskenujte QR kód ve své bankovní aplikaci.</p>
                          </div>
                        </div>

                        <div className="space-y-3 md:space-y-4 pt-6 md:pt-8 border-t border-gray-100">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-1">
                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Číslo účtu</span>
                            <span className="font-black tracking-wider text-sm break-all">{companySettings?.bankAccount || '—'}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-1">
                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">IBAN</span>
                            <span className="font-bold tracking-wider text-xs break-all">{companySettings?.bankIban || '—'}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-1">
                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Variabilní symbol</span>
                            <span className="font-black text-lavrs-red tracking-wider">{variableSymbol}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-1">
                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Částka (vč. DPH)</span>
                            <span className="font-black tracking-wider">{formatPrice(totalAmount)}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-1">
                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Zpráva pro příjemce</span>
                            <span className="font-medium text-xs text-gray-600 sm:text-right sm:max-w-[200px]">
                              {activeEvent?.title || 'LAVRS market'}{' '}
                              {activeEvent ? formatEventDateRange(activeEvent.date, activeEvent.endDate) : ''}{' '}
                              {activeApp?.zoneCategory || ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 p-6 bg-lavrs-beige/20 border border-lavrs-pink/50">
                        <CheckCircle2 size={24} className="text-green-500 shrink-0" />
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                          Po potvrzení obdržíte objednávku – výzvu k platbě. Proveďte platbu převodem dle uvedených údajů.
                        </p>
                      </div>

                      <button
                        disabled={isUpdatingStatus}
                        onClick={async () => {
                          if (!activeApp || !onUpdateStatus || !activeEvent) return;
                          if (!generatedInvoiceRef.current) {
                            alert('❌ Objednávka nebyla vygenerována. Zkuste obnovit stránku.');
                            return;
                          }

                          setIsUpdatingStatus(true);
                          try {
                            // Save billing details to brand profile + application
                            if (onSaveBilling) {
                              onSaveBilling({ billingName, ic, dic, billingAddress, billingEmail });
                            }

                            const invoiceResult = generatedInvoiceRef.current;

                            // 1. SAVE INVOICE TO DB FIRST (even without PDF)
                            //    This ensures the invoice record exists regardless of PDF success.
                            const { saveInvoice, updateInvoiceFiles } = await import('../lib/invoice-storage');
                            const savedInvoice = await saveInvoice({
                              result: invoiceResult,
                              applicationId: activeApp.id,
                              eventId: activeEvent.id,
                            });
                            console.log('[Invoice] DB record saved:', savedInvoice.invoice_number);

                            // 2. Generate PDF (non-blocking for DB — if it fails, invoice record still exists)
                            let pdfBlob: Blob | null = null;
                            try {
                              const { generateInvoicePdf } = await import('../lib/invoice-generator');
                              pdfBlob = await generateInvoicePdf(invoiceResult);
                              console.log('[Invoice] Real PDF generated:', pdfBlob.size, 'bytes');
                              invoiceResult.pdfBlob = pdfBlob;

                              // Upload PDF + XML and update invoice record with file URLs
                              await updateInvoiceFiles({
                                invoiceId: savedInvoice.id,
                                invoiceNumber: invoiceResult.invoiceNumber,
                                applicationId: activeApp.id,
                                pdfBlob,
                                xmlString: invoiceResult.xmlString,
                              });
                              console.log('[Invoice] Files uploaded and DB updated');
                            } catch (pdfErr) {
                              console.warn('[Invoice] PDF generation/upload failed (invoice DB record still saved):', pdfErr);
                            }

                            // 3. Fire-and-forget: send invoice notification email
                            if (pdfBlob && pdfBlob.size > 0) {
                              (async () => {
                                try {
                                  const ab = await pdfBlob!.arrayBuffer();
                                  const bytes = new Uint8Array(ab);
                                  let pdfBase64 = '';
                                  const chunk = 0x8000;
                                  for (let i = 0; i < bytes.length; i += chunk) {
                                    pdfBase64 += String.fromCharCode(...bytes.subarray(i, i + chunk));
                                  }
                                  pdfBase64 = btoa(pdfBase64);

                                  const evDate = new Date(activeEvent.date);
                                  const dd = String(evDate.getDate()).padStart(2, '0');
                                  const mm = String(evDate.getMonth() + 1).padStart(2, '0');
                                  const yyyy = evDate.getFullYear();

                                  const { supabase } = await import('../lib/supabase');
                                  const invoiceBody = {
                                      brandName: activeApp.brandName || '',
                                      contactPerson: activeApp.contactPerson || '',
                                      eventName: activeEvent.title || '',
                                      eventDate: `${dd}.${mm}.${yyyy}`,
                                      zoneCategory: activeApp.zoneCategory || '',
                                      invoiceNumber: invoiceResult.invoiceNumber,
                                      totalAmountCzk: (invoiceResult.totalAmountWithDph / 100).toLocaleString('cs-CZ'),
                                      pdfBase64,
                                      xmlString: invoiceResult.xmlString,
                                  };

                                  const { error: fnError } = await supabase.functions.invoke('send-invoice-notification', {
                                    body: { ...invoiceBody, recipientEmail: 'lavrs@lavrs.cz', recipientType: 'admin' },
                                  });
                                  if (fnError) console.error('[Order email] Admin notification error:', fnError);
                                  else console.log('[Order email] Notification sent to lavrs@lavrs.cz');

                                  const exhibitorEmail = billingEmail || activeApp?.billingEmail || activeApp?.email || '';
                                  if (exhibitorEmail) {
                                    // Exhibitor gets only PDF (no ISDOC XML) — this is an order, not an invoice
                                    const { xmlString: _omit, ...exhibitorBody } = invoiceBody;
                                    const { error: exError } = await supabase.functions.invoke('send-invoice-notification', {
                                      body: { ...exhibitorBody, recipientEmail: exhibitorEmail, recipientType: 'exhibitor' },
                                    });
                                    if (exError) console.error('[Order email] Exhibitor notification error:', exError);
                                    else console.log('[Order email] Order sent to exhibitor:', exhibitorEmail);
                                  }
                                } catch (emailErr) {
                                  console.error('[Invoice email] Failed (non-blocking):', emailErr);
                                }
                              })();
                            }

                            // 4. Update status
                            await onUpdateStatus(activeApp.id, AppStatus.PAYMENT_UNDER_REVIEW);

                            // 5. Generate invoice HTML preview
                            await generateInvoiceHtmlPreview();

                            setConfirmedPayment(true);
                          } catch (err: any) {
                            console.error('Error saving invoice:', err);
                            alert(`❌ Chyba: ${err.message || err.details || JSON.stringify(err)}`);
                          } finally {
                            setIsUpdatingStatus(false);
                          }
                        }}
                        className="w-full py-6 bg-lavrs-dark text-white rounded-none transition-all hover:bg-lavrs-red shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-1"
                      >
                        {isUpdatingStatus ? (
                          <div className="flex items-center justify-center gap-3">
                            <HeartLoader size={20} className="text-white" />
                            <span className="font-black uppercase tracking-[0.2em]">Odesílám...</span>
                          </div>
                        ) : (
                          <>
                            <span className="font-black uppercase tracking-[0.2em] text-base">Potvrdit</span>
                            <span className="flex items-center gap-2 text-white/80 text-xs font-medium">
                              <Download size={14} /> Stáhnout objednávku
                            </span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-8 animate-fadeIn">
                  <div className="bg-white border-2 border-gray-100 p-5 md:p-8 text-center space-y-4 md:space-y-6">
                    <div className="flex flex-col sm:flex-row items-center sm:justify-center gap-3 md:gap-4">
                      <div className="w-14 h-14 md:w-16 md:h-16 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle2 size={32} className="text-green-500" />
                      </div>
                      <div className="text-center sm:text-left">
                        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">Děkujeme za vaši objednávku!</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Proveďte platbu dle údajů na objednávce. Po připsání platby vám potvrdíme rezervaci místa na e-mail.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Inline invoice HTML preview */}
                  {invoiceHtmlContent && (
                    <div className="border-2 border-gray-200 bg-white shadow-sm">
                      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
                        <FileText size={16} className="text-gray-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Náhled objednávky</span>
                      </div>
                      <iframe
                        ref={invoiceIframeRef}
                        srcDoc={invoiceHtmlContent}
                        className="w-full border-0"
                        style={{ height: '800px' }}
                        title="Objednávka"
                      />
                    </div>
                  )}

                  {/* Save as PDF button */}
                  <button
                    onClick={handlePrintInvoice}
                    className="w-full py-5 bg-lavrs-red text-white rounded-none font-black uppercase tracking-[0.2em] transition-all hover:bg-red-700 shadow-lg flex items-center justify-center gap-3"
                  >
                    <Download size={20} /> Uložit jako PDF
                  </button>

                  <button
                    onClick={onBack}
                    className="w-full py-6 bg-green-600 text-white rounded-none font-black uppercase tracking-[0.2em] transition-all hover:bg-green-700 shadow-xl flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={20} /> Zpět na přehled
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
