import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Wifi, WifiOff, ExternalLink, Zap } from 'lucide-react';
import type { RssArticle, NewsCategory } from '../types';

interface Props {
  articles: RssArticle[];
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  onRefresh: () => void;
}

const CATEGORY_STYLE: Record<NewsCategory, { color: string; bg: string; label: string }> = {
  military: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'MIL' },
  security: { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'SEC' },
  diplomatic: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'DIP' },
  intelligence: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'INT' },
  economic: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', label: 'ECO' },
  humanitarian: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'HUM' },
};

const SOURCE_COLORS: Record<string, string> = {
  'BBC Asia': '#ef4444',
  'Al Jazeera': '#f97316',
  'The Hindu': '#10b981',
  'NDTV': '#3b82f6',
  'The Guardian': '#6366f1',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function isBreaking(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 45 * 60 * 1000;
}

type Filter = NewsCategory | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'military', label: 'MIL' },
  { key: 'security', label: 'SEC' },
  { key: 'diplomatic', label: 'DIP' },
  { key: 'intelligence', label: 'INT' },
  { key: 'economic', label: 'ECO' },
];

export default function NewsFeed({ articles, loading, error, lastRefreshed, onRefresh }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevArticlesRef = useRef<RssArticle[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  // Highlight newly added articles
  useEffect(() => {
    const prev = new Set(prevArticlesRef.current.map((a) => a.link));
    const fresh = articles.filter((a) => !prev.has(a.link)).map((a) => a.link);
    if (fresh.length > 0) {
      setNewIds(new Set(fresh));
      setTimeout(() => setNewIds(new Set()), 4000);
    }
    prevArticlesRef.current = articles;
  }, [articles]);

  const filtered =
    filter === 'all' ? articles : articles.filter((a) => a.category === filter);

  const lastRefStr = lastRefreshed
    ? lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        background: '#0d1421',
        borderRight: '1px solid #1f3050',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px 8px',
          borderBottom: '1px solid #1f3050',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: error ? '#ef4444' : '#10b981',
                boxShadow: error ? 'none' : '0 0 6px #10b981',
                animation: error ? 'none' : 'pulse-dot 1.8s ease-in-out infinite',
              }}
            />
            <span
              style={{
                color: '#e2e8f0',
                fontFamily: 'monospace',
                fontSize: 11,
                letterSpacing: '0.12em',
                fontWeight: 700,
              }}
            >
              LIVE OSINT FEED
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {error ? <WifiOff size={12} color="#ef4444" /> : <Wifi size={12} color="#10b981" />}
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Refresh feed"
              style={{
                background: 'none', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: '#4a6080', padding: 2, display: 'flex',
              }}
            >
              <RefreshCw
                size={12}
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
              />
            </button>
          </div>
        </div>

        {/* Sources */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
          {Object.entries(SOURCE_COLORS).map(([src, color]) => (
            <span
              key={src}
              style={{
                fontSize: 9, fontFamily: 'monospace',
                color, letterSpacing: '0.06em',
                background: `${color}12`,
                border: `1px solid ${color}30`,
                borderRadius: 3,
                padding: '1px 5px',
              }}
            >
              {src.toUpperCase()}
            </span>
          ))}
        </div>

        {/* Last updated */}
        <div style={{ color: '#2d4060', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em' }}>
          UPDATED {lastRefStr} IST · AUTO-REFRESH 5MIN
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 3, marginTop: 8, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '2px 7px',
                borderRadius: 3,
                fontSize: 9,
                fontFamily: 'monospace',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                border: `1px solid ${filter === f.key ? '#dc2626' : '#1f3050'}`,
                background: filter === f.key ? 'rgba(220,38,38,0.15)' : 'transparent',
                color: filter === f.key ? '#ef4444' : '#4a6080',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
          <span
            style={{
              marginLeft: 'auto',
              color: '#2d4060', fontSize: 9,
              fontFamily: 'monospace',
              alignSelf: 'center',
            }}
          >
            {filtered.length}
          </span>
        </div>
      </div>

      {/* Feed */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#1f3050 transparent',
        }}
      >
        {loading && articles.length === 0 ? (
          <div style={{ padding: '30px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: 28, height: 28, border: '2px solid #1f3050',
                borderTopColor: '#dc2626', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 10px',
              }}
            />
            <div style={{ color: '#4a6080', fontFamily: 'monospace', fontSize: 10 }}>
              FETCHING LIVE FEEDS…
            </div>
          </div>
        ) : error && articles.length === 0 ? (
          <div style={{ padding: '20px 14px' }}>
            <div style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 10, marginBottom: 6 }}>
              FEED ERROR
            </div>
            <div style={{ color: '#64748b', fontSize: 11 }}>{error}</div>
          </div>
        ) : (
          filtered.map((article) => {
            const catStyle = CATEGORY_STYLE[article.category];
            const srcColor = SOURCE_COLORS[article.sourceLabel] || '#4a6080';
            const breaking = isBreaking(article.pubDate);
            const isNew = newIds.has(article.link);

            return (
              <a
                key={article.link}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '10px 14px',
                  borderBottom: '1px solid #111c2e',
                  textDecoration: 'none',
                  borderLeft: `3px solid ${catStyle.color}`,
                  background: isNew ? 'rgba(220,38,38,0.06)' : 'transparent',
                  transition: 'background 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = isNew ? 'rgba(220,38,38,0.06)' : 'transparent')
                }
              >
                {/* Meta row */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    marginBottom: 5, flexWrap: 'wrap',
                  }}
                >
                  {breaking && (
                    <span
                      style={{
                        background: 'rgba(220,38,38,0.2)',
                        color: '#ef4444',
                        border: '1px solid rgba(220,38,38,0.4)',
                        fontSize: 8,
                        fontFamily: 'monospace',
                        padding: '1px 5px',
                        borderRadius: 2,
                        letterSpacing: '0.1em',
                        display: 'flex', alignItems: 'center', gap: 3,
                      }}
                    >
                      <Zap size={8} />
                      BREAKING
                    </span>
                  )}
                  <span
                    style={{
                      background: catStyle.bg,
                      color: catStyle.color,
                      fontSize: 8,
                      fontFamily: 'monospace',
                      padding: '1px 5px',
                      borderRadius: 2,
                      letterSpacing: '0.1em',
                    }}
                  >
                    {catStyle.label}
                  </span>
                  <span style={{ color: srcColor, fontSize: 9, fontFamily: 'monospace' }}>
                    {article.sourceLabel.toUpperCase()}
                  </span>
                  <span style={{ marginLeft: 'auto', color: '#2d4060', fontSize: 9, fontFamily: 'monospace' }}>
                    {timeAgo(article.pubDate)}
                  </span>
                </div>

                {/* Headline */}
                <div
                  style={{
                    color: '#cbd5e1',
                    fontSize: 12,
                    lineHeight: 1.45,
                    marginBottom: 4,
                    fontWeight: 500,
                  }}
                >
                  {article.title}
                </div>

                {/* Description */}
                {article.description && (
                  <div
                    style={{
                      color: '#4a6080',
                      fontSize: 11,
                      lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {article.description}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <ExternalLink size={9} color="#2d4060" />
                </div>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
