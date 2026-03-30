import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const smtpHost = Deno.env.get("SMTP_HOST")!;
const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
const smtpUsername = Deno.env.get("SMTP_USERNAME")!;
const smtpPassword = Deno.env.get("SMTP_PASSWORD")!;
const senderEmail = Deno.env.get("SENDER_EMAIL") || "info@lavrs.cz";
const senderName = Deno.env.get("SENDER_NAME") || "LAVRS market";

// Test recipient — change to dynamic after testing
const TEST_RECIPIENT = "info@lavrs.cz";

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

const getHtmlTemplate = (title: string, bodyHtml: string) => `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#e8b8b8; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#e8b8b8;">
    <tr>
      <td align="center" style="padding:30px 10px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; background-color:#f6d7d7; border-radius:12px; overflow:hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#e30613; padding:25px 30px; text-align:center;">
              <div style="color:#ffffff; font-size:28px; font-weight:900; letter-spacing:1px;">
                LAVRS market
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:35px 40px; text-align:left;">
              <h1 style="margin:0 0 20px 0; font-size:24px; line-height:1.2; color:#e30613; font-weight:bold; text-align:center;">
                ${title}
              </h1>
              <div style="font-size:16px; line-height:1.6; color:#b10014; margin-bottom:25px;">
                ${bodyHtml}
              </div>
              <p style="margin:0; font-size:15px; line-height:1.5; color:#b10014; font-weight:bold; border-top: 1px solid #efb2b7; padding-top: 15px;">
                Tym LAVRS market
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 25px 40px; text-align:center;">
              <p style="margin:0; font-size:12px; line-height:1.4; color:#b96d76;">
                Toto je automaticky generovany e-mail.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
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
        } = payload;

        const recipient = recipientEmail || TEST_RECIPIENT;

        console.log(`--- Invoice Notification ---`);
        console.log(`Brand: ${brandName}, Event: ${eventName}, Category: ${zoneCategory}`);
        console.log(`Invoice: ${invoiceNumber}, Amount: ${totalAmountCzk} CZK`);
        console.log(`Recipient: ${recipient}`);

        // Build email body
        const bodyHtml = `
            <p><strong>Nova objednavka na LAVRS market!</strong></p>
            <table style="width:100%; border-collapse:collapse; margin:15px 0;">
                <tr>
                    <td style="padding:8px 12px; border:1px solid #efb2b7; font-weight:bold; width:40%;">Znacka</td>
                    <td style="padding:8px 12px; border:1px solid #efb2b7;">${brandName || "—"}</td>
                </tr>
                <tr>
                    <td style="padding:8px 12px; border:1px solid #efb2b7; font-weight:bold;">Kontaktni osoba</td>
                    <td style="padding:8px 12px; border:1px solid #efb2b7;">${contactPerson || "—"}</td>
                </tr>
                <tr>
                    <td style="padding:8px 12px; border:1px solid #efb2b7; font-weight:bold;">Event</td>
                    <td style="padding:8px 12px; border:1px solid #efb2b7;">${eventName || "—"} (${eventDate || "—"})</td>
                </tr>
                <tr>
                    <td style="padding:8px 12px; border:1px solid #efb2b7; font-weight:bold;">Kategorie</td>
                    <td style="padding:8px 12px; border:1px solid #efb2b7;">${zoneCategory || "—"}</td>
                </tr>
                <tr>
                    <td style="padding:8px 12px; border:1px solid #efb2b7; font-weight:bold;">Cislo faktury</td>
                    <td style="padding:8px 12px; border:1px solid #efb2b7;">${invoiceNumber || "—"}</td>
                </tr>
                <tr>
                    <td style="padding:8px 12px; border:1px solid #efb2b7; font-weight:bold;">Castka</td>
                    <td style="padding:8px 12px; border:1px solid #efb2b7;">${totalAmountCzk || "—"} Kc</td>
                </tr>
            </table>
            <p>V priloze najdete vygenerovanou fakturu (PDF) a ISDOC XML soubor.</p>
        `;

        const subject = `Nova objednavka: ${brandName} — ${eventName} (${zoneCategory})`;
        const finalHtml = getHtmlTemplate("Nova objednavka", bodyHtml);

        // Prepare attachments
        const attachments: any[] = [];

        if (pdfBase64) {
            attachments.push({
                filename: `${invoiceNumber || "faktura"}.pdf`,
                content: base64ToUint8Array(pdfBase64),
                contentType: "application/pdf",
                encoding: "binary" as const,
            });
            console.log("PDF attachment added");
        }

        if (xmlString) {
            const encoder = new TextEncoder();
            attachments.push({
                filename: `${invoiceNumber || "faktura"}.isdoc`,
                content: encoder.encode(xmlString),
                contentType: "application/xml",
                encoding: "binary" as const,
            });
            console.log("ISDOC XML attachment added");
        }

        // Send via SMTP
        const client = new SMTPClient({
            connection: {
                hostname: smtpHost,
                port: smtpPort,
                tls: smtpPort === 465,
                auth: {
                    username: smtpUsername,
                    password: smtpPassword,
                },
            },
        });

        await client.send({
            from: { name: senderName, mail: senderEmail },
            to: recipient,
            subject,
            html: finalHtml,
            attachments: attachments.length > 0 ? attachments : undefined,
        });

        await client.close();
        console.log("Invoice notification email sent successfully!");

        return new Response(
            JSON.stringify({ message: "Invoice notification sent", recipient }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    } catch (err: any) {
        console.error("Error sending invoice notification:", err.message);
        return new Response(
            JSON.stringify({ error: err.message }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }
});
