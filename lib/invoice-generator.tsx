/**
 * Invoice Generator
 * Orchestrates PDF + ISDOC XML generation from application data
 */

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { Application, MarketEvent, EventPlan, CompanySettings } from '../types';
import { generateQrPayment } from './qr-payment';
import { buildIsdocXml } from './isdoc';
import { calculateInvoiceNumber } from './invoice-number';
import InvoicePdf from '../components/InvoicePdf';

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
    totalAmount: number;
    variableSymbol: string;
    qrDataUrl: string;
    spaydString: string;
    issuedDate: string;
    dueDate: string;
}

/**
 * Calculates price from event plan
 */
function getVariableSymbol(application: Application): string {
    // From existing PaymentPage logic: DDMM + IČ
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const ic = application.ic || '00000000';
    return `${day}${month}${ic}`;
}

/**
 * Calculates total price (base + extras)
 */
function calculateTotalPrice(
    application: Application,
    eventPlan: EventPlan,
    selectedExtraIds: string[]
): number {
    let total = 0;

    // DEBUG: Log what we're working with
    console.log('calculateTotalPrice DEBUG:', {
        zoneCategory: application.zoneCategory,
        availablePrices: Object.keys(eventPlan.prices || {}),
        selectedExtraIds,
        availableExtras: eventPlan.extras?.map(e => ({ id: e.id, label: e.label, price: e.price })),
    });

    // Base price for zone category
    if (application.zoneCategory && eventPlan.prices && eventPlan.prices[application.zoneCategory]) {
        const priceStr = eventPlan.prices[application.zoneCategory];
        const priceMatch = priceStr.match(/(\d+(?:\.\d{1,2})?)/);
        console.log('Base price found:', { zoneCategory: application.zoneCategory, priceStr, priceMatch });
        if (priceMatch) {
            const priceInCzk = parseFloat(priceMatch[1]);
            const priceInHalers = Math.round(priceInCzk * 100);
            total += priceInHalers;
            console.log('Added base price:', { priceInCzk, priceInHalers, total });
        }
    } else {
        console.warn('Base price NOT FOUND:', { zoneCategory: application.zoneCategory, hasPrices: !!eventPlan.prices });
    }

    // Extras
    selectedExtraIds.forEach((extraId) => {
        const extra = eventPlan.extras?.find((e) => e.id === extraId);
        if (extra) {
            const priceMatch = extra.price.match(/(\d+(?:\.\d{1,2})?)/);
            if (priceMatch) {
                const priceInCzk = parseFloat(priceMatch[1]);
                const priceInHalers = Math.round(priceInCzk * 100);
                total += priceInHalers;
                console.log('Added extra:', { extraId, label: extra.label, priceStr: extra.price, priceInCzk, priceInHalers, total });
            }
        } else {
            console.warn('Extra NOT FOUND:', extraId);
        }
    });

    console.log('Final total:', { totalHalers: total, totalCzk: total / 100 });
    return total;
}

/**
 * Main invoice generation function
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

    // 1. Calculate invoice number and dates
    const invoiceNumber = calculateInvoiceNumber(application, allApplications, event);
    const issuedDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (companySettings.invoiceDueDays ?? 14)); // Default 14 days
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // 2. Calculate total price
    const totalAmount = calculateTotalPrice(application, eventPlan, selectedExtraIds);
    const variableSymbol = getVariableSymbol(application);

    // 3. Build line items for invoice
    const lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }> = [];

    // Base price line
    if (application.zoneCategory && eventPlan.prices && eventPlan.prices[application.zoneCategory]) {
        const priceStr = eventPlan.prices[application.zoneCategory];
        const priceMatch = priceStr.match(/(\d+(?:\.\d{1,2})?)/);
        if (priceMatch) {
            const unitPrice = Math.round(parseFloat(priceMatch[1]) * 100);
            lineItems.push({
                description: `${application.zoneCategory} - Pronájem stánku`,
                quantity: 1,
                unitPrice,
                totalPrice: unitPrice,
            });
            console.log('Added line item (base):', { zoneCategory: application.zoneCategory, unitPrice });
        } else {
            console.warn('Failed to parse base price:', priceStr);
        }
    } else {
        console.warn('Base price line not added:', { zoneCategory: application.zoneCategory, hasPrices: !!eventPlan.prices });
    }

    // Extra items
    if (eventPlan.extras && eventPlan.extras.length > 0) {
        selectedExtraIds.forEach((extraId) => {
            const extra = eventPlan.extras.find((e) => e.id === extraId);
            if (extra) {
                const priceMatch = extra.price.match(/(\d+(?:\.\d{1,2})?)/);
                if (priceMatch) {
                    const unitPrice = Math.round(parseFloat(priceMatch[1]) * 100);
                    lineItems.push({
                        description: extra.label,
                        quantity: 1,
                        unitPrice,
                        totalPrice: unitPrice,
                    });
                    console.log('Added line item (extra):', { id: extraId, label: extra.label, unitPrice });
                } else {
                    console.warn('Failed to parse extra price:', { id: extraId, price: extra.price });
                }
            } else {
                console.warn('Extra not found in eventPlan.extras:', extraId);
            }
        });
    } else {
        console.warn('No extras in eventPlan:', { extrasCount: eventPlan.extras?.length });
    }

    // 4. Generate QR code and SPAYD
    const { spayd: spaydString, qrDataUrl } = await generateQrPayment({
        iban: companySettings.bankIban,
        amount: totalAmount,
        variableSymbol,
        message: 'LAVRS market',
    });

    // 5. Generate ISDOC XML
    const xmlString = buildIsdocXml({
        invoiceNumber,
        issuedDate,
        dueDate: dueDateStr,
        variableSymbol,
        issuer: {
            name: companySettings.companyName || 'LAVRS market',
            address: companySettings.companyAddress || 'Vnitroblock, Holešovice',
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
            unitPrice: item.unitPrice,
        })),
        totalAmount,
        taxAmount: 0, // For now, assume 0% VAT (can be extended later)
    });

    // 6. Generate PDF
    const pdfBlob = await pdf(
        <InvoicePdf
            invoiceNumber={invoiceNumber}
            issuedDate={issuedDate}
            dueDate={dueDateStr}
            variableSymbol={variableSymbol}
            issuerName={companySettings.companyName}
            issuerAddress={companySettings.companyAddress}
            issuerIC={companySettings.ic}
            issuerDIC={companySettings.dic}
            customerName={application.billingName}
            customerAddress={application.billingAddress}
            customerIC={application.ic}
            customerDIC={application.dic}
            customerEmail={application.billingEmail}
            lineItems={lineItems}
            totalAmount={totalAmount}
            qrDataUrl={qrDataUrl}
            spaydString={spaydString}
        />
    ).toBlob();

    // VALIDATION & DEBUG
    console.log('=== INVOICE GENERATION COMPLETE ===', {
        invoiceNumber,
        totalAmount,
        totalAmountCzk: totalAmount / 100,
        lineItemsCount: lineItems.length,
        lineItems: lineItems.map(li => ({ desc: li.description, unitPrice: li.unitPrice / 100, total: li.totalPrice / 100 })),
        customerName: application.billingName,
        variableSymbol,
        hasPdfBlob: !!pdfBlob,
        hasQrDataUrl: !!qrDataUrl,
        hasSpaydString: !!spaydString,
    });

    // WARNINGS for missing data
    if (totalAmount === 0) {
        console.warn('⚠️ WARNING: Total amount is 0 CZK - check if zoneCategory matches eventPlan.prices keys');
    }
    if (lineItems.length === 0) {
        console.warn('⚠️ WARNING: No line items - check if zoneCategory or extras are populated');
    }
    if (!application.billingName) {
        console.warn('⚠️ WARNING: Customer name is empty - check application.billingName');
    }

    return {
        pdfBlob,
        xmlString,
        invoiceNumber,
        totalAmount,
        variableSymbol,
        qrDataUrl,
        spaydString,
        issuedDate,
        dueDate: dueDateStr,
    };
}
