import React from 'react';
import { DollarSign, Search, Download, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { AppStatus, Application, MarketEvent, Invoice } from '../types';

interface PaymentsAndInvoicingProps {
    applications: Application[];
    events: MarketEvent[];
    planPrices: Array<{ event_id: string; prices: Record<string, string> }>;
    invoices: Invoice[];
}

const PaymentsAndInvoicing: React.FC<PaymentsAndInvoicingProps> = ({ applications, events, planPrices, invoices }) => {
    const normalizeId = React.useCallback((value?: string | null) => (value || '').trim().toLowerCase(), []);

    const eventById = React.useMemo(() => {
        const map = new Map<string, MarketEvent>();
        events.forEach((event) => map.set(normalizeId(event.id), event));
        return map;
    }, [events, normalizeId]);

    const pricesByEventId = React.useMemo(() => {
        const map = new Map<string, Record<string, string>>();
        planPrices.forEach((p) => map.set(normalizeId(p.event_id), p.prices));
        return map;
    }, [planPrices, normalizeId]);

    const invoiceByAppId = React.useMemo(() => {
        const map = new Map<string, Invoice>();
        invoices.forEach((inv) => map.set(inv.applicationId, inv));
        return map;
    }, [invoices]);

    const formatEventDate = React.useCallback((dateStr?: string) => {
        if (!dateStr) return '';
        const trimmed = dateStr.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            const d = new Date(trimmed);
            if (!isNaN(d.getTime())) return d.toLocaleDateString('cs-CZ');
        }
        return trimmed;
    }, []);

    const getAmountForApp = React.useCallback((app: Application): string => {
        // Primary source: price from the event plan for the app's category
        const eventKey = normalizeId(app.eventId);
        const prices = pricesByEventId.get(eventKey);
        if (prices && app.zoneCategory) {
            const price = prices[app.zoneCategory];
            if (price) return price.includes('Kč') ? price : `${price} Kč`;
        }
        return '-';
    }, [pricesByEventId, normalizeId]);

    const parseAmountNumber = React.useCallback((amountStr: string): number => {
        if (amountStr === '-') return 0;
        const cleaned = amountStr.replace(/[^\d]/g, '');
        return parseInt(cleaned, 10) || 0;
    }, []);

    const payments = React.useMemo(() => {
        const eligibleApps = applications.filter((app) => {
            const normalized = (app.status || '').toString().toUpperCase();
            return [
                AppStatus.APPROVED,
                AppStatus.PAYMENT_REMINDER,
                AppStatus.PAYMENT_LAST_CALL,
                AppStatus.PAYMENT_UNDER_REVIEW,
                AppStatus.PAID,
                AppStatus.EXPIRED,
            ].includes(normalized as AppStatus);
        });

        return eligibleApps.map((app) => {
            const normalized = (app.status || '').toString().toUpperCase();
            const isPaid = normalized === AppStatus.PAID;
            const isOverdue = normalized === AppStatus.EXPIRED || (app.paymentDeadline ? new Date(app.paymentDeadline) < new Date() : false);
            const status = isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending';
            const event = eventById.get(normalizeId(app.eventId));
            const eventTitle = event?.title || '-';
            const eventDate = formatEventDate(event?.date);
            const amount = getAmountForApp(app);
            const invoice = invoiceByAppId.get(app.id);

            return {
                id: invoice?.invoiceNumber || '—',
                appId: app.id,
                brand: app.brandName,
                event: eventTitle,
                eventDate,
                amount,
                amountNumber: parseAmountNumber(amount),
                date: app.submittedAt,
                status,
                pdfUrl: invoice?.pdfUrl || null,
                invoiceNumber: invoice?.invoiceNumber || null,
                pdfStoragePath: invoice?.pdfStoragePath || null,
            };
        });
    }, [applications, eventById, normalizeId, formatEventDate, getAmountForApp, invoiceByAppId, parseAmountNumber]);

    const stats = React.useMemo(() => {
        let total = 0, paid = 0, pending = 0, overdue = 0;
        payments.forEach((p) => {
            total += p.amountNumber;
            if (p.status === 'paid') paid += p.amountNumber;
            else if (p.status === 'overdue') overdue += p.amountNumber;
            else pending += p.amountNumber;
        });
        const fmt = (n: number) => n > 0
            ? new Intl.NumberFormat('cs-CZ').format(n).replace(/\s/g, '.') + ' Kč'
            : '0 Kč';
        return {
            total: fmt(total),
            paid: fmt(paid),
            pending: fmt(pending),
            overdue: fmt(overdue),
        };
    }, [payments]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return { bg: 'bg-green-100', text: 'text-green-700', label: 'ZAPLACENO', icon: CheckCircle };
            case 'pending': return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'ČEKÁ NA PLATBU', icon: Clock };
            case 'overdue': return { bg: 'bg-red-100', text: 'text-red-700', label: 'PO SPLATNOSTI', icon: AlertCircle };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'NEZNÁMÝ', icon: Clock };
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex items-end justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-lavrs-dark">Platby & Fakturace</h2>
                    <p className="text-gray-500">Správa plateb a faktur od vystavovatelů.</p>
                </div>
                <button className="bg-lavrs-dark text-white px-8 py-4 rounded-none font-semibold hover:bg-lavrs-red transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                    <Download size={20} /> Exportovat vše
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'CELKOVÝ OBRAT', value: stats.total, color: 'text-green-600' },
                    { label: 'ZAPLACENO', value: stats.paid, color: 'text-green-600' },
                    { label: 'ČEKÁ NA PLATBU', value: stats.pending, color: 'text-amber-600' },
                    { label: 'PO SPLATNOSTI', value: stats.overdue, color: 'text-red-600' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-none border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h4 className={`text-2xl font-extrabold tracking-tight ${stat.color}`}>{stat.value}</h4>
                    </div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Hledat platbu, značku nebo fakturu..."
                        className="pl-12 pr-6 py-3 bg-gray-50 border-2 border-transparent rounded-none focus:outline-none focus:border-lavrs-red transition-all text-sm w-full"
                    />
                </div>
                <button className="px-6 py-3 bg-gray-50 text-gray-600 rounded-none font-semibold hover:bg-gray-100 transition-all flex items-center gap-2">
                    <Filter size={18} /> Filtrovat
                </button>
            </div>

            <div className="bg-white rounded-none border border-gray-100 shadow-sm overflow-x-auto">
                {payments.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-50 text-gray-200 flex items-center justify-center mx-auto">
                            <DollarSign size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-lavrs-dark">Žádné platby k zobrazení</h3>
                        <p className="text-gray-400 max-w-xs mx-auto">Zatím neproběhly žádné transakce od vystavovatelů.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left table-fixed" style={{ minWidth: '900px' }}>
                            <thead>
                                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-8 py-4 w-[14%]">ID platby</th>
                                    <th className="px-8 py-4 w-[18%]">Značka</th>
                                    <th className="px-8 py-4 w-[18%]">Event</th>
                                    <th className="px-8 py-4 w-[12%]">Částka</th>
                                    <th className="px-8 py-4 w-[14%]">Datum přihlášení</th>
                                    <th className="px-8 py-4 w-[14%]">Stav</th>
                                    <th className="px-8 py-4 w-[10%]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payments.map((payment) => {
                                    const statusInfo = getStatusStyle(payment.status);
                                    const StatusIcon = statusInfo.icon;
                                    return (
                                        <tr key={payment.id} className="group hover:bg-lavrs-beige/30 transition-colors">
                                            <td className="px-8 py-6 max-w-0">
                                                <span className="font-mono text-xs text-gray-500 truncate block">{payment.id}</span>
                                            </td>
                                            <td className="px-8 py-6 max-w-0">
                                                <span className="font-bold text-sm text-lavrs-dark truncate block">{payment.brand}</span>
                                            </td>
                                            <td className="px-8 py-6 max-w-0">
                                                <div>
                                                    <span className="text-sm text-gray-600 block truncate">{payment.event}</span>
                                                    {payment.eventDate && (
                                                        <span className="text-[11px] text-gray-400">{payment.eventDate}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="font-bold text-sm text-lavrs-dark">{payment.amount}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm text-gray-500">{new Date(payment.date).toLocaleDateString('cs-CZ')}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider ${statusInfo.bg} ${statusInfo.text} flex items-center gap-1 w-fit`}>
                                                    <StatusIcon size={12} />
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {payment.pdfUrl ? (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const res = await fetch(payment.pdfUrl!);
                                                                if (payment.pdfUrl!.endsWith('.pdf')) {
                                                                    const blob = await res.blob();
                                                                    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                                                                    window.open(url, '_blank');
                                                                } else {
                                                                    let html = await res.text();
                                                                    // Inject export bar if not present
                                                                    if (!html.includes('pdf-export-bar')) {
                                                                        const styles = `<style>.pdf-export-bar{text-align:center;padding:24px 0 32px}.pdf-export-btn{display:inline-flex;align-items:center;gap:8px;background:#D32F2F;color:#fff;border:none;padding:14px 40px;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:.5px;border-radius:4px}.pdf-export-btn:hover{background:#b71c1c}@media print{.pdf-export-bar{display:none!important}}</style>`;
                                                                        const exportBtn = `<div class="pdf-export-bar"><button class="pdf-export-btn" onclick="window.print()"><svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/></svg>Uložit jako PDF</button></div>`;
                                                                        html = html.replace('</body>', `${styles}${exportBtn}</body>`);
                                                                    }
                                                                    const blob = new Blob([html], { type: 'text/html' });
                                                                    const url = URL.createObjectURL(blob);
                                                                    window.open(url, '_blank');
                                                                }
                                                            } catch {
                                                                window.open(payment.pdfUrl!, '_blank');
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-1.5 text-lavrs-red text-xs font-bold hover:underline"
                                                    >
                                                        <Download size={14} />
                                                        Faktura
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentsAndInvoicing;
