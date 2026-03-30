/**
 * ARES (Administrativní registr ekonomických subjektů) API wrapper
 * New endpoint (2024+): https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ico}
 * CORS: allowed (access-control-allow-origin: *) — no proxy needed
 */

export interface AresCompanyData {
  ico: string;
  name: string;
  address: string;
  dic?: string;
}

const ARES_BASE_URL = 'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty';

/**
 * Fetch company data from ARES by IČO (Czech company ID).
 * Calls ARES REST API directly (CORS allowed).
 */
export async function fetchFromARES(ico: string): Promise<AresCompanyData | null> {
  const normalizedIco = ico.replace(/\s+/g, '').replace(/[^\d]/g, '');

  if (normalizedIco.length !== 8 || !/^\d{8}$/.test(normalizedIco)) {
    throw new Error('IČO musí obsahovat přesně 8 číslic');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${ARES_BASE_URL}/${normalizedIco}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Subjekt s daným IČO v ARES nenalezen');
      }
      throw new Error(`ARES API chyba: ${response.status}`);
    }

    const data = await response.json();

    if (!data.ico || !data.obchodniJmeno) {
      throw new Error('ARES vrátilo neplatná data');
    }

    // Build address from sidlo.textovaAdresa or construct from parts
    let address = '';
    if (data.sidlo?.textovaAdresa) {
      address = data.sidlo.textovaAdresa;
    } else if (data.sidlo) {
      const parts = [
        data.sidlo.nazevUlice
          ? `${data.sidlo.nazevUlice} ${data.sidlo.cisloDomovni || ''}${data.sidlo.cisloOrientacni ? '/' + data.sidlo.cisloOrientacni : ''}`.trim()
          : null,
        data.sidlo.nazevMestskeCastiObvodu || data.sidlo.nazevObce,
        data.sidlo.psc ? `${data.sidlo.psc} ${data.sidlo.nazevObce || ''}`.trim() : null,
      ].filter(Boolean);
      address = parts.join(', ');
    }

    return {
      ico: data.ico,
      name: data.obchodniJmeno,
      address,
      dic: data.dic || undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
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
