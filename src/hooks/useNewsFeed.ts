import { useState, useEffect, useCallback, useRef } from 'react';
import type { RssArticle, NewsCategory } from '../types';

// ─── RSS / GDELT sources ──────────────────────────────────────────────────────
const RSS_SOURCES = [
  { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml',               label: 'BBC Asia',    cat: 'security'   as NewsCategory },
  { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml',        label: 'BBC MidEast', cat: 'military'   as NewsCategory },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml',                      label: 'Al Jazeera',  cat: 'diplomatic' as NewsCategory },
  { url: 'https://www.thehindu.com/news/international/feeder/default.rss', label: 'The Hindu',   cat: 'diplomatic' as NewsCategory },
  // NDTV world news (not India-general which includes crime/crime/lifestyle)
  { url: 'https://feeds.feedburner.com/ndtvnews-world-news',               label: 'NDTV',        cat: 'security'   as NewsCategory },
];

// GDELT full-text search: geopolitical/military events around India + Middle East
// 100% free, no API key, monitored globally from 65,000+ sources
const GDELT_QUERIES = [
  'india pakistan china military border conflict kashmir',
  'india naval military iran israel houthi conflict',
];

// ─── Strict geopolitical keyword sets ────────────────────────────────────────

// POSITIVE: article MUST contain at least 3 of these to pass (strict geo-mil filter)
// Deliberately excludes generic words like "security", "attack", "india" alone
const STRONG_GEO_KEYWORDS = [
  // Specific countries/regions with conflict relevance
  'pakistan', 'china', 'kashmir', 'myanmar', 'bangladesh', 'afghanistan',
  'maldives', 'sri lanka', 'iran', 'israel', 'houthi', 'hamas', 'hezbollah',
  'taliban', 'north korea', 'taiwan', 'ukraine', 'russia',
  // Military/security-specific terms (not generic)
  'military', 'army', 'navy', 'air force', 'airforce', 'nuclear', 'missile',
  'warship', 'submarine', 'carrier strike', 'fighter jet', 'drone strike', 'airstrike',
  'artillery', 'troops', 'battalion', 'regiment', 'platoon',
  // Geopolitical/conflict terms
  'ceasefire', 'infiltration', 'insurgency', 'militant', 'terror attack',
  'cross-border', 'loc', 'lac', 'line of control', 'line of actual control',
  'standoff', 'escalation', 'de-escalation', 'flashpoint', 'confrontation',
  'galwan', 'ladakh', 'arunachal', 'balakot', 'sindoor', 'pulwama',
  // Terrorist organisations
  'islamic state', 'isis', 'isil', 'al-qaeda', 'lashkar', 'jaish', 'ttp',
  'boko haram', 'al-shabaab',
  // Strategic/defence orgs
  'pentagon', 'nato', 'quad', 'cpec', 'bri', 'pla ', 'pla-n', 'ispr',
  'irgc', 'irgcn', 'mossad', 'cia', 'raw ',
  // Maritime/strategic routes
  'strait of hormuz', 'red sea', 'arabian sea', 'indian ocean', 'south china sea',
  'gulf of oman', 'persian gulf', 'chabahar', 'hambantota',
  // Actions
  'drone strike', 'missile launch', 'nuclear test', 'military exercise',
  'war games', 'border tension', 'naval blockade', 'arms deal', 'weapons sale',
  'geopolit', 'strategic competition', 'proxy war',
];

// SUPPORT: secondary relevance boosters (only used to lift score, not gate)
const SUPPORT_KEYWORDS = [
  'diplomat', 'minister', 'bilateral', 'summit', 'treaty', 'sanction',
  'ambassador', 'foreign policy', 'election', 'intelligence', 'surveillance',
  'spy', 'covert', 'operation', 'classified', 'raw', 'cia', 'isi', 'mi6',
  'refugee', 'displaced', 'humanitarian', 'casualties', 'civilian',
  'energy', 'oil', 'gas', 'corridor', 'port', 'infrastructure',
];

// NEGATIVE: disqualify articles about these topics entirely
const BLOCK_KEYWORDS = [
  'cricket', 'football', 'soccer', 'tennis', 'ipl', 'championship',
  'bollywood', 'film', 'movie', 'actor', 'celebrity', 'award',
  'recipe', 'fashion', 'lifestyle', 'beauty', 'diet', 'fitness',
  'stock market', 'nifty', 'sensex', 'ipo', 'startup funding',
  'weather forecast', 'horoscope', 'astrology',
];

const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  military:     ['army', 'military', 'navy', 'airforce', 'troops', 'soldier', 'weapon', 'missile', 'strike', 'bomb', 'drone', 'warship', 'fighter', 'artillery', 'offensive', 'defence', 'submarine', 'carrier', 'airstrike'],
  diplomatic:   ['talks', 'diplomat', 'minister', 'summit', 'agreement', 'treaty', 'sanction', 'ambassador', 'embassy', 'bilateral', 'multilateral', 'foreign', 'secretary', 'ministry', 'negotiat'],
  intelligence: ['intel', 'cia', 'raw', 'isi', 'spy', 'surveillance', 'intercept', 'covert', 'agent', 'operation', 'classified', 'signal', 'mi6', 'mossad'],
  economic:     ['trade', 'export', 'import', 'oil', 'gas', 'economy', 'sanction', 'tariff', 'corridor', 'port', 'energy', 'supply chain', 'embargo'],
  security:     ['terror', 'attack', 'security', 'police', 'arrest', 'isis', 'al-qaeda', 'lashkar', 'jaish', 'insurgent', 'ceasefire', 'conflict', 'ttp', 'militant'],
  humanitarian: ['refugee', 'civilian', 'aid', 'crisis', 'displaced', 'casualties', 'humanitarian', 'minority'],
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

// Returns true only for strictly geopolitical / national-interest content
function isGeopoliticallyRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  // Hard block first
  if (BLOCK_KEYWORDS.some((kw) => lower.includes(kw))) return false;
  // Must match at least 3 distinct strong keywords (prevents single-country crime news)
  const strongHits = STRONG_GEO_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  return strongHits >= 3;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').trim();
}

// ─── XML parser ───────────────────────────────────────────────────────────────
function parseRssXml(xml: string, label: string, defaultCat: NewsCategory): RssArticle[] {
  try {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('XML parse error');
    return Array.from(doc.querySelectorAll('item')).map((item): RssArticle => {
      const title       = stripHtml(item.querySelector('title')?.textContent || '');
      const link        = item.querySelector('link')?.textContent?.trim() || '';
      const pubDate     = item.querySelector('pubDate')?.textContent || new Date().toISOString();
      const description = stripHtml(item.querySelector('description')?.textContent || '').slice(0, 280);
      const thumbnail   = item.querySelector('enclosure')?.getAttribute('url') ||
                          item.querySelector('thumbnail')?.getAttribute('url') || undefined;
      return { title, link, pubDate, description, thumbnail, source: label, sourceLabel: label, category: classifyCategory(`${title} ${description}`) || defaultCat };
    }).filter((a) => isGeopoliticallyRelevant(`${a.title} ${a.description}`));
  } catch { return []; }
}

// ─── GDELT parser ─────────────────────────────────────────────────────────────
interface GdeltArticle { url: string; title: string; seendate: string; socialimage?: string; domain?: string; }
function parseGdelt(json: string): RssArticle[] {
  try {
    const data: { articles?: GdeltArticle[] } = JSON.parse(json);
    return (data.articles || []).map((a): RssArticle => ({
      title: a.title,
      link: a.url,
      pubDate: a.seendate ? `${a.seendate.slice(0,4)}-${a.seendate.slice(4,6)}-${a.seendate.slice(6,8)}T${a.seendate.slice(9,11)}:${a.seendate.slice(11,13)}:00Z` : new Date().toISOString(),
      description: '',
      thumbnail: a.socialimage,
      source: 'gdelt',
      sourceLabel: 'GDELT',
      category: classifyCategory(a.title),
    })).filter((a) => isGeopoliticallyRelevant(a.title));
  } catch { return []; }
}

// ─── Fetch via our Vercel Edge proxy (/api/news) ──────────────────────────────
async function fetchViaProxy(url: string): Promise<string> {
  const res = await fetch(`/api/news?url=${encodeURIComponent(url)}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`proxy ${res.status}`);
  return res.text();
}

async function fetchRssSource(rssUrl: string, label: string, cat: NewsCategory): Promise<RssArticle[]> {
  const xml = await fetchViaProxy(rssUrl);
  return parseRssXml(xml, label, cat);
}

async function fetchGdeltQuery(query: string): Promise<RssArticle[]> {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=100&timespan=24h&sourcelang=english&format=json`;
  const json = await fetchViaProxy(url);
  return parseGdelt(json);
}

// ─── Guardian (native CORS, no proxy needed) ──────────────────────────────────
async function fetchGuardian(apiKey: string): Promise<RssArticle[]> {
  const q = 'india+pakistan+china+kashmir+military+border+conflict+iran+israel+houthi+terror';
  const url = `https://content.guardianapis.com/search?q=${q}&show-fields=headline,thumbnail,trailText&order-by=newest&page-size=30&api-key=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`guardian ${res.status}`);
  interface GR { webTitle: string; webUrl: string; webPublicationDate: string; fields?: { headline?: string; thumbnail?: string; trailText?: string } }
  const data: { response: { results: GR[] } } = await res.json();
  return data.response.results.map((r): RssArticle => {
    const title = r.fields?.headline || r.webTitle;
    return { title, link: r.webUrl, pubDate: r.webPublicationDate, description: stripHtml(r.fields?.trailText || '').slice(0, 280), thumbnail: r.fields?.thumbnail, source: 'guardian', sourceLabel: 'The Guardian', category: classifyCategory(`${title} ${r.fields?.trailText}`) };
  }).filter((a) => isGeopoliticallyRelevant(`${a.title} ${a.description}`));
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

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 min

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
      // RSS feeds
      ...RSS_SOURCES.map((s) => fetchRssSource(s.url, s.label, s.cat)),
      // GDELT — free, real-time global event intelligence, no API key
      ...GDELT_QUERIES.map((q) => fetchGdeltQuery(q)),
      // Guardian (optional, if API key provided)
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
    setArticles(dedup(all).slice(0, 100));
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
