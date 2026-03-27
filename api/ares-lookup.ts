/**
 * Vercel API Route - ARES API Proxy
 * Řeší CORS problémy tím, že dělá ARES lookup na backendu
 */

type ResponseData = {
  ico?: string;
  name?: string;
  address?: string;
  dic?: string;
  error?: string;
};

export default async function handler(
  req: any,
  res: any
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get IČO from query params
  const { ico } = req.query;

  if (!ico) {
    return res.status(400).json({ error: 'IČO is required' });
  }

  // Normalize IČO
  const normalizedIco = String(ico)
    .replace(/\s+/g, '')
    .replace(/[^\d]/g, '');

  // Validate IČO format
  if (normalizedIco.length !== 8 || !/^\d{8}$/.test(normalizedIco)) {
    return res.status(400).json({
      error: 'IČO musí obsahovat přesně 8 číslic'
    });
  }

  try {
    // Call ARES API from Node.js (no CORS issues)
    const response = await fetch(
      `https://ares.gov.cz/api/v1/economic-subjects/${normalizedIco}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LAVRS Market (Vercel API Route)',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          error: 'Subjekt s daným IČO v ARES nenalezen'
        });
      }
      throw new Error(`ARES API returned ${response.status}`);
    }

    const data = await response.json();

    // Validate response
    if (!data.ico || !data.name) {
      return res.status(400).json({
        error: 'ARES vrátilo neplatná data'
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
    } as ResponseData);
  } catch (error) {
    console.error('ARES lookup error:', error);
    return res.status(500).json({
      error: 'Chyba při komunikaci s ARES'
    });
  }
}
