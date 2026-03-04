import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
//  HOW TO GET YOUR FREE API KEY:
//  1. Go to https://newsapi.org
//  2. Click "Get API Key" — sign up free
//  3. Copy your key and paste it below replacing YOUR_KEY_HERE
// ─────────────────────────────────────────────────────────────
const NEWS_API_KEY = "YOUR_KEY_HERE";

// Search terms focused on India geopolitics
const QUERIES = [
  "india military border china pakistan",
  "india conflict war threat",
  "india terrorism attack",
  "india geopolitical",
];

// Credibility scores for known sources (add more as you like)
const SOURCE_CREDIBILITY = {
  "reuters.com":       { score: 96, bias: "Centre" },
  "bbc.com":           { score: 92, bias: "Centre-Left" },
  "bbc.co.uk":         { score: 92, bias: "Centre-Left" },
  "thehindu.com":      { score: 91, bias: "Centre-Left" },
  "ndtv.com":          { score: 82, bias: "Centre" },
  "timesofindia.com":  { score: 80, bias: "Centre-Right" },
  "hindustantimes.com":{ score: 79, bias: "Centre-Right" },
  "aljazeera.com":     { score: 78, bias: "Centre" },
  "ani.in":            { score: 74, bias: "Centre-Right" },
  "theprint.in":       { score: 84, bias: "Centre" },
  "livemint.com":      { score: 83, bias: "Centre" },
  "economictimes.com": { score: 81, bias: "Centre-Right" },
  "republicworld.com": { score: 45, bias: "Right" },
  "opindia.com":       { score: 38, bias: "Right" },
  "thewire.in":        { score: 76, bias: "Left" },
};

// Auto-detect credibility from URL
function getCredibility(url = "") {
  for (const [domain, data] of Object.entries(SOURCE_CREDIBILITY)) {
    if (url.includes(domain)) return data;
  }
  return { score: 65, bias: "Unknown" };
}

// Auto-detect category from headline
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

export function useNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchNews() {
    // If no real API key, return mock data so the app still works
    if (NEWS_API_KEY === "YOUR_KEY_HERE") {
      setNews(MOCK_NEWS);
      setLoading(false);
      setLastUpdated(new Date());
      return;
    }

    try {
      setLoading(true);
      const query = QUERIES[Math.floor(Math.random() * QUERIES.length)];
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${NEWS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== "ok") throw new Error(data.message);

      const formatted = data.articles
        .filter(a => a.title && a.title !== "[Removed]")
        .map((a, i) => {
          const cred = getCredibility(a.url);
          return {
            id: i,
            headline: a.title,
            source: a.source?.name || "Unknown",
            url: a.url,
            credibility: cred.score,
            bias: cred.bias,
            category: getCategory(a.title),
            time: timeAgo(a.publishedAt),
            tags: [],
          };
        });

      setNews(formatted);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
      setNews(MOCK_NEWS); // fallback to mock on error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNews();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { news, loading, error, lastUpdated, refetch: fetchNews };
}

// ─── MOCK DATA (used when no API key, or as fallback) ────────
const MOCK_NEWS = [
  { id:1, headline:"Indian Army conducts surprise exercise near LAC — 30,000 troops mobilized in Ladakh", source:"The Hindu", credibility:91, bias:"Centre-Left", category:"MILITARY", time:"8m ago", url:"#" },
  { id:2, headline:"Pakistan test-fires Shaheen-III ballistic missile, India monitoring closely", source:"NDTV", credibility:82, bias:"Centre", category:"THREAT", time:"22m ago", url:"#" },
  { id:3, headline:"US warns China of consequences over Taiwan Strait movements", source:"Reuters", credibility:96, bias:"Centre", category:"GEOPOLITICAL", time:"34m ago", url:"#" },
  { id:4, headline:"NIA busts LeT module in Punjab, 4 arrested with IED components", source:"ANI", credibility:74, bias:"Centre-Right", category:"TERROR", time:"1h ago", url:"#" },
  { id:5, headline:"Iran threatens to block Strait of Hormuz; Indian oil imports at risk", source:"Al Jazeera", credibility:78, bias:"Centre", category:"ECONOMY", time:"1h ago", url:"#" },
  { id:6, headline:"India scrambles Rafales after Chinese J-20s spotted near Arunachal Pradesh airspace", source:"Livemint", credibility:83, bias:"Centre", category:"MILITARY", time:"2h ago", url:"#" },
  { id:7, headline:"QUAD summit condemns South China Sea militarization, India signs joint statement", source:"Times of India", credibility:80, bias:"Centre-Right", category:"DIPLOMATIC", time:"3h ago", url:"#" },
  { id:8, headline:"Myanmar junta forces push toward Indian border — Mizoram on alert", source:"The Hindu", credibility:91, bias:"Centre-Left", category:"MILITARY", time:"4h ago", url:"#" },
  { id:9, headline:"India-China corps commander talks resume at Chushul-Moldo border point", source:"NDTV", credibility:82, bias:"Centre", category:"DIPLOMATIC", time:"5h ago", url:"#" },
  { id:10, headline:"IED recovered near BSF camp in Rajasthan, Pakistan link suspected", source:"ANI", credibility:74, bias:"Centre-Right", category:"TERROR", time:"6h ago", url:"#" },
];
