import { useState, useEffect, useCallback, useRef } from 'react';
import type { RssArticle, NewsCategory } from '../types';

const RSS_SOURCES = [
  { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml',              label: 'BBC Asia',    defaultCategory: 'security'   as NewsCategory },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml',                     label: 'Al Jazeera',  defaultCategory: 'diplomatic' as NewsCategory },
  { url: 'https://www.thehindu.com/news/international/feeder/default.rss', label: 'The Hindu',  defaultCategory: 'diplomatic' as NewsCategory },
  { url: 'https://feeds.feedburner.com/ndtvnews-india-news',               label: 'NDTV',       defaultCategory: 'security'   as NewsCategory },
];

// ─── Relevance / category classifiers ────────────────────────────────────────
const RELEVANCE_KEYWORDS = [
  'india', 'indian', 'pakistan', 'china', 'myanmar', 'bangladesh', 'nepal',
  'sri lanka', 'maldives', 'kashmir', 'loc', 'lac', 'border', 'military',
  'army', 'navy', 'airforce', 'missile', 'nuclear', 'terror', 'attack',
  'conflict', 'tension', 'ceasefire', 'infiltration', 'insurgency',
  'geopolitics', 'security', 'defence', 'strategic', 'ispr', 'isi',
  'houthi', 'iran', 'gulf', 'ladakh', 'arunachal', 'manipur', 'sindoor',
  'balakot', 'pulwama', 'quad', 'bri', 'cpec', 'pla', 'drones',
];

const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  military:     ['army', 'military', 'navy', 'airforce', 'troops', 'soldier', 'weapon', 'missile', 'strike', 'bomb', 'drone', 'warship', 'fighter', 'artillery', 'offensive', 'defence'],
  diplomatic:   ['talks', 'diplomat', 'minister', 'summit', 'agreement', 'treaty', 'sanction', 'ambassador', 'embassy', 'bilateral', 'multilateral', 'foreign', 'secretary', 'ministry'],
  intelligence: ['intel', 'cia', 'raw', 'isi', 'spy', 'surveillance', 'intercept', 'covert', 'agent', 'operation', 'classified', 'signal'],
  economic:     ['trade', 'export', 'import', 'oil', 'gas', 'economy', 'sanction', 'tariff', 'gdp', 'inflation', 'currency', 'investment', 'corridor'],
  security:     ['terror', 'attack', 'bomb', 'security', 'police', 'arrest', 'isis', 'al-qaeda', 'lashkar', 'jaish', 'naxal', 'insurgent', 'ceasefire', 'conflict'],
  humanitarian: ['refugee', 'civilian', 'aid', 'crisis', 'flood', 'disaster', 'displaced', 'casualties', 'humanitarian'],
};

function classifyCategory(text: string): NewsCategory {
  const lower = text.toLowerCase();
  let best: NewsCategory = 'security';
  let bestScore = 0;
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = kws.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = cat as NewsCategory; }
  }
  return best;
}

function relevanceScore(text: string): number {
  return RELEVANCE_KEYWORDS.filter((kw) => text.toLowerCase().includes(kw)).length;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').trim();
}

// ─── Parse raw RSS XML string into articles ───────────────────────────────────
function parseRssXml(xml: string, label: string, defaultCategory: NewsCategory): RssArticle[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const parseErr = doc.querySelector('parsererror');
  if (parseErr) throw new Error('XML parse error');

  return Array.from(doc.querySelectorAll('item')).map((item): RssArticle => {
    const title       = stripHtml(item.querySelector('title')?.textContent || '');
    const link        = item.querySelector('link')?.textContent?.trim() || '';
    const pubDate     = item.querySelector('pubDate')?.textContent || new Date().toISOString();
    const description = stripHtml(item.querySelector('description')?.textContent || '').slice(0, 220);
    const thumbnail   = item.querySelector('enclosure')?.getAttribute('url') ||
                        item.querySelector('thumbnail')?.getAttribute('url') || undefined;
    return { title, link, pubDate, description, thumbnail, source: label, sourceLabel: label, category: classifyCategory(`${title} ${description}`) || defaultCategory };
  }).filter((a) => relevanceScore(`${a.title} ${a.description}`) >= 2);
}

// ─── Fetch via our own Vercel Edge proxy (/api/news) ─────────────────────────
// Server-side fetch — zero CORS restrictions, no third-party dependencies.
async function fetchViaProxy(rssUrl: string, label: string, cat: NewsCategory): Promise<RssArticle[]> {
  const proxyUrl = `/api/news?url=${encodeURIComponent(rssUrl)}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`proxy ${res.status} for ${label}`);
  const xml = await res.text();
  return parseRssXml(xml, label, cat);
}

// ─── Guardian API (native CORS support, no proxy needed) ─────────────────────
async function fetchGuardian(apiKey: string): Promise<RssArticle[]> {
  const q = 'india+pakistan+china+kashmir+military+border+conflict+security';
  const url = `https://content.guardianapis.com/search?q=${q}&show-fields=headline,thumbnail,trailText&order-by=newest&page-size=30&api-key=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`guardian ${res.status}`);
  interface GResult { webTitle: string; webUrl: string; webPublicationDate: string; fields?: { headline?: string; thumbnail?: string; trailText?: string } }
  const data: { response: { results: GResult[] } } = await res.json();
  return data.response.results.map((r): RssArticle => {
    const title = r.fields?.headline || r.webTitle;
    return { title, link: r.webUrl, pubDate: r.webPublicationDate, description: stripHtml(r.fields?.trailText || '').slice(0, 220), thumbnail: r.fields?.thumbnail, source: 'guardian', sourceLabel: 'The Guardian', category: classifyCategory(`${title} ${r.fields?.trailText}`) };
  }).filter((a) => relevanceScore(`${a.title} ${a.description}`) >= 1);
}

function dedup(articles: RssArticle[]): RssArticle[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    const key = a.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface NewsFeedState {
  articles: RssArticle[];
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  refresh: () => void;
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useNewsFeed(): NewsFeedState {
  const [articles, setArticles] = useState<RssArticle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const guardianKey = import.meta.env.VITE_GUARDIAN_API_KEY;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const results = await Promise.allSettled([
      ...RSS_SOURCES.map((s) => fetchViaProxy(s.url, s.label, s.defaultCategory)),
      ...(guardianKey ? [fetchGuardian(guardianKey)] : []),
    ]);

    const all: RssArticle[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') all.push(...r.value);
    }

    if (all.length === 0) {
      setError('All sources failed. Check network connectivity.');
      setLoading(false);
      return;
    }

    all.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    setArticles(dedup(all).slice(0, 80));
    setLastRefreshed(new Date());
    setLoading(false);
  }, [guardianKey]);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchAll]);

  return { articles, loading, error, lastRefreshed, refresh: fetchAll };
}
