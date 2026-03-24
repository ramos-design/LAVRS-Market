/**
 * Invoice PDF Component
 * Renders a professional Czech invoice using @react-pdf/renderer
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

// Register Liberation Sans font with Czech character support
Font.register({
    family: 'NotoSans',
    src: 'https://cdn.jsdelivr.net/npm/liberation-fonts@1.1.13/LiberationSans-Regular.ttf',
});

const styles = StyleSheet.create({
    page: {
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'NotoSans',
        fontSize: 10,
        color: '#1F2937',
        lineHeight: 1.5,
    },
    header: {
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#EF4444',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#EF4444',
        marginBottom: 5,
    },
    headerMeta: {
        fontSize: 10,
        color: '#666666',
        marginTop: 10,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 5,
        color: '#1F2937',
    },
    row: {
        display: 'flex',
        flexDirection: 'row',
        marginBottom: 6,
    },
    label: {
        fontWeight: 'bold',
        width: 120,
        color: '#4B5563',
    },
    value: {
        flex: 1,
    },
    table: {
        width: '100%',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderTopColor: '#CCCCCC',
        borderBottomColor: '#CCCCCC',
        marginVertical: 10,
    },
    tableHeader: {
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderBottomWidth: 1,
        borderBottomColor: '#D1D5DB',
        paddingHorizontal: 8,
        paddingVertical: 6,
        fontSize: 10,
        fontWeight: 'bold',
    },
    tableHeaderCell: {
        width: '50%',
        textAlign: 'left',
    },
    tableHeaderCellRight: {
        width: '25%',
        textAlign: 'right',
    },
    tableRow: {
        display: 'flex',
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    tableCell: {
        width: '50%',
        textAlign: 'left',
        fontSize: 10,
    },
    tableCellRight: {
        width: '25%',
        textAlign: 'right',
        fontSize: 10,
    },
    totalSection: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 2,
        borderTopColor: '#EF4444',
    },
    totalRow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 8,
    },
    totalLabel: {
        width: 200,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    totalAmount: {
        width: 100,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    finalTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#EF4444',
    },
    qrSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 15,
    },
    qrImage: {
        width: 100,
        height: 100,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    qrInfo: {
        flex: 1,
    },
    qrTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#1F2937',
    },
    qrText: {
        fontSize: 9,
        marginBottom: 3,
        color: '#666666',
    },
    footer: {
        marginTop: 30,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        fontSize: 8,
        color: '#999999',
        textAlign: 'center',
    },
});

export interface InvoicePdfProps {
    invoiceNumber: string;
    issuedDate: string;
    dueDate: string;
    variableSymbol: string;

    issuerName: string;
    issuerAddress: string;
    issuerIC: string;
    issuerDIC?: string;

    customerName: string;
    customerAddress: string;
    customerIC: string;
    customerDIC?: string;
    customerEmail?: string;

    lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;

    totalAmount: number;
    qrDataUrl?: string;
    spaydString?: string;
}

/**
 * Renders a professional Czech invoice PDF.
 */
export const InvoicePdf: React.FC<InvoicePdfProps> = ({
    invoiceNumber,
    issuedDate,
    dueDate,
    variableSymbol,
    issuerName,
    issuerAddress,
    issuerIC,
    issuerDIC,
    customerName,
    customerAddress,
    customerIC,
    customerDIC,
    customerEmail,
    lineItems,
    totalAmount,
    qrDataUrl,
    spaydString,
}) => {
    const formatCZK = (amount: number) => {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK',
            minimumFractionDigits: 2,
        }).format(amount / 100);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('cs-CZ', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header - ISDOC Compatible */}
                <View style={{ marginBottom: 30, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: '#EF4444' }}>
                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#EF4444', marginBottom: 10, fontFamily: 'NotoSans' }}>FAKTURA</Text>

                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <View>
                            <Text style={{ fontSize: 9, color: '#666', marginBottom: 2 }}>Číslo faktury</Text>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', fontFamily: 'NotoSans' }}>{invoiceNumber}</Text>
                        </View>
                        <View style={{ textAlign: 'right' }}>
                            <Text style={{ fontSize: 9, color: '#666', marginBottom: 2 }}>Datum vystavení</Text>
                            <Text style={{ fontSize: 11, fontFamily: 'NotoSans' }}>{formatDate(issuedDate)}</Text>
                        </View>
                    </View>

                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                        <View>
                            <Text style={{ fontSize: 9, color: '#666', marginBottom: 2 }}>Splatnost</Text>
                            <Text style={{ fontSize: 11 }}>{formatDate(dueDate)}</Text>
                        </View>
                        <View style={{ textAlign: 'right' }}>
                            <Text style={{ fontSize: 9, color: '#666', marginBottom: 2 }}>Variabilní symbol</Text>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', fontFamily: 'NotoSans' }}>{variableSymbol}</Text>
                        </View>
                    </View>
                </View>

                {/* Issuer and Customer Info - ISDOC Format */}
                <View style={{ display: 'flex', flexDirection: 'row', gap: 40, marginBottom: 30 }}>
                    {/* Vystavovatel */}
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#666', marginBottom: 8, fontFamily: 'NotoSans' }}>VYSTAVOVATEL:</Text>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2, fontFamily: 'NotoSans' }}>{issuerName}</Text>
                        <Text style={{ fontSize: 10, marginBottom: 8, lineHeight: 1.4 }}>{issuerAddress}</Text>
                        <Text style={{ fontSize: 9 }}>IČ:  {issuerIC}</Text>
                        {issuerDIC && <Text style={{ fontSize: 9 }}>DIČ: {issuerDIC}</Text>}
                    </View>

                    {/* Odběratel */}
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#666', marginBottom: 8, fontFamily: 'NotoSans' }}>ODBĚRATEL:</Text>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2, fontFamily: 'NotoSans' }}>{customerName}</Text>
                        <Text style={{ fontSize: 10, marginBottom: 8, lineHeight: 1.4 }}>{customerAddress}</Text>
                        <Text style={{ fontSize: 9 }}>IČ:  {customerIC}</Text>
                        {customerDIC && <Text style={{ fontSize: 9 }}>DIČ: {customerDIC}</Text>}
                        {customerEmail && <Text style={{ fontSize: 9 }}>Email: {customerEmail}</Text>}
                    </View>
                </View>

                {/* Line Items Table - ISDOC Format */}
                <View style={{ marginBottom: 20 }}>
                    <View style={{ display: 'flex', flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#1F2937', paddingBottom: 8, marginBottom: 8 }}>
                        <Text style={{ width: '50%', fontSize: 9, fontWeight: 'bold', color: '#FFF', backgroundColor: '#1F2937', padding: 6, fontFamily: 'NotoSans' }}>Popis položky</Text>
                        <Text style={{ width: '15%', fontSize: 9, fontWeight: 'bold', color: '#FFF', backgroundColor: '#1F2937', padding: 6, textAlign: 'center', fontFamily: 'NotoSans' }}>Počet</Text>
                        <Text style={{ width: '18%', fontSize: 9, fontWeight: 'bold', color: '#FFF', backgroundColor: '#1F2937', padding: 6, textAlign: 'right', fontFamily: 'NotoSans' }}>Jednotková cena</Text>
                        <Text style={{ width: '17%', fontSize: 9, fontWeight: 'bold', color: '#FFF', backgroundColor: '#1F2937', padding: 6, textAlign: 'right', fontFamily: 'NotoSans' }}>Celkem</Text>
                    </View>
                    {lineItems.map((item, idx) => (
                        <View key={idx} style={{ display: 'flex', flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingVertical: 6 }}>
                            <Text style={{ width: '50%', fontSize: 10 }}>{item.description}</Text>
                            <Text style={{ width: '15%', fontSize: 10, textAlign: 'center' }}>{item.quantity}</Text>
                            <Text style={{ width: '18%', fontSize: 10, textAlign: 'right' }}>{formatCZK(item.unitPrice)}</Text>
                            <Text style={{ width: '17%', fontSize: 10, textAlign: 'right', fontWeight: 'bold', fontFamily: 'NotoSans' }}>{formatCZK(item.totalPrice)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals - ISDOC Format */}
                <View style={{ marginTop: 20, paddingTop: 15, borderTopWidth: 2, borderTopColor: '#EF4444' }}>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
                        <Text style={{ width: '40%', textAlign: 'right', fontSize: 10, color: '#666' }}>Celkem bez DPH:</Text>
                        <Text style={{ width: '20%', textAlign: 'right', fontSize: 10, fontFamily: 'NotoSans' }}>{formatCZK(totalAmount)}</Text>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 12, paddingHorizontal: 10, backgroundColor: '#FEE2E2', borderLeftWidth: 3, borderLeftColor: '#EF4444' }}>
                        <Text style={{ width: '40%', textAlign: 'right', fontSize: 11, fontWeight: 'bold', color: '#EF4444', fontFamily: 'NotoSans' }}>Celkem k úhradě:</Text>
                        <Text style={{ width: '20%', textAlign: 'right', fontSize: 14, fontWeight: 'bold', color: '#EF4444', fontFamily: 'NotoSans' }}>{formatCZK(totalAmount)}</Text>
                    </View>
                </View>

                {/* QR Code Section - ISDOC Compatible */}
                {qrDataUrl && (
                    <View style={{ marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', display: 'flex', flexDirection: 'row', gap: 20 }}>
                        <View style={{ width: 120 }}>
                            <Image src={qrDataUrl} style={{ width: 110, height: 110, borderWidth: 1, borderColor: '#D1D5DB' }} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 6, fontFamily: 'NotoSans' }}>QR Platba (SPAYD)</Text>
                            <Text style={{ fontSize: 9, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>
                                Naskenujte QR kód ve vaší bankovní aplikaci pro okamžitou platbu. Platební údaje jsou kódovány v QR kódu.
                            </Text>
                            {spaydString && (
                                <Text style={{ fontSize: 7, color: '#999', fontFamily: 'NotoSans', wordBreak: 'break-all' }}>
                                    {spaydString}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Footer */}
                <View style={{ marginTop: 30, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#E5E7EB', textAlign: 'center', fontSize: 8, color: '#999' }}>
                    <Text style={{ marginBottom: 4 }}>Tato faktura je vystavena dle zákona č. 235/2004 Sb. (zákon o DPH) a kompatibilní s ISDOC 6.0.1</Text>
                    <Text style={{ marginBottom: 4 }}>Číslo účtu: 2900765432/2010  |  IBAN: CZ6520100000002900765432</Text>
                    <Text>Vygenerováno systémem LAVRS Market</Text>
                </View>
            </Page>
        </Document>
    );
};

export default InvoicePdf;
