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
const getHtmlTemplate = (title: string, bodyText: string) => {
    const safeTitle = escapeHtml(title);
    const formattedBody = escapeHtml(bodyText).replace(/\n/g, '<br>');
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
                else if (newStatus === 'REJECTED') templateId = 'application-rejected';
                else if (newStatus === 'PAID') templateId = 'payment-confirmed';
                else if (newStatus === 'PAYMENT_UNDER_REVIEW') templateId = 'payment-submitted';
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

        // 3b. Auto-attach invoice PDF for payment-submitted / payment-confirmed templates
        let invoiceData: { amount_czk?: number; invoice_number?: string; due_date?: string } | null = null;
        if (templateId === 'payment-submitted' || templateId === 'payment-confirmed') {
            // Try by invoice_id first, then fall back to application_id lookup
            let invoice = null;
            if (app.invoice_id) {
                const { data } = await supabase
                    .from('invoices')
                    .select('*')
                    .eq('id', app.invoice_id)
                    .single();
                invoice = data;
            }
            if (!invoice) {
                const { data } = await supabase
                    .from('invoices')
                    .select('*')
                    .eq('application_id', app.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                invoice = data;
                if (invoice) {
                    console.log(`Invoice found by application_id fallback: ${invoice.invoice_number}`);
                }
            }

            if (invoice) {
                invoiceData = invoice;

                // For payment-confirmed (PAID), prefer the paid PDF (DAŇOVÝ DOKLAD) if available
                const pdfPath = (templateId === 'payment-confirmed' && invoice.paid_pdf_storage_path)
                    ? invoice.paid_pdf_storage_path
                    : invoice.pdf_storage_path;

                if (pdfPath) {
                    const { data: pdfData, error: pdfError } = await supabase
                        .storage
                        .from('attachments')
                        .download(pdfPath);

                    if (!pdfError && pdfData && pdfData.size > 0) {
                        const arrayBuffer = await pdfData.arrayBuffer();
                        attachments.push({
                            filename: `${invoice.invoice_number}.pdf`,
                            content: new Uint8Array(arrayBuffer),
                            contentType: "application/pdf",
                        });
                        console.log(`- Auto-attached invoice PDF: ${invoice.invoice_number}.pdf (${pdfData.size} bytes, path: ${pdfPath})`);
                    } else {
                        console.warn(`- Could not attach invoice PDF: ${pdfError?.message || 'Unknown error'}`);
                    }
                }

                // For payment-confirmed, also attach ISDOC XML (e-doklad)
                if (templateId === 'payment-confirmed' && invoice.xml_storage_path) {
                    const { data: xmlData, error: xmlError } = await supabase
                        .storage
                        .from('attachments')
                        .download(invoice.xml_storage_path);

                    if (!xmlError && xmlData && xmlData.size > 0) {
                        const arrayBuffer = await xmlData.arrayBuffer();
                        attachments.push({
                            filename: `${invoice.invoice_number}.isdoc`,
                            content: new Uint8Array(arrayBuffer),
                            contentType: "application/xml",
                        });
                        console.log(`- Auto-attached ISDOC XML: ${invoice.invoice_number}.isdoc (${xmlData.size} bytes)`);
                    } else {
                        console.warn(`- Could not attach ISDOC XML: ${xmlError?.message || 'Unknown error'}`);
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

        const finalHtml = getHtmlTemplate(template.name || "Sd\u011blen\u00ed", body);

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

        console.log(`Sending '${templateId}' to ${app.email}...`);
        await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to: app.email,
            subject: subject,
            html: finalHtml,
            attachments: mailAttachments.length > 0 ? mailAttachments : undefined,
        });

        console.log("Email sent successfully!");

        // 6. Auto-send invoice notification for payment-confirmed (without PDF attachment)
        // Application will generate paid invoice (DAŇOVÝ DOKLAD) on client side
        if (templateId === 'payment-confirmed') {
            console.log(`For payment-confirmed, sending invoice notification email...`);
            try {
                // Send invoice notification with payment confirmation flag
                // No PDF in email - it will be generated in the application
                const invoiceNotificationPayload = {
                    brandName: app.brand_name,
                    contactPerson: app.contact_person,
                    eventName: event.title,
                    eventDate: event.date,
                    eventEndDate: event.end_date || null,
                    zoneCategory: app.zone_category,
                    invoiceNumber: invoiceData?.invoice_number || 'N/A',
                    totalAmountCzk: invoiceData?.amount_czk ? (invoiceData.amount_czk / 100).toFixed(2) : '0',
                    recipientEmail: app.email,
                    recipientType: 'exhibitor',
                    isPaymentConfirmed: true, // Signal: this is a PAID invoice email, no PDF attachment
                };

                const invoiceRes = await fetch('https://wllstifewvjtdrzfgbxj.supabase.co/functions/v1/send-invoice-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoiceNotificationPayload),
                });

                if (!invoiceRes.ok) {
                    console.warn(`send-invoice-notification returned ${invoiceRes.status}: ${await invoiceRes.text()}`);
                } else {
                    console.log(`send-invoice-notification (payment-confirmed) sent successfully`);
                }
            } catch (invoiceErr: any) {
                console.warn(`Failed to send invoice notification: ${invoiceErr.message}`, 'continuing...');
            }
        }

        // 7. Send admin notification if payment is confirmed
        if (templateId === 'payment-confirmed') {
            console.log(`Sending 'payment-approved-admin' to admin (${adminEmail})...`);
            try {
                const { data: adminTemplate, error: adminTmplError } = await supabase
                    .from('email_templates')
                    .select('*')
                    .eq('id', 'payment-approved-admin')
                    .single();

                if (!adminTmplError && adminTemplate && adminTemplate.enabled) {
                    let adminBody = adminTemplate.body || "";
                    let adminSubject = adminTemplate.subject || "";

                    Object.entries(vars).forEach(([k, v]) => {
                        adminBody = adminBody.split(k).join(v);
                        adminSubject = adminSubject.split(k).join(v);
                    });

                    const adminHtml = getHtmlTemplate(adminTemplate.name || "Ověřená platba", adminBody);

                    await transporter.sendMail({
                        from: `"${senderName}" <${senderEmail}>`,
                        to: adminEmail,
                        subject: adminSubject,
                        html: adminHtml,
                        attachments: mailAttachments.length > 0 ? mailAttachments : undefined,
                    });

                    console.log("Admin notification sent successfully!");
                } else {
                    console.log("Admin template 'payment-approved-admin' not found or disabled. Skipping admin notification.");
                }
            } catch (adminErr: any) {
                console.warn(`Failed to send admin notification: ${adminErr.message}`);
            }
        }

        return new Response(JSON.stringify({ message: "Done" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (err: any) {
        console.error("Critical error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});
