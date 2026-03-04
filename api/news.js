// api/news.js
// Aggregates multiple OSINT RSS feeds into one endpoint
// Runs server-side so no CORS issues

const FEEDS = [
  { url: "https://feeds.feedburner.com/ndtvnews-india-news", source: "NDTV", bias: "Centre", credibility: 82 },
  { url: "https://www.thehindu.com/news/national/feeder/default.rss", source: "The Hindu", bias: "Centre-Left", credibility: 91 },
  { url: "https://timesofindia.indiatimes.com/rss/4719148.cms", source: "Times of India", bias: "Centre-Right", credibility: 80 },
  { url: "https://www.theprint.in/feed/", source: "The Print", bias: "Centre", credibility: 84 },
  { url: "https://www.wionews.com/rss/india.xml", source: "WION", bias: "Centre-Right", credibility: 75 },
];

// Classify category from headline text
function classifyCategory(title) {
  const t = (title || "").toLowerCase();
  if (/terror|attack|blast|bomb|militant|ied|fidayeen|LeT|JeM/i.test(t))  return "TERROR";
  if (/army|military|naval|iaf|drdo|missile|rafale|brahmos|soldier/i.test(t)) return "MILITARY";
  if (/china|lac|depsang|galwan|pla|tibet|arunachal/i.test(t))            return "CHINA";
  if (/pakistan|loc|pok|kashmir|isi|ceasefire/i.test(t))                  return "PAKISTAN";
  if (/iran|israel|gaza|ukraine|russia|houthi|hormuz/i.test(t))           return "GLOBAL";
  if (/economy|gdp|rupee|oil|inflation|rbi|trade/i.test(t))               return "ECONOMY";
  if (/election|parliament|modi|government|bjp|congress/i.test(t))        return "POLITICS";
  if (/diplomacy|foreign|minister|ambassador|summit|bilateral/i.test(t))  return "DIPLOMATIC";
  return "SECURITY";
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Recent";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 60)   return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

async function fetchFeed({ url, source, bias, credibility }) {
  try {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=8`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.items) return [];
    return data.items.map((item, i) => ({
      id:          `${source}_${i}_${Date.now()}`,
      headline:    item.title || "",
      url:         item.link  || "#",
      source,
      bias,
      credibility,
      category:    classifyCategory(item.title),
      time:        timeAgo(item.pubDate),
      pubDate:     item.pubDate || "",
      description: item.description?.replace(/<[^>]+>/g, "").slice(0, 200) || "",
    }));
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=600"); // 10 min cache

  try {
    const results = await Promise.allSettled(FEEDS.map(fetchFeed));
    const allItems = results.flatMap(r => r.status === "fulfilled" ? r.value : []);

    // Sort by pubDate descending, deduplicate by headline similarity
    const seen = new Set();
    const deduped = allItems
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .filter(item => {
        const key = item.headline.slice(0, 40).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 40);

    res.status(200).json({
      ok:         true,
      fetched_at: new Date().toISOString(),
      count:      deduped.length,
      items:      deduped,
    });
  } catch (err) {
    res.status(200).json({ ok: false, error: err.message, items: [] });
  }
}
