/**
 * Invoice HTML Generator
 * Generates a complete HTML document for Czech ISDOC-compliant invoices.
 * Uses browser print (Save as PDF) instead of @react-pdf/renderer.
 */

import type { InvoicePdfProps, InvoiceLineItem } from '../components/InvoicePdf';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number): string {
    const fixed = Math.round(n * 100) / 100;
    const str = fixed.toFixed(2);
    const parts = str.split('.');
    const whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0'); // non-breaking space
    return whole + ',' + parts[1];
}

function fmtDate(iso: string): string {
    if (!iso || iso.length < 10) return iso || '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
}

function esc(val: string | undefined | null): string {
    if (!val) return '';
    return val
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* ------------------------------------------------------------------ */
/*  Main HTML generator                                                */
/* ------------------------------------------------------------------ */

export function generateInvoiceHtml(props: InvoicePdfProps): string {
    const {
        invoiceNumber, sequenceNumber, issuedDate, taxPointDate, dueDate, variableSymbol,
        issuerName, issuerAddress, issuerIC, issuerDIC, issuerRegistration,
        issuerPhone, issuerEmail, issuedBy,
        bankAccount, bankIban,
        customerName, customerAddress, customerIC, customerDIC,
        lineItems, qrDataUrl, invoiceNote,
    } = props;

    // DPH calculation
    const dphGroups = new Map<number, { base: number; tax: number; total: number }>();
    let totalBase = 0;
    let totalTax = 0;

    (lineItems || []).forEach((item) => {
        const lineBase = item.unitPriceCzk * item.quantity;
        const lineTax = Math.round(lineBase * (item.dphRate / 100) * 100) / 100;
        totalBase += lineBase;
        totalTax += lineTax;
        const g = dphGroups.get(item.dphRate) || { base: 0, tax: 0, total: 0 };
        g.base += lineBase;
        g.tax += lineTax;
        g.total += lineBase + lineTax;
        dphGroups.set(item.dphRate, g);
    });

    const grandTotal = Math.round((totalBase + totalTax) * 100) / 100;

    const defaultNote = 'Rezervace vašeho prodejního místa se stává závaznou až po uhrazení této faktury. V případě, že nebude faktura uhrazena do data splatnosti, rezervace automaticky zaniká a místo bude nabídnuto dalšímu vystavovateli.\nPři zrušení účasti méně než 14 dní před termínem akce činí storno poplatek 100 % z celkové částky.';
    const note = invoiceNote || defaultNote;

    const issuerLines = (issuerAddress || '').split('\n').filter(Boolean);
    const customerLines = (customerAddress || '').split('\n').filter(Boolean);

    // Build DPH summary rows
    let dphRowsHtml = '';
    for (const [rate, g] of dphGroups.entries()) {
        const label = rate === 21 ? 'Základní' : rate + '%';
        dphRowsHtml += `
            <tr>
                <td>${esc(label)}</td>
                <td class="center">${rate} %</td>
                <td class="right">${fmt(g.base)}</td>
                <td class="right">${fmt(g.tax)}</td>
                <td class="right">${fmt(g.total)}</td>
            </tr>`;
    }

    // Build line item rows
    let itemRowsHtml = '';
    (lineItems || []).forEach((item, idx) => {
        const lineTotal = item.unitPriceCzk * item.quantity;
        itemRowsHtml += `
            <tr>
                <td class="center">${idx + 1}</td>
                <td>${esc(item.description)}</td>
                <td class="center">${item.quantity}</td>
                <td class="center">ks</td>
                <td class="center">${item.dphRate}</td>
                <td class="right">${fmt(item.unitPriceCzk)}</td>
                <td class="right">${fmt(lineTotal)}</td>
            </tr>`;
    });

    // Note: replace newlines with <br>
    const noteHtml = esc(note).replace(/\n/g, '<br>');

    return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>Faktura ${esc(invoiceNumber)}</title>
<style>
    @page {
        size: A4;
        margin: 15mm 18mm 18mm 18mm;
    }
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        font-size: 9pt;
        color: #1a1a1a;
        line-height: 1.4;
        background: #fff;
    }
    .page {
        width: 210mm;
        min-height: 297mm;
        padding: 15mm 18mm 18mm 18mm;
        margin: 0 auto;
        background: #fff;
    }

    /* Header */
    h1 {
        font-size: 15pt;
        font-weight: 700;
        margin-bottom: 1pt;
        color: #1a1a1a;
    }
    h2 {
        font-size: 11pt;
        font-weight: 700;
        margin-bottom: 14pt;
        color: #1a1a1a;
    }

    /* Meta section */
    .meta {
        display: flex;
        gap: 20px;
        margin-bottom: 16pt;
    }
    .meta-col {
        flex: 1;
    }
    .meta-row {
        display: flex;
        margin-bottom: 2pt;
    }
    .meta-label {
        width: 120pt;
        color: #666;
        font-size: 8pt;
    }
    .meta-value {
        font-size: 9pt;
    }
    .meta-value.bold {
        font-weight: 700;
    }

    /* Parties */
    .parties {
        display: flex;
        gap: 20px;
        padding-top: 10pt;
        border-top: 1px solid #ccc;
        margin-bottom: 14pt;
    }
    .party {
        flex: 1;
    }
    .party-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    }
    .party-title {
        font-size: 9pt;
        font-weight: 700;
        margin-bottom: 4pt;
    }
    .party-seq {
        font-size: 9pt;
        font-weight: 700;
        color: #888;
    }
    .party-name {
        font-size: 10pt;
        font-weight: 700;
        margin-bottom: 2pt;
    }
    .party-line {
        font-size: 8pt;
        color: #333;
        margin-bottom: 1pt;
    }

    /* Note */
    .note {
        margin-bottom: 12pt;
        padding-bottom: 6pt;
        border-bottom: 0.5pt solid #ddd;
    }
    .note p {
        font-size: 7pt;
        color: #555;
        line-height: 1.5;
    }

    /* Tables */
    table {
        width: 100%;
        border-collapse: collapse;
    }
    .items-table th {
        font-size: 7pt;
        font-weight: 700;
        color: #444;
        text-align: left;
        padding-bottom: 4pt;
        border-bottom: 1pt solid #333;
    }
    .items-table td {
        font-size: 9pt;
        padding: 5pt 2pt;
        border-bottom: 0.5pt solid #ddd;
        vertical-align: top;
    }
    .items-table .col-id { width: 6%; }
    .items-table .col-desc { width: 38%; }
    .items-table .col-qty { width: 10%; }
    .items-table .col-unit { width: 8%; }
    .items-table .col-dph { width: 10%; }
    .items-table .col-price { width: 14%; }
    .items-table .col-total { width: 14%; }

    .center { text-align: center; }
    .right { text-align: right; }

    /* DPH summary */
    .dph-wrapper {
        display: flex;
        justify-content: flex-end;
        margin-top: 8pt;
        margin-bottom: 12pt;
    }
    .dph-table {
        width: 300pt;
    }
    .dph-table th {
        font-size: 8pt;
        font-weight: 700;
        padding-bottom: 3pt;
        border-bottom: 1pt solid #999;
        text-align: left;
    }
    .dph-table td {
        font-size: 8pt;
        padding: 3pt 2pt;
        border-bottom: 0.5pt solid #ddd;
    }
    .dph-table .totals-row td {
        border-top: 1pt solid #999;
        border-bottom: none;
        font-weight: 700;
    }

    /* Grand total */
    .grand-total {
        text-align: right;
        font-size: 14pt;
        font-weight: 700;
        margin-bottom: 20pt;
    }

    /* Bottom section */
    .bottom {
        display: flex;
        align-items: flex-end;
        margin-top: 10pt;
    }
    .qr-col {
        width: 130pt;
        margin-right: 10pt;
    }
    .qr-col img {
        width: 115pt;
        height: 115pt;
    }
    .qr-label {
        font-size: 7pt;
        color: #666;
        text-align: center;
        margin-top: 3pt;
    }
    .sign-col {
        flex: 1;
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;
    }
    .sign-line {
        width: 140pt;
        border-top: 1pt solid #aaa;
        padding-top: 4pt;
        text-align: center;
        font-size: 8pt;
        color: #666;
    }

    /* Footer */
    .footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-top: 0.5pt solid #ccc;
        padding-top: 6pt;
        margin-top: 20pt;
    }
    .footer-text {
        font-size: 6pt;
        color: #999;
    }
    .footer-bold {
        font-size: 6pt;
        color: #999;
        font-weight: 700;
    }

    /* Print-specific */
    @media print {
        body {
            background: #fff;
        }
        .page {
            width: auto;
            min-height: auto;
            padding: 0;
            margin: 0;
        }
    }

    /* Screen preview styling */
    @media screen {
        body {
            background: #e5e5e5;
            padding: 20px 0;
        }
        .page {
            box-shadow: 0 2px 10px rgba(0,0,0,0.15);
        }
    }
</style>
</head>
<body>
<div class="page">

    <!-- Header -->
    <h1>FAKTURA - DAŇOVÝ DOKLAD</h1>
    <h2>číslo: ${esc(invoiceNumber)}</h2>

    <!-- Meta -->
    <div class="meta">
        <div class="meta-col">
            <div class="meta-row">
                <span class="meta-label">Datum vystavení:</span>
                <span class="meta-value">${fmtDate(issuedDate)}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Datum úč.zd.plnění:</span>
                <span class="meta-value">${fmtDate(taxPointDate)}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Datum splatnosti:</span>
                <span class="meta-value bold">${fmtDate(dueDate)}</span>
            </div>
        </div>
        <div class="meta-col">
            <div class="meta-row">
                <span class="meta-label">Způsob úhrady:</span>
                <span class="meta-value">Převodním příkazem</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Bankovní spojení:</span>
                <span class="meta-value">${esc(bankAccount)}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">IBAN:</span>
                <span class="meta-value">${esc(bankIban)}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Variabilní symbol:</span>
                <span class="meta-value bold">${esc(variableSymbol)}</span>
            </div>
        </div>
    </div>

    <!-- Parties -->
    <div class="parties">
        <div class="party">
            <div class="party-title">Dodavatel:</div>
            <div class="party-name">${esc(issuerName)}</div>
            ${issuerLines.map(line => `<div class="party-line">${esc(line)}</div>`).join('\n            ')}
            <div class="party-line">IČ: ${esc(issuerIC)}${issuerDIC ? '&nbsp;&nbsp;DIČ: ' + esc(issuerDIC) : ''}</div>
            ${issuerRegistration ? `<div class="party-line">${esc(issuerRegistration)}</div>` : ''}
        </div>
        <div class="party">
            <div class="party-header">
                <span class="party-title">Odběratel:</span>
                <span class="party-seq">#${sequenceNumber}</span>
            </div>
            <div class="party-name">${esc(customerName)}</div>
            ${customerLines.map(line => `<div class="party-line">${esc(line)}</div>`).join('\n            ')}
            <div class="party-line">IČ: ${esc(customerIC)}${customerDIC ? '&nbsp;&nbsp;DIČ: ' + esc(customerDIC) : ''}</div>
        </div>
    </div>

    <!-- Note -->
    <div class="note">
        <p>${noteHtml}</p>
    </div>

    <!-- Items table -->
    <table class="items-table">
        <thead>
            <tr>
                <th class="col-id center">ID</th>
                <th class="col-desc">Položka</th>
                <th class="col-qty center">Množství</th>
                <th class="col-unit center">Jed.</th>
                <th class="col-dph center">% DPH</th>
                <th class="col-price right">Cena/jed.</th>
                <th class="col-total right">Cena celkem</th>
            </tr>
        </thead>
        <tbody>${itemRowsHtml}
        </tbody>
    </table>

    <!-- DPH summary -->
    <div class="dph-wrapper">
        <table class="dph-table">
            <thead>
                <tr>
                    <th>Sazba</th>
                    <th class="center">% DPH</th>
                    <th class="right">Základ</th>
                    <th class="right">Daň</th>
                    <th class="right">Celkem</th>
                </tr>
            </thead>
            <tbody>${dphRowsHtml}
                <tr class="totals-row">
                    <td><strong>Celkem CZK</strong></td>
                    <td></td>
                    <td class="right">${fmt(totalBase)}</td>
                    <td class="right">${fmt(totalTax)}</td>
                    <td class="right">${fmt(grandTotal)}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Grand total -->
    <div class="grand-total">Celkem k úhradě: ${fmt(grandTotal)} CZK</div>

    <!-- QR + Signature -->
    <div class="bottom">
        <div class="qr-col">
            ${qrDataUrl ? `<img src="${esc(qrDataUrl)}" alt="QR platba"><div class="qr-label">QR platba</div>` : ''}
        </div>
        <div class="sign-col">
            <div class="sign-line">Vystavil</div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div>
            ${issuerPhone ? `<div class="footer-bold">Telefon: ${esc(issuerPhone)}</div>` : ''}
            ${issuerEmail ? `<div class="footer-text">Email: ${esc(issuerEmail)}</div>` : ''}
        </div>
        <div class="footer-bold">ISDOC 6.0.1</div>
        <div>
            ${issuedBy ? `<div class="footer-text">Vystavil: ${esc(issuedBy)}</div>` : ''}
            <div class="footer-text">Strana 1</div>
        </div>
    </div>

</div>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Download as PDF via browser print dialog                           */
/* ------------------------------------------------------------------ */

export function downloadInvoiceAsPdf(props: InvoicePdfProps, filename: string): void {
    const html = generateInvoiceHtml(props);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
        console.error('[Invoice] Could not access iframe document');
        document.body.removeChild(iframe);
        return;
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for images (QR code) to load before printing
    const images = iframeDoc.querySelectorAll('img');
    const imagePromises = Array.from(images).map(
        (img) =>
            new Promise<void>((resolve) => {
                if (img.complete) {
                    resolve();
                } else {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                }
            })
    );

    Promise.all(imagePromises).then(() => {
        // Small delay to ensure CSS is fully applied
        setTimeout(() => {
            try {
                iframe.contentWindow?.print();
            } catch (e) {
                console.error('[Invoice] Print failed:', e);
            }
            // Remove iframe after a delay to allow print dialog to complete
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 250);
    });
}

/* ------------------------------------------------------------------ */
/*  Generate HTML blob (for storage)                                   */
/* ------------------------------------------------------------------ */

export async function generateInvoiceBlobFromHtml(props: InvoicePdfProps): Promise<Blob> {
    const html = generateInvoiceHtml(props);
    return new Blob([html], { type: 'text/html' });
}
