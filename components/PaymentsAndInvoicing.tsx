import React from 'react';
import { DollarSign, Search, Download, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const PaymentsAndInvoicing: React.FC = () => {
    const payments = [
        { id: 'PAY-001', brand: 'Vintage Soul', event: 'MINI LAVRS Market', amount: '4.200 Kč', status: 'paid', date: '2026-02-01', invoice: 'INV-2026-001' },
        { id: 'PAY-002', brand: 'Retro Vibes', event: 'MINI LAVRS Market', amount: '4.200 Kč', status: 'pending', date: '2026-02-03', invoice: 'INV-2026-002' },
        { id: 'PAY-003', brand: 'Urban Threads', event: 'LAVRS Market', amount: '8.400 Kč', status: 'overdue', date: '2026-01-28', invoice: 'INV-2026-003' },
        { id: 'PAY-004', brand: 'Eco Fashion Co.', event: 'MINI LAVRS Market', amount: '4.200 Kč', status: 'paid', date: '2026-02-02', invoice: 'INV-2026-004' },
        { id: 'PAY-005', brand: 'Second Life Style', event: 'LAVRS Market', amount: '8.400 Kč', status: 'pending', date: '2026-02-04', invoice: 'INV-2026-005' },
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Zaplaceno', icon: CheckCircle };
            case 'pending': return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Čeká na platbu', icon: Clock };
            case 'overdue': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Po splatnosti', icon: AlertCircle };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Neznámý', icon: Clock };
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex items-end justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-lavrs-dark">Platby & Fakturace</h2>
                    <p className="text-gray-500">Správa plateb a faktur od vystavovatelů.</p>
                </div>
                <button className="bg-lavrs-dark text-white px-8 py-4 rounded-none font-semibold hover:bg-lavrs-red transition-all flex items-center gap-2 shadow-lg active:scale-95">
                    <Download size={20} /> Exportovat vše
                </button>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Celkový obrat', value: '29.400 Kč', color: 'text-green-600' },
                    { label: 'Zaplaceno', value: '16.800 Kč', color: 'text-green-600' },
                    { label: 'Čeká na platbu', value: '12.600 Kč', color: 'text-amber-600' },
                    { label: 'Po splatnosti', value: '8.400 Kč', color: 'text-red-600' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-none border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h4 className={`text-2xl font-extrabold tracking-tight ${stat.color}`}>{stat.value}</h4>
                    </div>
                ))}
            </div>

            {/* Filters and Search */}
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

            {/* Payments Table */}
            <div className="bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <th className="px-8 py-4">ID Platby</th>
                                <th className="px-8 py-4">Značka</th>
                                <th className="px-8 py-4">Event</th>
                                <th className="px-8 py-4">Částka</th>
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
            </div>
        </div>
    );
};

export default PaymentsAndInvoicing;
