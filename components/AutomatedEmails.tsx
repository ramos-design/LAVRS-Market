import React, { useState, useRef, useCallback } from 'react';
import { Mail, Edit, Eye, Copy, Plus, CheckCircle, X, Upload, Paperclip, Trash2, Save, ArrowLeft, FileText, AlertCircle, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { useEmailTemplates, useEmailAttachments } from '../hooks/useSupabase';
import { DbEmailTemplate, DbEmailAttachment } from '../lib/database';

type EditorMode = 'list' | 'edit' | 'preview';

/* ─── Available template variables ───────────────────────────── */
const TEMPLATE_VARIABLES = [
    { key: '{{brand_name}}', label: 'Název značky', example: 'Vintage Soul' },
    { key: '{{event_name}}', label: 'Název eventu', example: 'LAVRS market #12' },
    { key: '{{event_date}}', label: 'Datum eventu', example: '15. března 2026' },
    { key: '{{event_location}}', label: 'Místo konání', example: 'Vnitroblock, Praha 7' },
    { key: '{{contact_person}}', label: 'Kontaktní osoba', example: 'Tereza Nováková' },
    { key: '{{payment_deadline}}', label: 'Splatnost faktury', example: '20. března 2026' },
    { key: '{{invoice_amount}}', label: 'Částka k úhradě', example: '3 500 Kč' },
    { key: '{{invoice_number}}', label: 'Číslo faktury', example: 'FV-2026-0042' },
];

/* ─── Default email bodies ───────────────────────────────────── */
const DEFAULT_BODIES: Record<string, string> = {
    'confirm-application': `Dobrý den, {{contact_person}},

děkujeme za Vaši přihlášku na {{event_name}} ({{event_date}}) za značku {{brand_name}}.

Vaše přihláška byla úspěšně přijata a nyní čeká na posouzení naším kurátorským týmem.

O výsledku Vás budeme informovat emailem do 5 pracovních dnů.

S pozdravem,
Tým LAVRS market`,

    'application-approved': `Dobrý den, {{contact_person}},

s radostí Vám oznamujeme, že Vaše přihláška za značku {{brand_name}} na {{event_name}} ({{event_date}}) byla schválena! 🎉

Pro potvrzení Vaší účasti prosím uhraďte fakturu v příloze do {{payment_deadline}}.

Částka k úhradě: {{invoice_amount}}
Číslo faktury: {{invoice_number}}

V případě neuhrazení do uvedeného termínu bude Vaše místo automaticky uvolněno.

S pozdravem,
Tým LAVRS market`,

    'application-rejected': `Dobrý den, {{contact_person}},

děkujeme za Váš zájem o účast na {{event_name}} ({{event_date}}).

Bohužel Vám musíme sdělit, že Vaše přihláška za značku {{brand_name}} nebyla tentokrát schválena. Kapacita eventu je omezená a výběr je vždy velmi náročný.

Můžete se zapsat na waitlist — pokud se uvolní místo, ozveme se Vám.

Přejeme hodně úspěchů a těšíme se na příští sezónu!

S pozdravem,
Tým LAVRS market`,

    'application-waitlist': `Dobrý den, {{contact_person}},

děkujeme za Váš zájem o účast na {{event_name}} ({{event_date}}) se značkou {{brand_name}}.

Vaše přihláška nás zaujala, bohužel však aktuální kapacita eventu je již plně obsazena. Rádi bychom Vás zařadili na waitlist — pokud se uvolní místo, budeme Vás neprodleně kontaktovat.

Nemusíte nic dalšího podnikat, o případném uvolnění místa Vás budeme informovat emailem.

Děkujeme za pochopení a těšíme se na případnou spolupráci!

S pozdravem,
Tým LAVRS market`,

    'payment-confirmed': `Dobrý den, {{contact_person}},

potvrzujeme přijetí Vaší platby za účast na {{event_name}} ({{event_date}}).

Částka: {{invoice_amount}}
Číslo faktury: {{invoice_number}}

Vaše místo je nyní závazně rezervováno. Organizační instrukce Vám zašleme několik dní před akcí.

Děkujeme a těšíme se na Vás!

S pozdravem,
Tým LAVRS market`,

    'payment-reminder': `Dobrý den, {{contact_person}},

rádi bychom Vám připomněli blížící se termín splatnosti faktury za {{event_name}} ({{event_date}}).

Číslo faktury: {{invoice_number}}
Částka: {{invoice_amount}}
Splatnost: {{payment_deadline}}

Prosím uhraďte fakturu včas, aby Vaše místo zůstalo rezervováno.

S pozdravem,
Tým LAVRS market`,

    'payment-last-call': `Dobrý den, {{contact_person}},

toto je poslední upomínka k úhradě faktury za {{event_name}} ({{event_date}}).

Číslo faktury: {{invoice_number}}
Částka: {{invoice_amount}}
Splatnost: {{payment_deadline}}

⚠️ Pokud platba nebude připsána do konce dne splatnosti, Vaše místo bude automaticky uvolněno a nabídnuto dalšímu zájemci z waitlistu.

S pozdravem,
Tým LAVRS market`,

    'event-instructions': `Dobrý den, {{contact_person}},

{{event_name}} se blíží! Zde jsou důležité organizační informace:

📍 Místo: {{event_location}}
📅 Datum: {{event_date}}
🕐 Příjezd a setup: 7:00 – 9:00
🚪 Start pro návštěvníky: 10:00
🔚 Konec: 18:00, úklid do 19:30

Podrobné informace a mapku naleznete v příloze.

Těšíme se na Vás!

S pozdravem,
Tým LAVRS market`,

    'event-reminder': `Dobrý den, {{contact_person}},

připomínáme, že zítra se koná {{event_name}}! 🎪

📍 {{event_location}}
📅 {{event_date}}
🕐 Příjezd: od 7:00

Nezapomeňte si vzít vše potřebné pro svůj stánek. V příloze najdete aktuální layout s umístěním Vašeho spotu.

Těšíme se na Vás!

S pozdravem,
Tým LAVRS market`,

    'post-event': `Dobrý den, {{contact_person}},

děkujeme za Vaši účast na {{event_name}} ({{event_date}})! 🙏

Doufáme, že se Vám event líbil a byl pro Vás přínosný. Budeme rádi za Vaši zpětnou vazbu — pomůže nám vylepšit další akce.

Sledujte nás na sociálních sítích pro informace o nadcházejících eventech.

Přejeme hodně úspěchů!

S pozdravem,
Tým LAVRS market`,

    'payment-submitted': `Dobrý den, {{contact_person}},

děkujeme za potvrzení platby za účast na {{event_name}} ({{event_date}}) za značku {{brand_name}}.

Vaše faktura je přiložena v příloze tohoto emailu.

Číslo faktury: {{invoice_number}}
Částka k úhradě: {{invoice_amount}}
Splatnost: {{payment_deadline}}

Jakmile bude platba připsána na náš účet, obdržíte potvrzení o přijetí platby a závazné rezervaci Vašeho místa.

S pozdravem,
Tým LAVRS market`,
};

/* ─── Main Component ────────────────────────────────────────── */
const AutomatedEmails: React.FC = () => {
    const { templates, updateTemplate, createTemplate, deleteTemplate, loading: loadingTemplates } = useEmailTemplates();

    const [mode, setMode] = useState<EditorMode>('list');
    const [editingTemplate, setEditingTemplate] = useState<DbEmailTemplate | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [showVariables, setShowVariables] = useState(false);
    const [saveNotification, setSaveNotification] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const { attachments, uploadAttachment, deleteAttachment, loading: loadingAttachments } = useEmailAttachments(editingTemplate?.id || null);

    const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cursorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
      return () => {
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        if (cursorTimeoutRef.current) {
          clearTimeout(cursorTimeoutRef.current);
        }
      };
    }, []);

    /* ─── Handlers ────────────────────────────────────────────── */

    const handleEdit = (template: DbEmailTemplate) => {
        setEditingTemplate(template);
        setMode('edit');
    };

    const handlePreview = (template: DbEmailTemplate) => {
        setEditingTemplate(template);
        setMode('preview');
    };

    const handleDuplicate = async (template: DbEmailTemplate) => {
        const newTemplate = {
            id: `template-${Date.now()}`,
            name: `${template.name} (kopie)`,
            subject: template.subject,
            description: template.description || '',
            body: template.body || '',
            category: template.category,
            enabled: false,
            last_edited: new Date().toISOString(),
        };
        await createTemplate(newTemplate as any);
    };

    const handleSave = async () => {
        if (!editingTemplate) return;

        await updateTemplate(editingTemplate.id, {
            name: editingTemplate.name,
            subject: editingTemplate.subject,
            description: editingTemplate.description,
            body: editingTemplate.body,
            category: editingTemplate.category,
            enabled: editingTemplate.enabled,
            last_edited: new Date().toISOString()
        });

        setSaveNotification(true);
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        notificationTimeoutRef.current = setTimeout(() => setSaveNotification(false), 2500);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Opravdu chcete tuto šablonu smazat?')) {
            await deleteTemplate(id);
            if (editingTemplate?.id === id) {
                setEditingTemplate(null);
                setMode('list');
            }
        }
    };

    /* ─── Attachment handlers ────────────────────────────────── */

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !editingTemplate) return;

        setIsUploading(true);
        try {
            for (const file of Array.from(files) as File[]) {
                await uploadAttachment(file);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Chyba při nahrávání přílohy.');
        } finally {
            setIsUploading(false);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveAttachment = async (attachment: DbEmailAttachment) => {
        if (confirm('Opravdu chcete tuto přílohu smazat?')) {
            await deleteAttachment(attachment.id, attachment.storage_path);
        }
    };

    const insertVariable = (variable: string) => {
        if (!bodyTextareaRef.current || !editingTemplate) return;
        const textarea = bodyTextareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = editingTemplate.body || '';
        const newText = text.substring(0, start) + variable + text.substring(end);
        setEditingTemplate(prev => prev ? { ...prev, body: newText } : prev);

        // Restore cursor position
        if (cursorTimeoutRef.current) {
          clearTimeout(cursorTimeoutRef.current);
        }
        cursorTimeoutRef.current = setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + variable.length;
            textarea.focus();
        }, 0);
    };

    /* ─── Helpers ─────────────────────────────────────────────── */

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return '🖼️';
        if (type.includes('pdf')) return '📄';
        if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return '📊';
        if (type.includes('word') || type.includes('document')) return '📝';
        return '📎';
    };

    const renderPreviewBody = (body: string) => {
        let preview = body;
        TEMPLATE_VARIABLES.forEach(v => {
            preview = preview.replaceAll(v.key, `<span style="background:#FEF3C7;padding:1px 6px;border-radius:2px;font-weight:600;color:#92400E;">${v.example}</span>`);
        });
        return preview.replace(/\n/g, '<br/>');
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'application': return { label: 'Přihlášky', color: 'bg-blue-100 text-blue-700' };
            case 'payment': return { label: 'Platby', color: 'bg-green-100 text-green-700' };
            case 'event': return { label: 'Event', color: 'bg-purple-100 text-purple-700' };
            default: return { label: 'Ostatní', color: 'bg-gray-100 text-gray-700' };
        }
    };

    const filteredTemplates = filterCategory === 'all'
        ? templates
        : templates.filter(t => t.category === filterCategory);

    /* ═══════════════════════════════════════════════════════════
       PREVIEW MODE
    ═══════════════════════════════════════════════════════════ */
    if (mode === 'preview' && editingTemplate) {
        const categoryInfo = getCategoryLabel(editingTemplate.category);
        return (
            <div className="space-y-6 animate-fadeIn">
                <button
                    onClick={() => setMode('list')}
                    className="flex items-center gap-2 text-gray-500 hover:text-lavrs-dark font-semibold transition-colors"
                >
                    <ArrowLeft size={18} /> Zpět na šablony
                </button>

                {/* Email preview container */}
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gray-100 rounded-none p-3 text-center mb-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                            <Eye size={12} /> Náhled emailu
                        </p>
                    </div>
                    <div className="bg-white border border-gray-200 shadow-xl">
                        {/* Email header */}
                        <div className="border-b border-gray-100 p-6 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-lavrs-dark rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">LM</span>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-lavrs-dark">LAVRS market</p>
                                    <p className="text-xs text-gray-400">info@lavrsmarket.cz</p>
                                </div>
                                <span className={`ml-auto px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-widest ${categoryInfo.color}`}>
                                    {categoryInfo.label}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Předmět:</p>
                                <p className="font-bold text-lavrs-dark"
                                    dangerouslySetInnerHTML={{
                                        __html: renderPreviewBody(editingTemplate.subject)
                                    }}
                                />
                            </div>
                        </div>

                        {/* Email body */}
                        <div className="p-6">
                            <div
                                className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: renderPreviewBody(editingTemplate.body) }}
                            />
                        </div>

                        {/* Attachments preview */}
                        {attachments.length > 0 && (
                            <div className="border-t border-gray-100 p-6">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Paperclip size={12} /> Přílohy ({attachments.length})
                                </p>
                                <div className="space-y-2">
                                    {attachments.map(att => (
                                        <div key={att.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-none">
                                            <span className="text-lg">{getFileIcon(att.file_type || '')}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-lavrs-dark truncate">{att.file_name}</p>
                                                <p className="text-xs text-gray-400">{formatFileSize(att.file_size || 0)}</p>
                                            </div>
                                            <Download size={14} className="text-gray-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="border-t border-gray-100 p-6 bg-gray-50">
                            <p className="text-xs text-gray-400 text-center">
                                Tento email byl automaticky odeslán systémem LAVRS market.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="max-w-2xl mx-auto flex gap-3">
                    <button
                        onClick={() => {
                            setMode('edit');
                        }}
                        className="flex-1 bg-lavrs-dark text-white px-6 py-4 rounded-none font-bold hover:bg-lavrs-red transition-all flex items-center justify-center gap-2"
                    >
                        <Edit size={16} /> Upravit šablonu
                    </button>
                    <button
                        onClick={() => setMode('list')}
                        className="px-6 py-4 bg-gray-100 text-gray-600 rounded-none font-bold hover:bg-gray-200 transition-all"
                    >
                        Zavřít
                    </button>
                </div>
            </div>
        );
    }

    /* ═══════════════════════════════════════════════════════════
       EDIT MODE
    ═══════════════════════════════════════════════════════════ */
    if (mode === 'edit' && editingTemplate) {
        return (
            <div className="space-y-6 animate-fadeIn">
                {/* Save notification */}
                {saveNotification && (
                    <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-none shadow-xl flex items-center gap-2 animate-fadeIn">
                        <CheckCircle size={18} />
                        <span className="font-bold text-sm">Šablona byla úspěšně uložena!</span>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setMode('list')}
                        className="flex items-center gap-2 text-gray-500 hover:text-lavrs-dark font-semibold transition-colors"
                    >
                        <ArrowLeft size={18} /> Zpět na šablony
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setMode('preview')}
                            className="px-5 py-3 bg-gray-100 text-gray-700 rounded-none font-bold text-sm hover:bg-gray-200 transition-all flex items-center gap-2"
                        >
                            <Eye size={14} /> Náhled
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-3 bg-lavrs-dark text-white rounded-none font-bold text-sm hover:bg-lavrs-red transition-all flex items-center gap-2 shadow-lg active:scale-95"
                        >
                            <Save size={14} /> Uložit šablonu
                        </button>
                    </div>
                </div>

                {/* Edit form */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main editor - 2 cols */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-gray-100 shadow-sm rounded-none overflow-hidden">
                            <div className="bg-lavrs-dark px-6 py-4">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    <Edit size={18} /> Editace šablony
                                </h3>
                            </div>
                            <div className="p-6 space-y-5">
                                {/* Template name */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                        Název šablony
                                    </label>
                                    <input
                                        type="text"
                                        value={editingTemplate.name}
                                        onChange={e => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : prev)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-none text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lavrs-red focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                        Předmět emailu
                                    </label>
                                    <input
                                        type="text"
                                        value={editingTemplate.subject}
                                        onChange={e => setEditingTemplate(prev => prev ? { ...prev, subject: e.target.value } : prev)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-lavrs-red focus:border-transparent transition-all"
                                        placeholder="Předmět emailu..."
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                        Interní popis (nebude v emailu)
                                    </label>
                                    <input
                                        type="text"
                                        value={editingTemplate.description}
                                        onChange={e => setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : prev)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-none text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-lavrs-red focus:border-transparent transition-all"
                                        placeholder="Popis účelu šablony..."
                                    />
                                </div>

                                {/* Body */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            Tělo emailu
                                        </label>
                                        <button
                                            onClick={() => setShowVariables(!showVariables)}
                                            className="flex items-center gap-1 text-[10px] font-bold text-lavrs-red uppercase tracking-widest hover:text-lavrs-dark transition-colors"
                                        >
                                            {showVariables ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            Vložit proměnnou
                                        </button>
                                    </div>

                                    {/* Variables panel */}
                                    {showVariables && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-none p-4 mb-3 animate-fadeIn">
                                            <p className="text-xs text-amber-700 font-semibold mb-3">
                                                Klikněte na proměnnou pro vložení na pozici kurzoru:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {TEMPLATE_VARIABLES.map(v => (
                                                    <button
                                                        key={v.key}
                                                        onClick={() => insertVariable(v.key)}
                                                        className="px-3 py-1.5 bg-white border border-amber-300 rounded-none text-xs font-mono font-semibold text-amber-800 hover:bg-amber-100 hover:border-amber-400 transition-all active:scale-95"
                                                        title={`${v.label} → např. "${v.example}"`}
                                                    >
                                                        {v.key}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <textarea
                                        ref={bodyTextareaRef}
                                        value={editingTemplate.body}
                                        onChange={e => setEditingTemplate(prev => prev ? { ...prev, body: e.target.value } : prev)}
                                        rows={16}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-none text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-lavrs-red focus:border-transparent transition-all resize-y"
                                        placeholder="Obsah emailu..."
                                    />
                                </div>

                                {/* Enabled toggle */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div>
                                        <p className="font-bold text-sm text-lavrs-dark">Aktivní šablona</p>
                                        <p className="text-xs text-gray-400">Email se bude automaticky odesílat při triggeru</p>
                                    </div>
                                    <button
                                        onClick={() => setEditingTemplate(prev => prev ? { ...prev, enabled: !prev.enabled } : prev)}
                                        className={`relative w-14 h-7 rounded-full transition-colors ${editingTemplate.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                                    >
                                        <span
                                            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${editingTemplate.enabled ? 'translate-x-7' : 'translate-x-0.5'}`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Attachments + Info */}
                    <div className="space-y-6">
                        {/* Attachments */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-none overflow-hidden">
                            <div className="bg-lavrs-dark px-6 py-4">
                                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                    <Paperclip size={16} /> Přílohy
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Upload area */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-none p-6 text-center cursor-pointer hover:border-lavrs-red hover:bg-red-50/30 transition-all group"
                                >
                                    <Upload size={28} className="mx-auto text-gray-300 group-hover:text-lavrs-red transition-colors mb-2" />
                                    <p className="text-sm font-bold text-gray-500 group-hover:text-lavrs-dark transition-colors">
                                        Nahrát přílohu
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        PDF, obrázky, dokumenty
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.svg"
                                    />
                                </div>

                                {/* Attachment list */}
                                {attachments.length > 0 ? (
                                    <div className="space-y-2">
                                        {attachments.map(att => (
                                            <div key={att.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-none group/att hover:bg-gray-100 transition-all">
                                                <span className="text-lg shrink-0">{getFileIcon(att.file_type || '')}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-lavrs-dark truncate">{att.file_name}</p>
                                                    <p className="text-[10px] text-gray-400">{formatFileSize(att.file_size || 0)}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveAttachment(att)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-none transition-all opacity-0 group-hover/att:opacity-100"
                                                    title="Odebrat přílohu"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 text-center py-2">
                                        Žádné přílohy
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Variables reference */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-none overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                                <h3 className="font-bold text-sm text-lavrs-dark flex items-center gap-2">
                                    <FileText size={16} /> Proměnné
                                </h3>
                            </div>
                            <div className="p-4">
                                <div className="space-y-1.5">
                                    {TEMPLATE_VARIABLES.map(v => (
                                        <div key={v.key} className="flex items-start gap-2 text-xs">
                                            <code className="shrink-0 bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600">
                                                {v.key}
                                            </code>
                                            <span className="text-gray-400 leading-relaxed">{v.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Template info */}
                        <div className="bg-blue-50 border border-blue-100 rounded-none p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={16} />
                                <div>
                                    <h4 className="font-bold text-xs text-blue-900 mb-1">Tip</h4>
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        Proměnné ve tvaru <code className="bg-blue-100 px-1 rounded">{'{{...}}'}</code> se při odesílání automaticky nahradí skutečnými daty.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ═══════════════════════════════════════════════════════════
       LIST MODE (default)
    ═══════════════════════════════════════════════════════════ */
    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-lavrs-dark">Automatické emaily</h2>
                    <p className="text-gray-500">Správa a editace šablon automatických emailů.</p>
                </div>
                <button
                    onClick={async () => {
                        const newTemplate = {
                            id: `custom-${Date.now()}`,
                            name: 'Nová šablona',
                            subject: 'Předmět emailu',
                            description: 'Popis nové šablony',
                            body: `Dobrý den, {{contact_person}},\n\n\n\nS pozdravem,\nTým LAVRS market`,
                            category: 'event',
                            enabled: false,
                            last_edited: new Date().toISOString(),
                        };
                        await createTemplate(newTemplate as any);
                    }}
                    className="bg-lavrs-dark text-white px-8 py-4 rounded-none font-semibold hover:bg-lavrs-red transition-all flex items-center gap-2 shadow-lg active:scale-95"
                >
                    <Plus size={20} /> Vytvořit novou šablonu
                </button>
            </header>

            {/* Stats */}
            <div className="bg-white rounded-none border border-gray-100 shadow-sm p-8">
                <h3 className="text-xl font-bold text-lavrs-dark mb-6">Statistiky emailů</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Aktivní šablony', value: templates.filter(t => t.enabled).length.toString() },
                        { label: 'Celkem šablon', value: templates.length.toString() },
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
                            <h4 className="text-3xl font-extrabold tracking-tight text-lavrs-dark">{stat.value}</h4>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-none p-6">
                <div className="flex gap-4">
                    <Mail className="text-blue-600 shrink-0" size={24} />
                    <div>
                        <h3 className="font-bold text-blue-900 mb-1">Jak fungují automatické emaily?</h3>
                        <p className="text-sm text-blue-700">
                            Každá šablona se automaticky odesílá při konkrétní události (např. schválení přihlášky, přijetí platby).
                            Můžete upravit text, předmět, přílohy i aktivitu šablony. Proměnné jako <code className="bg-blue-100 px-1 rounded">{'{{event_name}}'}</code> se automaticky nahradí skutečnými daty.
                        </p>
                    </div>
                </div>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { key: 'all', label: 'Všechny' },
                    { key: 'application', label: 'Přihlášky' },
                    { key: 'payment', label: 'Platby' },
                    { key: 'event', label: 'Event' },
                ].map(cat => (
                    <button
                        key={cat.key}
                        onClick={() => setFilterCategory(cat.key)}
                        className={`px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest transition-all ${filterCategory === cat.key
                            ? 'bg-lavrs-dark text-white shadow-md'
                            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => {
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
                                            {template.enabled ? (
                                                <CheckCircle size={14} className="text-green-600" />
                                            ) : (
                                                <span className="text-[9px] font-bold text-gray-400 uppercase">Neaktivní</span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-lavrs-dark mb-1">{template.name}</h3>
                                        <p className="text-xs text-gray-500 font-medium mb-3">{template.subject}</p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {template.description}
                                </p>

                                {/* Last edited */}
                                {template.last_edited && (
                                    <p className="text-[10px] text-gray-400">
                                        Upraveno: {new Date(template.last_edited).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}

                                <div className="flex gap-2 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="flex-1 py-2.5 bg-lavrs-dark text-white rounded-none font-bold text-sm hover:bg-lavrs-red transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit size={14} /> Editovat
                                    </button>
                                    <button
                                        onClick={() => handlePreview(template)}
                                        className="px-3 py-2.5 bg-gray-50 text-gray-600 rounded-none font-bold hover:bg-gray-100 transition-all"
                                        title="Náhled"
                                    >
                                        <Eye size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDuplicate(template)}
                                        className="px-3 py-2.5 bg-gray-50 text-gray-600 rounded-none font-bold hover:bg-gray-100 transition-all"
                                        title="Duplikovat"
                                    >
                                        <Copy size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="px-3 py-2.5 bg-gray-50 text-red-400 rounded-none font-bold hover:bg-red-50 hover:text-red-600 transition-all"
                                        title="Smazat"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default AutomatedEmails;
