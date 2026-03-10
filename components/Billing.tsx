import React from 'react';
import { CreditCard, Download, FileText, ExternalLink, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useApplications, useBrandProfiles } from '../hooks/useSupabase';
import { dbBrandProfileToApp, dbApplicationToApp } from '../lib/mappers';
import { AppStatus } from '../types';

const Billing: React.FC = () => {
    const { applications: dbApplications = [], loading: appsLoading } = useApplications();
    const { profiles: dbProfiles, loading: profilesLoading } = useBrandProfiles();

    const profiles = dbProfiles.map(dbBrandProfileToApp);
    const applications = (dbApplications || []).map(dbApplicationToApp);

    // Filter for applications in billing process
    const invoices = applications
        .filter(app => [AppStatus.PAID, AppStatus.APPROVED, AppStatus.PAYMENT_REMINDER, AppStatus.PAYMENT_LAST_CALL, AppStatus.PAYMENT_UNDER_REVIEW].includes(app.status))
        .map(app => ({
            id: `INV-${new Date(app.submittedAt).getFullYear()}-${app.id.slice(0, 4).toUpperCase()}`,
            date: app.approvedAt ? new Date(app.approvedAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : new Date(app.submittedAt).toLocaleDateString('cs-CZ'),
            deadline: app.paymentDeadline ? new Date(app.paymentDeadline).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : null,
            amount: 'TBD', 
            status: app.status,
            event: app.brandName
        }));

    const mainProfile = profiles[0];

    if (appsLoading || profilesLoading) {
        return <div className="p-12 text-center text-gray-400">Načítám fakturační údaje...</div>;
    }

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
                    <p className="text-2xl font-bold text-lavrs-dark">0 Kč</p>
                </div>
                <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm space-y-2">
                    <div className="w-10 h-10 bg-orange-50 rounded-none flex items-center justify-center text-orange-600 mb-4">
                        <CreditCard size={20} />
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">K úhradě</p>
                    <p className="text-2xl font-bold text-orange-600">0 Kč</p>
                </div>
                <div className="bg-lavrs-beige p-6 rounded-none border border-lavrs-red/10 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-lavrs-dark mb-1">Fakturační údaje</p>
                        <p className="text-xs text-gray-500 font-medium">{mainProfile?.billingName || 'Žádné údaje'}</p>
                    </div>
                    <button className="text-lavrs-red hover:bg-lavrs-red hover:text-white p-2 rounded-none transition-all border border-lavrs-red/20 shadow-sm">
                        <ArrowUpRight size={18} />
                    </button>
                </div>
            </div>

            {invoices.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-100 p-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 text-gray-300 flex items-center justify-center mx-auto">
                        <FileText size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-lavrs-dark">Zatím žádné faktury</h3>
                    <p className="text-gray-400 max-w-sm mx-auto">Zde se objeví vaše faktury a daňové doklady po schválení přihlášky a provedení platby.</p>
                </div>
            ) : (
                <div className="bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doklad / Datum schválení</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Akce / Položka</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Stav / Splatnost</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Částka</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Akce</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-lavrs-dark block">{inv.id}</span>
                                        <span className="text-[10px] text-gray-400">Schváleno: {inv.date}</span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-600">{inv.event}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="space-y-1">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-none ${
                                                inv.status === AppStatus.PAID ? 'bg-green-100 text-green-700' : 
                                                inv.status === AppStatus.PAYMENT_UNDER_REVIEW ? 'bg-blue-100 text-blue-700' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                                {inv.status === AppStatus.PAID ? 'ZAPLACENO' : 
                                                 inv.status === AppStatus.PAYMENT_UNDER_REVIEW ? 'V OVĚŘENÍ' : 'ČEKÁ NA PLATBU'}
                                            </span>
                                            {inv.status !== AppStatus.PAID && inv.deadline && (
                                                <p className="text-[9px] font-bold text-lavrs-red">Splatnost: {inv.deadline}</p>
                                            )}
                                        </div>
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
            )}
        </div>
    );
};

export default Billing;
