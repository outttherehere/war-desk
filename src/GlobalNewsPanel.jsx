// GlobalNewsPanel.jsx — Live world conflict news, India-impact highlighted
// Sources: MediaStack, RSS from Reuters/AP/Al Jazeera/BBC/The Hindu/WION/ANI
// India-impact articles get orange border + 🇮🇳 badge

import { useState, useEffect, useRef } from 'react';

// ─── India impact scorer ───────────────────────────────────────────────────────
// Returns 0-100 score: how much does this story affect India?
function indiaImpactScore(title, desc = '') {
  const text = (title + ' ' + desc).toLowerCase();
  let score = 0;

  // Direct India mentions
  const direct = ['india','indian','modi','delhi','mumbai','new delhi','indian army','indian navy','indian air force','isro','bsf','crpf'];
  direct.forEach(w => { if (text.includes(w)) score += 25; });

  // India neighbors / conflicts
  const neighbors = ['pakistan','kashmir','loc','lac','china','pla','myanmar','bangladesh','nepal','sri lanka','maldives','bhutan'];
  neighbors.forEach(w => { if (text.includes(w)) score += 18; });

  // Indian Ocean / maritime India dependency
  const maritime = ['arabian sea','indian ocean','bay of bengal','hormuz','strait of hormuz','red sea','bab-el-mandeb','malacca','andaman'];
  maritime.forEach(w => { if (text.includes(w)) score += 15; });

  // Energy / economic India dependency
  const economic = ['crude oil','brent','opec','oil price','iran sanctions','russia oil','rupee','inr','india trade','indian economy'];
  economic.forEach(w => { if (text.includes(w)) score += 12; });

  // Global conflicts with India impact
  const global = ['houthi','yemen','iran nuclear','israel','hezbollah','ukraine war','nato','taliban','isis','al qaeda','terror attack'];
  global.forEach(w => { if (text.includes(w)) score += 8; });

  // Diaspora / global Indian interest
  const diaspora = ['nri','indian diaspora','indian origin','indians abroad','india-us','india-russia','india-israel','brics','sco','g20','quad'];
  diaspora.forEach(w => { if (text.includes(w)) score += 6; });

  return Math.min(100, score);
}

function impactLabel(score) {
  if (score >= 60) return { text: 'INDIA DIRECT', color: '#ff4444', border: '#ff444444', bg: '#ff44440a' };
  if (score >= 35) return { text: 'INDIA HIGH', color: '#ff8c00', border: '#ff8c0044', bg: '#ff8c000a' };
  if (score >= 15) return { text: 'INDIA WATCH', color: '#ffd700', border: '#ffd70033', bg: '#ffd7000a' };
  return { text: 'GLOBAL', color: '#444', border: '#1a1a1a', bg: 'transparent' };
}

// ─── Primary sources — first-hand, trusted, conflict-focused ──────────────────
const PRIMARY_RSS_SOURCES = [
  // Wire services (most reliable, first to publish)
  { url: 'https://feeds.reuters.com/reuters/worldNews', name: 'Reuters', tier: 1 },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', tier: 1 },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', tier: 1 },

  // India primary sources
  { url: 'https://feeds.feedburner.com/ndtvnews-india-news', name: 'NDTV India', tier: 1 },
  { url: 'https://www.thehindu.com/news/national/feeder/default.rss', name: 'The Hindu', tier: 1 },
  { url: 'https://www.business-standard.com/rss/defence-32.rss', name: 'BS Defence', tier: 1 },
  { url: 'https://www.wionews.com/feeds/world.xml', name: 'WION', tier: 1 },

  // Regional conflict coverage
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', name: 'TOI World', tier: 2 },
  { url: 'https://www.financialexpress.com/about/defence/feed/', name: 'FE Defence', tier: 2 },
];

const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';
const MEDIASTACK_KEY = import.meta.env.VITE_MEDIASTACK_KEY || '';

// Conflict keywords — only show relevant stories
const CONFLICT_MUST_MATCH = [
  'war','conflict','military','army','navy','air force','strike','attack','missile',
  'bomb','troops','terror','killed','explosion','nuclear','ceasefire','violation',
  'border','india','pakistan','china','kashmir','iran','israel','ukraine','russia',
  'nato','houthi','taiwan','lac','loc','navy','warship','submarine','fighter jet',
  'ballistic','drone','sanction','oil','hormuz','red sea','arabian sea','indian ocean',
  'modi','defence','ministry of external affairs','mea','operation','sindoor','depsang',
  'galwan','siachen','PoK','surgical strike','cross-border','infiltration','ceasefire',
  'line of control','line of actual control','standoff','escalat','tension'
];

function isConflictRelevant(title, desc = '') {
  const text = (title + ' ' + desc).toLowerCase();
  return CONFLICT_MUST_MATCH.some(k => text.includes(k));
}

function timeAgo(date) {
  const d = (Date.now() - new Date(date)) / 1000;
  if (isNaN(d) || d < 0) return '?';
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export default function GlobalNewsPanel({ onArticleHover, onHoverEnd }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [sourceStats, setSourceStats] = useState({});
  const intervalRef = useRef(null);

  async function fetchAllSources() {
    const all = [];
    const stats = {};

    // MediaStack — real-time world news (primary)
    if (MEDIASTACK_KEY) {
      try {
        const kw = 'war,military strike,terror attack,nuclear,india border,kashmir,israel,ukraine,iran,houthi,taiwan,nato';
        const url = `https://api.mediastack.com/v1/news?access_key=${MEDIASTACK_KEY}&keywords=${encodeURIComponent(kw)}&languages=en&limit=50&sort=published_desc`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.data?.length) {
          data.data.forEach(a => {
            if (!isConflictRelevant(a.title, a.description || '')) return;
            const impact = indiaImpactScore(a.title, a.description || '');
            all.push({
              id: a.url || Math.random(),
              title: a.title,
              desc: (a.description || '').replace(/<[^>]*>/g, '').slice(0, 180),
              url: a.url,
              source: a.source || 'MediaStack',
              publishedAt: new Date(a.published_at),
              indiaImpact: impact,
              impactInfo: impactLabel(impact),
              isBreaking: Date.now() - new Date(a.published_at) < 90 * 60 * 1000,
              layer: 'MEDIASTACK',
              tier: 1
            });
          });
          stats['MediaStack'] = data.data.length;
        }
      } catch (e) { console.error('MediaStack fetch:', e); }
    }

    // RSS sources — run in parallel
    await Promise.allSettled(PRIMARY_RSS_SOURCES.map(async (src) => {
      try {
        const res = await fetch(`${RSS2JSON}${encodeURIComponent(src.url)}&count=15`);
        const data = await res.json();
        if (data.items?.length) {
          stats[src.name] = 0;
          data.items.forEach(item => {
            if (!isConflictRelevant(item.title, item.description || '')) return;
            const impact = indiaImpactScore(item.title, item.description || '');
            all.push({
              id: item.link || Math.random(),
              title: item.title,
              desc: (item.description || '').replace(/<[^>]*>/g, '').slice(0, 180),
              url: item.link,
              source: src.name,
              publishedAt: new Date(item.pubDate),
              indiaImpact: impact,
              impactInfo: impactLabel(impact),
              isBreaking: Date.now() - new Date(item.pubDate) < 2 * 60 * 60 * 1000,
              layer: 'RSS',
              tier: src.tier
            });
            stats[src.name]++;
          });
        }
      } catch (e) { /* skip failed source */ }
    }));

    // Deduplicate by title (first 50 chars)
    const seen = new Set();
    const deduped = all
      .filter(a => {
        if (!a.title || a.title.length < 10) return false;
        const key = a.title.slice(0, 50).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        // Sort: Breaking first, then by India impact, then by date
        if (a.isBreaking && !b.isBreaking) return -1;
        if (!a.isBreaking && b.isBreaking) return 1;
        if (Math.abs(a.indiaImpact - b.indiaImpact) > 20) return b.indiaImpact - a.indiaImpact;
        return b.publishedAt - a.publishedAt;
      })
      .slice(0, 60);

    setArticles(deduped);
    setSourceStats(stats);
    setLastFetch(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    setLoading(false);
  }

  useEffect(() => {
    fetchAllSources();
    intervalRef.current = setInterval(fetchAllSources, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(intervalRef.current);
  }, []);

  const filterOptions = [
    { key: 'ALL', label: 'ALL', color: '#555' },
    { key: 'DIRECT', label: '🇮🇳 DIRECT', color: '#ff4444' },
    { key: 'HIGH', label: '🇮🇳 HIGH', color: '#ff8c00' },
    { key: 'WATCH', label: '🇮🇳 WATCH', color: '#ffd700' },
    { key: 'GLOBAL', label: 'GLOBAL', color: '#444' },
  ];

  const filtered = articles.filter(a => {
    if (filter === 'ALL') return true;
    if (filter === 'DIRECT') return a.indiaImpact >= 60;
    if (filter === 'HIGH') return a.indiaImpact >= 35 && a.indiaImpact < 60;
    if (filter === 'WATCH') return a.indiaImpact >= 15 && a.indiaImpact < 35;
    if (filter === 'GLOBAL') return a.indiaImpact < 15;
    return true;
  });

  const directCount = articles.filter(a => a.indiaImpact >= 60).length;
  const highCount = articles.filter(a => a.indiaImpact >= 35 && a.indiaImpact < 60).length;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#07070e', fontFamily: 'monospace'
    }}>
      {/* Header */}
      <div style={{ padding: '6px 10px', borderBottom: '1px solid #111', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#ff4444', fontSize: 7, animation: 'blink 1s infinite' }}>●</span>
            <span style={{ color: '#fff', fontSize: 9, letterSpacing: 2 }}>WORLD CONFLICT FEED</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {lastFetch && <span style={{ color: '#252525', fontSize: 8 }}>{lastFetch}</span>}
            <button onClick={fetchAllSources} style={{
              background: 'none', border: '1px solid #1a1a1a', color: '#00d4ff',
              padding: '1px 5px', fontSize: 8, cursor: 'pointer'
            }}>↻</button>
          </div>
        </div>

        {/* India impact summary */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <div style={{ background: '#ff44440d', border: '1px solid #ff444422', padding: '2px 6px', display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ color: '#ff4444', fontSize: 9, fontWeight: 'bold' }}>{directCount}</span>
            <span style={{ color: '#ff444488', fontSize: 7 }}>DIRECT INDIA IMPACT</span>
          </div>
          <div style={{ background: '#ff8c000d', border: '1px solid #ff8c0022', padding: '2px 6px', display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ color: '#ff8c00', fontSize: 9, fontWeight: 'bold' }}>{highCount}</span>
            <span style={{ color: '#ff8c0088', fontSize: 7 }}>HIGH IMPACT</span>
          </div>
          <div style={{ marginLeft: 'auto', color: '#1a1a1a', fontSize: 7 }}>{articles.length} stories</div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {filterOptions.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              background: filter === f.key ? f.color + '22' : 'transparent',
              color: filter === f.key ? f.color : '#2a2a2a',
              border: `1px solid ${filter === f.key ? f.color + '44' : '#111'}`,
              padding: '2px 6px', fontSize: 7, cursor: 'pointer', letterSpacing: 1
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Sources status bar */}
      <div style={{ padding: '3px 8px', borderBottom: '1px solid #0d0d0d', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
        {Object.entries(sourceStats).map(([name, count]) => (
          <span key={name} style={{ color: count > 0 ? '#1a3a1a' : '#111', fontSize: 7, whiteSpace: 'nowrap', letterSpacing: 1 }}>
            {count > 0 ? '●' : '○'} {name}
          </span>
        ))}
        {Object.keys(sourceStats).length === 0 && (
          <span style={{ color: '#111', fontSize: 7 }}>CONNECTING TO SOURCES...</span>
        )}
      </div>

      {/* Articles */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ color: '#1a1a1a', fontSize: 10, marginBottom: 8 }}>⟳ CONNECTING TO SOURCES</div>
            <div style={{ color: '#111', fontSize: 8 }}>Reuters · Al Jazeera · BBC · NDTV · The Hindu · WION · MediaStack</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#1a1a1a', fontSize: 9 }}>NO STORIES IN THIS FILTER</div>
        ) : filtered.map(article => (
          <ArticleRow
            key={article.id}
            article={article}
            onMouseEnter={() => onArticleHover?.(article)}
            onMouseLeave={() => onHoverEnd?.()}
          />
        ))}
      </div>
    </div>
  );
}

function ArticleRow({ article, onMouseEnter, onMouseLeave }) {
  const { impactInfo, isBreaking } = article;
  const [hovered, setHovered] = useState(false);

  const share = () => {
    const t = `${impactInfo.text === 'INDIA DIRECT' || impactInfo.text === 'INDIA HIGH' ? '🇮🇳 ' : ''}${article.title}\n\nvia India War Desk — https://war-desk.vercel.app`;
    if (navigator.share) navigator.share({ title: article.title, text: t, url: article.url });
    else window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank');
  };

  return (
    <div
      onMouseEnter={() => { setHovered(true); onMouseEnter?.(); }}
      onMouseLeave={() => { setHovered(false); onMouseLeave?.(); }}
      style={{
        padding: '8px 10px',
        borderBottom: `1px solid ${impactInfo.color === '#ff4444' ? '#ff44441a' : '#0d0d0d'}`,
        borderLeft: `2px solid ${impactInfo.color}`,
        background: hovered ? impactInfo.bg || 'rgba(0,212,255,0.03)' : impactInfo.bg || 'transparent',
        transition: 'background 0.15s',
        cursor: 'pointer'
      }}
    >
      {/* Top row — badges */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        {isBreaking && (
          <span style={{ background: '#ff2200', color: '#fff', padding: '0 3px', fontSize: 7, letterSpacing: 1, animation: 'blink 1s infinite' }}>BREAKING</span>
        )}
        {/* India impact badge — most important */}
        <span style={{
          background: impactInfo.color + '18',
          color: impactInfo.color,
          border: `1px solid ${impactInfo.border}`,
          padding: '0 4px', fontSize: 7, letterSpacing: 1, fontWeight: 'bold'
        }}>
          {impactInfo.text}
        </span>
        {article.indiaImpact >= 15 && (
          <span style={{ color: impactInfo.color + 'aa', fontSize: 8 }}>
            {article.indiaImpact >= 60 ? '🇮🇳🇮🇳🇮🇳' : article.indiaImpact >= 35 ? '🇮🇳🇮🇳' : '🇮🇳'}
          </span>
        )}
        <span style={{ color: '#1a1a1a', fontSize: 7, marginLeft: 'auto' }}>
          {timeAgo(article.publishedAt)}
        </span>
      </div>

      {/* Title */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: article.indiaImpact >= 35 ? '#d8d8d8' : '#888',
          fontSize: article.indiaImpact >= 60 ? 11 : 10,
          lineHeight: 1.45,
          display: 'block',
          textDecoration: 'none',
          marginBottom: 4,
          fontWeight: article.indiaImpact >= 60 ? 'bold' : 'normal'
        }}
      >
        {article.title}
      </a>

      {/* Description for high-impact articles */}
      {article.indiaImpact >= 35 && article.desc && (
        <div style={{ color: '#333', fontSize: 9, lineHeight: 1.4, marginBottom: 4 }}>
          {article.desc.slice(0, 120)}...
        </div>
      )}

      {/* Source + share */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#1a1a1a', fontSize: 8 }}>
          {article.source} · {article.layer}
          {article.tier === 1 && <span style={{ color: '#1a3a1a', marginLeft: 4 }}>TIER 1</span>}
        </span>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); share(); }}
          style={{
            background: 'none', border: 'none', color: '#25D366',
            fontSize: 11, cursor: 'pointer', opacity: hovered ? 0.8 : 0,
            transition: 'opacity 0.2s', padding: 0
          }}
        >📤</button>
      </div>
    </div>
  );
}
