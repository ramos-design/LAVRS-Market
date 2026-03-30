/**
 * QR Platba (SPAYD format) generation for Czech invoices.
 * Converts invoice data to SPAYD string and generates QR code.
 * Reference: https://qr-platba.cz/pro-vyvojare/
 */

import QRCode from 'qrcode';

export interface SpaydOptions {
    iban: string;           // CZ6520100000002900765432
    amount: number;         // Amount in CZK (e.g., 5400)
    variableSymbol: string; // Variable symbol (e.g., 21031234567)
    message?: string;       // Payment message (max 60 chars)
}

/**
 * Builds a SPAYD (Short Payment Descriptor) string for Czech QR payments.
 * Format: SPD*1.0*ACC:CZ...*AM:5400.00*CC:CZK*VS:21031234567*MSG:LAVRS market
 */
export function buildSpaydString(options: SpaydOptions): string {
    const { iban, amount, variableSymbol, message = 'LAVRS market' } = options;

    // Ensure IBAN is properly formatted (no spaces), use default if not provided
    const cleanIban = (iban || 'CZ6520100000002900765432').replace(/\s+/g, '');

    // Amount must be decimal with 2 decimal places
    const amountDecimal = (amount / 100).toFixed(2);

    // Truncate message to 60 chars
    const truncatedMsg = message.substring(0, 60);

    // Build SPAYD string
    // X-VS is the correct SPAYD field for variable symbol (Czech extension)
    const spayd = `SPD*1.0*ACC:${cleanIban}*AM:${amountDecimal}*CC:CZK*X-VS:${variableSymbol}*MSG:${truncatedMsg}`;

    return spayd;
}

/**
 * Generates a QR code data URL from a SPAYD string.
 * Returns a base64-encoded PNG data URL suitable for embedding in images.
 */
export async function generateQrDataUrl(spayd: string): Promise<string> {
    try {
        const dataUrl = await QRCode.toDataURL(spayd, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });
        return dataUrl;
    } catch (error) {
        console.error('Failed to generate QR code:', error);
        throw error;
    }
}

/**
 * Combined helper: builds SPAYD and generates QR code in one call.
 */
export async function generateQrPayment(options: SpaydOptions): Promise<{ spayd: string; qrDataUrl: string }> {
    const spayd = buildSpaydString(options);
    const qrDataUrl = await generateQrDataUrl(spayd);
    return { spayd, qrDataUrl };
}
