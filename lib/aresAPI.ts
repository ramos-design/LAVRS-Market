/**
 * ARES (Administrativní registr ekonomických subjektů) API wrapper
 * Documentation: https://ares.gov.cz/stranky/vyvojar-info
 *
 * NOTE: Uses Vercel Edge Function proxy to avoid CORS issues
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
 *
 * Uses backend proxy endpoint: /api/ares-lookup
 */
export async function fetchFromARES(ico: string): Promise<AresCompanyData | null> {
  // Normalize IČO: remove spaces and non-digits
  const normalizedIco = ico.replace(/\s+/g, '').replace(/[^\d]/g, '');

  // IČO must be exactly 8 digits
  if (normalizedIco.length !== 8 || !/^\d{8}$/.test(normalizedIco)) {
    throw new Error('IČO musí obsahovat přesně 8 číslic');
  }

  try {
    // Call our backend proxy endpoint (Vercel Edge Function)
    // This avoids CORS issues by doing the ARES lookup server-side
    const response = await fetch(
      `/api/ares-lookup?ico=${encodeURIComponent(normalizedIco)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error || `Chyba: ${response.status}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();

    // Validate response has required fields
    if (!data.ico || !data.name) {
      throw new Error('Servere se nepodařilo načíst data z ARES');
    }

    return {
      ico: data.ico,
      name: data.name,
      address: data.address || '',
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
