import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Test endpoint to directly test ARES API connectivity and response format
 * Used for debugging ARES communication issues
 *
 * Usage: /api/ares-test?ico=07968906
 */

type ResponseData = {
  success?: boolean;
  aresStatus?: number;
  rawAresData?: any;
  extractedFields?: any;
  aresError?: string;
  error?: string;
};

function extractAddress(data: any): string {
  const parts: string[] = [];

  if (data.sídlo && typeof data.sídlo === 'object') {
    const sid = data.sídlo;
    if (sid.ulice) parts.push(sid.ulice);
    if (sid.číslo_popisné) parts.push(sid.číslo_popisné);
    if (sid.číslo_orientační) parts.push(`/${sid.číslo_orientační}`);
    if (sid.poštovní_směrovací_číslo) parts.push(sid.poštovní_směrovací_číslo);
    if (sid.obec || sid.město) parts.push(sid.obec || sid.město);
  } else {
    if (data.ulice) parts.push(data.ulice);
    if (data.číslo_popisné) parts.push(data.číslo_popisné);
    if (data.číslo_orientační) parts.push(`/${data.číslo_orientační}`);
    if (data.psc) parts.push(data.psc);
    if (data.město || data.obec) parts.push(data.město || data.obec);
  }

  return parts.join(', ');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ico } = req.query;

  if (!ico || typeof ico !== 'string') {
    return res.status(400).json({ error: 'IČO is required' });
  }

  const normalizedIco = ico.replace(/\s+/g, '').replace(/[^\d]/g, '');

  if (normalizedIco.length !== 8 || !/^\d{8}$/.test(normalizedIco)) {
    return res.status(400).json({
      error: 'IČO musí obsahovat přesně 8 číslic',
    });
  }

  try {
    const aresUrl = `https://ares.gov.cz/api/v1/economic-subjects/${normalizedIco}`;
    console.log(`[ares-test] Direct ARES test for IČO: ${normalizedIco}`);
    console.log(`[ares-test] URL: ${aresUrl}`);

    const response = await fetch(aresUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LAVRS-Market-Test/1.0',
      },
    });

    console.log(`[ares-test] ARES responded with status: ${response.status}`);
    console.log(`[ares-test] Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ares-test] Non-OK response body: ${errorText.substring(0, 200)}`);

      return res.status(200).json({
        success: false,
        aresStatus: response.status,
        aresError: `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
      });
    }

    const data = await response.json();
    console.log(`[ares-test] ARES response keys:`, Object.keys(data));
    console.log(`[ares-test] Data:`, JSON.stringify(data, null, 2));

    // Try to extract standard fields
    const extracted = {
      ico: data.ico,
      name: data.obchodní_jméno || data.nazev_obchodniho_jmena || data.name,
      dic: data.dic || data.daňové_identifikační_číslo,
      address: extractAddress(data),
    };

    return res.status(200).json({
      success: true,
      aresStatus: response.status,
      rawAresData: data,
      extractedFields: extracted,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[ares-test] Error during request:`, errorMsg);

    return res.status(200).json({
      success: false,
      aresError: errorMsg,
      error: 'Exception during ARES call',
    });
  }
}
