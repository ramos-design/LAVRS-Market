import React from 'react';
import { Mail, Edit, Eye, Copy, Plus, CheckCircle } from 'lucide-react';

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    description: string;
    category: 'application' | 'payment' | 'event';
    enabled: boolean;
}

const AutomatedEmails: React.FC = () => {
    const [templates] = React.useState<EmailTemplate[]>([
        {
            id: 'confirm-application',
            name: 'Potvrzení přihlášení',
            subject: 'Přihláška přijata - {{event_name}}',
            description: 'Automatický email odeslaný po úspěšném podání přihlášky k eventu.',
            category: 'application',
            enabled: true,
        },
        {
            id: 'application-approved',
            name: 'Schválení přihlášky + faktura',
            subject: 'Gratulujeme! Vaše přihláška byla schválena',
            description: 'Email s potvrzením schválení a přiloženou fakturou k úhradě.',
            category: 'application',
            enabled: true,
        },
        {
            id: 'application-rejected',
            name: 'Zamítnutí přihlášky',
            subject: 'Informace o vaší přihlášce na {{event_name}}',
            description: 'Zdvořilé zamítnutí přihlášky s možností zápisu na waitlist.',
            category: 'application',
            enabled: true,
        },
        {
            id: 'payment-confirmed',
            name: 'Potvrzení přijaté platby',
            subject: 'Platba přijata - {{event_name}}',
            description: 'Potvrzení o úspěšném přijetí platby za event.',
            category: 'payment',
            enabled: true,
        },
        {
            id: 'payment-reminder',
            name: 'Platební upomínka',
            subject: 'Připomínka platby - {{event_name}}',
            description: 'Upomínka na blížící se termín splatnosti faktury.',
            category: 'payment',
            enabled: true,
        },
        {
            id: 'payment-last-call',
            name: 'Platební upomínka - Last Call',
            subject: 'URGENTNÍ: Poslední výzva k úhradě',
            description: 'Finální upomínka před zrušením rezervace místa.',
            category: 'payment',
            enabled: true,
        },
        {
            id: 'event-instructions',
            name: 'Organizační instrukce před akcí',
            subject: 'Důležité informace k {{event_name}}',
            description: 'Praktické informace o průběhu eventu, příjezdu, setup času atd.',
            category: 'event',
            enabled: true,
        },
        {
            id: 'event-reminder',
            name: 'Reminder těsně před akcí',
            subject: 'Už zítra! {{event_name}}',
            description: 'Připomínka den před konáním eventu.',
            category: 'event',
            enabled: true,
        },
        {
            id: 'post-event',
            name: 'Post-event email',
            subject: 'Děkujeme za účast na {{event_name}}',
            description: 'Poděkování po skončení eventu, možnost zpětné vazby a pozvánka na další akce.',
            category: 'event',
            enabled: true,
        },
    ]);

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'application': return { label: 'Přihlášky', color: 'bg-blue-100 text-blue-700' };
            case 'payment': return { label: 'Platby', color: 'bg-green-100 text-green-700' };
            case 'event': return { label: 'Event', color: 'bg-purple-100 text-purple-700' };
            default: return { label: 'Ostatní', color: 'bg-gray-100 text-gray-700' };
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex items-end justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-lavrs-dark">Automatické emaily</h2>
                    <p className="text-gray-500">Správa a editace šablon automatických emailů.</p>
                </div>
                <button className="bg-lavrs-dark text-white px-8 py-4 rounded-none font-semibold hover:bg-lavrs-red transition-all flex items-center gap-2 shadow-lg active:scale-95">
                    <Plus size={20} /> Vytvořit novou šablonu
                </button>
            </header>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-none p-6">
                <div className="flex gap-4">
                    <Mail className="text-blue-600 shrink-0" size={24} />
                    <div>
                        <h3 className="font-bold text-blue-900 mb-1">Jak fungují automatické emaily?</h3>
                        <p className="text-sm text-blue-700">
                            Každá šablona se automaticky odesílá při konkrétní události (např. schválení přihlášky, přijetí platby).
                            Můžete upravit text, předmět i časování odeslání. Proměnné jako <code className="bg-blue-100 px-1 rounded">{'{{event_name}}'}</code> se automaticky nahradí skutečnými daty.
                        </p>
                    </div>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => {
                    const categoryInfo = getCategoryLabel(template.category);
                    return (
                        <div key={template.id} className="bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all">
                            <div className="p-6 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-widest ${categoryInfo.color}`}>
                                                {categoryInfo.label}
                                            </span>
                                            {template.enabled && (
                                                <CheckCircle size={14} className="text-green-600" />
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-lavrs-dark mb-1">{template.name}</h3>
                                        <p className="text-xs text-gray-500 font-medium mb-3">{template.subject}</p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {template.description}
                                </p>

                                <div className="flex gap-2 pt-4 border-t border-gray-100">
                                    <button className="flex-1 py-2.5 bg-lavrs-dark text-white rounded-none font-bold text-sm hover:bg-lavrs-red transition-all flex items-center justify-center gap-2">
                                        <Edit size={14} /> Editovat
                                    </button>
                                    <button className="px-3 py-2.5 bg-gray-50 text-gray-600 rounded-none font-bold hover:bg-gray-100 transition-all">
                                        <Eye size={14} />
                                    </button>
                                    <button className="px-3 py-2.5 bg-gray-50 text-gray-600 rounded-none font-bold hover:bg-gray-100 transition-all">
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Stats */}
            <div className="bg-white rounded-none border border-gray-100 shadow-sm p-8">
                <h3 className="text-xl font-bold text-lavrs-dark mb-6">Statistiky emailů</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Aktivní šablony', value: templates.filter(t => t.enabled).length.toString() },
                        { label: 'Odesláno tento měsíc', value: '342' },
                        { label: 'Průměrná otevíranost', value: '68%' },
                        { label: 'Úspěšnost doručení', value: '99.2%' },
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
                            <h4 className="text-3xl font-extrabold tracking-tight text-lavrs-dark">{stat.value}</h4>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AutomatedEmails;
