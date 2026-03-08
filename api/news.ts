// Vercel Edge Function — server-side RSS proxy, no CORS issues
export const config = { runtime: 'edge' };

const ALLOWED_DOMAINS = [
  'bbci.co.uk',
  'aljazeera.com',
  'thehindu.com',
  'feedburner.com',
  'ndtv.com',
  'feeds.guardianapis.com',
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
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
      signal: AbortSignal.timeout(12000),
    });

    if (!upstream.ok) {
      return new Response(`Upstream error: ${upstream.status}`, { status: 502 });
    }

    const xml = await upstream.text();
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`Fetch failed: ${msg}`, { status: 502 });
  }
}
