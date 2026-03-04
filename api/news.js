// api/news.js
// THREE-LAYER breaking news system:
// Layer 1 — NewsAPI.org: real-time Reuters/AP/Al Jazeera (minutes delay)
// Layer 2 — GDELT GKG: theme-based military/naval event tracking (15min)
// Layer 3 — Indian RSS fallback: NDTV/Hindu/PIB (hours, but India-specific)
//
// Set NEWSAPI_KEY in Vercel Environment Variables (dashboard → project → settings → env vars)

const NEWSAPI_KEY = process.env.NEWSAPI_KEY || "";

const RSS_FEEDS = [
  { url:"https://www.thehindu.com/news/national/feeder/default.rss",        source:"The Hindu",   credibility:91, bias:"Centre-Left" },
  { url:"https://feeds.feedburner.com/ndtvnews-india-news",                 source:"NDTV",        credibility:82, bias:"Centre"      },
  { url:"https://www.theprint.in/feed/",                                    source:"The Print",   credibility:84, bias:"Centre"      },
  { url:"https://www.business-standard.com/rss/defence-32.rss",             source:"BS Defence",  credibility:86, bias:"Centre"      },
  { url:"https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",          source:"PIB Official",credibility:95, bias:"Government"  },
  { url:"https://www.wionews.com/rss/world.xml",                            source:"WION World",  credibility:75, bias:"Centre-Right"},
];

function classifyCategory(title) {
  const t = title || "";
  if (/torpedo|submarine|naval|navy|warship|ship|vessel|maritime|sea|ocean|fleet|carrier/i.test(t)) return "MARITIME";
  if (/terror|attack|blast|bomb|militant|ied|LeT|JeM|fidayeen|isis/i.test(t))                     return "TERROR";
  if (/army|military|soldier|airstrike|missile|drone|strike|rafale|brahmos|fighter|jet/i.test(t)) return "MILITARY";
  if (/china|lac|depsang|galwan|pla|tibet|arunachal/i.test(t))                                    return "CHINA";
  if (/pakistan|loc|pok|kashmir|isi|ceasefire|sindoor/i.test(t))                                  return "PAKISTAN";
  if (/iran|israel|gaza|hamas|hezbollah|ukraine|russia|houthi|hormuz/i.test(t))                   return "GLOBAL";
  if (/economy|gdp|rupee|oil|crude|inflation|rbi|forex/i.test(t))                                 return "ECONOMY";
  if (/nuclear|nuke|warhead|missile test/i.test(t))                                                return "NUCLEAR";
  return "SECURITY";
}

function indiaRelevance(title, description) {
  const text = (title + " " + (description || "")).toLowerCase();
  if (/india|indian|delhi|mumbai|modi|jaishankar|iaf|ins |indian navy|bsf/i.test(text))           return "DIRECT";
  if (/pakistan|china|indian ocean|arabian sea|bay of bengal|lac|loc|kashmir/i.test(text))        return "HIGH";
  if (/iran|hormuz|gulf|houthi|red sea|oil price|crude/i.test(text))                              return "MEDIUM";
  if (/russia|ukraine|israel|gaza|usa|nato/i.test(text))                                          return "MONITOR";
  return null;
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Recent";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

async function fetchNewsAPI() {
  if (!NEWSAPI_KEY) return [];
  try {
    const query = encodeURIComponent(
      "(india OR \"indian ocean\" OR \"arabian sea\") AND (military OR navy OR attack OR terror OR conflict OR strike OR missile OR torpedo OR submarine)"
    );
    const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=30&apiKey=${NEWSAPI_KEY}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`NewsAPI ${r.status}`);
    const data = await r.json();
    if (data.status !== "ok") throw new Error(data.message || "NewsAPI error");
    const items = [];
    for (const article of (data.articles || [])) {
      const india = indiaRelevance(article.title, article.description);
      if (!india) continue;
      items.push({
        id:          `newsapi_${Date.now()}_${items.length}`,
        headline:    article.title || "",
        url:         article.url || "#",
        source:      article.source?.name || "NewsAPI",
        credibility: 88,
        bias:        "Wire Service",
        category:    classifyCategory(article.title),
        time:        timeAgo(article.publishedAt),
        pubDate:     article.publishedAt || "",
        description: (article.description || "").slice(0, 200),
        india,
        layer:       "NEWSAPI",
        breaking:    (Date.now() - new Date(article.publishedAt).getTime()) < 3600000,
      });
    }
    return items;
  } catch (err) {
    console.error("NewsAPI error:", err.message);
    return [];
  }
}

async function fetchGDELTGKG() {
  try {
    const queries = [
      "india naval military maritime",
      "india attack terror border",
      "iran ship torpedo submarine indian ocean",
      "india china pakistan conflict",
    ];
    const allItems = [];
    for (const q of queries) {
      try {
        const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=artlist&maxrecords=10&format=json&timespan=6h&sort=datedesc`;
        const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!r.ok) continue;
        const data = await r.json();
        for (const a of (data?.articles || [])) {
          if (!a.title) continue;
          const india = indiaRelevance(a.title, "");
          if (!india) continue;
          const ds = a.seendate || "";
          const pubDate = ds.length >= 8
            ? new Date(`${ds.slice(0,4)}-${ds.slice(4,6)}-${ds.slice(6,8)}`).toISOString()
            : new Date().toISOString();
          allItems.push({
            id:          `gdelt_${Date.now()}_${allItems.length}`,
            headline:    a.title,
            url:         a.url || "#",
            source:      a.domain || "GDELT",
            credibility: 80,
            bias:        "Wire/OSINT",
            category:    classifyCategory(a.title),
            time:        timeAgo(pubDate),
            pubDate,
            description: "",
            india,
            layer:       "GDELT",
            breaking:    false,
          });
        }
      } catch { continue; }
    }
    return allItems;
  } catch (err) {
    console.error("GDELT GKG error:", err.message);
    return [];
  }
}

async function fetchRSS({ url, source, credibility, bias }) {
  try {
    const r = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=8`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return [];
    const data = await r.json();
    if (!data?.items) return [];
    return data.items.map((item, i) => ({
      id:          `rss_${source}_${i}_${Date.now()}`,
      headline:    item.title || "",
      url:         item.link || "#",
      source, credibility, bias,
      category:    classifyCategory(item.title),
      time:        timeAgo(item.pubDate),
      pubDate:     item.pubDate || "",
      description: (item.description || "").replace(/<[^>]+>/g, "").slice(0, 200),
      india:       indiaRelevance(item.title, item.description) || "MONITOR",
      layer:       "RSS",
      breaking:    false,
    }));
  } catch { return []; }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=300");
  try {
    const [newsapiItems, gdeltItems, ...rssResults] = await Promise.all([
      fetchNewsAPI(),
      fetchGDELTGKG(),
      ...RSS_FEEDS.map(fetchRSS),
    ]);
    const rssItems = rssResults.flat();
    const allItems = [...newsapiItems, ...gdeltItems, ...rssItems];
    const seen = new Set();
    const deduped = allItems
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .filter(item => {
        const key = item.headline.slice(0, 50).toLowerCase().replace(/[^a-z0-9]/g, "");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    const sorted = [
      ...deduped.filter(i => i.breaking),
      ...deduped.filter(i => !i.breaking),
    ].slice(0, 60);
    return res.status(200).json({
      ok: true,
      fetched_at: new Date().toISOString(),
      count: sorted.length,
      breaking_count: sorted.filter(i => i.breaking).length,
      has_newsapi: newsapiItems.length > 0,
      layers: { newsapi: newsapiItems.length, gdelt: gdeltItems.length, rss: rssItems.length },
      items: sorted,
    });
  } catch (err) {
    return res.status(200).json({ ok:false, error:err.message, items:[], breaking_count:0 });
  }
};
