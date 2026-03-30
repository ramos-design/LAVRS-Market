/**
 * Invoice Generator
 * Orchestrates PDF + ISDOC XML generation from application data.
 * Calculates 21% DPH (VAT) per Czech tax law (zákon č. 235/2004 Sb.).
 */

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { Application, MarketEvent, EventPlan, CompanySettings } from '../types';
import { generateQrPayment } from './qr-payment';
import { buildIsdocXml } from './isdoc';
import { calculateInvoiceNumber, getApplicationSequenceForEvent } from './invoice-number';
import InvoicePdf, { InvoiceLineItem } from '../components/InvoicePdf';

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

function getVariableSymbol(application: Application): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const ic = application.ic || '00000000';
    return `${day}${month}${ic}`;
}

/**
 * Parse price string like "4 900 Kč" or "4900" to CZK number (not halers).
 */
function parsePriceCzk(priceStr: string): number {
    const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
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
 * Main invoice generation function.
 */
export async function generateInvoice(params: GenerateInvoiceParams): Promise<GeneratedInvoice> {
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
    const variableSymbol = getVariableSymbol(application);

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
    const qrMessage = `${event.title} ${eventDd}.${eventMm}.${eventYyyy}`.substring(0, 60);

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

    // 7. Generate PDF
    const pdfBlob = await pdf(
        <InvoicePdf
            invoiceNumber={invoiceNumber}
            sequenceNumber={sequenceNumber}
            issuedDate={issuedDate}
            taxPointDate={taxPointDate}
            dueDate={dueDateStr}
            variableSymbol={variableSymbol}
            issuerName={companySettings.companyName || 'LAVRS market'}
            issuerAddress={companySettings.companyAddress || ''}
            issuerIC={companySettings.ic || ''}
            issuerDIC={companySettings.dic}
            issuerRegistration={companySettings.registrationInfo}
            issuerPhone={companySettings.phone}
            issuerEmail={companySettings.email}
            issuedBy={companySettings.issuedBy}
            bankAccount={bankAccount}
            bankIban={bankIban}
            customerName={application.billingName}
            customerAddress={application.billingAddress}
            customerIC={application.ic}
            customerDIC={application.dic}
            lineItems={lineItems}
            qrDataUrl={qrDataUrl}
            invoiceNote={companySettings.invoiceNote}
        />
    ).toBlob();

    console.log('=== INVOICE GENERATED ===', {
        invoiceNumber,
        baseCzk: totalBaseCzk,
        dphCzk: totalTaxCzk,
        totalCzk: totalWithDphCzk,
        lineItemsCount: lineItems.length,
        variableSymbol,
    });

    return {
        pdfBlob,
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
    };
}
