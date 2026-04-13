/**
 * Invoice PDF — "OBJEDNÁVKA – VÝZVA K PLATBĚ"
 * Uses Roboto font (supports full Czech diacritics)
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

/* ------------------------------------------------------------------ */
/*  Font Registration — Roboto supports full Czech diacritics          */
/* ------------------------------------------------------------------ */

Font.register({
    family: 'Roboto',
    fonts: [
        {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf',
            fontWeight: 'normal',
        },
        {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf',
            fontWeight: 'bold',
        },
    ],
});

// Disable hyphenation (breaks Czech words incorrectly)
Font.registerHyphenationCallback(word => [word]);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface InvoiceLineItem {
    description: string;
    quantity: number;
    unitPriceCzk: number;
    dphRate: number;
}

export interface InvoicePdfProps {
    invoiceNumber: string;
    sequenceNumber: number;
    issuedDate: string;
    taxPointDate: string;
    dueDate: string;
    variableSymbol: string;
    issuerName: string;
    issuerAddress: string;
    issuerIC: string;
    issuerDIC?: string;
    issuerRegistration?: string;
    issuerPhone?: string;
    issuerEmail?: string;
    issuedBy?: string;
    bankAccount: string;
    bankIban: string;
    customerName: string;
    customerAddress: string;
    customerIC: string;
    customerDIC?: string;
    lineItems: InvoiceLineItem[];
    qrDataUrl?: string;
    invoiceNote?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number): string {
    const fixed = Math.round(n * 100) / 100;
    const str = fixed.toFixed(2);
    const parts = str.split('.');
    const whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return whole + ',' + parts[1];
}

function fmtDate(iso: string): string {
    if (!iso || iso.length < 10) return iso || '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
}

function safe(val: string | undefined | null): string {
    return val || '';
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const s = StyleSheet.create({
    page: {
        backgroundColor: '#fff',
        paddingTop: 40,
        paddingBottom: 50,
        paddingHorizontal: 40,
        fontFamily: 'Roboto',
        fontSize: 9,
        color: '#1a1a1a',
    },
    bold: { fontFamily: 'Roboto', fontWeight: 'bold' },

    // Header
    title: { fontSize: 14, fontFamily: 'Roboto', fontWeight: 'bold', marginBottom: 2 },
    subtitle: { fontSize: 11, fontFamily: 'Roboto', fontWeight: 'bold', marginBottom: 14 },

    // Meta
    row: { flexDirection: 'row', marginBottom: 2 },
    metaBlock: { flexDirection: 'row', marginBottom: 16 },
    metaLeft: { flex: 1 },
    metaRight: { flex: 1 },
    label: { width: 105, color: '#666', fontSize: 8 },
    value: { fontSize: 9 },
    valueBold: { fontSize: 9, fontFamily: 'Roboto', fontWeight: 'bold' },

    // Parties
    partiesRow: { flexDirection: 'row', marginBottom: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ccc' },
    partyCol: { flex: 1, paddingRight: 10 },
    partyTitle: { fontSize: 9, fontFamily: 'Roboto', fontWeight: 'bold', marginBottom: 4 },
    partyName: { fontSize: 10, fontFamily: 'Roboto', fontWeight: 'bold', marginBottom: 2 },
    partyLine: { fontSize: 8, marginBottom: 1, color: '#333' },

    // Note
    noteBox: { marginBottom: 12, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
    noteText: { fontSize: 7, color: '#555', lineHeight: 1.4 },

    // Table
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 4, marginBottom: 4 },
    tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
    th: { fontSize: 7, fontFamily: 'Roboto', fontWeight: 'bold', color: '#444' },
    td: { fontSize: 9 },
    colId: { width: '6%' },
    colDesc: { width: '38%' },
    colQty: { width: '10%', textAlign: 'center' },
    colUnit: { width: '8%', textAlign: 'center' },
    colDph: { width: '10%', textAlign: 'center' },
    colPrice: { width: '14%', textAlign: 'right' },
    colTotal: { width: '14%', textAlign: 'right' },

    // DPH summary
    dphContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, marginBottom: 12 },
    dphTable: { width: 300 },
    dphRow: { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
    dphHeader: { flexDirection: 'row', paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: '#999', marginBottom: 2 },
    dphLabel: { width: '22%', fontSize: 8 },
    dphRate: { width: '16%', textAlign: 'center', fontSize: 8 },
    dphBase: { width: '22%', textAlign: 'right', fontSize: 8 },
    dphTax: { width: '18%', textAlign: 'right', fontSize: 8 },
    dphTotal: { width: '22%', textAlign: 'right', fontSize: 8 },

    // Grand total
    grandTotal: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 },
    grandTotalText: { fontSize: 14, fontFamily: 'Roboto', fontWeight: 'bold' },

    // Bottom section
    bottomRow: { flexDirection: 'row', marginTop: 10 },
    qrCol: { width: 130, marginRight: 10 },
    qrImage: { width: 115, height: 115 },
    qrLabel: { fontSize: 7, color: '#666', marginTop: 3, textAlign: 'center' },
    signCol: { flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end' },
    signLine: { width: 140, borderTopWidth: 1, borderTopColor: '#aaa', paddingTop: 4, textAlign: 'center', fontSize: 8, color: '#666' },

    // Footer
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#ccc', paddingTop: 6, marginTop: 20 },
    footerText: { fontSize: 6, color: '#999' },
    footerBold: { fontSize: 6, color: '#999', fontFamily: 'Roboto', fontWeight: 'bold' },
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const InvoicePdf: React.FC<InvoicePdfProps> = (props) => {
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

    const defaultNote = 'Rezervace vašeho prodejního místa se stává závaznou až po uhrazení této objednávky. V případě, že nebude objednávka uhrazena do data splatnosti, rezervace automaticky zaniká a místo bude nabídnuto dalšímu vystavovateli.\nPři zrušení účasti méně než 14 dní před termínem akce činí storno poplatek 100 % z celkové částky.';

    const note = invoiceNote || defaultNote;

    const issuerLines = safe(issuerAddress).split('\n').filter(Boolean);
    const customerLines = safe(customerAddress).split('\n').filter(Boolean);

    return (
        <Document>
            <Page size="A4" style={s.page}>

                {/* Header */}
                <Text style={s.title}>OBJEDNÁVKA – VÝZVA K PLATBĚ</Text>
                <Text style={s.subtitle}>číslo: {safe(invoiceNumber)}</Text>

                {/* Meta */}
                <View style={s.metaBlock}>
                    <View style={s.metaLeft}>
                        <View style={s.row}>
                            <Text style={s.label}>Datum vystavení:</Text>
                            <Text style={s.value}>{fmtDate(issuedDate)}</Text>
                        </View>
                        <View style={s.row}>
                            <Text style={s.label}>Datum u.zd.plnění:</Text>
                            <Text style={s.value}>{fmtDate(taxPointDate)}</Text>
                        </View>
                        <View style={s.row}>
                            <Text style={s.label}>Datum splatnosti:</Text>
                            <Text style={s.valueBold}>{fmtDate(dueDate)}</Text>
                        </View>
                    </View>
                    <View style={s.metaRight}>
                        <View style={s.row}>
                            <Text style={s.label}>Způsob úhrady:</Text>
                            <Text style={s.value}>Převodem příkazem</Text>
                        </View>
                        <View style={s.row}>
                            <Text style={s.label}>Bankovní spojení:</Text>
                            <Text style={s.value}>{safe(bankAccount)}</Text>
                        </View>
                        <View style={s.row}>
                            <Text style={s.label}>IBAN:</Text>
                            <Text style={s.value}>{safe(bankIban)}</Text>
                        </View>
                        <View style={s.row}>
                            <Text style={s.label}>Variabilní symbol:</Text>
                            <Text style={s.valueBold}>{safe(variableSymbol)}</Text>
                        </View>
                    </View>
                </View>

                {/* Parties */}
                <View style={s.partiesRow}>
                    <View style={s.partyCol}>
                        <Text style={s.partyTitle}>Dodavatel:</Text>
                        <Text style={s.partyName}>{safe(issuerName)}</Text>
                        {issuerLines.map((line, i) => (
                            <Text key={i} style={s.partyLine}>{line}</Text>
                        ))}
                        <Text style={s.partyLine}>IC: {safe(issuerIC)}{issuerDIC ? '  DIC: ' + issuerDIC : ''}</Text>
                        {issuerRegistration ? <Text style={s.partyLine}>{issuerRegistration}</Text> : null}
                    </View>
                    <View style={s.partyCol}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={s.partyTitle}>Odběratel:</Text>
                            <Text style={[s.partyTitle, { color: '#888' }]}>#{sequenceNumber}</Text>
                        </View>
                        <Text style={s.partyName}>{safe(customerName)}</Text>
                        {customerLines.map((line, i) => (
                            <Text key={i} style={s.partyLine}>{line}</Text>
                        ))}
                        <Text style={s.partyLine}>IC: {safe(customerIC)}{customerDIC ? '  DIC: ' + customerDIC : ''}</Text>
                    </View>
                </View>

                {/* Note */}
                <View style={s.noteBox}>
                    <Text style={s.noteText}>{note}</Text>
                </View>

                {/* Items table */}
                <View style={s.tableHeader}>
                    <Text style={[s.th, s.colId]}>ID</Text>
                    <Text style={[s.th, s.colDesc]}>Položka</Text>
                    <Text style={[s.th, s.colQty]}>Množství</Text>
                    <Text style={[s.th, s.colUnit]}>Jed.</Text>
                    <Text style={[s.th, s.colDph]}>% DPH</Text>
                    <Text style={[s.th, s.colPrice]}>Cena/jed.</Text>
                    <Text style={[s.th, s.colTotal]}>Cena celkem</Text>
                </View>
                {(lineItems || []).map((item, idx) => {
                    const lineTotal = item.unitPriceCzk * item.quantity;
                    return (
                        <View key={idx} style={s.tableRow}>
                            <Text style={[s.td, s.colId]}>{idx + 1}</Text>
                            <Text style={[s.td, s.colDesc]}>{safe(item.description)}</Text>
                            <Text style={[s.td, s.colQty]}>{item.quantity}</Text>
                            <Text style={[s.td, s.colUnit]}>ks</Text>
                            <Text style={[s.td, s.colDph]}>{item.dphRate}</Text>
                            <Text style={[s.td, s.colPrice]}>{fmt(item.unitPriceCzk)}</Text>
                            <Text style={[s.td, s.colTotal]}>{fmt(lineTotal)}</Text>
                        </View>
                    );
                })}

                {/* DPH summary */}
                <View style={s.dphContainer}>
                    <View style={s.dphTable}>
                        <View style={s.dphHeader}>
                            <Text style={[s.dphLabel, s.bold]}>Sazba</Text>
                            <Text style={[s.dphRate, s.bold]}>% DPH</Text>
                            <Text style={[s.dphBase, s.bold]}>Základ</Text>
                            <Text style={[s.dphTax, s.bold]}>Daň</Text>
                            <Text style={[s.dphTotal, s.bold]}>Celkem</Text>
                        </View>
                        {Array.from(dphGroups.entries()).map(([rate, g]) => (
                            <View key={rate} style={s.dphRow}>
                                <Text style={s.dphLabel}>{rate === 21 ? 'Základní' : rate + '%'}</Text>
                                <Text style={s.dphRate}>{rate} %</Text>
                                <Text style={s.dphBase}>{fmt(g.base)}</Text>
                                <Text style={s.dphTax}>{fmt(g.tax)}</Text>
                                <Text style={s.dphTotal}>{fmt(g.total)}</Text>
                            </View>
                        ))}
                        <View style={[s.dphRow, { borderTopWidth: 1, borderTopColor: '#999' }]}>
                            <Text style={[s.dphLabel, s.bold]}>Celkem CZK</Text>
                            <Text style={s.dphRate}></Text>
                            <Text style={[s.dphBase, s.bold]}>{fmt(totalBase)}</Text>
                            <Text style={[s.dphTax, s.bold]}>{fmt(totalTax)}</Text>
                            <Text style={[s.dphTotal, s.bold]}>{fmt(grandTotal)}</Text>
                        </View>
                    </View>
                </View>

                {/* Grand total */}
                <View style={s.grandTotal}>
                    <Text style={s.grandTotalText}>Celkem k úhradě: {fmt(grandTotal)} CZK</Text>
                </View>

                {/* QR + Signature */}
                <View style={s.bottomRow}>
                    {qrDataUrl ? (
                        <View style={s.qrCol}>
                            <Image src={qrDataUrl} style={s.qrImage} />
                            <Text style={s.qrLabel}>QR platba</Text>
                        </View>
                    ) : (
                        <View style={s.qrCol} />
                    )}
                    <View style={s.signCol}>
                        <Text style={s.signLine}>Vystavil</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={s.footerRow}>
                    <View>
                        {issuerPhone ? <Text style={s.footerBold}>Telefon: {issuerPhone}</Text> : null}
                        {issuerEmail ? <Text style={s.footerText}>Email: {issuerEmail}</Text> : null}
                    </View>
                    <Text style={s.footerBold}>ISDOC 6.0.1</Text>
                    <View>
                        {issuedBy ? <Text style={s.footerText}>Vystavil: {issuedBy}</Text> : null}
                        <Text style={s.footerText}>Strana 1</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default InvoicePdf;
