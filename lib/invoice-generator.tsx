/**
 * Invoice Generator
 * Orchestrates PDF + ISDOC XML generation from application data.
 * Calculates 21% DPH (VAT) per Czech tax law (zákon č. 235/2004 Sb.).
 */

import React from 'react';
import { Application, MarketEvent, EventPlan, CompanySettings } from '../types';
import { generateQrPayment } from './qr-payment';
import { buildIsdocXml } from './isdoc';
import { calculateInvoiceNumber, getApplicationSequenceForEvent } from './invoice-number';
import type { InvoiceLineItem } from '../components/InvoicePdf';

const DPH_RATE = 21; // %

export interface GenerateInvoiceParams {
    application: Application;
    event: MarketEvent;
    eventPlan: EventPlan;
    selectedExtraIds: string[];
    companySettings: CompanySettings;
    allApplications: Application[];
}

export interface GeneratedInvoice {
    pdfBlob: Blob;
    xmlString: string;
    invoiceNumber: string;
    totalAmount: number;       // in halers, base WITHOUT DPH
    totalAmountWithDph: number; // in halers, WITH DPH
    taxAmount: number;          // in halers, DPH only
    variableSymbol: string;
    qrDataUrl: string;
    spaydString: string;
    issuedDate: string;
    dueDate: string;
}

function getVariableSymbol(application: Application, event: MarketEvent): string {
    const date = new Date(event.date);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const icoFirst6 = (application.ic || '000000').replace(/\D/g, '').substring(0, 6).padEnd(6, '0');
    return `${dd}${mm}${icoFirst6}`;
}

/**
 * Parse price string like "6.900 Kč", "6 900 Kč" or "4900" to whole CZK number.
 * Czech prices use dot/space as thousands separator, NOT decimal.
 */
function parsePriceCzk(priceStr: string): number {
    // Remove everything except digits — "6.900 Kč" → "6900", "6 900 Kč" → "6900"
    const digits = priceStr.replace(/[^\d]/g, '');
    return parseInt(digits, 10) || 0;
}

/**
 * Build line items with DPH rate.
 */
function buildLineItems(
    application: Application,
    event: MarketEvent,
    eventPlan: EventPlan,
    selectedExtraIds: string[]
): InvoiceLineItem[] {
    const items: InvoiceLineItem[] = [];

    // Base price for zone category
    if (application.zoneCategory && eventPlan.prices?.[application.zoneCategory]) {
        const priceCzk = parsePriceCzk(eventPlan.prices[application.zoneCategory]);
        if (priceCzk > 0) {
            // Format event date for item description
            const eventDate = new Date(event.date);
            const dd = String(eventDate.getDate()).padStart(2, '0');
            const mm = String(eventDate.getMonth() + 1).padStart(2, '0');
            const yyyy = eventDate.getFullYear();
            items.push({
                description: `Vystavovatelský poplatek včetně inventáře na LAVRS Market ${dd}.${mm}.${yyyy}`,
                quantity: 1,
                unitPriceCzk: priceCzk,
                dphRate: DPH_RATE,
            });
        }
    }

    // Extra items
    selectedExtraIds.forEach((extraId) => {
        const extra = eventPlan.extras?.find((e) => e.id === extraId);
        if (extra) {
            const priceCzk = parsePriceCzk(extra.price);
            if (priceCzk > 0) {
                items.push({
                    description: extra.label,
                    quantity: 1,
                    unitPriceCzk: priceCzk,
                    dphRate: DPH_RATE,
                });
            }
        }
    });

    return items;
}

/**
 * Phase 1: Fast — calculates all numbers, QR, XML. No PDF rendering.
 * Returns everything except pdfBlob (null).
 */
export async function prepareInvoiceData(params: GenerateInvoiceParams): Promise<GeneratedInvoice> {
    const {
        application,
        event,
        eventPlan,
        selectedExtraIds,
        companySettings,
        allApplications,
    } = params;

    // 1. Invoice number & sequence
    const invoiceNumber = calculateInvoiceNumber(application, allApplications, event);
    const sequenceNumber = getApplicationSequenceForEvent(application, allApplications);

    // 2. Dates
    const issuedDate = new Date().toISOString().split('T')[0];
    const taxPointDate = issuedDate; // datum uskutečnění zdanitelného plnění = datum vystavení
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (companySettings.invoiceDueDays ?? 14));
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // 3. Line items with DPH
    const lineItems = buildLineItems(application, event, eventPlan, selectedExtraIds);
    const variableSymbol = getVariableSymbol(application, event);

    // 4. Calculate totals
    let totalBaseCzk = 0;
    let totalTaxCzk = 0;
    lineItems.forEach((item) => {
        const lineBase = item.unitPriceCzk * item.quantity;
        const lineTax = Math.round(lineBase * (item.dphRate / 100) * 100) / 100;
        totalBaseCzk += lineBase;
        totalTaxCzk += lineTax;
    });
    const totalWithDphCzk = Math.round((totalBaseCzk + totalTaxCzk) * 100) / 100;

    // Convert to halers for storage (backward compat)
    const totalAmountHalers = Math.round(totalBaseCzk * 100);
    const taxAmountHalers = Math.round(totalTaxCzk * 100);
    const totalWithDphHalers = Math.round(totalWithDphCzk * 100);

    // 5. Generate QR code — amount in QR is the TOTAL WITH DPH (what the customer pays)
    // Message includes event name + date (max 60 chars per SPAYD spec)
    const eventDate = new Date(event.date);
    const eventDd = String(eventDate.getDate()).padStart(2, '0');
    const eventMm = String(eventDate.getMonth() + 1).padStart(2, '0');
    const eventYyyy = eventDate.getFullYear();
    const category = application.zoneCategory || '';
    const qrMessage = `${event.title} ${eventDd}.${eventMm}.${eventYyyy} ${category}`.trim().substring(0, 60);

    const bankAccount = companySettings.bankAccount || '';
    const bankIban = companySettings.bankIban || '';

    const { spayd: spaydString, qrDataUrl } = await generateQrPayment({
        iban: bankIban,
        amount: totalWithDphHalers,
        variableSymbol,
        message: qrMessage,
    });

    // 6. Generate ISDOC XML
    const xmlString = buildIsdocXml({
        invoiceNumber,
        issuedDate,
        taxPointDate,
        dueDate: dueDateStr,
        variableSymbol,
        issuer: {
            name: companySettings.companyName || 'LAVRS market',
            address: companySettings.companyAddress || '',
            ic: companySettings.ic || '00000000',
            dic: companySettings.dic,
        },
        customer: {
            name: application.billingName,
            address: application.billingAddress,
            ic: application.ic,
            dic: application.dic,
            email: application.billingEmail,
        },
        lineItems: lineItems.map((item, idx) => ({
            id: String(idx + 1),
            description: item.description,
            quantity: item.quantity,
            unitPriceCzk: item.unitPriceCzk,
            dphRate: item.dphRate,
        })),
        totalBaseCzk,
        totalTaxCzk,
        totalWithDphCzk,
        bankAccount,
        bankIban,
    });

    // PDF is NOT generated here — use generateInvoicePdf() separately
    return {
        pdfBlob: new Blob(), // placeholder, will be replaced by generateInvoicePdf
        xmlString,
        invoiceNumber,
        totalAmount: totalAmountHalers,
        totalAmountWithDph: totalWithDphHalers,
        taxAmount: taxAmountHalers,
        variableSymbol,
        qrDataUrl,
        spaydString,
        issuedDate,
        dueDate: dueDateStr,
        // Store params needed for PDF generation
        _pdfParams: {
            invoiceNumber,
            sequenceNumber,
            issuedDate,
            taxPointDate,
            dueDate: dueDateStr,
            variableSymbol,
            companySettings,
            application,
            lineItems,
            qrDataUrl,
            bankAccount,
            bankIban,
        },
    } as GeneratedInvoice;
}

/**
 * Phase 2: Slow — renders the PDF. Call after prepareInvoiceData().
 */
export async function generateInvoicePdf(invoiceData: GeneratedInvoice): Promise<Blob> {
    const p = (invoiceData as any)._pdfParams;
    if (!p) throw new Error('Missing PDF params — call prepareInvoiceData first');

    const reactPdf = await import('@react-pdf/renderer');
    const invoicePdfModule = await import('../components/InvoicePdf');
    const InvoicePdfComponent = invoicePdfModule.default;

    const props = {
        invoiceNumber: p.invoiceNumber,
        sequenceNumber: p.sequenceNumber,
        issuedDate: p.issuedDate,
        taxPointDate: p.taxPointDate,
        dueDate: p.dueDate,
        variableSymbol: p.variableSymbol,
        issuerName: p.companySettings.companyName || 'LAVRS market',
        issuerAddress: p.companySettings.companyAddress || '',
        issuerIC: p.companySettings.ic || '',
        issuerDIC: p.companySettings.dic || undefined,
        issuerRegistration: p.companySettings.registrationInfo || undefined,
        issuerPhone: p.companySettings.phone || undefined,
        issuerEmail: p.companySettings.email || undefined,
        issuedBy: p.companySettings.issuedBy || undefined,
        bankAccount: p.bankAccount,
        bankIban: p.bankIban,
        customerName: p.application.billingName || '',
        customerAddress: p.application.billingAddress || '',
        customerIC: p.application.ic || '',
        customerDIC: p.application.dic || undefined,
        lineItems: p.lineItems,
        qrDataUrl: p.qrDataUrl,
        invoiceNote: p.companySettings.invoiceNote || undefined,
    };

    console.log('[PDF] Creating React element with props:', Object.keys(props));
    const element = React.createElement(InvoicePdfComponent, props);

    console.log('[PDF] Calling pdf().toBlob()...');
    const instance = reactPdf.pdf(element);
    const pdfBlob = await instance.toBlob();
    console.log('[PDF] Blob generated:', pdfBlob.size, 'bytes');

    if (pdfBlob.size === 0) {
        throw new Error('PDF blob is empty (0 bytes)');
    }

    invoiceData.pdfBlob = pdfBlob;
    return pdfBlob;
}

/**
 * Full generation (both phases). Used by save flow.
 */
export async function generateInvoice(params: GenerateInvoiceParams): Promise<GeneratedInvoice> {
    const data = await prepareInvoiceData(params);
    await generateInvoicePdf(data);
    return data;
}
