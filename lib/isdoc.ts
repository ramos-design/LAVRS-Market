/**
 * ISDOC 6.0.1 XML Invoice Generator
 * Reference: https://mv.gov.cz/isdoc/
 * This generates machine-readable invoices compatible with Czech electronic invoicing.
 */

import { CompanySettings } from '../types';

export interface IsdocLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;   // in CZK (halers)
}

export interface IsdocInvoiceData {
    invoiceNumber: string;
    issuedDate: string;       // ISO format YYYY-MM-DD
    dueDate: string;          // ISO format YYYY-MM-DD
    variableSymbol: string;

    issuer: {
        name: string;
        address: string;
        ic: string;
        dic?: string;
    };

    customer: {
        name: string;
        address: string;
        ic: string;
        dic?: string;
        email?: string;
    };

    lineItems: IsdocLineItem[];
    totalAmount: number;   // in CZK (halers), without tax
    taxAmount: number;
}

/**
 * Converts CZK integer (halers) to decimal format with 2 decimals.
 * Example: 540000 → 5400.00
 */
function formatAmount(halers: number): string {
    return (halers / 100).toFixed(2);
}

/**
 * Builds a complete ISDOC 6.0.1 XML string.
 */
export function buildIsdocXml(data: IsdocInvoiceData): string {
    const uuid = crypto.randomUUID();
    const totalWithTax = data.totalAmount + data.taxAmount;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="http://isdoc.cz/namespace/invoice" version="6.0.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <DocumentType>1</DocumentType>
  <ID>${escapeXml(data.invoiceNumber)}</ID>
  <UUID>${uuid}</UUID>
  <IssueDate>${data.issuedDate}</IssueDate>
  <TaxPointDate>${data.issuedDate}</TaxPointDate>
  <DueDate>${data.dueDate}</DueDate>
  <VariableSymbol>${escapeXml(data.variableSymbol)}</VariableSymbol>

  <AccountingSupplierParty>
    <PartyIdentification>
      <PartyName>
        <Name>${escapeXml(data.issuer.name)}</Name>
      </PartyName>
      <PartyAddress>
        <StreetName>${escapeXml(data.issuer.address)}</StreetName>
      </PartyAddress>
      <PartyTaxScheme>
        <CompanyID>${escapeXml(data.issuer.ic)}</CompanyID>
        ${data.issuer.dic ? `<TaxRegistrationID>${escapeXml(data.issuer.dic)}</TaxRegistrationID>` : ''}
      </PartyTaxScheme>
    </PartyIdentification>
  </AccountingSupplierParty>

  <AccountingCustomerParty>
    <PartyIdentification>
      <PartyName>
        <Name>${escapeXml(data.customer.name)}</Name>
      </PartyName>
      <PartyAddress>
        <StreetName>${escapeXml(data.customer.address)}</StreetName>
      </PartyAddress>
      <PartyTaxScheme>
        <CompanyID>${escapeXml(data.customer.ic)}</CompanyID>
        ${data.customer.dic ? `<TaxRegistrationID>${escapeXml(data.customer.dic)}</TaxRegistrationID>` : ''}
      </PartyTaxScheme>
      ${data.customer.email ? `<Contact>
        <ElectronicMail>${escapeXml(data.customer.email)}</ElectronicMail>
      </Contact>` : ''}
    </PartyIdentification>
  </AccountingCustomerParty>

  <InvoiceLines>
${data.lineItems.map((item, index) => `    <InvoiceLine>
      <ID>${index + 1}</ID>
      <InvoicedQuantity unitCode="C62">${item.quantity}</InvoicedQuantity>
      <LineExtensionAmount>${formatAmount(item.unitPrice * item.quantity)}</LineExtensionAmount>
      <Item>
        <Description>${escapeXml(item.description)}</Description>
      </Item>
      <Price>
        <PriceAmount>${formatAmount(item.unitPrice)}</PriceAmount>
      </Price>
    </InvoiceLine>`).join('\n')}
  </InvoiceLines>

  <TaxTotal>
    <TaxAmount currencyID="CZK">${formatAmount(data.taxAmount)}</TaxAmount>
  </TaxTotal>

  <LegalMonetaryTotal>
    <LineExtensionAmount>${formatAmount(data.totalAmount)}</LineExtensionAmount>
    <TaxExclusiveAmount>${formatAmount(data.totalAmount)}</TaxExclusiveAmount>
    <AllowanceTotalAmount>0.00</AllowanceTotalAmount>
    <ChargeTotalAmount>0.00</ChargeTotalAmount>
    <PrepaidAmount>0.00</PrepaidAmount>
    <PayableAmount>${formatAmount(totalWithTax)}</PayableAmount>
  </LegalMonetaryTotal>
</Invoice>`;

    return xml;
}

/**
 * Escapes XML special characters to prevent injection.
 */
function escapeXml(str: string | undefined): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
