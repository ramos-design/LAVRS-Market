function i(a){const n=(Math.round(a*100)/100).toFixed(2).split(".");return n[0].replace(/\B(?=(\d{3})+(?!\d))/g," ")+","+n[1]}function m(a){if(!a||a.length<10)return a||"";const o=a.split("-");return o.length!==3?a:o[2]+"."+o[1]+"."+o[0]}function e(a){return a?a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}function L(a){const{invoiceNumber:o,sequenceNumber:g,issuedDate:n,taxPointDate:h,dueDate:F,variableSymbol:T,issuerName:I,issuerAddress:A,issuerIC:C,issuerDIC:f,issuerRegistration:v,issuerPhone:b,issuerEmail:x,issuedBy:u,bankAccount:P,bankIban:R,customerName:q,customerAddress:B,customerIC:E,customerDIC:y,lineItems:w,qrDataUrl:$,invoiceNote:H}=a,r=new Map;let p=0,c=0;(w||[]).forEach(t=>{const s=t.unitPriceCzk*t.quantity,l=Math.round(s*(t.dphRate/100)*100)/100;p+=s,c+=l;const d=r.get(t.dphRate)||{base:0,tax:0,total:0};d.base+=s,d.tax+=l,d.total+=s+l,r.set(t.dphRate,d)});const k=Math.round((p+c)*100)/100,M=e(H||`Rezervace vašeho prodejního místa se stává závaznou až po uhrazení této faktury. V případě, že nebude faktura uhrazena do data splatnosti, rezervace automaticky zaniká a místo bude nabídnuto dalšímu vystavovateli.
Při zrušení účasti méně než 14 dní před termínem akce činí storno poplatek 100 % z celkové částky.`).replace(/\n/g,"<br>"),N=(A||"").split(`
`).filter(Boolean),O=(B||"").split(`
`).filter(Boolean);let z="";for(const[t,s]of r.entries())z+=`<tr>
            <td>${t===21?"Základní":t+"%"}</td>
            <td>${t} %</td>
            <td class="r">${i(s.base)}</td>
            <td class="r">${i(s.tax)}</td>
            <td class="r">${i(s.total)}</td>
        </tr>`;let D="";return(w||[]).forEach((t,s)=>{const l=t.unitPriceCzk*t.quantity;D+=`<tr>
            <td>${s+1}</td>
            <td class="desc">${e(t.description)}</td>
            <td>${t.quantity}</td>
            <td>ks</td>
            <td>${t.dphRate}</td>
            <td class="r">${i(t.unitPriceCzk)}</td>
            <td class="r">${i(l)}</td>
        </tr>`}),`<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>Faktura ${e(o)}</title>
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
    .pdf-export-bar { text-align: center; padding: 24px 0 32px; }
    .pdf-export-btn { display: inline-flex; align-items: center; gap: 8px; background: #D32F2F; color: #fff; border: none; padding: 14px 40px; font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; transition: background 0.2s; border-radius: 4px; }
    .pdf-export-btn:hover { background: #b71c1c; }
    .pdf-export-btn svg { width: 18px; height: 18px; }
}
</style>
</head>
<body>
<div class="page">

    <!-- Header -->
    <div class="header">
        <h1>FAKTURA - DAŇOVÝ DOKLAD</h1>
        <div class="inv-num">číslo: ${e(o)}</div>
    </div>

    <!-- Meta -->
    <div class="meta">
        <div class="meta-col">
            <div class="meta-row"><span class="meta-label">Datum vystavení:</span><span class="meta-val">${m(n)}</span></div>
            <div class="meta-row"><span class="meta-label">Datum úč.zd.plnění:</span><span class="meta-val">${m(h)}</span></div>
            <div class="meta-row"><span class="meta-label">Datum splatnosti:</span><span class="meta-val bold">${m(F)}</span></div>
        </div>
        <div class="meta-col">
            <div class="meta-row"><span class="meta-label">Způsob úhrady:</span><span class="meta-val">Převodním příkazem</span></div>
            <div class="meta-row"><span class="meta-label">Bankovní spojení:</span><span class="meta-val">${e(P)}</span></div>
            <div class="meta-row"><span class="meta-label">IBAN:</span><span class="meta-val sm">${e(R)}</span></div>
            <div class="meta-row"><span class="meta-label">Variabilní symbol:</span><span class="meta-val bold">${e(T)}</span></div>
        </div>
    </div>

    <!-- Parties -->
    <div class="parties">
        <div class="party">
            <div class="party-label">Dodavatel</div>
            <div class="party-name">${e(I)}</div>
            ${N.map(t=>`<div class="party-line">${e(t)}</div>`).join("")}
            <div class="party-ic">IČ: ${e(C)}${f?"  DIČ: "+e(f):""}</div>
            ${v?`<div class="party-line" style="font-size:7pt;color:#888;margin-top:2pt">${e(v)}</div>`:""}
        </div>
        <div class="party">
            <span class="party-seq">#${g}</span>
            <div class="party-label">Odběratel</div>
            <div class="party-name">${e(q)}</div>
            ${O.map(t=>`<div class="party-line">${e(t)}</div>`).join("")}
            <div class="party-ic">IČ: ${e(E)}${y?"  DIČ: "+e(y):""}</div>
        </div>
    </div>

    <!-- Note -->
    <div class="note">${M}</div>

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
        <tbody>${D}</tbody>
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
                ${z}
                <tr class="totals">
                    <td><strong>Celkem CZK</strong></td>
                    <td></td>
                    <td class="r">${i(p)}</td>
                    <td class="r">${i(c)}</td>
                    <td class="r">${i(k)}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Grand total -->
    <div class="grand-total">
        Celkem k úhradě: <span>${i(k)} CZK</span>
    </div>

    <!-- QR + Signature -->
    <div class="bottom">
        <div class="qr-col">
            ${$?`<img src="${e($)}" alt="QR platba"><div class="qr-label">QR platba</div>`:""}
        </div>
        <div class="sign-col">
            <div class="sign-line">Vystavil</div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div>
            ${b?`<div class="footer-bold">Tel: ${e(b)}</div>`:""}
            ${x?`<div class="footer-text">${e(x)}</div>`:""}
        </div>
        <div class="footer-isdoc">ISDOC 6.0.1</div>
        <div style="text-align:right">
            ${u?`<div class="footer-text">Vystavil: ${e(u)}</div>`:""}
            <div class="footer-text">Strana 1</div>
        </div>
    </div>

</div>

<div class="pdf-export-bar">
    <button class="pdf-export-btn" onclick="window.print()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Uložit jako PDF
    </button>
</div>

</body>
</html>`}export{L as generateInvoiceHtml};
