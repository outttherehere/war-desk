import { useState, useEffect } from "react";

const SOURCE_CREDIBILITY = {
  "ndtv.com":          { score: 82, bias: "Centre" },
  "thehindu.com":      { score: 91, bias: "Centre-Left" },
  "timesofindia.com":  { score: 80, bias: "Centre-Right" },
  "hindustantimes.com":{ score: 79, bias: "Centre-Right" },
  "theprint.in":       { score: 84, bias: "Centre" },
  "livemint.com":      { score: 83, bias: "Centre" },
  "reuters.com":       { score: 96, bias: "Centre" },
  "aljazeera.com":     { score: 78, bias: "Centre" },
  "bbc.com":           { score: 92, bias: "Centre-Left" },
  "wion.com":          { score: 75, bias: "Centre-Right" },
};

function getCredibility(url = "") {
  for (const [domain, data] of Object.entries(SOURCE_CREDIBILITY)) {
    if (url.includes(domain)) return data;
  }
  return { score: 65, bias: "Unknown" };
}

function getCategory(title = "") {
  const t = title.toLowerCase();
  if (t.includes("terror") || t.includes("attack") || t.includes("blast") || t.includes("ied")) return "TERROR";
  if (t.includes("missile") || t.includes("nuclear") || t.includes("nuke")) return "THREAT";
  if (t.includes("army") || t.includes("military") || t.includes("troops") || t.includes("air force") || t.includes("navy")) return "MILITARY";
  if (t.includes("diplomat") || t.includes("summit") || t.includes("treaty") || t.includes("talks")) return "DIPLOMATIC";
  if (t.includes("oil") || t.includes("trade") || t.includes("sanction") || t.includes("economy")) return "ECONOMY";
  return "GEOPOLITICAL";
}

function timeAgo(dateString) {
  const now = new Date();
  const then = new Date(dateString);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Free RSS to JSON service - works on live sites
const RSS_FEEDS = [
  { url: "https://feeds.feedburner.com/ndtvnews-india-news", source: "NDTV", sourceUrl: "ndtv.com" },
  { url: "https://www.thehindu.com/news/national/feeder/default.rss", source: "The Hindu", sourceUrl: "thehindu.com" },
  { url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms", source: "Times of India", sourceUrl: "timesofindia.com" },
  { url: "https://www.wionews.com/feeds/world.xml", source: "WION", sourceUrl: "wion.com" },
];

export function useNews() {
  const [news, setNews] = useState(MOCK_NEWS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchFeed(feed) {
    try {
      // rss2json is a free service that converts RSS to JSON
      const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
      const res = await fetch(api);
      const data = await res.json();
      if (data.status !== "ok") return [];
      return data.items.map((item, i) => {
        const cred = getCredibility(feed.sourceUrl);
        return {
          id: `${feed.source}-${i}`,
          headline: item.title,
          source: feed.source,
          url: item.link,
          credibility: cred.score,
          bias: cred.bias,
          category: getCategory(item.title),
          time: timeAgo(item.pubDate),
        };
      });
    } catch {
      return [];
    }
  }

  async function fetchNews() {
    try {
      setLoading(true);
      const results = await Promise.all(RSS_FEEDS.map(fetchFeed));
      const all = results
        .flat()
        .filter(item => item.headline && item.headline !== "")
        .sort(() => Math.random() - 0.5)
        .slice(0, 20);
      if (all.length > 0) {
        setNews(all);
        setError(null);
      } else {
        setNews(MOCK_NEWS);
        setError("Using fallback data");
      }
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      setNews(MOCK_NEWS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { news, loading, error, lastUpdated, refetch: fetchNews };
}

const MOCK_NEWS = [
  { id:1, headline:"Indian Army conducts surprise exercise near LAC — 30,000 troops mobilized in Ladakh", source:"The Hindu", credibility:91, bias:"Centre-Left", category:"MILITARY", time:"8m ago", url:"#" },
  { id:2, headline:"Pakistan test-fires Shaheen-III ballistic missile, India monitoring closely", source:"NDTV", credibility:82, bias:"Centre", category:"THREAT", time:"22m ago", url:"#" },
  { id:3, headline:"US warns China of consequences over Taiwan Strait movements", source:"Reuters", credibility:96, bias:"Centre", category:"GEOPOLITICAL", time:"34m ago", url:"#" },
  { id:4, headline:"NIA busts LeT module in Punjab, 4 arrested with IED components", source:"ANI", credibility:74, bias:"Centre-Right", category:"TERROR", time:"1h ago", url:"#" },
  { id:5, headline:"Iran threatens to block Strait of Hormuz — Indian oil imports at risk", source:"Al Jazeera", credibility:78, bias:"Centre", category:"ECONOMY", time:"1h ago", url:"#" },
  { id:6, headline:"India scrambles Rafales after Chinese J-20s spotted near Arunachal Pradesh", source:"Livemint", credibility:83, bias:"Centre", category:"MILITARY", time:"2h ago", url:"#" },
  { id:7, headline:"QUAD summit condemns South China Sea militarization — India signs joint statement", source:"Times of India", credibility:80, bias:"Centre-Right", category:"DIPLOMATIC", time:"3h ago", url:"#" },
  { id:8, headline:"Myanmar junta forces push toward Indian border — Mizoram on alert", source:"The Hindu", credibility:91, bias:"Centre-Left", category:"MILITARY", time:"4h ago", url:"#" },
  { id:9, headline:"India-China corps commander talks resume at Chushul-Moldo border point", source:"NDTV", credibility:82, bias:"Centre", category:"DIPLOMATIC", time:"5h ago", url:"#" },
  { id:10, headline:"IED recovered near BSF camp in Rajasthan — Pakistan link suspected", source:"ANI", credibility:74, bias:"Centre-Right", category:"TERROR", time:"6h ago", url:"#" },
];
