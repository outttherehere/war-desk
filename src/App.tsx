import { useState, useEffect } from 'react';
import { Satellite, Clock, Activity } from 'lucide-react';
import MapView from './components/MapView';
import ConflictPanel from './components/ConflictPanel';
import NewsFeed from './components/NewsFeed';
import SindoorPanel from './components/SindoorPanel';
import { useNewsFeed } from './hooks/useNewsFeed';
import { useSindoorProbability } from './hooks/useSindoorProbability';
import { CONFLICTS } from './data/conflicts';
import type { Conflict } from './types';

function useLiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function App() {
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const { articles, loading, error, lastRefreshed, refresh } = useNewsFeed();
  const sindoorState = useSindoorProbability(articles);
  const clock = useLiveClock();

  const istTime = clock.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

  const istDate = clock.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const criticalCount = CONFLICTS.filter((c) => c.intensity === 'critical').length;
  const activeCount = CONFLICTS.filter((c) => c.status === 'active' || c.status === 'escalating').length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: '52px 1fr',
        gridTemplateColumns: '1fr',
        height: '100vh',
        width: '100vw',
        background: '#050a14',
        overflow: 'hidden',
        fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        style={{
          background: '#07101f',
          borderBottom: '1px solid #1f3050',
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          gap: 16,
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28, height: 28,
              borderRadius: '50%',
              background: 'rgba(220,38,38,0.15)',
              border: '1.5px solid rgba(220,38,38,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 10, height: 10,
                borderRadius: '50%',
                background: '#dc2626',
                boxShadow: '0 0 8px #dc2626',
                animation: 'pulse-dot 1.5s ease-in-out infinite',
              }}
            />
          </div>
          <div>
            <div
              style={{
                color: '#e2e8f0',
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '0.1em',
              }}
            >
              INDIA GEOPOLITICAL INTELLIGENCE
            </div>
            <div style={{ color: '#2d4060', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.12em' }}>
              STRATEGIC THREAT ASSESSMENT SYSTEM
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: '#1f3050', flexShrink: 0 }} />

        {/* Status chips */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px',
              background: 'rgba(220,38,38,0.12)',
              border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 4,
              color: '#ef4444',
              fontFamily: 'monospace',
              fontSize: 10,
              letterSpacing: '0.1em',
            }}
          >
            <div
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#dc2626',
                animation: 'pulse-dot 1.2s ease-in-out infinite',
              }}
            />
            {criticalCount} CRITICAL
          </span>
          <span
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px',
              background: 'rgba(249,115,22,0.1)',
              border: '1px solid rgba(249,115,22,0.25)',
              borderRadius: 4,
              color: '#f97316',
              fontFamily: 'monospace',
              fontSize: 10,
              letterSpacing: '0.1em',
            }}
          >
            <Activity size={10} />
            {activeCount} ACTIVE
          </span>
          <span
            style={{
              padding: '3px 10px',
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 4,
              color: '#60a5fa',
              fontFamily: 'monospace',
              fontSize: 10,
              letterSpacing: '0.1em',
            }}
          >
            {CONFLICTS.length} ZONES MONITORED
          </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Satellite icon + news count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2d4060' }}>
          <Satellite size={12} />
          <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em' }}>
            {articles.length > 0 ? `${articles.length} FEED ITEMS` : loading ? 'LOADING…' : 'NO FEED'}
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: '#1f3050', flexShrink: 0 }} />

        {/* Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={12} color="#2d4060" />
          <div>
            <div
              style={{
                color: '#e2e8f0',
                fontFamily: 'monospace',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.08em',
              }}
            >
              {istTime}
            </div>
            <div style={{ color: '#2d4060', fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.06em' }}>
              {istDate} IST
            </div>
          </div>
        </div>
      </header>

      {/* ── Main body ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          overflow: 'hidden',
          flex: 1,
        }}
      >
        {/* Left — News Feed */}
        <NewsFeed
          articles={articles}
          loading={loading}
          error={error}
          lastRefreshed={lastRefreshed}
          onRefresh={refresh}
        />

        {/* Center — Map */}
        <MapView
          conflicts={CONFLICTS}
          onConflictClick={setSelectedConflict}
        />

        {/* Right — Sindoor Panel */}
        <SindoorPanel state={sindoorState} />
      </div>

      {/* ── Conflict detail panel (bottom drawer) ─────────────────────────── */}
      {selectedConflict && (
        <ConflictPanel
          conflict={selectedConflict}
          onClose={() => setSelectedConflict(null)}
        />
      )}
    </div>
  );
}
