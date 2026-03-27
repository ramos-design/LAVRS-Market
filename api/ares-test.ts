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
  aresData?: any;
  aresError?: string;
  error?: string;
};

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

    return res.status(200).json({
      success: true,
      aresStatus: response.status,
      aresData: data,
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
