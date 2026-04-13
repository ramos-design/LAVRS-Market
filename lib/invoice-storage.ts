/**
 * Invoice Storage
 * Uploads generated invoice assets to Supabase Storage and creates DB record
 */

import { supabase } from './supabase';
import { invoicesDb } from './database';
import { GeneratedInvoice } from './invoice-generator';
import { DbInvoice } from './database';

export interface SaveInvoiceParams {
    result: GeneratedInvoice;
    applicationId: string;
    eventId?: string;
}

/**
 * Phase 1: Creates invoice record in DB (without files).
 * This ensures the invoice exists even if PDF generation fails later.
 */
export async function saveInvoice(params: SaveInvoiceParams): Promise<DbInvoice> {
    const { result, applicationId, eventId } = params;

    console.log('=== SAVING INVOICE TO DB ===', {
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

        // Create invoice record in DB (no files yet)
        // Initially marked as NOT paid - will be updated when admin confirms payment
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
            pdf_storage_path: null,
            xml_storage_path: null,
            pdf_url: null,
            xml_url: null,
            is_paid: false, // Initially unpaid - set to true when admin confirms payment
        });

        console.log('=== INVOICE DB RECORD CREATED ===', {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            amountCzk: invoice.amount_czk,
        });

        // invoice_id is auto-linked to application via DB trigger (trg_link_invoice)

        return invoice;
    } catch (error) {
        console.error('Failed to save invoice:', error);
        throw error;
    }
}

export interface UpdateInvoiceFilesParams {
    invoiceId: string;
    invoiceNumber: string;
    applicationId: string;
    pdfBlob: Blob;
    xmlString?: string;
}

/**
 * Phase 2: Uploads PDF + XML to Storage and updates the invoice record with file URLs.
 * Called after saveInvoice() succeeds and PDF has been generated.
 */
export async function updateInvoiceFiles(params: UpdateInvoiceFilesParams): Promise<void> {
    const { invoiceId, invoiceNumber, applicationId, pdfBlob, xmlString } = params;

    try {
        let pdfUrl: string | null = null;
        let pdfPath: string | null = null;
        let xmlUrl: string | null = null;
        let xmlPath: string | null = null;

        // 1. Upload PDF
        if (pdfBlob && pdfBlob.size > 0) {
            pdfPath = `invoices/${applicationId}/${invoiceNumber}.pdf`;
            const { error: pdfError } = await supabase.storage
                .from('attachments')
                .upload(pdfPath, pdfBlob, {
                    contentType: 'application/pdf',
                    upsert: true,
                });

            if (pdfError) {
                console.warn(`PDF upload failed: ${pdfError.message}`);
            } else {
                const { data: pdfUrlData } = supabase.storage
                    .from('attachments')
                    .getPublicUrl(pdfPath);
                pdfUrl = pdfUrlData?.publicUrl || null;
            }
        }

        // 2. Upload ISDOC XML
        if (xmlString) {
            xmlPath = `invoices/${applicationId}/${invoiceNumber}.isdoc`;
            const xmlBlob = new Blob([xmlString], { type: 'application/xml' });
            const { error: xmlError } = await supabase.storage
                .from('attachments')
                .upload(xmlPath, xmlBlob, {
                    contentType: 'application/xml',
                    upsert: true,
                });

            if (xmlError) {
                console.warn(`ISDOC XML upload failed: ${xmlError.message}`);
            } else {
                const { data: xmlUrlData } = supabase.storage
                    .from('attachments')
                    .getPublicUrl(xmlPath);
                xmlUrl = xmlUrlData?.publicUrl || null;
            }
        }

        // 3. Update invoice record with file paths/URLs
        await invoicesDb.update(invoiceId, {
            pdf_storage_path: pdfPath,
            xml_storage_path: xmlPath,
            pdf_url: pdfUrl,
            xml_url: xmlUrl,
        });

        console.log('=== INVOICE FILES UPLOADED ===', { invoiceNumber, pdfUrl, xmlUrl });
    } catch (error) {
        console.warn('Failed to upload invoice files (DB record still exists):', error);
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
        a.download = `${invoiceNumber}.pdf`;
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
