/**
 * ARES (Administrativní registr ekonomických subjektů) API wrapper
 * Documentation: https://ares.gov.cz/stranky/vyvojar-info
 *
 * Uses backend proxy at /api/ares to avoid CORS issues
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
 * Calls /api/ares serverless function which proxies to ARES
 */
export async function fetchFromARES(ico: string): Promise<AresCompanyData | null> {
  // Normalize IČO: remove spaces and non-digits
  const normalizedIco = ico.replace(/\s+/g, '').replace(/[^\d]/g, '');

  // IČO must be exactly 8 digits
  if (normalizedIco.length !== 8 || !/^\d{8}$/.test(normalizedIco)) {
    throw new Error('IČO musí obsahovat přesně 8 číslic');
  }

  try {
    // Call backend proxy at /api/ares
    console.log(`[aresAPI] Requesting IČO: ${normalizedIco}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `/api/ares?ico=${encodeURIComponent(normalizedIco)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    console.log(`[aresAPI] Response status: ${response.status}`);

    if (!response.ok) {
      let errorData = { error: `HTTP ${response.status}` };
      try {
        errorData = await response.json();
        console.error(`[aresAPI] Error response:`, errorData);
      } catch (e) {
        console.error(`[aresAPI] Could not parse error response as JSON`);
      }
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`[aresAPI] Success response:`, data);

    // Validate response has required fields
    if (!data.ico || !data.name) {
      console.error(`[aresAPI] Missing required fields: ico=${data.ico}, name=${data.name}`);
      throw new Error('Servere se nepodařilo načíst data z ARES');
    }

    return {
      ico: data.ico,
      name: data.name,
      address: data.address || '',
      dic: data.dic || undefined,
    };
  } catch (error) {
    console.error(`[aresAPI] Catch block error:`, error);
    if (error instanceof Error) {
      // Handle abort/timeout
      if (error.name === 'AbortError') {
        throw new Error('Timeout - ARES server neodpovídá');
      }
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
