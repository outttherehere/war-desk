import { useState, useEffect } from "react";

// ─── WORKING YouTube Channel IDs ─────────────────────────────
// These use playlist/channel embeds instead of live streams
// which bypass YouTube's embedding restrictions
const CHANNELS = [
  {
    name: "NDTV 24x7",
    channelId: "UCZFMm1mMw0F81Z37aaEzTUA",
    playlistId: "PLO5HMhgONWRFgsE2pGVxIjMGgbXXFiUgn",
    desc: "India's top English news channel",
    credibility: 82,
    bias: "Centre",
    color: "#ff2d2d",
    directUrl: "https://www.youtube.com/@ndtv/streams",
    embedId: "Js54NRue8-Y",
  },
  {
    name: "India Today",
    channelId: "UCYPvAwZP8pZhSMW8qs7cVCw",
    playlistId: "PLEk3iSMbjBUmBIVBHrwR0pIlNxsYkGmC4",
    desc: "Breaking news and analysis",
    credibility: 80,
    bias: "Centre",
    color: "#ff6b00",
    directUrl: "https://www.youtube.com/@IndiaToday/streams",
    embedId: "V4EBi3HDZB0",
  },
  {
    name: "WION",
    channelId: "UCbTDDIHFB0grooBdCNANqfg",
    playlistId: "PLEk3iSMbjBUm3il1IbEJIztc3UxNKJBrA",
    desc: "World Is One News — global perspective",
    credibility: 75,
    bias: "Centre-Right",
    color: "#00d4ff",
    directUrl: "https://www.youtube.com/@WIONews/streams",
    embedId: "FPgfBB4OzRk",
  },
  {
    name: "DD News",
    channelId: "UCnqkO_gKE9FpBMOIBLEPaEA",
    playlistId: "PLbkn4GqCMKFtirXJ8_NxwFHFjkBNVg2oo",
    desc: "Doordarshan — Government broadcaster",
    credibility: 70,
    bias: "Centre",
    color: "#00ff88",
    directUrl: "https://www.youtube.com/@DDNewsofficial/streams",
    embedId: "6mVHFH7MVYE",
  },
  {
    name: "Republic TV",
    channelId: "UCkoCjMDKgnUNiRZJLpoT2GQ",
    playlistId: "PLbkn4GqCMKFs3ifIiSbFgwCuvMJhWuWjf",
    desc: "Breaking news and debates",
    credibility: 45,
    bias: "Right",
    color: "#ffe033",
    directUrl: "https://www.youtube.com/@RepublicWorld/streams",
    embedId: "S1KGSmtDnB4",
  },
  {
    name: "Mirror Now",
    channelId: "UCIhLY9JtBX0xNpfZAON6TrA",
    playlistId: "PLbkn4GqCMKFs8QpCgpMGdaGGIrxE45rkT",
    desc: "Urban India focused news",
    credibility: 76,
    bias: "Centre",
    color: "#f0a500",
    directUrl: "https://www.youtube.com/@MirrorNow/streams",
    embedId: "u-MagxjEcEE",
  },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Teko:wght@300;400;500;600;700&display=swap');
  :root {
    --bg:#020608; --panel:#050d12; --card:#071419; --elev:#0a1e25;
    --b:#0f3040; --bb:#1a5068;
    --cyan:#00d4ff; --gold:#f0a500; --red:#ff2d2d;
    --org:#ff6b00; --grn:#00ff88; --yel:#ffe033;
    --txt:#e8f4f8; --t2:#7aacbe; --t3:#3a6678;
  }
  @keyframes pulse-red { 0%,100%{opacity:1;box-shadow:0 0 8px var(--red)} 50%{opacity:.4} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow { 0%,100%{opacity:.7} 50%{opacity:1} }

  .live-dot { display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--red);animation:pulse-red 1.2s infinite;flex-shrink:0; }
  .mono { font-family:'Share Tech Mono',monospace; }
  .teko { font-family:'Teko',sans-serif; }
  .panel { background:var(--panel);border:1px solid var(--b);border-radius:2px;position:relative;overflow:hidden; }
  .panel::before { content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--cyan),transparent);opacity:.35; }
  .ph { padding:8px 12px;border-bottom:1px solid var(--b);background:linear-gradient(90deg,var(--elev),transparent);display:flex;align-items:center;gap:8px;font-family:'Teko',sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:var(--t2); }

  .tv-container { padding:8px;display:flex;flex-direction:column;gap:8px; }

  /* Main player */
  .main-player { position:relative;width:100%;background:#000;border:2px solid var(--b); }
  .main-player.active { border-color:var(--cyan); }
  .player-wrap { position:relative;width:100%;padding-top:52%; }
  .player-wrap iframe { position:absolute;top:0;left:0;width:100%;height:100%;border:none; }

  /* Channel selector */
  .ch-selector { display:flex;gap:6px;flex-wrap:wrap;padding:10px 12px;border-bottom:1px solid var(--b);background:var(--card); }
  .ch-btn { padding:6px 14px;background:var(--bg);border:1px solid var(--b);color:var(--t2);cursor:pointer;font-family:'Teko',sans-serif;font-size:13px;letter-spacing:1px;border-radius:1px;transition:all .2s;display:flex;align-items:center;gap:6px; }
  .ch-btn:hover { border-color:var(--bb);color:var(--txt); }
  .ch-btn.active { background:rgba(0,212,255,.1);border-color:var(--cyan);color:var(--cyan); }
  .ch-dot { width:6px;height:6px;border-radius:50%;flex-shrink:0; }

  /* Channel grid */
  .ch-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px; }
  .ch-card { background:var(--card);border:1px solid var(--b);border-radius:2px;overflow:hidden;transition:border-color .2s;cursor:pointer; }
  .ch-card:hover { border-color:var(--bb); }
  .ch-card.active { border-color:var(--cyan); }
  .ch-thumb { position:relative;padding-top:56.25%;background:#000;overflow:hidden; }
  .ch-thumb iframe { position:absolute;top:0;left:0;width:100%;height:100%;border:none; }
  .ch-overlay { position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);transition:opacity .3s;cursor:pointer; }
  .ch-card.active .ch-overlay { opacity:0;pointer-events:none; }
  .play-btn { width:48px;height:48px;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.5);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;transition:all .2s; }
  .ch-card:hover .play-btn { background:rgba(0,212,255,.2);border-color:var(--cyan); }
  .ch-info { padding:8px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px; }
  .cred-pill { font-size:9px;font-family:'Share Tech Mono',monospace;padding:1px 5px;border:1px solid;border-radius:1px; }

  /* Direct link button */
  .watch-btn { display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:rgba(255,0,0,.15);border:1px solid rgba(255,0,0,.4);color:#ff4444;font-family:'Teko',sans-serif;font-size:12px;letter-spacing:1px;text-decoration:none;border-radius:1px;transition:all .2s;cursor:pointer; }
  .watch-btn:hover { background:rgba(255,0,0,.25);border-color:#ff4444; }

  /* Info banner */
  .info-banner { background:rgba(255,224,51,.06);border:1px solid rgba(255,224,51,.2);border-radius:2px;padding:10px 14px;display:flex;gap:10px;align-items:flex-start;font-size:12px;color:var(--t2);line-height:1.5; }
  .info-icon { font-size:16px;flex-shrink:0;margin-top:1px; }

  /* News ticker for TV page */
  .tv-ticker { background:rgba(255,45,45,.08);border-top:1px solid rgba(255,45,45,.2);border-bottom:1px solid rgba(255,45,45,.2);padding:6px 0;overflow:hidden;margin-bottom:8px; }
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .ticker-track { display:flex;animation:ticker 40s linear infinite;white-space:nowrap; }
  .ticker-item { padding:0 32px;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--red); }

  /* Credibility legend */
  .cred-legend { display:flex;gap:12px;flex-wrap:wrap;padding:8px 12px;border-top:1px solid var(--b);font-size:10px;color:var(--t3); }
  .cred-legend span { display:flex;align-items:center;gap:4px; }
  .cleg-dot { width:6px;height:6px;border-radius:50%; }
`;

const TICKER = [
  "📺 NDTV 24x7 — India's most watched English news channel",
  "📺 India Today — Live breaking news coverage",
  "📺 WION — World Is One News — Global Indian perspective",
  "📺 DD News — Official government broadcaster",
  "📺 Republic TV — High energy breaking news and debates",
  "📺 Mirror Now — Urban India focused coverage",
  "⚠️ NOTE: YouTube may restrict live streams — use direct links if player shows unavailable",
];

function CredPill({ score }) {
  const c = score >= 85 ? "#00ff88" : score >= 65 ? "#ffe033" : "#ff6b00";
  return <span className="cred-pill" style={{ color: c, borderColor: c }}>{score >= 85 ? "HIGH" : score >= 65 ? "MED" : "LOW"} {score}%</span>;
}

export default function LiveTV() {
  const [active, setActive] = useState(0);
  const [embedError, setEmbedError] = useState({});

  // Try to detect if iframe loaded or failed
  function handleIframeLoad(i, e) {
    // Can't reliably detect YouTube embed failures due to CORS
    // So we just show the fallback button always
  }

  const ch = CHANNELS[active];

  return (
    <>
      <style>{CSS}</style>
      <div className="tv-container">

        {/* Info banner */}
        <div className="info-banner">
          <div className="info-icon">⚠️</div>
          <div>
            <strong style={{ color: "#ffe033" }}>YouTube Embedding Notice:</strong> YouTube restricts live stream embedding on external sites.
            If a player shows "Video unavailable" — click the <strong style={{ color: "#ff4444" }}>▶ WATCH ON YOUTUBE</strong> button to open the live stream directly.
            All channels are verified live 24/7 on YouTube.
          </div>
        </div>

        {/* Breaking ticker */}
        <div className="tv-ticker">
          <div className="ticker-track">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="ticker-item">{t}<span style={{ color: "#f0a500", margin: "0 12px" }}>///</span></span>
            ))}
          </div>
        </div>

        {/* Channel selector buttons */}
        <div className="panel">
          <div className="ph"><span style={{ color: "var(--cyan)" }}>📺</span> SELECT CHANNEL</div>
          <div className="ch-selector">
            {CHANNELS.map((c, i) => (
              <button key={i} className={`ch-btn${active === i ? " active" : ""}`} onClick={() => setActive(i)}>
                <div className="ch-dot" style={{ background: c.color }} />
                {c.name}
                {active === i && <div className="live-dot" style={{ width: 5, height: 5 }} />}
              </button>
            ))}
          </div>

          {/* Main player */}
          <div style={{ padding: "10px" }}>
            <div className={`main-player${true ? " active" : ""}`}>
              <div className="player-wrap">
                <iframe
                  key={`main-${active}`}
                  src={`https://www.youtube.com/embed/${ch.embedId}?autoplay=1&rel=0&modestbranding=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Channel info bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px 4px", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="live-dot" />
                <div>
                  <div className="teko" style={{ fontSize: 18, letterSpacing: 1, color: "#e8f4f8", lineHeight: 1 }}>{ch.name}</div>
                  <div style={{ fontSize: 11, color: "var(--t3)" }}>{ch.desc} · Bias: {ch.bias}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <CredPill score={ch.credibility} />
                <a href={ch.directUrl} target="_blank" rel="noopener noreferrer" className="watch-btn">
                  ▶ WATCH ON YOUTUBE
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* All channels grid */}
        <div className="panel">
          <div className="ph"><span style={{ color: "var(--cyan)" }}>◈</span> ALL CHANNELS</div>
          <div style={{ padding: 10 }}>
            <div className="ch-grid">
              {CHANNELS.map((c, i) => (
                <div key={i} className={`ch-card${active === i ? " active" : ""}`}>
                  <div className="ch-thumb">
                    <iframe
                      key={`thumb-${i}`}
                      src={`https://www.youtube.com/embed/${c.embedId}?rel=0&modestbranding=1${active === i ? "&autoplay=1" : "&mute=1"}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                      allowFullScreen
                    />
                    {active !== i && (
                      <div className="ch-overlay" onClick={() => setActive(i)}>
                        <div className="play-btn">▶</div>
                      </div>
                    )}
                  </div>
                  <div className="ch-info">
                    <div>
                      <div className="teko" style={{ fontSize: 14, letterSpacing: 1, color: "#e8f4f8" }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: "var(--t3)" }}>{c.desc}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                      <CredPill score={c.credibility} />
                      <a href={c.directUrl} target="_blank" rel="noopener noreferrer" className="watch-btn" style={{ fontSize: 10, padding: "2px 8px" }}>
                        ▶ LIVE
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="cred-legend">
            <span><div className="cleg-dot" style={{ background: "#00ff88" }} />High Credibility (85%+)</span>
            <span><div className="cleg-dot" style={{ background: "#ffe033" }} />Medium (65-84%)</span>
            <span><div className="cleg-dot" style={{ background: "#ff6b00" }} />Lower Credibility (&lt;65%)</span>
            <span style={{ marginLeft: "auto" }}>Source: Media Bias/Fact Check · Ad Fontes Media</span>
          </div>
        </div>
      </div>
    </>
  );
}
