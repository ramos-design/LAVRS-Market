/**
 * Invoice number generation for Czech invoices.
 * Format: LVRSM{DDMM}-{sequence}
 * where DDMM is day-month of event, sequence is per-event app order.
 */

import { Application, MarketEvent } from '../types';

/**
 * Formats date to DDMM (day-month) from ISO date string or Date object.
 * Example: "2026-03-21" → "2103"
 */
export function getEventDayMonth(dateStr: string | Date): string {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}${month}`;
}

/**
 * Calculates the sequence number for an application within an event.
 * Filters all applications for the same event, sorts by submitted_at, and finds index.
 * Returns 1-based sequence number (first app = 1, second = 2, etc.)
 */
export function getApplicationSequenceForEvent(
    application: Application,
    allApplications: Application[]
): number {
    // Filter applications for same event
    const sameEventApps = allApplications.filter((a) => a.eventId === application.eventId);

    // Sort by submittedAt (ascending = oldest first)
    const sorted = sameEventApps.sort((a, b) => {
        const aTime = new Date(a.submittedAt).getTime();
        const bTime = new Date(b.submittedAt).getTime();
        return aTime - bTime;
    });

    // Find index and return 1-based sequence
    const index = sorted.findIndex((a) => a.id === application.id);
    return index >= 0 ? index + 1 : 1;
}

/**
 * Generates an invoice number for an application.
 * Format: LVRSM{DDMM}-{sequence}
 * Example: "LVRSM2103-5"
 */
export function calculateInvoiceNumber(
    application: Application,
    allApplications: Application[],
    event: MarketEvent
): string {
    const dayMonth = getEventDayMonth(event.date);
    const sequence = getApplicationSequenceForEvent(application, allApplications);
    return `LVRSM${dayMonth}-${sequence}`;
}

/**
 * Map: application ID → invoice number
 * Useful for quickly looking up invoice numbers by app in a table.
 */
export function buildInvoiceNumberMap(
    allApplications: Application[],
    eventsMap: Map<string, MarketEvent>
): Map<string, string> {
    const map = new Map<string, string>();

    allApplications.forEach((app) => {
        const event = eventsMap.get(app.eventId);
        if (event) {
            const invoiceNumber = calculateInvoiceNumber(app, allApplications, event);
            map.set(app.id, invoiceNumber);
        }
    });

    return map;
}
