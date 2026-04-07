import React from 'react';
import { CreditCard, Download, FileText, ArrowUpRight, TrendingUp, Loader } from 'lucide-react';
import { AppStatus, Application, BrandProfile, Invoice } from '../types';
import { useInvoices } from '../hooks/useSupabase';
import { downloadInvoicePdf } from '../lib/invoice-storage';

interface BillingProps {
    applications: Application[];
    brands: BrandProfile[];
}

const Billing: React.FC<BillingProps> = ({ applications, brands }) => {
    const { data: allInvoices, loading: invoicesLoading } = useInvoices();

    // Only show applications that have a generated invoice (completed payment process)
    const appsWithInvoice = applications.filter(app => app.invoiceId);

    // Build invoice display data by matching applications with their invoice records
    const invoiceMap = new Map<string, Invoice>();
    for (const inv of allInvoices) {
        invoiceMap.set(inv.applicationId, inv);
    }

    const invoices = appsWithInvoice
        .map(app => {
            const invoice = invoiceMap.get(app.id);
            if (!invoice) return null;
            return {
                invoiceNumber: invoice.invoiceNumber,
                date: new Date(invoice.issuedAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
                deadline: new Date(invoice.dueDate).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
                amount: new Intl.NumberFormat('cs-CZ').format(invoice.amountCzk / 100) + ' Kč',
                amountRaw: invoice.amountCzk,
                status: app.status,
                event: app.brandName,
                pdfStoragePath: invoice.pdfStoragePath,
            };
        })
        .filter(Boolean) as Array<{
            invoiceNumber: string;
            date: string;
            deadline: string;
            amount: string;
            amountRaw: number;
            status: AppStatus;
            event: string;
            pdfStoragePath?: string;
        }>;

    const mainProfile = brands[0];
    const hasBillingAccess = invoices.length > 0;

    const totalPaid = invoices
        .filter(inv => inv.status === AppStatus.PAID)
        .reduce((sum, inv) => sum + inv.amountRaw, 0);
    const totalDue = invoices
        .filter(inv => inv.status !== AppStatus.PAID)
        .reduce((sum, inv) => sum + inv.amountRaw, 0);

    const handleDownloadPdf = async (invoiceNumber: string, pdfStoragePath?: string) => {
        if (!pdfStoragePath) return;
        try {
            await downloadInvoicePdf(invoiceNumber, pdfStoragePath);
        } catch (err) {
            console.error('PDF download failed:', err);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 pt-4 md:pt-0 animate-fadeIn">
            <div>
                <h1 className="text-2xl md:text-4xl font-bold text-lavrs-dark mb-1 md:mb-2">Fakturace</h1>
                <p className="text-sm md:text-base text-gray-500">Přehled plateb a daňových dokladů.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm space-y-2">
                    <div className="w-10 h-10 bg-green-50 rounded-none flex items-center justify-center text-green-600 mb-4">
                        <TrendingUp size={20} />
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Celkem zaplaceno</p>
                    <p className="text-2xl font-bold text-lavrs-dark">{hasBillingAccess ? new Intl.NumberFormat('cs-CZ').format(totalPaid / 100) + ' Kč' : '—'}</p>
                </div>
                <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm space-y-2">
                    <div className="w-10 h-10 bg-orange-50 rounded-none flex items-center justify-center text-orange-600 mb-4">
                        <CreditCard size={20} />
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">K úhradě</p>
                    <p className="text-2xl font-bold text-orange-600">{hasBillingAccess ? new Intl.NumberFormat('cs-CZ').format(totalDue / 100) + ' Kč' : '—'}</p>
                </div>
                <div className="bg-lavrs-beige p-6 rounded-none border border-lavrs-red/10 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-lavrs-dark mb-1">Fakturační údaje</p>
                        <p className="text-xs text-gray-500 font-medium">
                            {hasBillingAccess ? (mainProfile?.billingName || 'Žádné údaje') : 'Dostupné po schválení'}
                        </p>
                    </div>
                    <button
                        className="text-lavrs-red hover:bg-lavrs-red hover:text-white p-2 rounded-none transition-all border border-lavrs-red/20 shadow-sm"
                        disabled={!hasBillingAccess}
                    >
                        <ArrowUpRight size={18} />
                    </button>
                </div>
            </div>

            {invoicesLoading ? (
                <div className="bg-white border-2 border-dashed border-gray-100 p-20 text-center space-y-4">
                    <Loader size={32} className="animate-spin text-gray-300 mx-auto" />
                    <p className="text-gray-400">Načítám faktury...</p>
                </div>
            ) : !hasBillingAccess ? (
                <div className="bg-white border-2 border-dashed border-gray-100 p-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 text-gray-300 flex items-center justify-center mx-auto">
                        <FileText size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-lavrs-dark">Zatím žádné faktury</h3>
                    <p className="text-gray-400 max-w-sm mx-auto">Faktury se zobrazí po dokončení platebního procesu a vystavení dokladu.</p>
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
                                <tr key={inv.invoiceNumber} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-lavrs-dark block">{inv.invoiceNumber}</span>
                                        <span className="text-[10px] text-gray-400">Vystaveno: {inv.date}</span>
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
                                            {inv.status !== AppStatus.PAID && (
                                                <p className="text-[9px] font-bold text-lavrs-red">Splatnost: {inv.deadline}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-lavrs-dark">{inv.amount}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDownloadPdf(inv.invoiceNumber, inv.pdfStoragePath)}
                                            disabled={!inv.pdfStoragePath}
                                            className="inline-flex items-center gap-2 text-lavrs-red font-bold text-xs hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
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

