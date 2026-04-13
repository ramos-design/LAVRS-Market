import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY")!;

/**
 * Generate paid invoice PDF (DAŇOVÝ DOKLAD format)
 * Called from send-email when payment is confirmed
 */
Deno.serve(async (req) => {
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
        const { applicationId, invoiceId } = payload;

        console.log(`[generate-paid-invoice] Generating paid invoice for app: ${applicationId}, invoice: ${invoiceId}`);

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Fetch invoice data
        let invoice = null;
        if (invoiceId) {
            const { data } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', invoiceId)
                .single();
            invoice = data;
        } else if (applicationId) {
            const { data } = await supabase
                .from('invoices')
                .select('*')
                .eq('application_id', applicationId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            invoice = data;
        }

        if (!invoice) {
            console.warn(`No invoice found for app ${applicationId}`);
            return new Response(
                JSON.stringify({ error: "Invoice not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // 2. Check if we already have a paid version
        const { data: paidInvoice } = await supabase
            .from('invoices')
            .select('*')
            .eq('application_id', applicationId)
            .eq('is_paid', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (paidInvoice && paidInvoice.pdf_storage_path) {
            console.log(`Paid invoice already exists: ${paidInvoice.invoice_number}`);
            return new Response(
                JSON.stringify({
                    message: "Paid invoice already generated",
                    invoiceNumber: paidInvoice.invoice_number,
                    storePath: paidInvoice.pdf_storage_path
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        // 3. For now, we'll return a message indicating that the frontend should generate the PDF
        // In a real scenario, we would generate PDF here using a headless browser or PDF library
        console.log(`[generate-paid-invoice] Invoice data retrieved. Marking for client-side PDF generation.`);

        return new Response(
            JSON.stringify({
                message: "PDF generation requires client-side rendering",
                invoiceId: invoice.id,
                applicationId: applicationId,
                invoiceNumber: invoice.invoice_number,
                isPaid: true,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err: any) {
        console.error("[generate-paid-invoice] Error:", err.message);
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
});
