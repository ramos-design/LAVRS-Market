/**
 * Vercel Edge Function - ARES API Proxy
 * Řeší CORS problémy tím, že dělá ARES lookup na backendu
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Get IČO from query params
  const url = new URL(request.url);
  const ico = url.searchParams.get('ico');

  if (!ico) {
    return new Response(JSON.stringify({ error: 'IČO is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Normalize IČO
  const normalizedIco = ico.replace(/\s+/g, '').replace(/[^\d]/g, '');

  // Validate IČO format
  if (normalizedIco.length !== 8 || !/^\d{8}$/.test(normalizedIco)) {
    return new Response(
      JSON.stringify({ error: 'IČO musí obsahovat přesně 8 číslic' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Call ARES API from edge (no CORS issues)
    const response = await fetch(
      `https://ares.gov.cz/api/v1/economic-subjects/${normalizedIco}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LAVRS Market (Vercel Edge Function)',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Subjekt s daným IČO v ARES nenalezen' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`ARES API returned ${response.status}`);
    }

    const data = await response.json();

    // Validate response
    if (!data.ico || !data.name) {
      return new Response(
        JSON.stringify({ error: 'ARES vrátilo neplatná data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build address
    const addressParts = [
      data.address_street,
      data.address_postal_code,
      data.address_city,
    ].filter(Boolean);

    return new Response(
      JSON.stringify({
        ico: data.ico,
        name: data.name,
        address: addressParts.join(', ') || '',
        dic: data.dic || undefined,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ARES lookup error:', error);
    return new Response(
      JSON.stringify({ error: 'Chyba při komunikaci s ARES' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
