import React from 'react';
import { FileText, Clock, AlertCircle } from 'lucide-react';
import { AppStatus, Application, MarketEvent } from '../types';
import { useInvoices, useAllEventPlanPrices } from '../hooks/useSupabase';

interface MyApplicationsProps {
    applications: Application[];
    events: MarketEvent[];
}

const MyApplicationsInner: React.FC<MyApplicationsProps> = ({ applications, events }) => {
    const { data: allInvoices } = useInvoices();
    const { planPrices } = useAllEventPlanPrices();

    const pricesByEventId = React.useMemo(() => {
        const map = new Map<string, Record<string, string>>();
        for (const p of planPrices) {
            map.set(p.event_id, p.prices);
        }
        return map;
    }, [planPrices]);

    const invoiceNumberByAppId = React.useMemo(() => {
        const map = new Map<string, string>();
        for (const inv of allInvoices) {
            map.set(inv.applicationId, inv.invoiceNumber);
        }
        return map;
    }, [allInvoices]);

    const getEventTitle = (eventId: string) => events.find(e => e.id === eventId)?.title || 'Neznámý event';
    const getEventDate = (eventId: string) => {
        const event = events.find(e => e.id === eventId);
        return event?.date ? new Date(event.date).toLocaleDateString('cs-CZ') : '';
    };
    const getStatusStyle = (status: AppStatus) => {
        switch (status) {
            case AppStatus.APPROVED:
            case AppStatus.PAYMENT_REMINDER:
            case AppStatus.PAYMENT_LAST_CALL:
                return 'bg-green-50 text-green-700 border-green-100';
            case AppStatus.PENDING:
                return 'bg-orange-50 text-orange-700 border-orange-100';
            case AppStatus.REJECTED:
                return 'bg-red-50 text-red-700 border-red-100';
            case AppStatus.WAITLIST:
                return 'bg-blue-50 text-blue-700 border-blue-100';
            case AppStatus.PAID:
                return 'bg-green-100 text-green-800 border-green-200';
            case AppStatus.EXPIRED:
                return 'bg-gray-100 text-gray-500 border-gray-200';
            case AppStatus.PAYMENT_UNDER_REVIEW:
                return 'bg-blue-50 text-blue-700 border-blue-100';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString('cs-CZ');
    const getDaysLeft = (iso: string) => {
        const diffMs = new Date(iso).getTime() - Date.now();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    };

    // Filter applications according to user guidelines:
    // "only those that are approved (přijaté), rejected (zamítnuté), or waiting list (waitlist)"
    // We also include PENDING because users need to see their active submissions.
    // PAID, EXPIRED, or deleted (no longer in DB) should not be in this specific view.
    // Show all applications to the user so they have a full history
    const visibleApplications = applications;

    return (
        <div className="space-y-6 md:space-y-8 pt-4 md:pt-0 animate-fadeIn">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl md:text-4xl font-bold text-lavrs-dark mb-1 md:mb-2">Moje Přihlášky</h1>
                    <p className="text-sm md:text-base text-gray-500">Správa a historie vašich registrací na eventy.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {visibleApplications.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-100 p-20 text-center space-y-4">
                        <FileText className="w-16 h-16 text-gray-200 mx-auto" />
                        <h3 className="text-xl font-bold text-lavrs-dark">Zatím žádné přihlášky</h3>
                        <p className="text-gray-400 max-w-sm mx-auto">Zde se objeví vaše přihlášky na eventy po jejich odeslání.</p>
                    </div>
                ) : visibleApplications.map((app) => {
                    const daysLeft = app.paymentDeadline ? getDaysLeft(app.paymentDeadline) : null;
                    return (
                        <div key={app.id} className="bg-white p-4 md:p-6 rounded-none border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden border-r-4 border-r-lavrs-red md:border-r md:border-r-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 md:gap-6 min-w-0 flex-1">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-lavrs-beige rounded-none flex items-center justify-center text-lavrs-red group-hover:scale-110 transition-transform shrink-0">
                                        <FileText size={20} className="md:hidden" />
                                        <FileText size={24} className="hidden md:block" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 md:gap-3 mb-1 flex-wrap">
                                            <h3 className="font-bold text-lavrs-dark text-sm md:text-base">{app.brandName}</h3>
                                            <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-none border ${getStatusStyle(app.status)}`}>
                                                {app.status === AppStatus.APPROVED || app.status === AppStatus.PAYMENT_REMINDER || app.status === AppStatus.PAYMENT_LAST_CALL ? 'Schváleno' :
                                                    app.status === AppStatus.PENDING ? 'Čeká na posouzení' :
                                                        app.status === AppStatus.REJECTED ? 'Zamítnuto' :
                                                            app.status === AppStatus.WAITLIST ? 'Na waitlistu' :
                                                                app.status === AppStatus.PAID ? 'Zaplaceno' :
                                                                    app.status === AppStatus.PAYMENT_UNDER_REVIEW ? 'Platba se zpracovává' :
                                                                        app.status === AppStatus.EXPIRED ? 'Exspirováno' : 'Neznámý stav'}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 md:gap-4 text-xs text-gray-400">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(app.submittedAt).toLocaleDateString('cs-CZ')}</span>
                                            <span className="font-medium text-gray-500">{getEventTitle(app.eventId)} · {getEventDate(app.eventId)}</span>
                                            <span className="hidden md:inline font-medium text-gray-500">ID: {invoiceNumberByAppId.get(app.id) || app.id}</span>
                                        </div>
                                        {app.status === AppStatus.APPROVED && app.paymentDeadline && (
                                            <div className="mt-2 text-xs text-lavrs-dark">
                                                <span className="font-bold">Splatnost faktury:</span> {formatDate(app.paymentDeadline)}
                                                {' '}
                                                {daysLeft !== null && daysLeft >= 0 ? (
                                                    <span className="text-gray-500">(zbývá {daysLeft} dní)</span>
                                                ) : (
                                                    <span className="text-red-600 font-bold">Po splatnosti</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="shrink-0 ml-3 text-right">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Cena</p>
                                    {(() => {
                                        if (app.customPrice != null && app.customPrice > 0) {
                                            return <p className="font-bold text-lavrs-dark text-sm md:text-base">{app.customPrice.toLocaleString('cs-CZ')} Kč</p>;
                                        }
                                        const rawPrice = app.zoneCategory ? pricesByEventId.get(app.eventId)?.[app.zoneCategory] : undefined;
                                        if (rawPrice != null && rawPrice !== '') {
                                            const num = Number(rawPrice);
                                            if (!isNaN(num)) {
                                                return <p className="font-bold text-lavrs-dark text-sm md:text-base">{num.toLocaleString('cs-CZ')} Kč</p>;
                                            }
                                            return (
                                                <>
                                                    <p className="font-bold text-lavrs-dark text-sm md:text-base">Dohodou</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">Částku upřesníme ve schválovacím řízení</p>
                                                </>
                                            );
                                        }
                                        return <p className="font-bold text-lavrs-dark text-sm md:text-base">—</p>;
                                    })()}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-blue-50/50 p-6 rounded-none border border-blue-100 flex gap-4">
                <AlertCircle className="text-blue-500 shrink-0" size={24} />
                <div className="text-sm">
                    <p className="text-blue-900 font-bold mb-1">Potřebujete změnit údaje v přihlášce?</p>
                    <p className="text-blue-700 font-medium">Změny v již odeslaných přihláškách řešíme individuálně. Napište nám na <span className="underline cursor-pointer">hello@lavrs.cz</span>.</p>
                </div>
            </div>
        </div>
    );
};

// Memoize to prevent unnecessary re-renders when parent updates
const MyApplications = React.memo(MyApplicationsInner);

export default MyApplications;
