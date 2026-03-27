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
        return res.status(404).json({
          error: 'Subjekt s daným IČO v ARES nenalezen',
        });
      }
      return res.status(response.status).json({
        error: `ARES API error: ${response.status}`,
      });
    }

    const data = await response.json();

    if (!data.ico || !data.name) {
      return res.status(400).json({
        error: 'ARES vrátilo neplatná data',
      });
    }

    // Build address
    const addressParts = [
      data.address_street,
      data.address_postal_code,
      data.address_city,
    ].filter(Boolean);

    return res.status(200).json({
      ico: data.ico,
      name: data.name,
      address: addressParts.join(', ') || '',
      dic: data.dic || undefined,
    });
  } catch (error) {
    console.error('ARES lookup error:', error);
    return res.status(500).json({
      error: 'Chyba při komunikaci s ARES',
    });
  }
}
