// LiveNewsFeed.jsx — real articles, WhatsApp share, mobile-ready
import { useState } from 'react';

const CAT_COLOR = {
  MILITARY: '#ff4444', TERROR: '#ff2200', CHINA: '#ff8c00',
  PAK: '#ffcc00', ECONOMIC: '#00d4ff', GLOBAL: '#888', GEOPOLITICAL: '#00ff88'
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function shareArticle(article) {
  const text = `📰 ${article.title}\n\nvia India War Desk — https://war-desk.vercel.app`;
  if (navigator.share) {
    navigator.share({ title: article.title, text, url: article.url });
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }
}

export default function LiveNewsFeed({ articles = [], lastFetch, onRefresh }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(false);

  const filters = ['ALL', 'MILITARY', 'PAK', 'CHINA', 'TERROR', 'GLOBAL'];

  const filtered = activeFilter === 'ALL' ? articles :
    articles.filter(a => a.category === activeFilter);

  const displayed = expanded ? filtered : filtered.slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #222' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#ff4444', fontSize: 8 }}>●</span>
          <span style={{ color: '#fff', fontSize: 10, letterSpacing: 2 }}>LIVE NEWS</span>
          {lastFetch && <span style={{ color: '#555', fontSize: 9 }}>· {lastFetch}</span>}
        </div>
        <button onClick={onRefresh} style={{ background: 'none', border: '1px solid #333', color: '#00d4ff', padding: '2px 6px', fontSize: 9, cursor: 'pointer' }}>↻</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 2, padding: '4px 8px', borderBottom: '1px solid #1a1a1a', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{
            background: activeFilter === f ? (CAT_COLOR[f] || '#00d4ff') : 'transparent',
            color: activeFilter === f ? '#000' : '#555',
            border: `1px solid ${activeFilter === f ? (CAT_COLOR[f] || '#00d4ff') : '#2a2a2a'}`,
            padding: '1px 6px', fontSize: 8, cursor: 'pointer', letterSpacing: 1,
            fontFamily: 'monospace'
          }}>{f}</button>
        ))}
      </div>

      {/* Articles */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {displayed.length === 0 ? (
          <div style={{ color: '#444', fontSize: 10, padding: 12, textAlign: 'center' }}>
            {articles.length === 0 ? 'LOADING LIVE FEED...' : 'NO ARTICLES IN THIS CATEGORY'}
          </div>
        ) : displayed.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}

        {filtered.length > 6 && (
          <button onClick={() => setExpanded(!expanded)} style={{
            width: '100%', background: 'transparent', border: '1px solid #222',
            color: '#555', padding: '6px', fontSize: 9, cursor: 'pointer', letterSpacing: 1
          }}>
            {expanded ? '▲ SHOW LESS' : `▼ LOAD ${filtered.length - 6} MORE`}
          </button>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article }) {
  const [hovered, setHovered] = useState(false);
  const catColor = CAT_COLOR[article.category] || '#888';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 10px',
        borderBottom: '1px solid #111',
        background: hovered ? 'rgba(0,212,255,0.04)' : 'transparent',
        transition: 'background 0.2s'
      }}
    >
      {/* Category + credibility + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
        {article.isBreaking && (
          <span style={{ background: '#ff2200', color: 'white', padding: '1px 4px', fontSize: 8, letterSpacing: 1, fontFamily: 'monospace', animation: 'blink 1s infinite' }}>BREAKING</span>
        )}
        <span style={{ background: catColor + '22', color: catColor, border: `1px solid ${catColor}44`, padding: '1px 5px', fontSize: 8, letterSpacing: 1 }}>
          {article.category}
        </span>
        <span style={{
          background: article.credibility > 85 ? '#00ff8822' : '#ffffff11',
          color: article.credibility > 85 ? '#00ff88' : '#666',
          border: `1px solid ${article.credibility > 85 ? '#00ff8844' : '#333'}`,
          padding: '1px 4px', fontSize: 8
        }}>{article.credibility}%</span>
        <span style={{ color: '#444', fontSize: 8, marginLeft: 'auto' }}>{timeAgo(article.publishedAt)}</span>
      </div>

      {/* Title */}
      <a href={article.url} target="_blank" rel="noopener noreferrer" style={{
        color: '#d0d0d0', fontSize: 11, lineHeight: 1.4, display: 'block',
        textDecoration: 'none', marginBottom: 4
      }}
        onMouseEnter={e => e.target.style.color = '#fff'}
        onMouseLeave={e => e.target.style.color = '#d0d0d0'}
      >
        {article.title}
      </a>

      {/* Source + share */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#444', fontSize: 9 }}>
          {article.source} · {article.layer}
        </span>
        <button
          onClick={() => shareArticle(article)}
          style={{
            background: 'transparent', border: 'none', color: '#25D366',
            fontSize: 11, cursor: 'pointer', padding: '0 4px', opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s'
          }}
          title="Share on WhatsApp"
        >📤</button>
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
