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

const TEMPLATE_ID = "awaiting-order-reminder";

const corsHeaders = {
    "Access-Control-Allow-Origin": "https://rezervace.lavrsmarket.cz",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
        + '<p style="margin:0;font-size:15px;line-height:1.5;color:#b10014;font-weight:bold;border-top:1px solid #efb2b7;padding-top:15px;">Tým LAVRS market</p>'
        + '</td></tr>'
        + '<tr><td style="padding:0 40px 25px 40px;text-align:center;">'
        + '<p style="margin:0;font-size:12px;line-height:1.4;color:#b96d76;">Toto je automaticky generovaný e-mail. Prosíme, neodpovídejte na něj.</p>'
        + '</td></tr></table></td></tr></table></body></html>';
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const applicationId: string | undefined = payload?.applicationId;

        if (!applicationId) {
            return new Response(JSON.stringify({ error: "Missing applicationId" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`--- Awaiting Order Reminder requested for ${applicationId} ---`);

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: app, error: appError } = await supabase
            .from('applications')
            .select('*')
            .eq('id', applicationId)
            .single();

        if (appError || !app) {
            return new Response(JSON.stringify({ error: `Application not found: ${applicationId}` }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Refuse if exhibitor already completed the payment process (has an invoice)
        if (app.invoice_id) {
            return new Response(JSON.stringify({
                error: "Application already has an invoice; use payment-reminder instead.",
                invoiceId: app.invoice_id,
            }), {
                status: 409,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', app.event_id)
            .single();

        if (eventError || !event) {
            return new Response(JSON.stringify({ error: `Event not found: ${app.event_id}` }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { data: template, error: tmplError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('id', TEMPLATE_ID)
            .single();

        if (tmplError || !template) {
            return new Response(JSON.stringify({ error: `Template '${TEMPLATE_ID}' not found.` }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (!template.enabled) {
            return new Response(JSON.stringify({ message: "Template disabled" }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        let body = template.body || "";
        let subject = template.subject || "";
        const formattedDate = formatEventDateRange(event.date, event.end_date);
        const vars: Record<string, string> = {
            '{{event_name}}': event.title || "LAVRS market",
            '{{event_date}}': formattedDate,
            '{{event_location}}': event.location || "",
            '{{contact_person}}': app.contact_person || "",
            '{{brand_name}}': app.brand_name || "",
            '{{payment_deadline}}': app.payment_deadline
                ? new Date(app.payment_deadline).toLocaleDateString('cs-CZ')
                : "N/A",
            '{{zone_type}}': app.zone_category || "",
        };

        Object.entries(vars).forEach(([k, v]) => {
            body = body.split(k).join(v);
            subject = subject.split(k).join(v);
        });

        const finalHtml = getHtmlTemplate(template.name || "Připomenutí objednávky", body);

        // Awaiting-order reminder goes to billing email if set, otherwise contact email
        const recipientEmail = app.billing_email || app.email;

        if (!recipientEmail) {
            return new Response(JSON.stringify({ error: "No recipient email on application" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUsername,
                pass: smtpPassword,
            },
        });

        console.log(`Sending '${TEMPLATE_ID}' to ${recipientEmail}...`);
        await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to: recipientEmail,
            subject: subject,
            html: finalHtml,
        });

        console.log("Awaiting-order reminder sent successfully!");

        return new Response(
            JSON.stringify({ message: "Done", template: TEMPLATE_ID, recipient: recipientEmail }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err: any) {
        console.error("Critical error:", err.message);
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
