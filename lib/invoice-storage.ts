/**
 * Invoice Storage
 * Uploads generated invoice assets to Supabase Storage and creates DB record
 */

import { supabase } from './supabase';
import { invoicesDb, applicationsDb } from './database';
import { GeneratedInvoice } from './invoice-generator';
import { DbInvoice } from './database';

export interface SaveInvoiceParams {
    result: GeneratedInvoice;
    applicationId: string;
    eventId?: string;
}

/**
 * Uploads invoice HTML and ISDOC XML to Storage, creates invoice record in DB,
 * and links it to the application.
 */
export async function saveInvoice(params: SaveInvoiceParams): Promise<DbInvoice> {
    const { result, applicationId, eventId } = params;

    console.log('=== SAVING INVOICE ===', {
        invoiceNumber: result.invoiceNumber,
        applicationId,
        eventId,
        totalAmountWithDph: result.totalAmountWithDph,
        variableSymbol: result.variableSymbol,
        issuedDate: result.issuedDate,
        dueDate: result.dueDate,
    });

    try {
        // Check if invoice already exists
        const existingInvoice = await invoicesDb.getByInvoiceNumber(result.invoiceNumber);
        if (existingInvoice) {
            console.log('Invoice already exists:', result.invoiceNumber);
            return existingInvoice;
        }

        // 1. Upload HTML invoice to Storage
        const htmlPath = `invoices/${applicationId}/${result.invoiceNumber}.html`;
        let pdfUrl: string | null = null;

        if (result.pdfBlob && result.pdfBlob.size > 0) {
            const { error: htmlError } = await supabase.storage
                .from('attachments')
                .upload(htmlPath, result.pdfBlob, {
                    contentType: 'text/html',
                    upsert: true,
                });

            if (htmlError) {
                console.warn(`HTML invoice upload failed (non-blocking): ${htmlError.message}`);
            } else {
                const { data: htmlUrlData } = supabase.storage
                    .from('attachments')
                    .getPublicUrl(htmlPath);
                pdfUrl = htmlUrlData?.publicUrl || null;
            }
        } else {
            console.warn('Invoice HTML blob is empty, skipping upload');
        }

        // 2. Upload ISDOC XML to Storage
        const xmlPath = `invoices/${applicationId}/${result.invoiceNumber}.isdoc`;
        let xmlUrl: string | null = null;

        if (result.xmlString) {
            const xmlBlob = new Blob([result.xmlString], { type: 'application/xml' });
            const { error: xmlError } = await supabase.storage
                .from('attachments')
                .upload(xmlPath, xmlBlob, {
                    contentType: 'application/xml',
                    upsert: true,
                });

            if (xmlError) {
                console.warn(`ISDOC XML upload failed (non-blocking): ${xmlError.message}`);
            } else {
                const { data: xmlUrlData } = supabase.storage
                    .from('attachments')
                    .getPublicUrl(xmlPath);
                xmlUrl = xmlUrlData?.publicUrl || null;
            }
        }

        // 3. Create invoice record in DB
        // amount_czk = total WITH DPH in halers (what customer pays)
        const uniqueId = crypto.randomUUID();
        const invoice = await invoicesDb.create({
            id: uniqueId,
            application_id: applicationId,
            event_id: eventId || null,
            invoice_number: result.invoiceNumber,
            amount_czk: result.totalAmountWithDph,
            issued_at: result.issuedDate,
            due_date: result.dueDate,
            variable_symbol: result.variableSymbol,
            pdf_storage_path: htmlPath,
            xml_storage_path: xmlPath,
            pdf_url: pdfUrl,
            xml_url: xmlUrl,
        });

        console.log('=== INVOICE SAVED ===', {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            amountCzk: invoice.amount_czk,
            pdfUrl,
            xmlUrl,
        });

        // 4. Link invoice to application (non-blocking)
        try {
            await applicationsDb.update(applicationId, {
                invoice_id: invoice.id,
            });
        } catch (linkErr) {
            console.warn('Failed to link invoice to application:', linkErr);
        }

        return invoice;
    } catch (error) {
        console.error('Failed to save invoice:', error);
        throw error;
    }
}

/**
 * Downloads invoice HTML as a file to the user's browser.
 */
export async function downloadInvoicePdf(invoiceNumber: string, pdfStoragePath: string) {
    try {
        const { data, error } = await supabase.storage
            .from('attachments')
            .download(pdfStoragePath);

        if (error) throw new Error(`Download failed: ${error.message}`);

        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoiceNumber}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Failed to download invoice:', error);
        throw error;
    }
}

/**
 * Downloads invoice ISDOC XML as a file to the user's browser.
 */
export async function downloadInvoiceXml(invoiceNumber: string, xmlStoragePath: string) {
    try {
        const { data, error } = await supabase.storage
            .from('attachments')
            .download(xmlStoragePath);

        if (error) throw new Error(`Download failed: ${error.message}`);

        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoiceNumber}.isdoc`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Failed to download invoice XML:', error);
        throw error;
    }
}
