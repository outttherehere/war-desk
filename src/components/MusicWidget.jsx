// MusicWidget.jsx — Ambient music player UI
import { useState } from 'react';

export default function MusicWidget({ currentTrack, isPlaying, muted, enabled, onToggleMute, onToggleEnabled }) {
  const [expanded, setExpanded] = useState(false);

  if (!enabled) {
    return (
      <button onClick={onToggleEnabled} style={{
        position: 'fixed', bottom: 36, right: 8, zIndex: 9998,
        background: 'rgba(0,0,0,0.8)', border: '1px solid #222',
        color: '#333', padding: '4px 8px', fontSize: 9, cursor: 'pointer',
        fontFamily: 'monospace', letterSpacing: 1
      }}>♪ MUSIC OFF</button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 36, right: 8, zIndex: 9998,
      background: 'rgba(6,6,15,0.95)', border: `1px solid ${isPlaying ? '#ff444433' : '#1a1a1a'}`,
      minWidth: expanded ? 220 : 140,
      transition: 'all 0.3s ease',
      boxShadow: isPlaying ? '0 0 20px rgba(255,50,50,0.1)' : 'none'
    }}>
      {/* Collapsed bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', cursor: 'pointer' }}
      >
        {/* Visualizer bars */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              width: 2,
              background: isPlaying ? '#ff6644' : '#222',
              borderRadius: 1,
              height: isPlaying ? `${Math.random() * 10 + 4}px` : '4px',
              animation: isPlaying ? `barAnim${i} ${0.4 + i*0.1}s ease infinite alternate` : 'none',
              transition: 'height 0.1s'
            }}/>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {currentTrack ? (
            <>
              <div style={{ color: '#ff8844', fontSize: 8, letterSpacing: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ♪ {currentTrack.track?.split(' - ')[0] || 'AMBIENT'}
              </div>
              <div style={{ color: '#444', fontSize: 7 }}>{currentTrack.mood}</div>
            </>
          ) : (
            <div style={{ color: '#333', fontSize: 8 }}>HOVER MAP FOR MUSIC</div>
          )}
        </div>

        <span style={{ color: '#333', fontSize: 8 }}>{expanded ? '▼' : '▲'}</span>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ borderTop: '1px solid #1a1a1a', padding: '8px' }}>
          {currentTrack && (
            <>
              <div style={{ color: '#ff8844', fontSize: 9, marginBottom: 4 }}>{currentTrack.track}</div>
              <div style={{ color: '#444', fontSize: 8, marginBottom: 8, fontStyle: 'italic' }}>"{currentTrack.mood}"</div>
              <a href={currentTrack.ytSearch} target="_blank" rel="noopener noreferrer"
                style={{ color: '#00d4ff', fontSize: 8, display: 'block', marginBottom: 8 }}>
                → Open in YouTube
              </a>
            </>
          )}

          <div style={{ color: '#333', fontSize: 8, marginBottom: 6 }}>
            Music auto-selects based on conflict zone
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={onToggleMute} style={{
              flex: 1, background: 'transparent', border: '1px solid #222',
              color: muted ? '#ff4444' : '#555', padding: '3px', fontSize: 9, cursor: 'pointer'
            }}>{muted ? '🔇 MUTED' : '🔊 SOUND'}</button>
            <button onClick={onToggleEnabled} style={{
              flex: 1, background: 'transparent', border: '1px solid #222',
              color: '#333', padding: '3px', fontSize: 9, cursor: 'pointer'
            }}>✕ OFF</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes barAnim1 { to { height: 12px } }
        @keyframes barAnim2 { to { height: 8px } }
        @keyframes barAnim3 { to { height: 14px } }
        @keyframes barAnim4 { to { height: 6px } }
      `}</style>
    </div>
  );
}
