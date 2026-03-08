import { useState, useEffect, useCallback, useRef } from 'react';
import type { RssArticle, NewsCategory } from '../types';

// ─── RSS sources via rss2json.com CORS proxy ────────────────────────────────
const RSS_SOURCES = [
  {
    url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml',
    label: 'BBC Asia',
    defaultCategory: 'security' as NewsCategory,
  },
  {
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    label: 'Al Jazeera',
    defaultCategory: 'diplomatic' as NewsCategory,
  },
  {
    url: 'https://www.thehindu.com/news/international/feeder/default.rss',
    label: 'The Hindu',
    defaultCategory: 'diplomatic' as NewsCategory,
  },
  {
    url: 'https://feeds.feedburner.com/ndtvnews-india-news',
    label: 'NDTV',
    defaultCategory: 'security' as NewsCategory,
  },
];

// Keywords that classify an article as India-geopolitics-relevant
const RELEVANCE_KEYWORDS = [
  'india', 'indian', 'pakistan', 'china', 'myanmar', 'bangladesh', 'nepal',
  'sri lanka', 'maldives', 'kashmir', 'loc', 'lac', 'border', 'military',
  'army', 'navy', 'airforce', 'missile', 'nuclear', 'terror', 'attack',
  'conflict', 'tension', 'ceasefire', 'infiltration', 'insurgency',
  'geopolitics', 'security', 'defence', 'strategic', 'ispr', 'isi',
  'houthi', 'iran', 'gulf', 'ladakh', 'arunachal', 'manipur', 'sindoor',
  'balakot', 'pulwama', 'quad', 'bri', 'cpec', 'pla', 'raf', 'drones',
];

const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  military: ['army', 'military', 'navy', 'airforce', 'troops', 'soldier', 'weapon', 'missile', 'strike', 'bomb', 'drone', 'warship', 'fighter', 'artillery', 'battalion', 'offensive', 'defence'],
  diplomatic: ['talks', 'diplomat', 'minister', 'summit', 'agreement', 'treaty', 'sanction', 'ambassador', 'embassy', 'bilateral', 'multilateral', 'foreign', 'secretary', 'ministry'],
  intelligence: ['intel', 'cia', 'raw', 'isi', 'spy', 'surveillance', 'intercept', 'covert', 'agent', 'operation', 'classified', 'signal'],
  economic: ['trade', 'export', 'import', 'oil', 'gas', 'economy', 'sanction', 'tariff', 'gdp', 'inflation', 'currency', 'investment', 'corridor'],
  security: ['terror', 'attack', 'bomb', 'security', 'police', 'arrest', 'isis', 'al-qaeda', 'lashkar', 'jaish', 'naxal', 'insurgent', 'ceasefire', 'conflict'],
  humanitarian: ['refugee', 'civilian', 'aid', 'crisis', 'flood', 'disaster', 'displaced', 'casualties', 'humanitarian'],
};

function classifyCategory(text: string): NewsCategory {
  const lower = text.toLowerCase();
  let bestCategory: NewsCategory = 'security';
  let bestScore = 0;
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = kws.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat as NewsCategory;
    }
  }
  return bestCategory;
}

function relevanceScore(text: string): number {
  const lower = text.toLowerCase();
  return RELEVANCE_KEYWORDS.filter((kw) => lower.includes(kw)).length;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim();
}

interface Rss2JsonItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail?: string;
  author?: string;
  enclosure?: { link?: string; thumbnail?: string };
}

interface Rss2JsonResponse {
  status: string;
  feed: { title: string };
  items: Rss2JsonItem[];
}

async function fetchRssSource(
  rssUrl: string,
  label: string,
  defaultCategory: NewsCategory,
  apiKey?: string
): Promise<RssArticle[]> {
  const key = apiKey ? `&api_key=${apiKey}` : '';
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=30${key}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data: Rss2JsonResponse = await res.json();
  if (data.status !== 'ok') throw new Error('rss2json error');

  return data.items
    .map((item): RssArticle => {
      const rawText = `${item.title} ${stripHtml(item.description || '')}`;
      return {
        title: stripHtml(item.title),
        link: item.link,
        pubDate: item.pubDate,
        description: stripHtml(item.description || '').slice(0, 220),
        thumbnail: item.thumbnail || item.enclosure?.link || item.enclosure?.thumbnail,
        author: item.author,
        source: rssUrl,
        sourceLabel: label,
        category: classifyCategory(rawText) || defaultCategory,
      };
    })
    .filter((a) => relevanceScore(`${a.title} ${a.description}`) >= 2);
}

// ─── Guardian API (optional, CORS-friendly) ──────────────────────────────────
async function fetchGuardian(apiKey: string): Promise<RssArticle[]> {
  const query = 'india+pakistan+china+kashmir+military+border+conflict+security';
  const url = `https://content.guardianapis.com/search?q=${query}&show-fields=headline,thumbnail,trailText&order-by=newest&page-size=30&api-key=${apiKey}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Guardian HTTP ${res.status}`);

  interface GuardianResult {
    id: string;
    webTitle: string;
    webUrl: string;
    webPublicationDate: string;
    fields?: { headline?: string; thumbnail?: string; trailText?: string };
  }

  const data: { response: { results: GuardianResult[] } } = await res.json();

  return data.response.results.map((r): RssArticle => {
    const text = `${r.fields?.headline || r.webTitle} ${r.fields?.trailText || ''}`;
    return {
      title: r.fields?.headline || r.webTitle,
      link: r.webUrl,
      pubDate: r.webPublicationDate,
      description: stripHtml(r.fields?.trailText || '').slice(0, 220),
      thumbnail: r.fields?.thumbnail,
      source: 'guardian',
      sourceLabel: 'The Guardian',
      category: classifyCategory(text),
    };
  }).filter((a) => relevanceScore(`${a.title} ${a.description}`) >= 1);
}

// ─── De-duplicate by title similarity ────────────────────────────────────────
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

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useNewsFeed(): NewsFeedState {
  const [articles, setArticles] = useState<RssArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const guardianKey = import.meta.env.VITE_GUARDIAN_API_KEY as string | undefined;
  const rss2jsonKey = import.meta.env.VITE_RSS2JSON_KEY as string | undefined;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const results = await Promise.allSettled([
      ...RSS_SOURCES.map((s) => fetchRssSource(s.url, s.label, s.defaultCategory, rss2jsonKey)),
      ...(guardianKey ? [fetchGuardian(guardianKey)] : []),
    ]);

    const all: RssArticle[] = [];
    let anySuccess = false;
    for (const r of results) {
      if (r.status === 'fulfilled') {
        all.push(...r.value);
        anySuccess = true;
      }
    }

    if (!anySuccess) {
      setError('All sources failed. Check network or API keys.');
      setLoading(false);
      return;
    }

    // Sort by date descending, take top 80
    all.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    setArticles(dedup(all).slice(0, 80));
    setLastRefreshed(new Date());
    setLoading(false);
  }, [guardianKey, rss2jsonKey]);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchAll]);

  return { articles, loading, error, lastRefreshed, refresh: fetchAll };
}
