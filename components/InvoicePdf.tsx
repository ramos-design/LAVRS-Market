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

// Register Liberation Sans with both Regular and Bold weights (bundled locally)
Font.register({
    family: 'LiberationSans',
    fonts: [
        { src: '/fonts/LiberationSans-Regular.ttf', fontWeight: 400 },
        { src: '/fonts/LiberationSans-Bold.ttf', fontWeight: 700 },
    ],
});

const styles = StyleSheet.create({
    page: {
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'LiberationSans',
        fontSize: 10,
        color: '#1F2937',
        lineHeight: 1.5,
    },

    // Header
    headerContainer: {
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#EF4444',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#EF4444',
        marginBottom: 10,
    },
    headerMetaRow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    headerMetaDivider: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    metaLabel: {
        fontSize: 9,
        color: '#666',
        marginBottom: 2,
    },
    metaValue: {
        fontSize: 11,
    },
    metaValueLarge: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    metaValueBold: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    textRight: {
        textAlign: 'right',
    },

    // Party info
    partyColumns: {
        display: 'flex',
        flexDirection: 'row',
        gap: 40,
        marginBottom: 30,
    },
    partyColumn: {
        flex: 1,
    },
    partyLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
    },
    partyName: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    partyAddress: {
        fontSize: 10,
        marginBottom: 8,
        lineHeight: 1.4,
    },
    partyDetail: {
        fontSize: 9,
    },

    // Line items table
    lineItemsSection: {
        marginBottom: 20,
    },
    tableHeaderRow: {
        display: 'flex',
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: '#1F2937',
        paddingBottom: 8,
        marginBottom: 8,
    },
    tableHeaderCellBase: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#FFF',
        backgroundColor: '#1F2937',
        padding: 6,
    },
    thDescription: {
        width: '50%',
        textAlign: 'left',
    },
    thQuantity: {
        width: '15%',
        textAlign: 'center',
    },
    thUnitPrice: {
        width: '18%',
        textAlign: 'right',
    },
    thTotal: {
        width: '17%',
        textAlign: 'right',
    },
    tableDataRow: {
        display: 'flex',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingVertical: 6,
    },
    tdDescription: {
        width: '50%',
        fontSize: 10,
        textAlign: 'left',
    },
    tdQuantity: {
        width: '15%',
        fontSize: 10,
        textAlign: 'center',
    },
    tdUnitPrice: {
        width: '18%',
        fontSize: 10,
        textAlign: 'right',
    },
    tdTotal: {
        width: '17%',
        fontSize: 10,
        textAlign: 'right',
        fontWeight: 'bold',
    },

    // Totals
    totalsContainer: {
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 2,
        borderTopColor: '#EF4444',
    },
    subtotalRow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 10,
    },
    subtotalLabel: {
        width: '40%',
        textAlign: 'right',
        fontSize: 10,
        color: '#666',
    },
    subtotalValue: {
        width: '20%',
        textAlign: 'right',
        fontSize: 10,
    },
    grandTotalRow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingVertical: 12,
        paddingHorizontal: 10,
        backgroundColor: '#FEE2E2',
        borderLeftWidth: 3,
        borderLeftColor: '#EF4444',
    },
    grandTotalLabel: {
        width: '40%',
        textAlign: 'right',
        fontSize: 11,
        fontWeight: 'bold',
        color: '#EF4444',
    },
    grandTotalValue: {
        width: '20%',
        textAlign: 'right',
        fontSize: 14,
        fontWeight: 'bold',
        color: '#EF4444',
    },

    // QR section
    qrContainer: {
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        display: 'flex',
        flexDirection: 'row',
        gap: 20,
    },
    qrImageWrapper: {
        width: 120,
    },
    qrImage: {
        width: 110,
        height: 110,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    qrInfo: {
        flex: 1,
    },
    qrTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    qrDescription: {
        fontSize: 9,
        color: '#666',
        lineHeight: 1.5,
        marginBottom: 8,
    },
    spaydText: {
        fontSize: 7,
        color: '#999',
    },

    // Footer
    footerContainer: {
        marginTop: 30,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        textAlign: 'center',
        fontSize: 8,
        color: '#999',
    },
    footerLine: {
        marginBottom: 4,
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
                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>FAKTURA</Text>

                    <View style={styles.headerMetaRow}>
                        <View>
                            <Text style={styles.metaLabel}>Číslo faktury</Text>
                            <Text style={styles.metaValueLarge}>{invoiceNumber}</Text>
                        </View>
                        <View style={styles.textRight}>
                            <Text style={styles.metaLabel}>Datum vystavení</Text>
                            <Text style={styles.metaValue}>{formatDate(issuedDate)}</Text>
                        </View>
                    </View>

                    <View style={styles.headerMetaDivider}>
                        <View>
                            <Text style={styles.metaLabel}>Splatnost</Text>
                            <Text style={styles.metaValue}>{formatDate(dueDate)}</Text>
                        </View>
                        <View style={styles.textRight}>
                            <Text style={styles.metaLabel}>Variabilní symbol</Text>
                            <Text style={styles.metaValueBold}>{variableSymbol}</Text>
                        </View>
                    </View>
                </View>

                {/* Issuer and Customer */}
                <View style={styles.partyColumns}>
                    <View style={styles.partyColumn}>
                        <Text style={styles.partyLabel}>VYSTAVOVATEL:</Text>
                        <Text style={styles.partyName}>{issuerName}</Text>
                        <Text style={styles.partyAddress}>{issuerAddress}</Text>
                        <Text style={styles.partyDetail}>IČ:  {issuerIC}</Text>
                        {issuerDIC && <Text style={styles.partyDetail}>DIČ: {issuerDIC}</Text>}
                    </View>

                    <View style={styles.partyColumn}>
                        <Text style={styles.partyLabel}>ODBĚRATEL:</Text>
                        <Text style={styles.partyName}>{customerName}</Text>
                        <Text style={styles.partyAddress}>{customerAddress}</Text>
                        <Text style={styles.partyDetail}>IČ:  {customerIC}</Text>
                        {customerDIC && <Text style={styles.partyDetail}>DIČ: {customerDIC}</Text>}
                        {customerEmail && <Text style={styles.partyDetail}>Email: {customerEmail}</Text>}
                    </View>
                </View>

                {/* Line Items Table */}
                <View style={styles.lineItemsSection} wrap>
                    <View style={styles.tableHeaderRow} wrap={false} minPresenceAhead={20}>
                        <Text style={[styles.tableHeaderCellBase, styles.thDescription]}>Popis položky</Text>
                        <Text style={[styles.tableHeaderCellBase, styles.thQuantity]}>Počet</Text>
                        <Text style={[styles.tableHeaderCellBase, styles.thUnitPrice]}>Jednotková cena</Text>
                        <Text style={[styles.tableHeaderCellBase, styles.thTotal]}>Celkem</Text>
                    </View>
                    {lineItems.map((item, idx) => (
                        <View key={idx} style={styles.tableDataRow} wrap={false}>
                            <Text style={styles.tdDescription}>{item.description}</Text>
                            <Text style={styles.tdQuantity}>{item.quantity}</Text>
                            <Text style={styles.tdUnitPrice}>{formatCZK(item.unitPrice)}</Text>
                            <Text style={styles.tdTotal}>{formatCZK(item.totalPrice)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalsContainer}>
                    <View style={styles.subtotalRow}>
                        <Text style={styles.subtotalLabel}>Celkem bez DPH:</Text>
                        <Text style={styles.subtotalValue}>{formatCZK(totalAmount)}</Text>
                    </View>
                    <View style={styles.grandTotalRow}>
                        <Text style={styles.grandTotalLabel}>Celkem k úhradě:</Text>
                        <Text style={styles.grandTotalValue}>{formatCZK(totalAmount)}</Text>
                    </View>
                </View>

                {/* QR Code */}
                {qrDataUrl && (
                    <View style={styles.qrContainer} wrap={false}>
                        <View style={styles.qrImageWrapper}>
                            <Image src={qrDataUrl} style={styles.qrImage} />
                        </View>
                        <View style={styles.qrInfo}>
                            <Text style={styles.qrTitle}>QR Platba (SPAYD)</Text>
                            <Text style={styles.qrDescription}>
                                Naskenujte QR kód ve vaší bankovní aplikaci pro okamžitou platbu. Platební údaje jsou kódovány v QR kódu.
                            </Text>
                            {spaydString && (
                                <Text style={styles.spaydText}>
                                    {spaydString}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerLine}>Tato faktura je vystavena dle zákona č. 235/2004 Sb. (zákon o DPH) a kompatibilní s ISDOC 6.0.1</Text>
                    <Text style={styles.footerLine}>Číslo účtu: 2900765432/2010  |  IBAN: CZ6520100000002900765432</Text>
                    <Text>Vygenerováno systémem LAVRS Market</Text>
                </View>
            </Page>
        </Document>
    );
};

export default InvoicePdf;
