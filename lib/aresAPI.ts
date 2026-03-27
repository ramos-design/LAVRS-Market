/**
 * ARES (Administrativní registr ekonomických subjektů) API wrapper
 * Documentation: https://ares.gov.cz/stranky/vyvojar-info
 */

export interface AresCompanyData {
  ico: string;
  name: string;
  address: string;
  dic?: string;
}

/**
 * Fetch company data from ARES by IČO (Czech company ID)
 * IČO must be 8 digits
 */
export async function fetchFromARES(ico: string): Promise<AresCompanyData | null> {
  // Normalize IČO: remove spaces and non-digits
  const normalizedIco = ico.replace(/\s+/g, '').replace(/[^\d]/g, '');

  // IČO must be exactly 8 digits
  if (normalizedIco.length !== 8 || !/^\d{8}$/.test(normalizedIco)) {
    throw new Error('IČO musí obsahovat přesně 8 číslic');
  }

  try {
    const response = await fetch(
      `https://ares.gov.cz/api/v1/economic-subjects/${normalizedIco}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Subjekt s daným IČO v ARES nenalezen');
      }
      throw new Error(`ARES API chyba: ${response.status}`);
    }

    const data = await response.json();

    // Extract relevant fields from ARES response
    // ARES response structure:
    // {
    //   ico: string
    //   name: string
    //   address_region: string
    //   address_city: string
    //   address_street: string
    //   address_postal_code: string
    //   dic: string
    // }

    if (!data.ico || !data.name) {
      throw new Error('ARES vrátilo neplatná data');
    }

    // Build full address
    const addressParts = [
      data.address_street,
      data.address_postal_code,
      data.address_city,
    ].filter(Boolean);

    return {
      ico: data.ico,
      name: data.name,
      address: addressParts.join(', ') || '',
      dic: data.dic || undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Chyba při komunikaci s ARES');
  }
}

/**
 * Validate Czech IČO format
 */
export function isValidIcoFormat(ico: string): boolean {
  const normalized = ico.replace(/\s+/g, '').replace(/[^\d]/g, '');
  return normalized.length === 8 && /^\d{8}$/.test(normalized);
}
