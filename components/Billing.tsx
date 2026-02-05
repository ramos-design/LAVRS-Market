import React from 'react';
import { CreditCard, Download, FileText, ExternalLink, ArrowUpRight, TrendingUp } from 'lucide-react';

const Billing: React.FC = () => {
    const invoices = [
        { id: 'INV-2026-001', date: '16. 3. 2026', amount: '4.200 Kč', status: 'PAID', event: 'LAVRS Market #12' },
        { id: 'INV-2026-002', date: '2. 4. 2026', amount: '2.500 Kč', status: 'UNPAID', event: 'LAVRS Mini #4' }
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-4xl font-bold text-lavrs-dark mb-2">Fakturace</h1>
                <p className="text-gray-500">Přehled plateb a daňových dokladů.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm space-y-2">
                    <div className="w-10 h-10 bg-green-50 rounded-none flex items-center justify-center text-green-600 mb-4">
                        <TrendingUp size={20} />
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Celkem zaplaceno</p>
                    <p className="text-2xl font-bold text-lavrs-dark">6.700 Kč</p>
                </div>
                <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm space-y-2">
                    <div className="w-10 h-10 bg-orange-50 rounded-none flex items-center justify-center text-orange-600 mb-4">
                        <CreditCard size={20} />
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">K úhradě</p>
                    <p className="text-2xl font-bold text-orange-600">2.500 Kč</p>
                </div>
                <div className="bg-lavrs-beige p-6 rounded-none border border-lavrs-red/10 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-lavrs-dark mb-1">Fakturační údaje</p>
                        <p className="text-xs text-gray-500 font-medium">Vintage Soul s.r.o.</p>
                    </div>
                    <button className="text-lavrs-red hover:bg-lavrs-red hover:text-white p-2 rounded-none transition-all border border-lavrs-red/20 shadow-sm">
                        <ArrowUpRight size={18} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doklad</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Akce / Položka</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Stav</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Částka</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Akce</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="font-bold text-lavrs-dark block">{inv.id}</span>
                                    <span className="text-[10px] text-gray-400">{inv.date}</span>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-600">{inv.event}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-none ${inv.status === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                                        }`}>
                                        {inv.status === 'PAID' ? 'ZAPLACENO' : 'NEZAPLACENO'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-lavrs-dark">{inv.amount}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="inline-flex items-center gap-2 text-lavrs-red font-bold text-xs hover:underline">
                                        <Download size={14} /> PDF
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Billing;
