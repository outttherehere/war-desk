// Vercel Edge Function — server-side proxy for RSS feeds and GDELT
// Runs server-side: zero CORS restrictions, no third-party dependencies.
export const config = { runtime: 'edge' };

const ALLOWED_DOMAINS = [
  // RSS sources
  'bbci.co.uk',
  'bbc.co.uk',
  'aljazeera.com',
  'thehindu.com',
  'feedburner.com',
  'ndtv.com',
  // GDELT free API (geopolitical event monitoring)
  'api.gdeltproject.org',
];

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const rssUrl = searchParams.get('url');

  if (!rssUrl) {
    return new Response('Missing ?url= parameter', { status: 400 });
  }

  const isAllowed = ALLOWED_DOMAINS.some((d) => rssUrl.includes(d));
  if (!isAllowed) {
    return new Response('Domain not in allow-list', { status: 403 });
  }

  try {
    const upstream = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IntelBot/1.0)' },
      signal: AbortSignal.timeout(14000),
    });

    if (!upstream.ok) {
      return new Response(`Upstream error: ${upstream.status}`, { status: 502 });
    }

    const body = await upstream.text();
    // Auto-detect JSON vs XML
    const isJson = body.trimStart().startsWith('{') || body.trimStart().startsWith('[');

    return new Response(body, {
      headers: {
        'Content-Type': isJson
          ? 'application/json; charset=utf-8'
          : 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`Fetch failed: ${msg}`, { status: 502 });
  }
}
