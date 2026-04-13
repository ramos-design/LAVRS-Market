import nodemailer from "npm:nodemailer@6";

const smtpHost = Deno.env.get("SMTP_HOST")!;
const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
const smtpUsername = Deno.env.get("SMTP_USERNAME")!;
const smtpPassword = Deno.env.get("SMTP_PASSWORD")!;
const senderEmail = Deno.env.get("SENDER_EMAIL") || "lavrs@lavrs.cz";
const senderName = Deno.env.get("SENDER_NAME") || "LAVRS market";

const TEST_RECIPIENT = "lavrs@lavrs.cz";

const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function buildEmailHtml(title: string, brandName: string, contactPerson: string, eventName: string, eventDate: string, zoneCategory: string, invoiceNumber: string, totalAmountCzk: string, recipientType: string): string {
    const e = escapeHtml;
    const isAdmin = recipientType === 'admin';
    const footerText = isAdmin
        ? '<p>V p\u0159\u00edloze najdete vygenerovanou objedn\u00e1vku (PDF).</p>'
        : '<p>V p\u0159\u00edloze najdete vygenerovanou objedn\u00e1vku (PDF).</p>'
        + '<p>Pokud jste tuto objedn\u00e1vku ji\u017e zaplatili, tento e-mail pros\u00edm ignorujte.</p>'
        + '<p>Jakmile t\u00fdm LAVRS market schv\u00e1l\u00ed Va\u0161i platbu, obdr\u017e\u00edte fakturu e-mailem a budete informov\u00e1ni o za\u0159azen\u00ed do eventu.</p>';
    // Compact HTML — no indentation to avoid SMTP quoted-printable =20 artifacts
    return '<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>' + e(title) + '</title></head>'
    + '<body style="margin:0;padding:0;background-color:#e8b8b8;font-family:Arial,Helvetica,sans-serif;">'
    + '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#e8b8b8;">'
    + '<tr><td align="center" style="padding:30px 10px;">'
    + '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#f6d7d7;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.1);">'
    + '<tr><td style="background-color:#e30613;padding:25px 30px;text-align:center;">'
    + '<div style="color:#ffffff;font-size:28px;font-weight:900;letter-spacing:1px;">LAVRS market</div>'
    + '</td></tr>'
    + '<tr><td style="padding:35px 40px;text-align:left;">'
    + '<h1 style="margin:0 0 20px 0;font-size:24px;line-height:1.2;color:#e30613;font-weight:bold;text-align:center;">' + e(title) + '</h1>'
    + '<div style="font-size:16px;line-height:1.6;color:#b10014;margin-bottom:25px;">'
    + '<p><strong>Nov\u00e1 objedn\u00e1vka na LAVRS market!</strong></p>'
    + '<table style="width:100%;border-collapse:collapse;margin:15px 0;">'
    + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;width:40%;">Zna\u010dka</td>'
    + '<td style="padding:8px 12px;border:1px solid #efb2b7;">' + e(brandName || '\u2014') + '</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;">Kontaktn\u00ed osoba</td>'
    + '<td style="padding:8px 12px;border:1px solid #efb2b7;">' + e(contactPerson || '\u2014') + '</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;">Event</td>'
    + '<td style="padding:8px 12px;border:1px solid #efb2b7;">' + e(eventName || '\u2014') + ' (' + e(eventDate || '\u2014') + ')</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;">Kategorie</td>'
    + '<td style="padding:8px 12px;border:1px solid #efb2b7;">' + e(zoneCategory || '\u2014') + '</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;">\u010c\u00edslo objedn\u00e1vky</td>'
    + '<td style="padding:8px 12px;border:1px solid #efb2b7;">' + e(invoiceNumber || '\u2014') + '</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #efb2b7;font-weight:bold;">\u010c\u00e1stka</td>'
    + '<td style="padding:8px 12px;border:1px solid #efb2b7;">' + e(totalAmountCzk || '\u2014') + ' K\u010d</td></tr>'
    + '</table>'
    + footerText
    + '</div>'
    + '<p style="margin:0;font-size:15px;line-height:1.5;color:#b10014;font-weight:bold;border-top:1px solid #efb2b7;padding-top:15px;">T\u00fdm LAVRS market</p>'
    + '</td></tr>'
    + '<tr><td style="padding:0 40px 25px 40px;text-align:center;">'
    + '<p style="margin:0;font-size:12px;line-height:1.4;color:#b96d76;">Toto je automaticky generovan\u00fd e-mail.</p>'
    + '</td></tr>'
    + '</table></td></tr></table></body></html>';
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "https://rezervace.lavrsmarket.cz",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        const payload = await req.json();
        const {
            brandName,
            contactPerson,
            eventName,
            eventDate,
            zoneCategory,
            invoiceNumber,
            totalAmountCzk,
            pdfBase64,
            xmlString,
            recipientEmail,
            recipientType,
        } = payload;

        const recipient = recipientEmail || TEST_RECIPIENT;

        console.log(`--- Invoice Notification ---`);
        console.log(`Brand: ${brandName}, Event: ${eventName}, Category: ${zoneCategory}`);
        console.log(`Invoice: ${invoiceNumber}, Amount: ${totalAmountCzk}`);
        console.log(`Recipient: ${recipient}, Type: ${recipientType || 'unknown'}`);
        console.log(`PDF base64 length: ${pdfBase64?.length || 0}`);
        console.log(`XML length: ${xmlString?.length || 0}`);

        const subject = `Nov\u00e1 objedn\u00e1vka: ${brandName} \u2014 ${eventName} (${zoneCategory})`;
        const finalHtml = buildEmailHtml(
            "Nov\u00e1 objedn\u00e1vka",
            brandName, contactPerson, eventName, eventDate,
            zoneCategory, invoiceNumber, totalAmountCzk,
            recipientType || 'exhibitor'
        );

        const attachments: { filename: string; content: Uint8Array; contentType: string }[] = [];

        if (pdfBase64 && pdfBase64.length > 100) {
            attachments.push({
                filename: `${invoiceNumber || "objednavka"}.pdf`,
                content: base64ToUint8Array(pdfBase64),
                contentType: "application/pdf",
            });
            console.log(`PDF attachment: ${pdfBase64.length} base64 chars`);
        } else {
            console.warn("PDF base64 missing or too short, skipping attachment");
        }

        if (xmlString && xmlString.length > 10) {
            const encoder = new TextEncoder();
            attachments.push({
                filename: `${invoiceNumber || "objednavka"}.isdoc`,
                content: encoder.encode(xmlString),
                contentType: "application/xml",
            });
            console.log(`ISDOC XML attachment: ${xmlString.length} chars`);
        } else {
            console.warn("XML string missing or too short, skipping attachment");
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

        const mailAttachments = attachments.map(a => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
        }));

        await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to: recipient,
            subject,
            html: finalHtml,
            attachments: mailAttachments.length > 0 ? mailAttachments : undefined,
        });

        console.log("Invoice notification email sent successfully!");

        return new Response(
            JSON.stringify({ message: "Invoice notification sent", recipient, attachmentCount: attachments.length }),
            { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://rezervace.lavrsmarket.cz" } }
        );
    } catch (err: any) {
        console.error("Error sending invoice notification:", err.message);
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://rezervace.lavrsmarket.cz" } }
        );
    }
});
