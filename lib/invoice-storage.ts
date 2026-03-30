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
 * Uploads invoice PDF and XML to Storage, creates invoice record in DB,
 * and links it to the application.
 */
export async function saveInvoice(params: SaveInvoiceParams): Promise<DbInvoice> {
    const { result, applicationId, eventId } = params;
    const invoiceId = result.invoiceNumber;

    console.log('=== SAVING INVOICE ===', {
        invoiceNumber: result.invoiceNumber,
        applicationId,
        eventId,
        totalAmount: result.totalAmount,
        totalAmountCzk: result.totalAmount / 100,
        variableSymbol: result.variableSymbol,
        issuedDate: result.issuedDate,
    });

    try {
        // Check if invoice already exists
        const existingInvoice = await invoicesDb.getByInvoiceNumber(result.invoiceNumber);
        if (existingInvoice) {
            console.log('Invoice already exists:', result.invoiceNumber);
            return existingInvoice;
        }

        // 1. Upload PDF to Storage (skip if blob is empty/missing)
        const pdfPath = `invoices/${applicationId}/${result.invoiceNumber}.pdf`;
        let pdfUrl: string | null = null;

        if (result.pdfBlob && result.pdfBlob.size > 0) {
            const { error: pdfError } = await supabase.storage
                .from('attachments')
                .upload(pdfPath, result.pdfBlob, {
                    contentType: 'application/pdf',
                    upsert: true,
                });

            if (pdfError) {
                console.warn(`PDF upload failed (non-blocking): ${pdfError.message}`);
            } else {
                const { data: pdfUrlData } = supabase.storage
                    .from('attachments')
                    .getPublicUrl(pdfPath);
                pdfUrl = pdfUrlData?.publicUrl || null;
            }
        } else {
            console.warn('PDF blob is empty, skipping PDF upload');
        }

        // 2. Upload ISDOC XML to Storage
        const xmlPath = `invoices/${applicationId}/${result.invoiceNumber}.isdoc`;
        const xmlBlob = new Blob([result.xmlString], { type: 'application/xml' });
        const { error: xmlError } = await supabase.storage
            .from('attachments')
            .upload(xmlPath, xmlBlob, {
                contentType: 'application/xml',
                upsert: true,
            });

        if (xmlError) {
            throw new Error(`ISDOC XML upload failed: ${xmlError.message}`);
        }

        // Get public URL for XML
        const { data: xmlUrlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(xmlPath);
        const xmlUrl = xmlUrlData?.publicUrl || null;

        // 3. Create invoice record in DB
        const uniqueId = crypto.randomUUID(); // Generate unique ID instead of using invoice number
        const invoice = await invoicesDb.create({
            id: uniqueId,
            application_id: applicationId,
            event_id: eventId || null,
            invoice_number: result.invoiceNumber,
            amount_czk: result.totalAmount,
            issued_at: new Date(result.issuedDate + 'T00:00:00Z').toISOString(),
            due_date: new Date(result.dueDate + 'T00:00:00Z').toISOString(),
            variable_symbol: result.variableSymbol,
            pdf_storage_path: pdfPath,
            xml_storage_path: xmlPath,
            pdf_url: pdfUrl,
            xml_url: xmlUrl,
        });

        // 4. Link invoice to application (non-blocking if it fails)
        try {
            await applicationsDb.update(applicationId, {
                invoice_id: invoice.id,
            });
        } catch (linkErr) {
            console.warn('Failed to link invoice to application (non-blocking):', linkErr);
        }

        return invoice;
    } catch (error) {
        console.error('Failed to save invoice:', error);
        throw error;
    }
}

/**
 * Downloads invoice PDF as a file to the user's browser.
 */
export async function downloadInvoicePdf(invoiceNumber: string, pdfStoragePath: string) {
    try {
        const { data, error } = await supabase.storage
            .from('attachments')
            .download(pdfStoragePath);

        if (error) {
            throw new Error(`Download failed: ${error.message}`);
        }

        // Create a blob URL and trigger download
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Failed to download invoice PDF:', error);
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

        if (error) {
            throw new Error(`Download failed: ${error.message}`);
        }

        // Create a blob URL and trigger download
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
