// GlobalNewsPanel.jsx — FIXED VERSION
// https MediaStack, RSS fallback, India-impact scoring, WhatsApp share

import { useState, useEffect, useRef } from 'react';

const MEDIASTACK_KEY = import.meta.env.VITE_MEDIASTACK_KEY || '';
const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

function indiaImpactScore(title, desc = '') {
  const text = (title + ' ' + desc).toLowerCase();
  let score = 0;
  const groups = [
    { words: ['india','indian','modi','delhi','mumbai','indian army','indian navy','bsf','crpf','isro'], pts: 25 },
    { words: ['pakistan','kashmir','loc','lac','china','pla','myanmar','bangladesh','nepal','sri lanka'], pts: 18 },
    { words: ['arabian sea','indian ocean','bay of bengal','hormuz','red sea','malacca','andaman'], pts: 15 },
    { words: ['crude oil','brent','opec','iran sanctions','rupee','india trade','indian economy'], pts: 12 },
    { words: ['houthi','yemen','iran nuclear','israel','hezbollah','ukraine war','nato','taliban','isis','terror'], pts: 8 },
    { words: ['nri','indian diaspora','brics','sco','g20','quad','india-us','india-russia'], pts: 6 },
  ];
  groups.forEach(g => g.words.forEach(w => { if (text.includes(w)) score += g.pts; }));
  return Math.min(100, score);
}

function impactLabel(score) {
  if (score >= 60) return { text: '🇮🇳 INDIA DIRECT', color: '#ff4444', border: '#ff444433', bg: '#ff44440a' };
  if (score >= 35) return { text: '🇮🇳 INDIA HIGH',   color: '#ff8c00', border: '#ff8c0033', bg: '#ff8c000a' };
  if (score >= 15) return { text: '🇮🇳 INDIA WATCH',  color: '#ffd700', border: '#ffd70033', bg: '#ffd7000a' };
  return              { text: 'GLOBAL',              color: '#333',    border: '#1a1a1a',  bg: 'transparent' };
}

const CONFLICT_WORDS = ['war','conflict','military','army','navy','air force','strike','attack','missile','bomb','troops','terror','killed','explosion','nuclear','ceasefire','border','india','pakistan','china','kashmir','iran','israel','ukraine','russia','nato','houthi','taiwan','lac','loc','warship','ballistic','drone','hormuz','red sea','arabian','indian ocean','sindoor','depsang','galwan','sanctions','airspace'];

function isRelevant(title, desc = '') {
  const t = (title + ' ' + desc).toLowerCase();
  return CONFLICT_WORDS.some(w => t.includes(w));
}

const RSS_SOURCES = [
  { url: 'https://feeds.reuters.com/reuters/worldNews', name: 'Reuters' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World' },
  { url: 'https://feeds.feedburner.com/ndtvnews-india-news', name: 'NDTV' },
  { url: 'https://www.thehindu.com/news/national/feeder/default.rss', name: 'The Hindu' },
  { url: 'https://www.business-standard.com/rss/defence-32.rss', name: 'BS Defence' },
  { url: 'https://www.wionews.com/feeds/world.xml', name: 'WION' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', name: 'TOI World' },
];

function timeAgo(date) {
  const d = (Date.now() - new Date(date)) / 1000;
  if (!d || isNaN(d) || d < 0) return '?';
  if (d < 60) return 'now';
  if (d < 3600) return `${Math.floor(d/60)}m`;
  if (d < 86400) return `${Math.floor(d/3600)}h`;
  return `${Math.floor(d/86400)}d`;
}

function ArticleRow({ article, onMouseEnter, onMouseLeave }) {
  const [hovered, setHovered] = useState(false);
  const { impactInfo, isBreaking } = article;

  const share = (e) => {
    e.preventDefault(); e.stopPropagation();
    const t = `${article.indiaImpact >= 35 ? '🇮🇳 ' : ''}${article.title}\n\nIndia War Desk — https://war-desk.vercel.app`;
    if (navigator.share) navigator.share({ title: article.title, text: t, url: article.url });
    else window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank');
  };

  return (
    <div
      onMouseEnter={() => { setHovered(true); onMouseEnter?.(); }}
      onMouseLeave={() => { setHovered(false); onMouseLeave?.(); }}
      style={{
        padding: '7px 9px',
        borderBottom: `1px solid ${article.indiaImpact >= 60 ? '#1a0808' : '#080808'}`,
        borderLeft: `2px solid ${hovered ? impactInfo.color : impactInfo.color + '44'}`,
        background: hovered ? (impactInfo.bg || 'rgba(0,212,255,0.03)') : (impactInfo.bg || 'transparent'),
        transition: 'all 0.15s'
      }}
    >
      <div style={{ display: 'flex', gap: 3, marginBottom: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        {isBreaking && (
          <span style={{ background: '#ff2200', color: '#fff', padding: '0 3px', fontSize: 6, letterSpacing: 1, animation: 'blink 1s infinite' }}>BREAKING</span>
        )}
        <span style={{ background: impactInfo.color + '15', color: impactInfo.color, border: `1px solid ${impactInfo.border}`, padding: '0 4px', fontSize: 6, letterSpacing: 1 }}>
          {impactInfo.text}
        </span>
        <span style={{ color: '#151515', fontSize: 7, marginLeft: 'auto' }}>{timeAgo(article.publishedAt)}</span>
      </div>

      <a href={article.url} target="_blank" rel="noopener noreferrer" style={{
        color: article.indiaImpact >= 35 ? '#cccccc' : '#555',
        fontSize: article.indiaImpact >= 60 ? 11 : 10,
        lineHeight: 1.4, display: 'block', textDecoration: 'none', marginBottom: 3,
        fontWeight: article.indiaImpact >= 60 ? 'bold' : 'normal'
      }}>
        {article.title}
      </a>

      {article.indiaImpact >= 35 && article.desc && (
        <div style={{ color: '#252525', fontSize: 8, lineHeight: 1.4, marginBottom: 3 }}>
          {article.desc.slice(0, 110)}...
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#151515', fontSize: 7 }}>{article.source} · {article.layer}</span>
        <button onClick={share} style={{ background: 'none', border: 'none', color: '#25D366', fontSize: 11, cursor: 'pointer', opacity: hovered ? 0.7 : 0, transition: 'opacity 0.2s', padding: 0 }}>📤</button>
      </div>
    </div>
  );
}

export default function GlobalNewsPanel({ onArticleHover, onHoverEnd }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourceLog, setSourceLog] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [lastFetch, setLastFetch] = useState(null);
  const timerRef = useRef(null);

  async function fetchAll() {
    const all = [];
    const log = [];

    // MediaStack (HTTPS — real-time breaking news)
    if (MEDIASTACK_KEY) {
      try {
        const kw = 'india military,pakistan border,kashmir,china lac,operation sindoor,israel,ukraine,iran,houthi,nato,terror attack,nuclear';
        const url = `https://api.mediastack.com/v1/news?access_key=${MEDIASTACK_KEY}&keywords=${encodeURIComponent(kw)}&languages=en&limit=50&sort=published_desc`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.data?.length) {
          data.data.forEach(a => {
            if (!isRelevant(a.title, a.description || '')) return;
            const impact = indiaImpactScore(a.title, a.description || '');
            all.push({
              id: a.url || String(Math.random()),
              title: a.title,
              desc: (a.description || '').replace(/<[^>]*>/g, '').slice(0, 160),
              url: a.url,
              source: a.source || 'MediaStack',
              publishedAt: new Date(a.published_at),
              indiaImpact: impact,
              impactInfo: impactLabel(impact),
              isBreaking: Date.now() - new Date(a.published_at) < 90 * 60 * 1000,
              layer: 'LIVE'
            });
          });
          log.push(`✓ MediaStack: ${data.data.length}`);
        } else {
          log.push(`○ MediaStack: ${data?.error?.message || 'empty'}`);
        }
      } catch (e) {
        log.push(`✗ MediaStack: network`);
      }
    }

    // RSS — all sources in parallel
    const results = await Promise.allSettled(
      RSS_SOURCES.map(async (src) => {
        const res = await fetch(`${RSS2JSON}${encodeURIComponent(src.url)}&count=12`);
        const data = await res.json();
        if (!data?.items?.length) throw new Error('empty');
        const items = [];
        data.items.forEach(item => {
          if (!isRelevant(item.title, item.description || '')) return;
          const impact = indiaImpactScore(item.title, item.description || '');
          items.push({
            id: item.link || String(Math.random()),
            title: item.title,
            desc: (item.description || '').replace(/<[^>]*>/g, '').slice(0, 160),
            url: item.link,
            source: src.name,
            publishedAt: new Date(item.pubDate),
            indiaImpact: impact,
            impactInfo: impactLabel(impact),
            isBreaking: Date.now() - new Date(item.pubDate) < 2 * 60 * 60 * 1000,
            layer: 'RSS'
          });
        });
        return { name: src.name, items };
      })
    );

    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        all.push(...r.value.items);
        log.push(`✓ ${r.value.name}: ${r.value.items.length}`);
      } else {
        log.push(`✗ ${RSS_SOURCES[i].name}`);
      }
    });

    // Deduplicate + sort
    const seen = new Set();
    const deduped = all
      .filter(a => {
        if (!a.title || a.title.length < 15) return false;
        const key = a.title.slice(0, 45).toLowerCase().replace(/\W/g, '');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        if (a.isBreaking !== b.isBreaking) return a.isBreaking ? -1 : 1;
        if (Math.abs(a.indiaImpact - b.indiaImpact) > 15) return b.indiaImpact - a.indiaImpact;
        return b.publishedAt - a.publishedAt;
      })
      .slice(0, 70);

    setArticles(deduped);
    setSourceLog(log);
    setLastFetch(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const FILTERS = [
    { k: 'ALL',    label: 'ALL',        color: '#444' },
    { k: 'DIRECT', label: '🇮🇳 DIRECT', color: '#ff4444' },
    { k: 'HIGH',   label: '🇮🇳 HIGH',   color: '#ff8c00' },
    { k: 'WATCH',  label: '🇮🇳 WATCH',  color: '#ffd700' },
    { k: 'GLOBAL', label: 'GLOBAL',     color: '#333' },
  ];

  const filtered = articles.filter(a => {
    if (filter === 'ALL')    return true;
    if (filter === 'DIRECT') return a.indiaImpact >= 60;
    if (filter === 'HIGH')   return a.indiaImpact >= 35 && a.indiaImpact < 60;
    if (filter === 'WATCH')  return a.indiaImpact >= 15 && a.indiaImpact < 35;
    if (filter === 'GLOBAL') return a.indiaImpact < 15;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#06060c', fontFamily: 'monospace' }}>

      <div style={{ padding: '6px 8px', borderBottom: '1px solid #0d0d0d', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: '#ff4444', fontSize: 7, animation: 'blink 1s infinite' }}>●</span>
            <span style={{ color: '#ddd', fontSize: 9, letterSpacing: 2 }}>WORLD CONFLICT FEED</span>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {lastFetch && <span style={{ color: '#1a1a1a', fontSize: 7 }}>{lastFetch}</span>}
            <button onClick={fetchAll} style={{ background: 'none', border: '1px solid #111', color: '#00d4ff', padding: '1px 5px', fontSize: 8, cursor: 'pointer' }}>↻</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
          <div style={{ background: '#ff44440d', border: '1px solid #ff444418', padding: '2px 5px', display: 'flex', gap: 3, alignItems: 'center' }}>
            <span style={{ color: '#ff4444', fontSize: 10, fontWeight: 'bold' }}>{articles.filter(a => a.indiaImpact >= 60).length}</span>
            <span style={{ color: '#ff444466', fontSize: 6 }}>DIRECT</span>
          </div>
          <div style={{ background: '#ff8c000d', border: '1px solid #ff8c0018', padding: '2px 5px', display: 'flex', gap: 3, alignItems: 'center' }}>
            <span style={{ color: '#ff8c00', fontSize: 10, fontWeight: 'bold' }}>{articles.filter(a => a.indiaImpact >= 35 && a.indiaImpact < 60).length}</span>
            <span style={{ color: '#ff8c0066', fontSize: 6 }}>HIGH</span>
          </div>
          <div style={{ marginLeft: 'auto', color: '#1a1a1a', fontSize: 7, alignSelf: 'center' }}>{articles.length} stories</div>
        </div>

        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              background: filter === f.k ? f.color + '22' : 'transparent',
              color: filter === f.k ? f.color : '#1a1a1a',
              border: `1px solid ${filter === f.k ? f.color + '44' : '#0d0d0d'}`,
              padding: '2px 5px', fontSize: 7, cursor: 'pointer', letterSpacing: 1
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Source log */}
      <div style={{ padding: '2px 8px', borderBottom: '1px solid #080808', display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0, flexWrap: 'wrap' }}>
        {sourceLog.length === 0
          ? <span style={{ color: '#111', fontSize: 6 }}>CONNECTING TO SOURCES...</span>
          : sourceLog.map((s, i) => (
            <span key={i} style={{ color: s.startsWith('✓') ? '#0d2a0d' : '#1a0a0a', fontSize: 6, whiteSpace: 'nowrap' }}>{s}</span>
          ))
        }
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ color: '#1a1a1a', fontSize: 10, marginBottom: 6 }}>⟳ FETCHING LIVE SOURCES</div>
            <div style={{ color: '#0d0d0d', fontSize: 7, lineHeight: 1.8 }}>Reuters · Al Jazeera · BBC · NDTV<br/>The Hindu · BS Defence · WION · MediaStack</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#1a1a1a', fontSize: 9 }}>NO STORIES IN THIS FILTER</div>
        ) : (
          filtered.map(a => (
            <ArticleRow
              key={a.id}
              article={a}
              onMouseEnter={() => onArticleHover?.(a)}
              onMouseLeave={onHoverEnd}
            />
          ))
        )}
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </div>
  );
}
