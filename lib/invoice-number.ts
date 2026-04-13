/**
 * Invoice number generation — sequential numbering 12620001–12629999.
 * Invoice number = Order number = Variable symbol (all identical).
 */

import { invoicesDb } from './database';
import { Application, MarketEvent } from '../types';

/**
 * Returns the next available invoice number from the DB (async).
 * Range: 12620001–12629999, sequential.
 */
export async function calculateInvoiceNumber(): Promise<string> {
    return invoicesDb.getNextInvoiceNumber();
}

/**
 * Sequence number for an application within an event (1-based).
 * Still used for display purposes (e.g., #1, #2 in PDF).
 */
export function getApplicationSequenceForEvent(
    application: Application,
    allApplications: Application[]
): number {
    const sameEventApps = allApplications.filter((a) => a.eventId === application.eventId);

    const sorted = sameEventApps.sort((a, b) => {
        const aTime = new Date(a.submittedAt).getTime();
        const bTime = new Date(b.submittedAt).getTime();
        return aTime - bTime;
    });

    const index = sorted.findIndex((a) => a.id === application.id);
    return index >= 0 ? index + 1 : 1;
}

/**
 * Map: application ID → invoice number.
 * Reads existing invoices from the provided list (no DB call per app).
 */
export function buildInvoiceNumberMap(
    invoices: Array<{ applicationId: string; invoiceNumber: string }>
): Map<string, string> {
    const map = new Map<string, string>();
    invoices.forEach((inv) => {
        map.set(inv.applicationId, inv.invoiceNumber);
    });
    return map;
}
