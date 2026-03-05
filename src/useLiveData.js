// useLiveData.js — ALL live data, direct browser fetches, no backend
// CORS-enabled free APIs only

import { useState, useEffect, useRef } from 'react';

const NEWSAPI_KEY = import.meta.env.VITE_NEWSAPI_KEY || '';
const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

// ─── GDELT direct browser fetch ───────────────────────────────────────────────
export function useGDELT() {
  const [events, setEvents] = useState([]);
  const [sindoorSignal, setSindoorSignal] = useState(null);
  const [liveRiskIndex, setLiveRiskIndex] = useState(67);
  const [lastFetch, setLastFetch] = useState(null);
  const [status, setStatus] = useState('loading');

  const INDIA_KEYWORDS = ['india','pakistan','china','kashmir','lac','loc','myanmar','bangladesh','nepal','sri lanka','indian ocean','arabian sea','bay of bengal','modi','delhi','mumbai','operation sindoor','PoK','depsang','aksai chin'];
  const CRITICAL_KEYWORDS = ['attack','strike','missile','bomb','troops','military','war','conflict','killed','explosion','nuclear','terror','ceasefire','violation','aircraft','navy','army','hostage','siege'];

  async function fetchGDELT() {
    setStatus('fetching');
    try {
      const now = new Date();
      const pad = n => String(n).padStart(2,'0');
      const ts = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00`;
      
      const url = `https://api.gdeltproject.org/api/v2/geo/geo?query=india+OR+pakistan+OR+kashmir+OR+china+LAC&mode=pointdata&startdatetime=${getYesterday()}&enddatetime=${ts}&maxrecords=50&format=json`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      const features = data?.features || [];
      
      // Score each event
      const scored = features.map(f => {
        const title = (f.properties?.name || '').toLowerCase();
        const isCritical = CRITICAL_KEYWORDS.some(k => title.includes(k));
        const isIndia = INDIA_KEYWORDS.some(k => title.includes(k));
        return {
          id: f.properties?.url || Math.random(),
          lat: f.geometry?.coordinates?.[1],
          lng: f.geometry?.coordinates?.[0],
          title: f.properties?.name || 'Event',
          url: f.properties?.url,
          tone: f.properties?.tone || 0,
          date: f.properties?.dateadded,
          severity: isCritical ? 'CRITICAL' : isIndia ? 'HIGH' : 'MEDIUM',
          indiaRelevant: isIndia,
          source: f.properties?.domain || 'gdelt'
        };
      }).filter(e => e.lat && e.lng);

      const criticalCount = scored.filter(e => e.severity === 'CRITICAL').length;
      const indiaCount = scored.filter(e => e.indiaRelevant).length;
      
      // Compute live risk index from GDELT tone + severity
      const avgTone = scored.length > 0 
        ? scored.reduce((s, e) => s + Math.abs(e.tone || 0), 0) / scored.length 
        : 5;
      const riskScore = Math.min(95, Math.max(45, 
        55 + (criticalCount * 2.5) + (indiaCount * 1.5) + (avgTone * 0.8)
      ));

      setEvents(scored);
      setLiveRiskIndex(Math.round(riskScore));
      setSindoorSignal({ criticalCount, indiaCount, events: scored.slice(0, 5) });
      setLastFetch(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      setStatus('live');
    } catch (err) {
      console.error('GDELT fetch error:', err);
      setStatus('error');
      // Fallback baseline events
      setEvents(BASELINE_EVENTS);
    }
  }

  function getYesterday() {
    const d = new Date(Date.now() - 24*60*60*1000);
    const pad = n => String(n).padStart(2,'0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}000000`;
  }

  useEffect(() => {
    fetchGDELT();
    const interval = setInterval(fetchGDELT, 15 * 60 * 1000); // every 15 min
    return () => clearInterval(interval);
  }, []);

  return { events, sindoorSignal, liveRiskIndex, lastFetch, status, refetch: fetchGDELT };
}

// ─── NEWS direct browser fetch ────────────────────────────────────────────────
export function useNews() {
  const [articles, setArticles] = useState([]);
  const [breaking, setBreaking] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);

  const DEFENCE_FEEDS = [
    'https://feeds.feedburner.com/ndtvnews-india-news',
    'https://www.thehindu.com/news/national/feeder/default.rss',
    'https://www.business-standard.com/rss/defence-32.rss',
    'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', // TOI world
    'https://www.wionews.com/feeds/world.xml',
  ];

  const SECURITY_KEYWORDS = ['army','navy','airforce','military','missile','border','attack','terror','nuclear','troops','pakistan','china','lac','loc','kashmir','war','conflict','strike','operation','sindoor','defence','security','ceasefire','explosion','killed','aircraft','warship','navy'];

  function scoreArticle(title, desc) {
    const text = (title + ' ' + desc).toLowerCase();
    let score = 50;
    const critWords = ['attack','killed','strike','explosion','war','ceasefire violation','nuclear','missile'];
    const highWords = ['military','troops','border','terror','operation','conflict'];
    const indiaWords = ['india','indian','modi','delhi','pakistan','china','kashmir','lac'];
    
    critWords.forEach(w => { if(text.includes(w)) score += 15; });
    highWords.forEach(w => { if(text.includes(w)) score += 8; });
    indiaWords.forEach(w => { if(text.includes(w)) score += 5; });
    
    return Math.min(99, score);
  }

  function categorize(title) {
    const t = title.toLowerCase();
    if (t.match(/army|navy|airforce|troops|military|aircraft|warship|missile|strike|bomb/)) return 'MILITARY';
    if (t.match(/terror|attack|explosion|killed|hostage/)) return 'TERROR';
    if (t.match(/china|lac|depsang|aksai/)) return 'CHINA';
    if (t.match(/pakistan|loc|kashmir|isi|pok/)) return 'PAK';
    if (t.match(/economy|gdp|rupee|trade|oil|gas|sanctions/)) return 'ECONOMIC';
    if (t.match(/iran|usa|israel|gaza|ukraine|russia|nato/)) return 'GLOBAL';
    return 'GEOPOLITICAL';
  }

  async function fetchNews() {
    const allArticles = [];
    
    // Try NewsAPI first if key available
    if (NEWSAPI_KEY) {
      try {
        const queries = ['india military defense', 'pakistan china border india', 'operation sindoor india'];
        for (const q of queries) {
          const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWSAPI_KEY}`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.articles) {
            data.articles.forEach(a => {
              allArticles.push({
                id: a.url,
                title: a.title,
                desc: a.description || '',
                url: a.url,
                source: a.source?.name || 'NewsAPI',
                publishedAt: new Date(a.publishedAt),
                credibility: scoreArticle(a.title, a.description || ''),
                category: categorize(a.title),
                layer: 'NEWSAPI',
                isBreaking: Date.now() - new Date(a.publishedAt) < 2 * 60 * 60 * 1000
              });
            });
          }
        }
      } catch(e) { console.error('NewsAPI error:', e); }
    }

    // RSS feeds via rss2json (free, CORS-enabled)
    for (const feed of DEFENCE_FEEDS) {
      try {
        const url = `${RSS2JSON}${encodeURIComponent(feed)}&count=8`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.items) {
          data.items.forEach(item => {
            const relevance = scoreArticle(item.title, item.description || '');
            if (relevance > 55) { // only security-relevant
              allArticles.push({
                id: item.link,
                title: item.title,
                desc: item.description?.replace(/<[^>]*>/g, '').slice(0, 120) || '',
                url: item.link,
                source: data.feed?.title || 'RSS',
                publishedAt: new Date(item.pubDate),
                credibility: relevance,
                category: categorize(item.title),
                layer: 'RSS',
                isBreaking: Date.now() - new Date(item.pubDate) < 3 * 60 * 60 * 1000
              });
            }
          });
        }
      } catch(e) { /* skip failed feeds */ }
    }

    // Deduplicate by title similarity, sort by date
    const seen = new Set();
    const deduped = allArticles
      .filter(a => {
        const key = a.title.slice(0, 40).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, 30);

    setArticles(deduped);
    setBreaking(deduped.filter(a => a.isBreaking || a.credibility > 85).slice(0, 8));
    setLastFetch(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  }

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(interval);
  }, []);

  return { articles, breaking, lastFetch, refetch: fetchNews };
}

// ─── LIVE PRICES direct browser fetch ────────────────────────────────────────
export function useLivePrices() {
  const [prices, setPrices] = useState({ inr: null, brent: null, gold: null, lastUpdate: null });

  async function fetchPrices() {
    try {
      // INR/USD — free, no key, CORS enabled
      const fxRes = await fetch('https://open.er-api.com/v6/latest/USD');
      const fxData = await fxRes.json();
      const inrRate = fxData?.rates?.INR;

      // Gold price via metals-api free alternative
      let brent = null, gold = null;
      try {
        const commodRes = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ%3DF?interval=1d&range=1d');
        const commodData = await commodRes.json();
        brent = commodData?.chart?.result?.[0]?.meta?.regularMarketPrice;
      } catch(e) {}

      try {
        const goldRes = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d');
        const goldData = await goldRes.json();
        gold = goldData?.chart?.result?.[0]?.meta?.regularMarketPrice;
      } catch(e) {}

      setPrices({
        inr: inrRate ? { rate: inrRate.toFixed(2), change: ((inrRate - 83) / 83 * 100).toFixed(2) } : null,
        brent: brent ? { price: brent.toFixed(2) } : null,
        gold: gold ? { price: gold.toFixed(0) } : null,
        lastUpdate: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      });
    } catch(e) {
      console.error('Price fetch error:', e);
    }
  }

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10 * 60 * 1000); // every 10 min
    return () => clearInterval(interval);
  }, []);

  return prices;
}

// ─── BASELINE EVENTS (shown while GDELT loads) ────────────────────────────────
const BASELINE_EVENTS = [
  { id: 'b1', lat: 34.0837, lng: 74.7973, title: 'Kashmir LoC — active monitoring zone', severity: 'HIGH', indiaRelevant: true, source: 'baseline' },
  { id: 'b2', lat: 34.8, lng: 78.0, title: 'Depsang Plains — LAC patrol sector', severity: 'HIGH', indiaRelevant: true, source: 'baseline' },
  { id: 'b3', lat: 23.7, lng: 68.2, title: 'Sir Creek — maritime boundary zone', severity: 'MEDIUM', indiaRelevant: true, source: 'baseline' },
  { id: 'b4', lat: 11.0, lng: 76.0, title: 'Arabian Sea — Indian Navy patrol', severity: 'MEDIUM', indiaRelevant: true, source: 'baseline' },
  { id: 'b5', lat: 31.5, lng: 74.3, title: 'Sialkot sector — forward deployment reported', severity: 'HIGH', indiaRelevant: true, source: 'baseline' },
  { id: 'b6', lat: 29.5, lng: 77.7, title: 'Yamuna Nagar — civil defence exercise', severity: 'LOW', indiaRelevant: true, source: 'baseline' },
  { id: 'b7', lat: 27.1, lng: 78.0, title: 'Agra — strategic reserve monitoring', severity: 'LOW', indiaRelevant: true, source: 'baseline' },
  { id: 'b8', lat: 15.3, lng: 44.2, title: 'Yemen — Houthi maritime threat zone', severity: 'CRITICAL', indiaRelevant: false, source: 'baseline' },
  { id: 'b9', lat: 26.3, lng: 50.2, title: 'Gulf — energy transit corridor', severity: 'HIGH', indiaRelevant: true, source: 'baseline' },
  { id: 'b10', lat: 49.0, lng: 32.0, title: 'Ukraine — active conflict zone', severity: 'CRITICAL', indiaRelevant: false, source: 'baseline' },
];
