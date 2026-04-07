/**
 * Invoice HTML Generator — LAVRS Market branded
 * Generates a complete HTML document for Czech ISDOC-compliant invoices.
 * Uses browser print (Save as PDF).
 */

import type { InvoicePdfProps, InvoiceLineItem } from '../components/InvoicePdf';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number): string {
    const fixed = Math.round(n * 100) / 100;
    const str = fixed.toFixed(2);
    const parts = str.split('.');
    const whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
    return whole + ',' + parts[1];
}

function fmtDate(iso: string): string {
    if (!iso || iso.length < 10) return iso || '';
    const p = iso.split('-');
    if (p.length !== 3) return iso;
    return p[2] + '.' + p[1] + '.' + p[0];
}

function esc(val: string | undefined | null): string {
    if (!val) return '';
    return val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
    const noteHtml = esc(note).replace(/\n/g, '<br>');

    const issuerLines = (issuerAddress || '').split('\n').filter(Boolean);
    const customerLines = (customerAddress || '').split('\n').filter(Boolean);

    // Build DPH summary rows
    let dphRowsHtml = '';
    for (const [rate, g] of dphGroups.entries()) {
        dphRowsHtml += `<tr>
            <td>${rate === 21 ? 'Základní' : rate + '%'}</td>
            <td>${rate}\u00A0%</td>
            <td class="r">${fmt(g.base)}</td>
            <td class="r">${fmt(g.tax)}</td>
            <td class="r">${fmt(g.total)}</td>
        </tr>`;
    }

    // Build line item rows
    let itemRowsHtml = '';
    (lineItems || []).forEach((item, idx) => {
        const lineTotal = item.unitPriceCzk * item.quantity;
        itemRowsHtml += `<tr>
            <td>${idx + 1}</td>
            <td class="desc">${esc(item.description)}</td>
            <td>${item.quantity}</td>
            <td>ks</td>
            <td>${item.dphRate}</td>
            <td class="r">${fmt(item.unitPriceCzk)}</td>
            <td class="r">${fmt(lineTotal)}</td>
        </tr>`;
    });

    return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>Faktura ${esc(invoiceNumber)}</title>
<style>
@page { size: A4; margin: 12mm 16mm 14mm 16mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 8.5pt; color: #222; line-height: 1.35; background: #fff; }
.page { width: 210mm; min-height: 297mm; padding: 12mm 16mm 14mm 16mm; margin: 0 auto; background: #fff; }

/* ===== HEADER ===== */
.header { border-bottom: 3px solid #D32F2F; padding-bottom: 10pt; margin-bottom: 12pt; }
.header h1 { font-size: 18pt; font-weight: 800; color: #D32F2F; letter-spacing: -0.5pt; margin: 0; }
.header .inv-num { font-size: 10pt; font-weight: 700; color: #444; margin-top: 2pt; }

/* ===== META ===== */
.meta { display: flex; gap: 12pt; margin-bottom: 14pt; }
.meta-col { flex: 1; }
.meta-row { display: flex; align-items: baseline; margin-bottom: 1.5pt; }
.meta-label { width: 90pt; color: #333; font-size: 7pt; flex-shrink: 0; }
.meta-val { font-size: 7.5pt; color: #000; }
.meta-val.bold { font-weight: 700; }
.meta-val.sm { font-size: 6.5pt; white-space: nowrap; }

/* ===== PARTIES ===== */
.parties { display: flex; gap: 0; margin-bottom: 12pt; border: 2px solid #222; }
.party { flex: 1; padding: 10pt 12pt; }
.party:first-child { border-right: 2px solid #222; }
.party-label { font-size: 8pt; font-weight: 700; color: #000; text-transform: uppercase; letter-spacing: 0.5pt; margin-bottom: 4pt; }
.party-name { font-size: 10pt; font-weight: 700; color: #000; margin-bottom: 3pt; }
.party-line { font-size: 8pt; color: #222; line-height: 1.4; }
.party-ic { font-size: 7.5pt; color: #222; margin-top: 4pt; }
.party-seq { float: right; font-size: 10pt; font-weight: 700; color: #D32F2F; }

/* ===== NOTE ===== */
.note { background: #fafafa; border-left: 3px solid #D32F2F; padding: 6pt 10pt; margin-bottom: 12pt; font-size: 6.5pt; color: #333; line-height: 1.5; }

/* ===== ITEMS TABLE ===== */
.items { width: 100%; border-collapse: collapse; margin-bottom: 8pt; border: 2px solid #000; }
.items th { background: #f0f0f0; color: #000; font-size: 7pt; font-weight: 700; padding: 5pt 6pt; text-transform: uppercase; letter-spacing: 0.3pt; border: 1px solid #000; }
.items th.c { text-align: center; }
.items th.r { text-align: right; }
.items td { font-size: 8.5pt; padding: 6pt; border: 1px solid #000; text-align: center; color: #000; }
.items td.desc { text-align: left; }
.items td.r { text-align: right; }

/* ===== DPH TABLE ===== */
.dph-wrap { display: flex; justify-content: flex-end; margin-bottom: 10pt; }
.dph { width: 280pt; border-collapse: collapse; border: 1px solid #000; }
.dph th { font-size: 7pt; font-weight: 700; color: #000; padding: 4pt 5pt; border: 1px solid #000; background: #f0f0f0; text-align: left; }
.dph th.c { text-align: center; }
.dph th.r { text-align: right; }
.dph td { font-size: 8pt; padding: 4pt 5pt; border: 1px solid #000; text-align: center; color: #000; }
.dph td.r { text-align: right; }
.dph td:first-child { text-align: left; }
.dph .totals td { border-top: 2px solid #000; font-weight: 700; font-size: 8.5pt; }

/* ===== GRAND TOTAL ===== */
.grand-total { text-align: right; margin-bottom: 16pt; padding: 8pt 12pt; background: #FFF5F5; border: 2px solid #D32F2F; border-left: 5px solid #D32F2F; }
.grand-total span { font-size: 15pt; font-weight: 800; color: #D32F2F; }

/* ===== BOTTOM ===== */
.bottom { display: flex; align-items: flex-end; gap: 20pt; margin-top: 6pt; }
.qr-col { width: 110pt; }
.qr-col img { width: 105pt; height: 105pt; border: 1px solid #333; }
.qr-label { font-size: 7pt; color: #333; text-align: center; margin-top: 2pt; }
.sign-col { flex: 1; display: flex; justify-content: flex-end; align-items: flex-end; padding-bottom: 4pt; }
.sign-line { width: 130pt; border-top: 1px solid #000; padding-top: 4pt; text-align: center; font-size: 7.5pt; color: #333; }

/* ===== FOOTER ===== */
.footer { display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #333; padding-top: 6pt; margin-top: 16pt; }
.footer-text { font-size: 6.5pt; color: #333; }
.footer-bold { font-size: 6.5pt; color: #333; font-weight: 700; }
.footer-isdoc { font-size: 7pt; font-weight: 700; color: #D32F2F; letter-spacing: 1pt; }

@media print {
    body { background: #fff; }
    .page { width: auto; min-height: auto; padding: 0; margin: 0; }
    .items tbody tr:hover { background: transparent; }
}
@media screen {
    body { background: #e5e5e5; padding: 20px 0; }
    .page { box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
    .pdf-export-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: #222; text-align: center; padding: 12px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
    .pdf-export-btn { display: inline-flex; align-items: center; gap: 8px; background: #D32F2F; color: #fff; border: none; padding: 12px 32px; font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; transition: background 0.2s; border-radius: 4px; }
    .pdf-export-btn:hover { background: #b71c1c; }
    .pdf-export-btn svg { width: 18px; height: 18px; }
    .page { margin-top: 60px; }
}
</style>
</head>
<body>
<div class="pdf-export-bar">
    <button class="pdf-export-btn" onclick="window.print()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Uložit jako PDF
    </button>
</div>
<div class="page">

    <!-- Header -->
    <div class="header">
        <h1>FAKTURA - DAŇOVÝ DOKLAD</h1>
        <div class="inv-num">číslo: ${esc(invoiceNumber)}</div>
    </div>

    <!-- Meta -->
    <div class="meta">
        <div class="meta-col">
            <div class="meta-row"><span class="meta-label">Datum vystavení:</span><span class="meta-val">${fmtDate(issuedDate)}</span></div>
            <div class="meta-row"><span class="meta-label">Datum úč.zd.plnění:</span><span class="meta-val">${fmtDate(taxPointDate)}</span></div>
            <div class="meta-row"><span class="meta-label">Datum splatnosti:</span><span class="meta-val bold">${fmtDate(dueDate)}</span></div>
        </div>
        <div class="meta-col">
            <div class="meta-row"><span class="meta-label">Způsob úhrady:</span><span class="meta-val">Převodním příkazem</span></div>
            <div class="meta-row"><span class="meta-label">Bankovní spojení:</span><span class="meta-val">${esc(bankAccount)}</span></div>
            <div class="meta-row"><span class="meta-label">IBAN:</span><span class="meta-val sm">${esc(bankIban)}</span></div>
            <div class="meta-row"><span class="meta-label">Variabilní symbol:</span><span class="meta-val bold">${esc(variableSymbol)}</span></div>
        </div>
    </div>

    <!-- Parties -->
    <div class="parties">
        <div class="party">
            <div class="party-label">Dodavatel</div>
            <div class="party-name">${esc(issuerName)}</div>
            ${issuerLines.map(l => `<div class="party-line">${esc(l)}</div>`).join('')}
            <div class="party-ic">IČ: ${esc(issuerIC)}${issuerDIC ? '\u00A0\u00A0DIČ: ' + esc(issuerDIC) : ''}</div>
            ${issuerRegistration ? `<div class="party-line" style="font-size:7pt;color:#888;margin-top:2pt">${esc(issuerRegistration)}</div>` : ''}
        </div>
        <div class="party">
            <span class="party-seq">#${sequenceNumber}</span>
            <div class="party-label">Odběratel</div>
            <div class="party-name">${esc(customerName)}</div>
            ${customerLines.map(l => `<div class="party-line">${esc(l)}</div>`).join('')}
            <div class="party-ic">IČ: ${esc(customerIC)}${customerDIC ? '\u00A0\u00A0DIČ: ' + esc(customerDIC) : ''}</div>
        </div>
    </div>

    <!-- Note -->
    <div class="note">${noteHtml}</div>

    <!-- Items table -->
    <table class="items">
        <thead><tr>
            <th class="c" style="width:5%">ID</th>
            <th style="width:37%;text-align:left">Položka</th>
            <th class="c" style="width:9%">Množství</th>
            <th class="c" style="width:7%">Jed.</th>
            <th class="c" style="width:8%">% DPH</th>
            <th class="r" style="width:17%">Cena/jed.</th>
            <th class="r" style="width:17%">Cena celkem</th>
        </tr></thead>
        <tbody>${itemRowsHtml}</tbody>
    </table>

    <!-- DPH summary -->
    <div class="dph-wrap">
        <table class="dph">
            <thead><tr>
                <th style="width:22%">Sazba</th>
                <th class="c" style="width:14%">% DPH</th>
                <th class="r" style="width:22%">Základ</th>
                <th class="r" style="width:20%">Daň</th>
                <th class="r" style="width:22%">Celkem</th>
            </tr></thead>
            <tbody>
                ${dphRowsHtml}
                <tr class="totals">
                    <td><strong>Celkem CZK</strong></td>
                    <td></td>
                    <td class="r">${fmt(totalBase)}</td>
                    <td class="r">${fmt(totalTax)}</td>
                    <td class="r">${fmt(grandTotal)}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Grand total -->
    <div class="grand-total">
        Celkem k úhradě: <span>${fmt(grandTotal)} CZK</span>
    </div>

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
            ${issuerPhone ? `<div class="footer-bold">Tel: ${esc(issuerPhone)}</div>` : ''}
            ${issuerEmail ? `<div class="footer-text">${esc(issuerEmail)}</div>` : ''}
        </div>
        <div class="footer-isdoc">ISDOC 6.0.1</div>
        <div style="text-align:right">
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
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;opacity:0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
        document.body.removeChild(iframe);
        return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const images = doc.querySelectorAll('img');
    const loaded = Array.from(images).map(img =>
        new Promise<void>(r => img.complete ? r() : (img.onload = () => r(), img.onerror = () => r()))
    );

    Promise.all(loaded).then(() => {
        setTimeout(() => {
            try { iframe.contentWindow?.print(); } catch (e) { console.error('[Invoice] Print failed:', e); }
            setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 200);
    });
}

/* ------------------------------------------------------------------ */
/*  Generate HTML blob (for storage)                                   */
/* ------------------------------------------------------------------ */

export async function generateInvoiceBlobFromHtml(props: InvoicePdfProps): Promise<Blob> {
    return new Blob([generateInvoiceHtml(props)], { type: 'text/html' });
}
