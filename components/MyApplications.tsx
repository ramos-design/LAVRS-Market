import React from 'react';
import { FileText, Clock, CheckCircle2, AlertCircle, ChevronRight, Search } from 'lucide-react';
import { AppStatus, Application } from '../types';

interface MyApplicationsProps {
    applications: Application[];
}

const MyApplications: React.FC<MyApplicationsProps> = ({ applications }) => {
    const getStatusStyle = (status: AppStatus) => {
        switch (status) {
            case AppStatus.APPROVED: return 'bg-green-50 text-green-700 border-green-100';
            case AppStatus.PENDING: return 'bg-orange-50 text-orange-700 border-orange-100';
            case AppStatus.REJECTED: return 'bg-red-50 text-red-700 border-red-100';
            case AppStatus.WAITLIST: return 'bg-blue-50 text-blue-700 border-blue-100 text-blue-500';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString('cs-CZ');
    const getDaysLeft = (iso: string) => {
        const diffMs = new Date(iso).getTime() - Date.now();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold text-lavrs-dark mb-2">Moje Přihlášky</h1>
                    <p className="text-gray-500">Správa a historie vašich registrací na eventy.</p>
                </div>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lavrs-red transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Hledat přihlášku..."
                        className="pl-12 pr-6 py-3 bg-white border-2 border-gray-100 rounded-none focus:outline-none focus:border-lavrs-red transition-all text-sm w-64 shadow-sm"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {applications.map((app) => {
                    const daysLeft = app.paymentDeadline ? getDaysLeft(app.paymentDeadline) : null;
                    return (
                        <div key={app.id} className="bg-white p-6 rounded-none border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-lavrs-beige rounded-none flex items-center justify-center text-lavrs-red group-hover:scale-110 transition-transform">
                                <FileText size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-lavrs-dark">{app.brandName}</h3>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-none border ${getStatusStyle(app.status)}`}>
                                        {app.status === AppStatus.APPROVED ? 'Schváleno' :
                                            app.status === AppStatus.PENDING ? 'Čeká na posouzení' :
                                                app.status === AppStatus.REJECTED ? 'Zamítnuto' :
                                                    app.status === AppStatus.WAITLIST ? 'Na waitlistu' : 'Neznámý stav'}
                                    </span>
                                </div>
                                <div className="flex gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(app.submittedAt).toLocaleDateString('cs-CZ')}</span>
                                    <span className="font-medium text-gray-500">ID: {app.id}</span>
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

                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Cena</p>
                                <p className="font-bold text-lavrs-dark">4.200 Kč</p>
                            </div>
                            <button className="p-3 rounded-none bg-gray-50 text-gray-400 hover:bg-lavrs-red hover:text-white transition-all shadow-sm">
                                <ChevronRight size={20} />
                            </button>
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

export default MyApplications;
