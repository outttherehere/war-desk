import { useState, useEffect, useCallback, useRef } from 'react';
import type { RssArticle, NewsCategory } from '../types';

const RSS_SOURCES = [
  { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml',       label: 'BBC Asia',    defaultCategory: 'security'   as NewsCategory },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml',              label: 'Al Jazeera',  defaultCategory: 'diplomatic' as NewsCategory },
  { url: 'https://www.thehindu.com/news/international/feeder/default.rss', label: 'The Hindu', defaultCategory: 'diplomatic' as NewsCategory },
  { url: 'https://feeds.feedburner.com/ndtvnews-india-news',       label: 'NDTV',        defaultCategory: 'security'   as NewsCategory },
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
  military:      ['army', 'military', 'navy', 'airforce', 'troops', 'soldier', 'weapon', 'missile', 'strike', 'bomb', 'drone', 'warship', 'fighter', 'artillery', 'offensive', 'defence'],
  diplomatic:    ['talks', 'diplomat', 'minister', 'summit', 'agreement', 'treaty', 'sanction', 'ambassador', 'embassy', 'bilateral', 'multilateral', 'foreign', 'secretary', 'ministry'],
  intelligence:  ['intel', 'cia', 'raw', 'isi', 'spy', 'surveillance', 'intercept', 'covert', 'agent', 'operation', 'classified', 'signal'],
  economic:      ['trade', 'export', 'import', 'oil', 'gas', 'economy', 'sanction', 'tariff', 'gdp', 'inflation', 'currency', 'investment', 'corridor'],
  security:      ['terror', 'attack', 'bomb', 'security', 'police', 'arrest', 'isis', 'al-qaeda', 'lashkar', 'jaish', 'naxal', 'insurgent', 'ceasefire', 'conflict'],
  humanitarian:  ['refugee', 'civilian', 'aid', 'crisis', 'flood', 'disaster', 'displaced', 'casualties', 'humanitarian'],
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
  const lower = text.toLowerCase();
  return RELEVANCE_KEYWORDS.filter((kw) => lower.includes(kw)).length;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').trim();
}

// ─── XML parser (used when fetching raw RSS) ──────────────────────────────────
function parseRssXml(xmlStr: string, label: string, defaultCategory: NewsCategory): RssArticle[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, 'text/xml');
    const items = Array.from(doc.querySelectorAll('item'));
    return items.map((item): RssArticle => {
      const title       = stripHtml(item.querySelector('title')?.textContent || '');
      const link        = item.querySelector('link')?.textContent?.trim() || '';
      const pubDate     = item.querySelector('pubDate')?.textContent || new Date().toISOString();
      const description = stripHtml(item.querySelector('description')?.textContent || '').slice(0, 220);
      const thumbnail   = item.querySelector('enclosure')?.getAttribute('url') ||
                          item.querySelector('thumbnail')?.getAttribute('url') || undefined;
      return { title, link, pubDate, description, thumbnail, source: label, sourceLabel: label, category: classifyCategory(`${title} ${description}`) || defaultCategory };
    }).filter((a) => relevanceScore(`${a.title} ${a.description}`) >= 2);
  } catch {
    return [];
  }
}

// ─── Strategy 1: allorigins.win (free, no key, no CORS) ──────────────────────
async function fetchViaAllOrigins(rssUrl: string, label: string, cat: NewsCategory): Promise<RssArticle[]> {
  const url = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`allorigins ${res.status}`);
  const data: { contents: string; status: { http_code: number } } = await res.json();
  if (data.status.http_code !== 200) throw new Error(`upstream ${data.status.http_code}`);
  return parseRssXml(data.contents, label, cat);
}

// ─── Strategy 2: corsproxy.io fallback ───────────────────────────────────────
async function fetchViaCorsproxy(rssUrl: string, label: string, cat: NewsCategory): Promise<RssArticle[]> {
  const url = `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`corsproxy ${res.status}`);
  const xml = await res.text();
  return parseRssXml(xml, label, cat);
}

// ─── Strategy 3: rss2json (needs API key for production) ─────────────────────
interface Rss2JsonItem {
  title: string; link: string; pubDate: string; description: string;
  thumbnail?: string; enclosure?: { link?: string };
}
async function fetchViaRss2Json(rssUrl: string, label: string, cat: NewsCategory, apiKey?: string): Promise<RssArticle[]> {
  const key = apiKey ? `&api_key=${apiKey}` : '';
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=30${key}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`rss2json ${res.status}`);
  const data: { status: string; items: Rss2JsonItem[] } = await res.json();
  if (data.status !== 'ok') throw new Error('rss2json status error');
  return data.items.map((item): RssArticle => ({
    title: stripHtml(item.title),
    link: item.link,
    pubDate: item.pubDate,
    description: stripHtml(item.description || '').slice(0, 220),
    thumbnail: item.thumbnail || item.enclosure?.link,
    source: rssUrl,
    sourceLabel: label,
    category: classifyCategory(`${item.title} ${item.description}`),
  })).filter((a) => relevanceScore(`${a.title} ${a.description}`) >= 2);
}

// ─── Fetch one source — try strategies in order ───────────────────────────────
async function fetchSource(rssUrl: string, label: string, cat: NewsCategory, rss2jsonKey?: string): Promise<RssArticle[]> {
  const strategies = [
    () => fetchViaAllOrigins(rssUrl, label, cat),
    () => fetchViaCorsproxy(rssUrl, label, cat),
    () => fetchViaRss2Json(rssUrl, label, cat, rss2jsonKey),
  ];
  for (const strategy of strategies) {
    try {
      const articles = await strategy();
      if (articles.length > 0) return articles;
    } catch {
      // try next strategy
    }
  }
  return [];
}

// ─── Guardian API (optional, native CORS support) ─────────────────────────────
async function fetchGuardian(apiKey: string): Promise<RssArticle[]> {
  const q = 'india+pakistan+china+kashmir+military+border+conflict+security';
  const url = `https://content.guardianapis.com/search?q=${q}&show-fields=headline,thumbnail,trailText&order-by=newest&page-size=30&api-key=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const guardianKey  = import.meta.env.VITE_GUARDIAN_API_KEY;
  const rss2jsonKey  = import.meta.env.VITE_RSS2JSON_KEY;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const results = await Promise.allSettled([
      ...RSS_SOURCES.map((s) => fetchSource(s.url, s.label, s.defaultCategory, rss2jsonKey)),
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
  }, [guardianKey, rss2jsonKey]);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchAll]);

  return { articles, loading, error, lastRefreshed, refresh: fetchAll };
}
