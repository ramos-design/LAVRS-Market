/**
 * ISDOC 6.0.1 XML Invoice Generator
 * Reference: https://mv.gov.cz/isdoc/
 * Generates machine-readable invoices with DPH (VAT) per Czech law (zákon č. 235/2004 Sb.)
 */

export interface IsdocLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPriceCzk: number;   // in CZK (not halers)
    dphRate: number;        // e.g. 21 for 21%
}

export interface IsdocInvoiceData {
    invoiceNumber: string;
    issuedDate: string;       // YYYY-MM-DD
    taxPointDate: string;     // datum uskutečnění zdanitelného plnění
    dueDate: string;          // YYYY-MM-DD
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
    totalBaseCzk: number;       // základ bez DPH
    totalTaxCzk: number;        // DPH
    totalWithDphCzk: number;    // celkem s DPH

    bankAccount: string;
    bankIban: string;
}

function fmt(czk: number): string {
    return czk.toFixed(2);
}

function escapeXml(str: string | undefined): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Builds a complete ISDOC 6.0.1 XML string with DPH tax breakdown.
 */
export function buildIsdocXml(data: IsdocInvoiceData): string {
    const uuid = crypto.randomUUID();

    // Group line items by DPH rate for TaxSubTotal
    const taxGroups = new Map<number, { base: number; tax: number }>();
    data.lineItems.forEach((item) => {
        const lineBase = item.unitPriceCzk * item.quantity;
        const lineTax = Math.round(lineBase * (item.dphRate / 100) * 100) / 100;
        const existing = taxGroups.get(item.dphRate) || { base: 0, tax: 0 };
        existing.base += lineBase;
        existing.tax += lineTax;
        taxGroups.set(item.dphRate, existing);
    });

    const taxSubTotals = Array.from(taxGroups.entries())
        .map(([rate, group]) => `    <TaxSubTotal>
      <TaxableAmount currencyID="CZK">${fmt(group.base)}</TaxableAmount>
      <TaxAmount currencyID="CZK">${fmt(group.tax)}</TaxAmount>
      <TaxCategory>
        <Percent>${fmt(rate)}</Percent>
      </TaxCategory>
    </TaxSubTotal>`)
        .join('\n');

    const invoiceLines = data.lineItems.map((item, index) => {
        const lineBase = item.unitPriceCzk * item.quantity;
        const lineTax = Math.round(lineBase * (item.dphRate / 100) * 100) / 100;
        return `    <InvoiceLine>
      <ID>${index + 1}</ID>
      <InvoicedQuantity unitCode="C62">${item.quantity}</InvoicedQuantity>
      <LineExtensionAmount currencyID="CZK">${fmt(lineBase)}</LineExtensionAmount>
      <LineExtensionAmountTaxInclusive currencyID="CZK">${fmt(lineBase + lineTax)}</LineExtensionAmountTaxInclusive>
      <LineExtensionTaxAmount currencyID="CZK">${fmt(lineTax)}</LineExtensionTaxAmount>
      <ClassifiedTaxCategory>
        <Percent>${fmt(item.dphRate)}</Percent>
        <VATCalculationMethod>0</VATCalculationMethod>
      </ClassifiedTaxCategory>
      <Item>
        <Description>${escapeXml(item.description)}</Description>
      </Item>
      <UnitPrice>${fmt(item.unitPriceCzk)}</UnitPrice>
    </InvoiceLine>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="http://isdoc.cz/namespace/invoice" version="6.0.1">
  <DocumentType>1</DocumentType>
  <ID>${escapeXml(data.invoiceNumber)}</ID>
  <UUID>${uuid}</UUID>
  <IssueDate>${data.issuedDate}</IssueDate>
  <TaxPointDate>${data.taxPointDate}</TaxPointDate>
  <VATApplicable>true</VATApplicable>
  <Note>FAKTURA - DAŇOVÝ DOKLAD</Note>
  <LocalCurrencyCode>CZK</LocalCurrencyCode>
  <CurrRate>1</CurrRate>
  <RefCurrRate>1</RefCurrRate>

  <AccountingSupplierParty>
    <Party>
      <PartyIdentification>
        <ID>${escapeXml(data.issuer.ic)}</ID>
      </PartyIdentification>
      <PartyName>
        <Name>${escapeXml(data.issuer.name)}</Name>
      </PartyName>
      <PostalAddress>
        <StreetName>${escapeXml(data.issuer.address)}</StreetName>
        <Country>
          <IdentificationCode>CZ</IdentificationCode>
          <Name>Česká republika</Name>
        </Country>
      </PostalAddress>
      <PartyTaxScheme>
        <CompanyID>${escapeXml(data.issuer.ic)}</CompanyID>
        ${data.issuer.dic ? `<TaxScheme>${escapeXml(data.issuer.dic)}</TaxScheme>` : ''}
      </PartyTaxScheme>
    </Party>
  </AccountingSupplierParty>

  <AccountingCustomerParty>
    <Party>
      <PartyIdentification>
        <ID>${escapeXml(data.customer.ic)}</ID>
      </PartyIdentification>
      <PartyName>
        <Name>${escapeXml(data.customer.name)}</Name>
      </PartyName>
      <PostalAddress>
        <StreetName>${escapeXml(data.customer.address)}</StreetName>
        <Country>
          <IdentificationCode>CZ</IdentificationCode>
          <Name>Česká republika</Name>
        </Country>
      </PostalAddress>
      <PartyTaxScheme>
        <CompanyID>${escapeXml(data.customer.ic)}</CompanyID>
        ${data.customer.dic ? `<TaxScheme>${escapeXml(data.customer.dic)}</TaxScheme>` : ''}
      </PartyTaxScheme>
      ${data.customer.email ? `<Contact>
        <ElectronicMail>${escapeXml(data.customer.email)}</ElectronicMail>
      </Contact>` : ''}
    </Party>
  </AccountingCustomerParty>

  <PaymentMeans>
    <Payment>
      <PaidAmount currencyID="CZK">${fmt(data.totalWithDphCzk)}</PaidAmount>
      <PaymentMeansCode>42</PaymentMeansCode>
      <Details>
        <PaymentDueDate>${data.dueDate}</PaymentDueDate>
        <ID>${escapeXml(data.variableSymbol)}</ID>
        <BankCode>${escapeXml((data.bankAccount || '').split('/')[1] || '')}</BankCode>
        <Name>${escapeXml((data.bankAccount || '').split('/')[0] || '')}</Name>
        <IBAN>${escapeXml((data.bankIban || '').replace(/\s+/g, ''))}</IBAN>
      </Details>
    </Payment>
  </PaymentMeans>

  <TaxTotal>
    <TaxAmount currencyID="CZK">${fmt(data.totalTaxCzk)}</TaxAmount>
${taxSubTotals}
  </TaxTotal>

  <LegalMonetaryTotal>
    <TaxExclusiveAmount currencyID="CZK">${fmt(data.totalBaseCzk)}</TaxExclusiveAmount>
    <TaxInclusiveAmount currencyID="CZK">${fmt(data.totalWithDphCzk)}</TaxInclusiveAmount>
    <AlreadyClaimedTaxExclusiveAmount currencyID="CZK">0.00</AlreadyClaimedTaxExclusiveAmount>
    <AlreadyClaimedTaxInclusiveAmount currencyID="CZK">0.00</AlreadyClaimedTaxInclusiveAmount>
    <DifferenceTaxExclusiveAmount currencyID="CZK">${fmt(data.totalBaseCzk)}</DifferenceTaxExclusiveAmount>
    <DifferenceTaxInclusiveAmount currencyID="CZK">${fmt(data.totalWithDphCzk)}</DifferenceTaxInclusiveAmount>
    <PayableRoundingAmount currencyID="CZK">0.00</PayableRoundingAmount>
    <PaidDepositsAmount currencyID="CZK">0.00</PaidDepositsAmount>
    <PayableAmount currencyID="CZK">${fmt(data.totalWithDphCzk)}</PayableAmount>
  </LegalMonetaryTotal>

  <InvoiceLines>
${invoiceLines}
  </InvoiceLines>
</Invoice>`;

    return xml;
}
