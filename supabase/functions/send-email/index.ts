import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const smtpHost = Deno.env.get("SMTP_HOST")!;
const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
const smtpUsername = Deno.env.get("SMTP_USERNAME")!;
const smtpPassword = Deno.env.get("SMTP_PASSWORD")!;
const senderEmail = Deno.env.get("SENDER_EMAIL") || "lavrs@lavrs.cz";
const senderName = Deno.env.get("SENDER_NAME") || "LAVRS market";
const adminEmail = Deno.env.get("ADMIN_EMAIL") || "lavrs@lavrs.cz";

const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Format event date as range if multi-day, single date if one-day */
function formatEventDateRange(dateStr: string, endDateStr?: string | null): string {
    if (!dateStr) return '';
    const fmt = (d: Date) => new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    const start = new Date(dateStr);
    if (isNaN(start.getTime())) return dateStr;
    if (!endDateStr || dateStr === endDateStr) return fmt(start);
    const end = new Date(endDateStr);
    if (isNaN(end.getTime())) return fmt(start);
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = new Intl.DateTimeFormat('cs-CZ', { month: 'long' }).format(start);
    const endMonth = new Intl.DateTimeFormat('cs-CZ', { month: 'long' }).format(end);
    const year = end.getFullYear();
    if (startMonth === endMonth) return `${startDay}.–${endDay}. ${endMonth} ${year}`;
    return `${startDay}. ${startMonth} – ${endDay}. ${endMonth} ${year}`;
}

// Compact HTML — no indentation to avoid SMTP quoted-printable =3d / =20 artifacts
// bodyText = plain text (will be escaped), or if isRawHtml=true, pre-formatted HTML (no escaping)
const getHtmlTemplate = (title: string, bodyText: string, isRawHtml = false) => {
    const safeTitle = escapeHtml(title);
    const formattedBody = isRawHtml ? bodyText : escapeHtml(bodyText).replace(/\n/g, '<br>');
    return '<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"/>'
    + '<meta name="viewport" content="width=device-width,initial-scale=1.0"/>'
    + '<title>' + safeTitle + '</title></head>'
    + '<body style="margin:0;padding:0;background-color:#e8b8b8;font-family:Arial,Helvetica,sans-serif;">'
    + '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#e8b8b8;margin:0;padding:0;">'
    + '<tr><td align="center" style="padding:30px 10px;">'
    + '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#f6d7d7;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.1);">'
    + '<tr><td style="background-color:#e30613;padding:25px 30px;text-align:center;">'
    + '<div style="color:#ffffff;font-size:28px;font-weight:900;letter-spacing:1px;">LAVRS market</div>'
    + '</td></tr>'
    + '<tr><td style="padding:35px 40px;text-align:left;">'
    + '<h1 style="margin:0 0 20px 0;font-size:24px;line-height:1.2;color:#e30613;font-weight:bold;text-align:center;">' + safeTitle + '</h1>'
    + '<div style="font-size:16px;line-height:1.6;color:#b10014;margin-bottom:25px;">' + formattedBody + '</div>'
    + '<p style="margin:0;font-size:15px;line-height:1.5;color:#b10014;font-weight:bold;border-top:1px solid #efb2b7;padding-top:15px;">T\u00fdm LAVRS market</p>'
    + '</td></tr>'
    + '<tr><td style="padding:0 40px 25px 40px;text-align:center;">'
    + '<p style="margin:0;font-size:12px;line-height:1.4;color:#b96d76;">Toto je automaticky generovan\u00fd e-mail. Pros\u00edme, neodpov\u00eddejte na n\u011bj.</p>'
    + '</td></tr></table></td></tr></table></body></html>';
};

const corsHeaders = {
    "Access-Control-Allow-Origin": "https://rezervace.lavrsmarket.cz",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const type = (payload.type || "").toUpperCase();
        const table = payload.table;
        const record = payload.record;
        const old_record = payload.old_record;

        console.log(`--- Webhook Triggered: ${table} | ${type} ---`);

        if (table !== 'applications') {
            return new Response(JSON.stringify({ message: "Ignored (not applications table)" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        let templateId = '';
        const app = record;

        // Decision logic
        if (type === 'INSERT') {
            templateId = 'confirm-application';
            console.log("New application. Using template: confirm-application");
        } else if (type === 'UPDATE' && old_record) {
            const oldStatus = (old_record.status || "").toUpperCase();
            const newStatus = (record.status || "").toUpperCase();
            if (oldStatus !== newStatus) {
                if (newStatus === 'APPROVED') templateId = 'application-approved';
                else if (newStatus === 'APPROVED_FREE') templateId = 'application-approved-free'; // free approval — no invoice, no payment flow
                else if (newStatus === 'REJECTED') templateId = 'application-rejected';
                else if (newStatus === 'PAID') templateId = 'payment-confirmed'; // payment confirmed with paid PDF + ISDOC from storage
                else if (newStatus === 'PAYMENT_UNDER_REVIEW') templateId = 'invoice-notification'; // order confirmation with PDF from storage
                else if (newStatus === 'PAYMENT_REMINDER') templateId = 'payment-reminder';
                else if (newStatus === 'PAYMENT_LAST_CALL') templateId = 'payment-last-call';
                else if (newStatus === 'WAITLIST') templateId = 'application-waitlist';
            }
        }

        if (!templateId) {
            console.log("No status change requiring email.");
            return new Response(JSON.stringify({ message: "No action needed" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Fetch Event Details
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', app.event_id)
            .single();

        if (eventError || !event) throw new Error(`Event not found: ${app.event_id}`);

        // 2. Fetch Email Template
        const { data: template, error: tmplError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('id', templateId)
            .single();

        if (tmplError || !template) throw new Error(`Template '${templateId}' not found.`);
        if (!template.enabled) return new Response(JSON.stringify({ message: "Template disabled" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        // 3. Fetch Attachments
        const { data: attachmentsData } = await supabase
            .from('email_attachments')
            .select('*')
            .eq('template_id', templateId);

        const attachments: { filename: string; content: Uint8Array; contentType: string }[] = [];
        if (attachmentsData && attachmentsData.length > 0) {
            console.log(`Found ${attachmentsData.length} attachments. Downloading...`);
            for (const att of attachmentsData) {
                const { data: fileData, error: downloadError } = await supabase
                    .storage
                    .from('attachments')
                    .download(att.storage_path);

                if (!downloadError && fileData && fileData.size > 0) {
                    const arrayBuffer = await fileData.arrayBuffer();
                    const ext = att.file_name.split('.').pop()?.toLowerCase();
                    let contentType = att.file_type || "application/octet-stream";
                    if (ext === 'pdf') contentType = "application/pdf";
                    else if (['jpg', 'jpeg'].includes(ext!)) contentType = "image/jpeg";
                    else if (ext === 'png') contentType = "image/png";

                    attachments.push({
                        filename: att.file_name,
                        content: new Uint8Array(arrayBuffer),
                        contentType: contentType,
                    });
                    console.log(`- Attached: ${att.file_name} (${fileData.size} bytes, Type: ${contentType})`);
                } else {
                    const reason = downloadError ? downloadError.message : (fileData?.size === 0 ? "Empty file (0KB)" : "Unknown error");
                    console.warn(`- Skipping attachment ${att.file_name}: ${reason}`);
                }
            }
        }

        // Fetch invoice data for templates that need it
        let invoiceData: { amount_czk?: number; invoice_number?: string; due_date?: string; pdf_storage_path?: string; paid_pdf_storage_path?: string; xml_storage_path?: string } | null = null;
        if (['payment-reminder', 'payment-last-call', 'invoice-notification', 'payment-confirmed'].includes(templateId)) {
            let invoice = null;
            if (app.invoice_id) {
                const { data } = await supabase
                    .from('invoices')
                    .select('invoice_number, amount_czk, due_date, pdf_storage_path, paid_pdf_storage_path, xml_storage_path')
                    .eq('id', app.invoice_id)
                    .single();
                invoice = data;
            }
            if (!invoice) {
                const { data } = await supabase
                    .from('invoices')
                    .select('invoice_number, amount_czk, due_date, pdf_storage_path, paid_pdf_storage_path, xml_storage_path')
                    .eq('application_id', app.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                invoice = data;
            }
            if (invoice) {
                invoiceData = invoice;
                // Auto-attach paid PDF + ISDOC for payment confirmation (PAID)
                if (templateId === 'payment-confirmed') {
                    const paidPdfPath = invoice.paid_pdf_storage_path || invoice.pdf_storage_path;
                    if (paidPdfPath) {
                        const { data: pdfData, error: pdfError } = await supabase
                            .storage.from('attachments').download(paidPdfPath);
                        if (!pdfError && pdfData && pdfData.size > 0) {
                            const arrayBuffer = await pdfData.arrayBuffer();
                            attachments.push({
                                filename: `${invoice.invoice_number}.pdf`,
                                content: new Uint8Array(arrayBuffer),
                                contentType: "application/pdf",
                            });
                            console.log(`- Auto-attached paid PDF: ${invoice.invoice_number}.pdf (${pdfData.size} bytes)`);
                        }
                    }
                    // Also attach ISDOC XML
                    if (invoice.xml_storage_path) {
                        const { data: xmlData, error: xmlError } = await supabase
                            .storage.from('attachments').download(invoice.xml_storage_path);
                        if (!xmlError && xmlData && xmlData.size > 0) {
                            const arrayBuffer = await xmlData.arrayBuffer();
                            attachments.push({
                                filename: `${invoice.invoice_number}.isdoc`,
                                content: new Uint8Array(arrayBuffer),
                                contentType: "application/xml",
                            });
                            console.log(`- Auto-attached ISDOC: ${invoice.invoice_number}.isdoc`);
                        }
                    }
                }
                // Auto-attach invoice PDF for order confirmation + payment reminders
                if (['invoice-notification', 'payment-reminder', 'payment-last-call'].includes(templateId) && invoice.pdf_storage_path) {
                    const { data: pdfData, error: pdfError } = await supabase
                        .storage.from('attachments').download(invoice.pdf_storage_path);
                    if (!pdfError && pdfData && pdfData.size > 0) {
                        const arrayBuffer = await pdfData.arrayBuffer();
                        attachments.push({
                            filename: `${invoice.invoice_number}.pdf`,
                            content: new Uint8Array(arrayBuffer),
                            contentType: "application/pdf",
                        });
                        console.log(`- Auto-attached invoice PDF: ${invoice.invoice_number}.pdf (${pdfData.size} bytes)`);
                    } else {
                        console.warn(`- Could not attach invoice PDF: ${pdfError?.message || 'no data'}`);
                    }
                }
            }
        }

        // 4. Substitution
        let body = template.body || "";
        let subject = template.subject || "";
        const formattedDate = formatEventDateRange(event.date, event.end_date);
        const vars: Record<string, string> = {
            '{{event_name}}': event.title || "LAVRS market",
            '{{event_date}}': formattedDate,
            '{{event_location}}': event.location || "",
            '{{contact_person}}': app.contact_person || "",
            '{{brand_name}}': app.brand_name || "",
            '{{payment_deadline}}': invoiceData?.due_date
                ? new Date(invoiceData.due_date).toLocaleDateString('cs-CZ')
                : (app.payment_deadline ? new Date(app.payment_deadline).toLocaleDateString('cs-CZ') : "N/A"),
            '{{invoice_amount}}': invoiceData?.amount_czk
                ? (invoiceData.amount_czk / 100).toLocaleString('cs-CZ') + ' K\u010d'
                : "Dle faktury",
            '{{invoice_number}}': invoiceData?.invoice_number || "",
            '{{zone_type}}': app.zone_category || "",
        };

        Object.entries(vars).forEach(([k, v]) => {
            body = body.split(k).join(v);
            subject = subject.split(k).join(v);
        });

        // Handle {{order_table}} for invoice templates
        let finalHtml: string;
        if ((templateId === 'invoice-notification' || templateId === 'payment-confirmed') && invoiceData) {
            const e = escapeHtml;
            const orderTableHtml = '<table style="width:100%;border-collapse:collapse;margin:15px 0;">'
                + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;width:40%;">Zna\u010dka</td><td style="padding:8px 12px;border:1px solid #efb2b7;">' + e(app.brand_name || '') + '</td></tr>'
                + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;">Event</td><td style="padding:8px 12px;border:1px solid #efb2b7;">' + e(event.title || '') + ' (' + e(formattedDate) + ')</td></tr>'
                + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;">Kategorie</td><td style="padding:8px 12px;border:1px solid #efb2b7;">' + e(app.zone_category || '') + '</td></tr>'
                + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;">\u010c\u00edslo</td><td style="padding:8px 12px;border:1px solid #efb2b7;">' + e(invoiceData.invoice_number || '') + '</td></tr>'
                + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;">\u010c\u00e1stka</td><td style="padding:8px 12px;border:1px solid #efb2b7;">' + (invoiceData.amount_czk ? (invoiceData.amount_czk / 100).toLocaleString('cs-CZ') + ' K\u010d' : '') + '</td></tr>'
                + '</table>';
            const ORDER_TABLE_PLACEHOLDER = '___ORDER_TABLE___';
            let processedBody = body.split('{{order_table}}').join(ORDER_TABLE_PLACEHOLDER);
            processedBody = escapeHtml(processedBody).replace(/\n/g, '<br>');
            processedBody = processedBody.split(ORDER_TABLE_PLACEHOLDER).join(orderTableHtml);
            finalHtml = getHtmlTemplate(template.name || "Sd\u011blen\u00ed", processedBody, true);
        } else {
            finalHtml = getHtmlTemplate(template.name || "Sd\u011blen\u00ed", body);
        }

        // 5. Send with nodemailer
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUsername,
                pass: smtpPassword,
            },
        });

        const mailAttachments = attachments.map(a => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
        }));

        // Payment/invoice emails go to billing_email (if set), others to contact email
        const recipientEmail = ['payment-reminder', 'payment-last-call', 'invoice-notification', 'payment-confirmed'].includes(templateId)
            ? (app.billing_email || app.email)
            : app.email;

        console.log(`Sending '${templateId}' to ${recipientEmail}...`);
        await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to: recipientEmail,
            subject: subject,
            html: finalHtml,
            attachments: mailAttachments.length > 0 ? mailAttachments : undefined,
        });

        console.log("Email sent successfully!");

        // For payment-confirmed (PAID) and order confirmation (invoice-notification), send admin + accounting copies
        if (templateId === 'payment-confirmed' || templateId === 'invoice-notification') {
            try {
                // For payment-confirmed: use same template for admin; for order: use admin-specific template
                const adminTemplateId = templateId === 'payment-confirmed' ? 'payment-confirmed' : 'invoice-notification-admin';
                const { data: adminTemplate } = await supabase
                    .from('email_templates')
                    .select('*')
                    .eq('id', adminTemplateId)
                    .single();

                if (adminTemplate && adminTemplate.enabled) {
                    let adminBody = adminTemplate.body || "";
                    let adminSubject = adminTemplate.subject || "";

                    // Build order table HTML for admin
                    const orderTableHtml = '<table style="width:100%;border-collapse:collapse;margin:15px 0;">'
                        + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;width:40%;">Zna\u010dka</td><td style="padding:8px 12px;border:1px solid #efb2b7;">' + (app.brand_name || '') + '</td></tr>'
                        + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;">Kontakt</td><td style="padding:8px 12px;border:1px solid #efb2b7;">' + (app.contact_person || '') + '</td></tr>'
                        + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;">Event</td><td style="padding:8px 12px;border:1px solid #efb2b7;">' + (event.title || '') + ' (' + formattedDate + ')</td></tr>'
                        + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;">Kategorie</td><td style="padding:8px 12px;border:1px solid #efb2b7;">' + (app.zone_category || '') + '</td></tr>'
                        + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;">\u010c\u00edslo objedn\u00e1vky</td><td style="padding:8px 12px;border:1px solid #efb2b7;">' + (invoiceData?.invoice_number || '') + '</td></tr>'
                        + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;">\u010c\u00e1stka</td><td style="padding:8px 12px;border:1px solid #efb2b7;">' + (invoiceData?.amount_czk ? (invoiceData.amount_czk / 100).toLocaleString('cs-CZ') + ' K\u010d' : '') + '</td></tr>'
                        + '</table>';

                    // Substitute variables + order_table
                    const ORDER_TABLE_PLACEHOLDER = '___ORDER_TABLE___';
                    Object.entries(vars).forEach(([k, v]) => {
                        adminBody = adminBody.split(k).join(v);
                        adminSubject = adminSubject.split(k).join(v);
                    });

                    // Prefix invoice number for admin + accounting emails (payment-confirmed only)
                    if (templateId === 'payment-confirmed' && invoiceData?.invoice_number) {
                        adminSubject = `\u010d. faktury ${invoiceData.invoice_number} - ${adminSubject}`;
                    }

                    adminBody = adminBody.split('{{order_table}}').join(ORDER_TABLE_PLACEHOLDER);
                    const escapedAdminBody = adminBody.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br>');
                    const adminBodyHtml = escapedAdminBody.split(ORDER_TABLE_PLACEHOLDER).join(orderTableHtml);
                    const adminHtml = getHtmlTemplate(adminTemplate.name || 'Nov\u00e1 objedn\u00e1vka', adminBodyHtml, true);

                    await transporter.sendMail({
                        from: `"${senderName}" <${senderEmail}>`,
                        to: adminEmail,
                        subject: adminSubject,
                        html: adminHtml,
                        attachments: mailAttachments.length > 0 ? mailAttachments : undefined,
                    });
                    console.log(`Admin notification sent to ${adminEmail}`);

                    // For payment-confirmed, also send to accounting email
                    if (templateId === 'payment-confirmed') {
                        const { data: companyData } = await supabase
                            .from('company_settings')
                            .select('accounting_email')
                            .eq('id', 'singleton')
                            .single();

                        if (companyData?.accounting_email) {
                            await transporter.sendMail({
                                from: `"${senderName}" <${senderEmail}>`,
                                to: companyData.accounting_email,
                                subject: adminSubject,
                                html: adminHtml,
                                attachments: mailAttachments.length > 0 ? mailAttachments : undefined,
                            });
                            console.log(`Accounting notification sent to ${companyData.accounting_email}`);
                        }
                    }
                }
            } catch (adminErr: any) {
                console.warn(`Failed to send admin/accounting notification: ${adminErr.message}`);
            }
        }

        return new Response(JSON.stringify({ message: "Done", template: templateId, recipient: recipientEmail }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (err: any) {
        console.error("Critical error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});
