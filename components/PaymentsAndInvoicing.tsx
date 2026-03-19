import React from 'react';
import { DollarSign, Search, Download, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { AppStatus, Application, MarketEvent } from '../types';

interface PaymentsAndInvoicingProps {
    applications: Application[];
    events: MarketEvent[];
}

const PaymentsAndInvoicing: React.FC<PaymentsAndInvoicingProps> = ({ applications, events }) => {
    const normalizeId = React.useCallback((value?: string | null) => (value || '').trim().toLowerCase(), []);

    const eventById = React.useMemo(() => {
        const map = new Map<string, MarketEvent>();
        events.forEach((event) => map.set(normalizeId(event.id), event));
        return map;
    }, [events, normalizeId]);

    const toEventDayMonth = React.useCallback((eventDate?: string) => {
        if (!eventDate) return '0000';
        const trimmed = eventDate.trim();

        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            const parsed = new Date(trimmed);
            if (!isNaN(parsed.getTime())) {
                return `${String(parsed.getDate()).padStart(2, '0')}${String(parsed.getMonth() + 1).padStart(2, '0')}`;
            }
        }

        const numeric = trimmed.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
        if (numeric) {
            return `${String(parseInt(numeric[1], 10)).padStart(2, '0')}${String(parseInt(numeric[2], 10)).padStart(2, '0')}`;
        }

        const range = trimmed.match(/(\d{1,2})\.\s*[–-]\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(\d{4})/);
        if (range) {
            return `${String(parseInt(range[1], 10)).padStart(2, '0')}${String(parseInt(range[3], 10)).padStart(2, '0')}`;
        }

        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
            return `${String(parsed.getDate()).padStart(2, '0')}${String(parsed.getMonth() + 1).padStart(2, '0')}`;
        }

        return '0000';
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

        const sequenceByAppId = new Map<string, number>();
        const groupedByEvent = new Map<string, Application[]>();

        eligibleApps.forEach((app) => {
            const eventKey = normalizeId(app.eventId) || 'unknown';
            const list = groupedByEvent.get(eventKey) || [];
            list.push(app);
            groupedByEvent.set(eventKey, list);
        });

        groupedByEvent.forEach((list) => {
            list
                .slice()
                .sort((a, b) => {
                    const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
                    const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
                    if (aTime !== bTime) return aTime - bTime;
                    return a.id.localeCompare(b.id);
                })
                .forEach((app, idx) => {
                    sequenceByAppId.set(app.id, idx + 1);
                });
        });

        return eligibleApps.map((app) => {
            const normalized = (app.status || '').toString().toUpperCase();
            const isPaid = normalized === AppStatus.PAID;
            const isOverdue = normalized === AppStatus.EXPIRED || (app.paymentDeadline ? new Date(app.paymentDeadline) < new Date() : false);
            const status = isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending';
            const event = eventById.get(normalizeId(app.eventId));
            const eventTitle = event?.title || '-';
            const dayMonth = toEventDayMonth(event?.date);
            const sequence = sequenceByAppId.get(app.id) || 1;

            return {
                id: `LVRSM${dayMonth}-${sequence}`,
                brand: app.brandName,
                event: eventTitle,
                amount: '-',
                date: app.submittedAt,
                status,
                invoice: '-',
            };
        });
    }, [applications, eventById, normalizeId, toEventDayMonth]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return { bg: 'bg-green-100', text: 'text-green-700', label: 'ZAPLACENO', icon: CheckCircle };
            case 'pending': return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'CEKA NA PLATBU', icon: Clock };
            case 'overdue': return { bg: 'bg-red-100', text: 'text-red-700', label: 'PO SPLATNOSTI', icon: AlertCircle };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'NEZNAMY', icon: Clock };
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex items-end justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-lavrs-dark">Platby & Fakturace</h2>
                    <p className="text-gray-500">Sprava plateb a faktur od vystavovatelu.</p>
                </div>
                <button className="bg-lavrs-dark text-white px-8 py-4 rounded-none font-semibold hover:bg-lavrs-red transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                    <Download size={20} /> Exportovat vse
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'CELKOVY OBRAT', value: '0 Kc', color: 'text-green-600' },
                    { label: 'ZAPLACENO', value: '0 Kc', color: 'text-green-600' },
                    { label: 'CEKA NA PLATBU', value: '0 Kc', color: 'text-amber-600' },
                    { label: 'PO SPLATNOSTI', value: '0 Kc', color: 'text-red-600' },
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
                        placeholder="Hledat platbu, znacku nebo fakturu..."
                        className="pl-12 pr-6 py-3 bg-gray-50 border-2 border-transparent rounded-none focus:outline-none focus:border-lavrs-red transition-all text-sm w-full"
                    />
                </div>
                <button className="px-6 py-3 bg-gray-50 text-gray-600 rounded-none font-semibold hover:bg-gray-100 transition-all flex items-center gap-2">
                    <Filter size={18} /> Filtrovat
                </button>
            </div>

            <div className="bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden">
                {payments.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-50 text-gray-200 flex items-center justify-center mx-auto">
                            <DollarSign size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-lavrs-dark">Zadne platby k zobrazeni</h3>
                        <p className="text-gray-400 max-w-xs mx-auto">Zatim neprobehly zadne transakce od vystavovatelu.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-8 py-4">ID Platby</th>
                                    <th className="px-8 py-4">Znacka</th>
                                    <th className="px-8 py-4">Event</th>
                                    <th className="px-8 py-4">Castka</th>
                                    <th className="px-8 py-4">Datum</th>
                                    <th className="px-8 py-4">Stav</th>
                                    <th className="px-8 py-4">Faktura</th>
                                    <th className="px-8 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payments.map((payment) => {
                                    const statusInfo = getStatusStyle(payment.status);
                                    const StatusIcon = statusInfo.icon;
                                    return (
                                        <tr key={payment.id} className="group hover:bg-lavrs-beige/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <span className="font-mono text-xs text-gray-500">{payment.id}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="font-bold text-sm text-lavrs-dark">{payment.brand}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm text-gray-600">{payment.event}</span>
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
                                            <td className="px-8 py-6">
                                                <span className="font-mono text-xs text-gray-500">{payment.invoice}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="text-lavrs-red text-xs font-bold hover:underline">
                                                    DETAIL
                                                </button>
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
