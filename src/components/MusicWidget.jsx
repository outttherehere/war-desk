// MusicWidget.jsx — Fixed with unlock button for browser autoplay policy
import { useState } from 'react';

export default function MusicWidget({ currentTrack, isPlaying, muted, enabled, unlocked, onToggleMute, onToggleEnabled, onUnlock }) {
  const [expanded, setExpanded] = useState(false);

  if (!enabled) {
    return (
      <button onClick={onToggleEnabled} style={{
        position: 'fixed', bottom: 30, right: 8, zIndex: 9998,
        background: 'rgba(0,0,0,0.85)', border: '1px solid #1a1a1a',
        color: '#252525', padding: '4px 8px', fontSize: 8, cursor: 'pointer',
        fontFamily: 'monospace', letterSpacing: 1
      }}>♪ MUSIC OFF — CLICK TO ENABLE</button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 8, zIndex: 9998,
      background: 'rgba(5,5,12,0.97)',
      border: `1px solid ${isPlaying ? '#ff444422' : '#111'}`,
      minWidth: expanded ? 210 : 160,
      transition: 'all 0.3s',
      boxShadow: isPlaying ? '0 0 15px rgba(255,80,80,0.08)' : 'none',
      fontFamily: 'monospace'
    }}>

      {/* Main bar */}
      <div onClick={() => setExpanded(!expanded)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', cursor: 'pointer' }}>

        {/* Visualizer */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14, width: 16 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              width: 2, background: isPlaying ? '#ff6644' : '#1a1a1a', borderRadius: 1,
              height: isPlaying ? `${[8,12,6,10][i-1]}px` : '3px',
              animation: isPlaying ? `bar${i} ${[0.4,0.6,0.5,0.7][i-1]}s ease-in-out infinite alternate` : 'none'
            }}/>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          {!unlocked ? (
            <div style={{ color: '#ff8844', fontSize: 8 }}>♪ CLICK TO UNLOCK AUDIO</div>
          ) : currentTrack ? (
            <>
              <div style={{ color: '#ff8844', fontSize: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isPlaying ? '♪ ' : '○ '}{currentTrack.track?.split(' - ')[0] || 'AMBIENT'}
              </div>
              <div style={{ color: '#252525', fontSize: 7 }}>{currentTrack.mood}</div>
            </>
          ) : (
            <div style={{ color: '#252525', fontSize: 8 }}>HOVER MAP → MUSIC</div>
          )}
        </div>

        <span style={{ color: '#1a1a1a', fontSize: 8 }}>{expanded ? '▼' : '▲'}</span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ borderTop: '1px solid #0d0d0d', padding: 8 }}>
          {!unlocked && (
            <button onClick={onUnlock} style={{
              width: '100%', background: '#ff884422', border: '1px solid #ff884444',
              color: '#ff8844', padding: '5px', fontSize: 8, cursor: 'pointer',
              letterSpacing: 1, marginBottom: 6
            }}>
              ▶ UNLOCK AUDIO (required once)
            </button>
          )}

          {currentTrack && (
            <>
              <div style={{ color: '#ff8844', fontSize: 8, marginBottom: 2 }}>{currentTrack.track}</div>
              <div style={{ color: '#333', fontSize: 7, marginBottom: 6, fontStyle: 'italic' }}>"{currentTrack.mood}"</div>
              <a href={currentTrack.ytSearch} target="_blank" rel="noopener noreferrer"
                style={{ color: '#00d4ff', fontSize: 8, display: 'block', marginBottom: 6 }}>
                → Open in YouTube ↗
              </a>
            </>
          )}

          {!currentTrack && unlocked && (
            <div style={{ color: '#1a1a1a', fontSize: 8, marginBottom: 6, lineHeight: 1.5 }}>
              Hover over any conflict zone on the map to trigger music
            </div>
          )}

          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={onToggleMute} style={{
              flex: 1, background: 'transparent',
              border: `1px solid ${muted ? '#ff4444' : '#1a1a1a'}`,
              color: muted ? '#ff4444' : '#333',
              padding: '3px', fontSize: 8, cursor: 'pointer'
            }}>{muted ? '🔇 MUTED' : '🔊 SOUND'}</button>
            <button onClick={onToggleEnabled} style={{
              flex: 1, background: 'transparent', border: '1px solid #1a1a1a',
              color: '#252525', padding: '3px', fontSize: 8, cursor: 'pointer'
            }}>✕ OFF</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bar1 { to { height: 13px } }
        @keyframes bar2 { to { height: 7px } }
        @keyframes bar3 { to { height: 11px } }
        @keyframes bar4 { to { height: 5px } }
      `}</style>
    </div>
  );
}
