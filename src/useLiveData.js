// useLiveData.js V10 — MediaStack + GDELT + live prices, all direct browser fetches

import { useState, useEffect } from 'react';

const MEDIASTACK_KEY = import.meta.env.VITE_MEDIASTACK_KEY || '387b1d694cc1c4c49ab5576349a27af3';
const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

// ─── GDELT ────────────────────────────────────────────────────────────────────
export function useGDELT() {
  const [events, setEvents] = useState([]);
  const [sindoorSignal, setSindoorSignal] = useState(null);
  const [liveRiskIndex, setLiveRiskIndex] = useState(67);
  const [lastFetch, setLastFetch] = useState(null);
  const [status, setStatus] = useState('loading');

  const INDIA_KW = ['india','pakistan','china','kashmir','lac','loc','myanmar','bangladesh','nepal','indian ocean','arabian sea','bay of bengal','modi','delhi','operation sindoor','depsang','aksai chin','galwan','siachen','andaman'];
  const CRITICAL_KW = ['attack','strike','missile','bomb','troops','war','conflict','killed','explosion','nuclear','terror','ceasefire','violation','aircraft','navy','army','hostage','siege','ballistic'];

  async function fetchGDELT() {
    setStatus('fetching');
    try {
      const now = new Date();
      const pad = n => String(n).padStart(2,'0');
      const ts = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00`;
      const yesterday = (() => {
        const d = new Date(Date.now() - 24*60*60*1000);
        return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}000000`;
      })();

      const url = `https://api.gdeltproject.org/api/v2/geo/geo?query=india+OR+pakistan+OR+kashmir+OR+china+OR+iran+OR+israel&mode=pointdata&startdatetime=${yesterday}&enddatetime=${ts}&maxrecords=60&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      const features = data?.features || [];

      const scored = features.map(f => {
        const title = (f.properties?.name || '').toLowerCase();
        const isCritical = CRITICAL_KW.some(k => title.includes(k));
        const isIndia = INDIA_KW.some(k => title.includes(k));
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
      const avgTone = scored.length ? scored.reduce((s,e) => s + Math.abs(e.tone||0), 0) / scored.length : 5;
      const riskScore = Math.min(95, Math.max(45, 55 + criticalCount*2.5 + indiaCount*1.5 + avgTone*0.8));

      setEvents(scored);
      setLiveRiskIndex(Math.round(riskScore));
      setSindoorSignal({ criticalCount, indiaCount, events: scored.slice(0,5) });
      setLastFetch(new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }));
      setStatus('live');
    } catch(err) {
      console.error('GDELT:', err);
      setStatus('error');
      setEvents(BASELINE_EVENTS);
    }
  }

  useEffect(() => { fetchGDELT(); const i = setInterval(fetchGDELT, 15*60*1000); return () => clearInterval(i); }, []);
  return { events, sindoorSignal, liveRiskIndex, lastFetch, status, refetch: fetchGDELT };
}

// ─── NEWS — MediaStack primary, RSS fallback ───────────────────────────────────
export function useNews() {
  const [articles, setArticles] = useState([]);
  const [breaking, setBreaking] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);

  const RSS_FEEDS = [
    'https://feeds.feedburner.com/ndtvnews-india-news',
    'https://www.thehindu.com/news/national/feeder/default.rss',
    'https://www.business-standard.com/rss/defence-32.rss',
    'https://www.wionews.com/feeds/world.xml',
    'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms',
  ];

  function scoreArticle(title, desc='') {
    const text = (title+' '+desc).toLowerCase();
    let score = 45;
    ['attack','killed','strike','explosion','war','nuclear','missile','ceasefire violation'].forEach(w => { if(text.includes(w)) score+=15; });
    ['military','troops','border','terror','operation','conflict','navy','airforce'].forEach(w => { if(text.includes(w)) score+=8; });
    ['india','indian','modi','pakistan','china','kashmir','lac'].forEach(w => { if(text.includes(w)) score+=5; });
    return Math.min(99, score);
  }

  function categorize(title) {
    const t = title.toLowerCase();
    if (t.match(/army|navy|airforce|troops|military|aircraft|warship|missile|strike|bomb/)) return 'MILITARY';
    if (t.match(/terror|blast|explosion|fidayeen|hostage/)) return 'TERROR';
    if (t.match(/china|lac|depsang|aksai|pla/)) return 'CHINA';
    if (t.match(/pakistan|loc|kashmir|isi|pok/)) return 'PAK';
    if (t.match(/iran|usa|israel|gaza|ukraine|russia|nato|houthi/)) return 'GLOBAL';
    if (t.match(/economy|rupee|oil|sanctions|trade/)) return 'ECONOMIC';
    return 'GEOPOLITICAL';
  }

  async function fetchNews() {
    const all = [];

    // MediaStack — real-time, 500 req/day free
    if (MEDIASTACK_KEY) {
      try {
        const keywords = 'india military,pakistan border,india china lac,operation sindoor,india navy,india army,kashmir conflict,iran nuclear,israel gaza';
        const url = `https://api.mediastack.com/v1/news?access_key=${MEDIASTACK_KEY}&keywords=${encodeURIComponent(keywords)}&countries=in,pk,cn,ir,il,ua,ru&languages=en&limit=50&sort=published_desc`;
        // Note: MediaStack free tier is HTTP only
        const res = await fetch(url);
        const data = await res.json();
        if (data.data) {
          data.data.forEach(a => {
            const cred = scoreArticle(a.title, a.description || '');
            if (cred > 50) {
              all.push({
                id: a.url,
                title: a.title,
                desc: (a.description || '').replace(/<[^>]*>/g,'').slice(0,150),
                url: a.url,
                source: a.source || 'MediaStack',
                publishedAt: new Date(a.published_at),
                credibility: cred,
                category: categorize(a.title),
                layer: 'MEDIASTACK',
                isBreaking: Date.now() - new Date(a.published_at) < 2*60*60*1000
              });
            }
          });
        }
      } catch(e) { console.error('MediaStack:', e); }
    }

    // RSS fallback — always run alongside MediaStack
    for (const feed of RSS_FEEDS) {
      try {
        const res = await fetch(`${RSS2JSON}${encodeURIComponent(feed)}&count=10`);
        const data = await res.json();
        if (data.items) {
          data.items.forEach(item => {
            const cred = scoreArticle(item.title, item.description||'');
            if (cred > 55) {
              all.push({
                id: item.link,
                title: item.title,
                desc: (item.description||'').replace(/<[^>]*>/g,'').slice(0,150),
                url: item.link,
                source: data.feed?.title || 'RSS',
                publishedAt: new Date(item.pubDate),
                credibility: cred,
                category: categorize(item.title),
                layer: 'RSS',
                isBreaking: Date.now() - new Date(item.pubDate) < 3*60*60*1000
              });
            }
          });
        }
      } catch(e) {}
    }

    // Deduplicate + sort
    const seen = new Set();
    const deduped = all
      .filter(a => { const k = a.title.slice(0,50).toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true; })
      .sort((a,b) => b.publishedAt - a.publishedAt)
      .slice(0, 40);

    setArticles(deduped);
    setBreaking(deduped.filter(a => a.isBreaking && a.credibility > 70).slice(0, 10));
    setLastFetch(new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }));
  }

  useEffect(() => { fetchNews(); const i = setInterval(fetchNews, 5*60*1000); return () => clearInterval(i); }, []);
  return { articles, breaking, lastFetch, refetch: fetchNews };
}

// ─── LIVE PRICES ──────────────────────────────────────────────────────────────
export function useLivePrices() {
  const [prices, setPrices] = useState({ inr: null, brent: null, gold: null, lastUpdate: null });

  async function fetchPrices() {
    let inr = null, brent = null, gold = null;
    try {
      const r = await fetch('https://open.er-api.com/v6/latest/USD');
      const d = await r.json();
      if (d.rates?.INR) inr = { rate: d.rates.INR.toFixed(2), prev: 83.5 };
    } catch(e) {}

    // Frankfurter.app as backup for forex
    if (!inr) {
      try {
        const r = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR');
        const d = await r.json();
        if (d.rates?.INR) inr = { rate: d.rates.INR.toFixed(2), prev: 83.5 };
      } catch(e) {}
    }

    // Metals/commodities via public API
    try {
      const r = await fetch('https://api.metals.live/v1/spot/oil,gold');
      const d = await r.json();
      brent = d?.oil ? { price: d.oil.toFixed(2) } : null;
      gold = d?.gold ? { price: Math.round(d.gold) } : null;
    } catch(e) {}

    setPrices({ inr, brent, gold, lastUpdate: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) });
  }

  useEffect(() => { fetchPrices(); const i = setInterval(fetchPrices, 10*60*1000); return () => clearInterval(i); }, []);
  return prices;
}

// ─── BASELINE events shown while GDELT loads ──────────────────────────────────
const BASELINE_EVENTS = [
  { id:'b1', lat:34.0, lng:74.8, title:'Kashmir Valley — active monitoring', severity:'HIGH', indiaRelevant:true, source:'baseline' },
  { id:'b2', lat:34.8, lng:78.0, title:'Depsang Plains — LAC patrol', severity:'HIGH', indiaRelevant:true, source:'baseline' },
  { id:'b3', lat:15.0, lng:42.5, title:'Red Sea — Houthi threat zone', severity:'CRITICAL', indiaRelevant:true, source:'baseline' },
  { id:'b4', lat:31.3, lng:34.4, title:'Gaza — active conflict', severity:'CRITICAL', indiaRelevant:false, source:'baseline' },
  { id:'b5', lat:49.0, lng:32.0, title:'Ukraine — active warzone', severity:'CRITICAL', indiaRelevant:false, source:'baseline' },
  { id:'b6', lat:26.5, lng:56.5, title:'Hormuz Strait — energy chokepoint', severity:'HIGH', indiaRelevant:true, source:'baseline' },
  { id:'b7', lat:32.4, lng:53.7, title:'Iran — nuclear tension', severity:'CRITICAL', indiaRelevant:true, source:'baseline' },
];
