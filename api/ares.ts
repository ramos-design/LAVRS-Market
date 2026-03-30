import type { VercelRequest, VercelResponse } from '@vercel/node';

type ResponseData = {
  ico?: string;
  name?: string;
  address?: string;
  dic?: string;
  error?: string;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ResponseData>
) {
  // Only GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ico } = req.query;

  if (!ico || typeof ico !== 'string') {
    return res.status(400).json({ error: 'IČO is required' });
  }

  // Normalize IČO
  const normalizedIco = ico.replace(/\s+/g, '').replace(/[^\d]/g, '');

  if (normalizedIco.length !== 8 || !/^\d{8}$/.test(normalizedIco)) {
    return res.status(400).json({
      error: 'IČO musí obsahovat přesně 8 číslic',
    });
  }

  try {
    const aresUrl = `https://ares.gov.cz/api/v1/economic-subjects/${normalizedIco}`;
    console.log(`[ARES] Fetching: ${aresUrl}`);

    const response = await fetch(aresUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`[ARES] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ARES] Error response: ${errorText}`);

      if (response.status === 404) {
        return res.status(404).json({
          error: 'Subjekt s daným IČO v ARES nenalezen',
        });
      }
      return res.status(response.status).json({
        error: `ARES API error: ${response.status}`,
      });
    }

    const data = await response.json();
    console.log(`[ARES] Received data keys:`, Object.keys(data));
    console.log(`[ARES] Full response:`, JSON.stringify(data, null, 2));

    if (!data.ico || !data.name) {
      console.error(`[ARES] Missing required fields: ico=${data.ico}, name=${data.name}`);
      console.error(`[ARES] Available fields:`, Object.keys(data));
      return res.status(400).json({
        error: 'ARES vrátilo neplatná data',
      });
    }

    // Build address - try various field combinations
    const addressParts = [
      data.address_street || data.ulice || data.street,
      data.address_postal_code || data.psc || data.poštovní_směrovací_číslo,
      data.address_city || data.město || data.obec || data.city,
    ].filter(Boolean);

    const responseData = {
      ico: data.ico,
      name: data.name,
      address: addressParts.join(', ') || '',
      dic: data.dic || undefined,
    };

    console.log(`[ARES] Returning success response:`, JSON.stringify(responseData));
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('[ARES] Lookup error:', error instanceof Error ? error.message : String(error));
    console.error('[ARES] Stack:', error instanceof Error ? error.stack : 'No stack');
    return res.status(500).json({
      error: 'Chyba při komunikaci s ARES',
    });
  }
}
