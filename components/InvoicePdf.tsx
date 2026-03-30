/**
 * Invoice PDF Component — "FAKTURA - DAŇOVÝ DOKLAD"
 * Matches the original invoice layout from We make brand s.r.o.
 * Compliant with Czech tax law (zákon č. 235/2004 Sb.) and ISDOC 6.0.1
 */

import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
    Font,
} from '@react-pdf/renderer';

// Use absolute URL for fonts so @react-pdf/renderer can fetch them in any context
const fontBase = typeof window !== 'undefined' ? window.location.origin : '';

Font.register({
    family: 'LiberationSans',
    fonts: [
        { src: `${fontBase}/fonts/LiberationSans-Regular.ttf`, fontWeight: 400 },
        { src: `${fontBase}/fonts/LiberationSans-Bold.ttf`, fontWeight: 700 },
    ],
});

// Disable hyphenation (causes issues with Czech text)
Font.registerHyphenationCallback((word) => [word]);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface InvoiceLineItem {
    description: string;
    quantity: number;
    unitPriceCzk: number;   // price per unit WITHOUT DPH, in CZK (not halers)
    dphRate: number;        // e.g. 21 for 21%
}

export interface InvoicePdfProps {
    invoiceNumber: string;
    sequenceNumber: number;         // #696 style running number
    issuedDate: string;             // YYYY-MM-DD
    taxPointDate: string;           // datum uskutečnění zdanitelného plnění
    dueDate: string;                // YYYY-MM-DD
    variableSymbol: string;

    // Dodavatel (supplier / issuer)
    issuerName: string;
    issuerAddress: string;
    issuerIC: string;
    issuerDIC?: string;
    issuerRegistration?: string;    // e.g. "C 343549 u MS v Praze"
    issuerPhone?: string;
    issuerEmail?: string;
    issuedBy?: string;              // person name

    // Bank
    bankAccount: string;            // e.g. "81562880/5500"
    bankIban: string;               // e.g. "CZ58 5500 0000 0000 8156 2880"

    // Odběratel (customer / buyer)
    customerName: string;
    customerAddress: string;
    customerIC: string;
    customerDIC?: string;

    // Line items
    lineItems: InvoiceLineItem[];

    // QR
    qrDataUrl?: string;

    // Note (storno / reservation text)
    invoiceNote?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtCZK(n: number): string {
    const fixed = n.toFixed(2);
    const [whole, dec] = fixed.split('.');
    // Add space as thousands separator (Czech style)
    const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted},${dec}`;
}

function fmtDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
}

/* ------------------------------------------------------------------ */
/*  Styles — faithful to the original invoice                          */
/* ------------------------------------------------------------------ */

const s = StyleSheet.create({
    page: {
        backgroundColor: '#fff',
        paddingTop: 36,
        paddingBottom: 60,
        paddingHorizontal: 40,
        fontFamily: 'LiberationSans',
        fontSize: 9,
        color: '#1a1a1a',
        lineHeight: 1.45,
    },

    /* ---------- HEADER ---------- */
    headerTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
    headerNumber: { fontSize: 12, fontWeight: 'bold', marginBottom: 16 },

    /* ---------- META ROW ---------- */
    metaRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    metaLeft: { flex: 1 },
    metaRight: { flex: 1 },
    metaLine: { flexDirection: 'row', marginBottom: 3 },
    metaLabel: { width: 110, color: '#555', fontSize: 9 },
    metaValue: { fontSize: 9 },
    metaValueBold: { fontSize: 9, fontWeight: 'bold' },

    /* ---------- PARTIES ---------- */
    partiesRow: { flexDirection: 'row', marginBottom: 16, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 12 },
    partyCol: { flex: 1 },
    partyLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
    partyName: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
    partyLine: { fontSize: 9, marginBottom: 1 },
    partyIcLine: { fontSize: 9, marginBottom: 1 },
    seqBadge: { fontSize: 10, fontWeight: 'bold', textAlign: 'right', color: '#555' },

    /* ---------- NOTE ---------- */
    noteBox: { marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
    noteText: { fontSize: 8, color: '#444', lineHeight: 1.5 },

    /* ---------- ITEM TABLE ---------- */
    table: { marginBottom: 12 },
    tHeaderRow: {
        flexDirection: 'row',
        borderBottomWidth: 1.5,
        borderBottomColor: '#333',
        paddingBottom: 5,
        marginBottom: 4,
    },
    tRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: '#ddd',
    },
    // column widths
    colId:    { width: '6%', textAlign: 'left' },
    colDesc:  { width: '40%', textAlign: 'left' },
    colQty:   { width: '10%', textAlign: 'center' },
    colUnit:  { width: '8%', textAlign: 'center' },
    colDph:   { width: '8%', textAlign: 'center' },
    colPrice: { width: '14%', textAlign: 'right' },
    colTotal: { width: '14%', textAlign: 'right' },

    thText: { fontSize: 8, fontWeight: 'bold', color: '#333' },
    tdText: { fontSize: 9 },

    /* ---------- DPH SUMMARY TABLE ---------- */
    dphSummaryContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 16,
    },
    dphTable: { width: 320 },
    dphHeaderRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#999',
        paddingBottom: 4,
        marginBottom: 4,
    },
    dphRow: {
        flexDirection: 'row',
        paddingVertical: 3,
        borderBottomWidth: 0.5,
        borderBottomColor: '#ddd',
    },
    dphColLabel:  { width: '20%', textAlign: 'left' },
    dphColRate:   { width: '15%', textAlign: 'center' },
    dphColBase:   { width: '22%', textAlign: 'right' },
    dphColTax:    { width: '21%', textAlign: 'right' },
    dphColTotal:  { width: '22%', textAlign: 'right' },
    dphThText: { fontSize: 8, fontWeight: 'bold', color: '#555' },
    dphTdText: { fontSize: 9 },
    dphTdBold: { fontSize: 9, fontWeight: 'bold' },

    /* ---------- GRAND TOTAL ---------- */
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 24,
    },
    grandTotalText: {
        fontSize: 16,
        fontWeight: 'bold',
    },

    /* ---------- BOTTOM SECTION (QR + signature) ---------- */
    bottomRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
    qrCol: { width: 140 },
    qrImage: { width: 120, height: 120, borderWidth: 0.5, borderColor: '#ccc' },
    qrLabel: { fontSize: 8, color: '#555', marginTop: 4, textAlign: 'center' },
    signatureCol: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
    },
    signatureLine: { width: 150, borderTopWidth: 1, borderTopColor: '#999', paddingTop: 4, textAlign: 'center' },
    signatureText: { fontSize: 9, color: '#555', textAlign: 'center' },

    /* ---------- FOOTER ---------- */
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        paddingTop: 8,
    },
    footerLeft: { flex: 1 },
    footerCenter: { flex: 1, textAlign: 'center' },
    footerRight: { flex: 1, textAlign: 'right' },
    footerText: { fontSize: 7, color: '#888' },
    footerBold: { fontSize: 7, color: '#888', fontWeight: 'bold' },
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const InvoicePdf: React.FC<InvoicePdfProps> = (props) => {
    const {
        invoiceNumber,
        sequenceNumber,
        issuedDate,
        taxPointDate,
        dueDate,
        variableSymbol,
        issuerName,
        issuerAddress,
        issuerIC,
        issuerDIC,
        issuerRegistration,
        issuerPhone,
        issuerEmail,
        issuedBy,
        bankAccount,
        bankIban,
        customerName,
        customerAddress,
        customerIC,
        customerDIC,
        lineItems,
        qrDataUrl,
        invoiceNote,
    } = props;

    // --- DPH calculation ---
    // Group by DPH rate
    const dphGroups = new Map<number, { base: number; tax: number; total: number }>();
    let totalBase = 0;
    let totalTax = 0;

    lineItems.forEach((item) => {
        const lineBase = item.unitPriceCzk * item.quantity;
        const lineTax = Math.round(lineBase * (item.dphRate / 100) * 100) / 100;
        totalBase += lineBase;
        totalTax += lineTax;

        const existing = dphGroups.get(item.dphRate) || { base: 0, tax: 0, total: 0 };
        existing.base += lineBase;
        existing.tax += lineTax;
        existing.total += lineBase + lineTax;
        dphGroups.set(item.dphRate, existing);
    });

    const grandTotal = Math.round((totalBase + totalTax) * 100) / 100;

    const defaultNote =
        'Rezervace vašeho prodejního místa se stává závaznou až po uhrazení této faktury. V případě, že nebude faktura uhrazena do data splatnosti, rezervace automaticky zaniká a místo bude nabídnuto dalšímu vystavovateli.\n\nPři zrušení účasti méně než 14 dní před termínem akce činí storno poplatek 100 % z celkové částky.';

    const note = invoiceNote || defaultNote;

    const dphRateName = (rate: number) => {
        if (rate === 21) return 'Základní';
        if (rate === 12) return 'Snížená';
        if (rate === 0) return 'Osvobozeno';
        return `${rate}%`;
    };

    return (
        <Document>
            <Page size="A4" style={s.page}>

                {/* ===== HEADER ===== */}
                <Text style={s.headerTitle}>FAKTURA - DAŇOVÝ DOKLAD</Text>
                <Text style={s.headerNumber}>číslo: {invoiceNumber}</Text>

                {/* ===== META (dates + bank) ===== */}
                <View style={s.metaRow}>
                    <View style={s.metaLeft}>
                        <View style={s.metaLine}>
                            <Text style={s.metaLabel}>Datum vystavení:</Text>
                            <Text style={s.metaValue}>{fmtDate(issuedDate)}</Text>
                        </View>
                        <View style={s.metaLine}>
                            <Text style={s.metaLabel}>Datum u.zd.plnění:</Text>
                            <Text style={s.metaValue}>{fmtDate(taxPointDate)}</Text>
                        </View>
                        <View style={s.metaLine}>
                            <Text style={s.metaLabel}>Datum splatnosti:</Text>
                            <Text style={s.metaValueBold}>{fmtDate(dueDate)}</Text>
                        </View>
                    </View>
                    <View style={s.metaRight}>
                        <View style={s.metaLine}>
                            <Text style={s.metaLabel}>Způsob úhrady:</Text>
                            <Text style={s.metaValue}>Převodním příkazem</Text>
                        </View>
                        <View style={s.metaLine}>
                            <Text style={s.metaLabel}>Bankovní spojení:</Text>
                            <Text style={s.metaValue}>{bankAccount}</Text>
                        </View>
                        <View style={s.metaLine}>
                            <Text style={s.metaLabel}>IBAN:</Text>
                            <Text style={s.metaValue}>{bankIban}</Text>
                        </View>
                        <View style={s.metaLine}>
                            <Text style={s.metaLabel}>Variabilní symbol:</Text>
                            <Text style={s.metaValueBold}>{variableSymbol}</Text>
                        </View>
                    </View>
                </View>

                {/* ===== PARTIES ===== */}
                <View style={s.partiesRow}>
                    <View style={s.partyCol}>
                        <Text style={s.partyLabel}>Dodavatel:</Text>
                        <Text style={s.partyName}>{issuerName}</Text>
                        {issuerAddress.split('\n').map((line, i) => (
                            <Text key={i} style={s.partyLine}>{line}</Text>
                        ))}
                        <Text style={s.partyIcLine}>
                            IČ: {issuerIC}
                            {issuerDIC ? `  DIČ: ${issuerDIC}` : ''}
                        </Text>
                        {issuerRegistration && (
                            <Text style={s.partyLine}>{issuerRegistration}</Text>
                        )}
                    </View>
                    <View style={s.partyCol}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={s.partyLabel}>Odběratel:</Text>
                            <Text style={s.seqBadge}>#{sequenceNumber}</Text>
                        </View>
                        <Text style={s.partyName}>{customerName}</Text>
                        {customerAddress.split('\n').map((line, i) => (
                            <Text key={i} style={s.partyLine}>{line}</Text>
                        ))}
                        <Text style={s.partyIcLine}>
                            IČ: {customerIC}
                            {customerDIC ? `  DIČ: ${customerDIC}` : ''}
                        </Text>
                    </View>
                </View>

                {/* ===== NOTE ===== */}
                <View style={s.noteBox}>
                    <Text style={s.noteText}>{note}</Text>
                </View>

                {/* ===== LINE ITEMS TABLE ===== */}
                <View style={s.table}>
                    <View style={s.tHeaderRow}>
                        <Text style={[s.thText, s.colId]}>ID</Text>
                        <Text style={[s.thText, s.colDesc]}>Položka</Text>
                        <Text style={[s.thText, s.colQty]}>Množství</Text>
                        <Text style={[s.thText, s.colUnit]}>Jed.</Text>
                        <Text style={[s.thText, s.colDph]}>% DPH</Text>
                        <Text style={[s.thText, s.colPrice]}>Cena/jed.</Text>
                        <Text style={[s.thText, s.colTotal]}>Cena celkem</Text>
                    </View>
                    {lineItems.map((item, idx) => {
                        const lineTotal = item.unitPriceCzk * item.quantity;
                        return (
                            <View key={idx} style={s.tRow} wrap={false}>
                                <Text style={[s.tdText, s.colId]}>{idx + 1}</Text>
                                <Text style={[s.tdText, s.colDesc]}>{item.description}</Text>
                                <Text style={[s.tdText, s.colQty]}>{item.quantity}</Text>
                                <Text style={[s.tdText, s.colUnit]}></Text>
                                <Text style={[s.tdText, s.colDph]}>{item.dphRate}</Text>
                                <Text style={[s.tdText, s.colPrice]}>{fmtCZK(item.unitPriceCzk)}</Text>
                                <Text style={[s.tdText, s.colTotal]}>{fmtCZK(lineTotal)}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* ===== DPH SUMMARY TABLE ===== */}
                <View style={s.dphSummaryContainer}>
                    <View style={s.dphTable}>
                        <View style={s.dphHeaderRow}>
                            <Text style={[s.dphThText, s.dphColLabel]}>Sazba</Text>
                            <Text style={[s.dphThText, s.dphColRate]}>% DPH</Text>
                            <Text style={[s.dphThText, s.dphColBase]}>Základ</Text>
                            <Text style={[s.dphThText, s.dphColTax]}>Daň</Text>
                            <Text style={[s.dphThText, s.dphColTotal]}>Celkem</Text>
                        </View>
                        {Array.from(dphGroups.entries()).map(([rate, group]) => (
                            <View key={rate} style={s.dphRow}>
                                <Text style={[s.dphTdText, s.dphColLabel]}>{dphRateName(rate)}</Text>
                                <Text style={[s.dphTdText, s.dphColRate]}>{rate} %</Text>
                                <Text style={[s.dphTdText, s.dphColBase]}>{fmtCZK(group.base)}</Text>
                                <Text style={[s.dphTdText, s.dphColTax]}>{fmtCZK(group.tax)}</Text>
                                <Text style={[s.dphTdText, s.dphColTotal]}>{fmtCZK(group.total)}</Text>
                            </View>
                        ))}
                        {/* Totals row */}
                        <View style={[s.dphRow, { borderTopWidth: 1, borderTopColor: '#999' }]}>
                            <Text style={[s.dphTdBold, s.dphColLabel]}>Celkem CZK</Text>
                            <Text style={[s.dphTdText, s.dphColRate]}></Text>
                            <Text style={[s.dphTdBold, s.dphColBase]}>{fmtCZK(totalBase)}</Text>
                            <Text style={[s.dphTdBold, s.dphColTax]}>{fmtCZK(totalTax)}</Text>
                            <Text style={[s.dphTdBold, s.dphColTotal]}>{fmtCZK(grandTotal)}</Text>
                        </View>
                    </View>
                </View>

                {/* ===== GRAND TOTAL ===== */}
                <View style={s.grandTotalRow}>
                    <Text style={s.grandTotalText}>
                        Celkem k úhradě: {fmtCZK(grandTotal)} CZK
                    </Text>
                </View>

                {/* ===== QR + SIGNATURE ===== */}
                <View style={s.bottomRow}>
                    {qrDataUrl ? (
                        <View style={s.qrCol}>
                            <Image src={qrDataUrl} style={s.qrImage} />
                            <Text style={s.qrLabel}>QR platba</Text>
                        </View>
                    ) : (
                        <View style={s.qrCol} />
                    )}
                    <View style={s.signatureCol}>
                        <Text style={s.signatureLine}>Vystavil</Text>
                    </View>
                </View>

                {/* ===== FOOTER ===== */}
                <View style={s.footer} fixed>
                    <View style={s.footerLeft}>
                        {issuerPhone && <Text style={s.footerBold}>Telefon: {issuerPhone}</Text>}
                        {issuerEmail && <Text style={s.footerText}>Email: {issuerEmail}</Text>}
                    </View>
                    <View style={s.footerCenter}>
                        <Text style={s.footerBold}>ISDOC</Text>
                    </View>
                    <View style={s.footerRight}>
                        {issuedBy && <Text style={s.footerText}>Vystavil: {issuedBy}</Text>}
                        <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
                            `Strana ${pageNumber} z ${totalPages}`
                        } />
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default InvoicePdf;
