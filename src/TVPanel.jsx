import { useState } from "react";

// ─── CHANNEL DATA ────────────────────────────────────────────
// Strategy: Use multiple embed methods in priority order.
// Method 1: Official website embed (most reliable)
// Method 2: YouTube nocookie embed with special params
// Method 3: Direct link fallback

const CHANNELS = [
  {
    name: "NDTV 24x7",
    credibility: 82,
    bias: "Centre",
    color: "#ff2d2d",
    logo: "🔴",
    desc: "India's top English news",
    // NDTV official live embed
    embedSrc: "https://www.ndtv.com/livetv/embedcode",
    // YouTube with special params that sometimes bypass restriction
    ytSrc: "https://www.youtube-nocookie.com/embed/Js54NRue8-Y?autoplay=1&mute=0&rel=0&modestbranding=1&iv_load_policy=3",
    // Direct watch link
    watchUrl: "https://www.ndtv.com/live-tv",
    ytUrl: "https://www.youtube.com/watch?v=Js54NRue8-Y",
    // Thumbnail for fallback UI
    thumb: "https://img.youtube.com/vi/Js54NRue8-Y/maxresdefault.jpg",
  },
  {
    name: "India Today",
    credibility: 80,
    bias: "Centre",
    color: "#ff6b00",
    logo: "🟠",
    desc: "Breaking news & analysis",
    embedSrc: "https://www.indiatoday.in/livetv/embed",
    ytSrc: "https://www.youtube-nocookie.com/embed/V4EBi3HDZB0?autoplay=1&mute=0&rel=0&modestbranding=1",
    watchUrl: "https://www.indiatoday.in/livetv",
    ytUrl: "https://www.youtube.com/watch?v=V4EBi3HDZB0",
    thumb: "https://img.youtube.com/vi/V4EBi3HDZB0/maxresdefault.jpg",
  },
  {
    name: "WION",
    credibility: 75,
    bias: "Centre-Right",
    color: "#00d4ff",
    logo: "🔵",
    desc: "World Is One News",
    embedSrc: "https://www.wionews.com/live-tv",
    ytSrc: "https://www.youtube-nocookie.com/embed/FPgfBB4OzRk?autoplay=1&mute=0&rel=0&modestbranding=1",
    watchUrl: "https://www.wionews.com/live-tv",
    ytUrl: "https://www.youtube.com/watch?v=FPgfBB4OzRk",
    thumb: "https://img.youtube.com/vi/FPgfBB4OzRk/maxresdefault.jpg",
  },
  {
    name: "DD News",
    credibility: 70,
    bias: "Centre",
    color: "#00ff88",
    logo: "🟢",
    desc: "Government broadcaster",
    // DD News has a public embed
    embedSrc: "https://ddnews.gov.in/live",
    ytSrc: "https://www.youtube-nocookie.com/embed/6mVHFH7MVYE?autoplay=1&mute=0&rel=0&modestbranding=1",
    watchUrl: "https://ddnews.gov.in/live",
    ytUrl: "https://www.youtube.com/watch?v=6mVHFH7MVYE",
    thumb: "https://img.youtube.com/vi/6mVHFH7MVYE/maxresdefault.jpg",
  },
  {
    name: "Republic TV",
    credibility: 45,
    bias: "Right",
    color: "#ffe033",
    logo: "🟡",
    desc: "Breaking news & debates",
    embedSrc: "https://www.republicworld.com/live",
    ytSrc: "https://www.youtube-nocookie.com/embed/S1KGSmtDnB4?autoplay=1&mute=0&rel=0&modestbranding=1",
    watchUrl: "https://www.republicworld.com/live",
    ytUrl: "https://www.youtube.com/watch?v=S1KGSmtDnB4",
    thumb: "https://img.youtube.com/vi/S1KGSmtDnB4/maxresdefault.jpg",
  },
  {
    name: "Mirror Now",
    credibility: 76,
    bias: "Centre",
    color: "#f0a500",
    logo: "🟤",
    desc: "Urban India news",
    embedSrc: "https://www.timesnownews.com/mirror-now/live-tv",
    ytSrc: "https://www.youtube-nocookie.com/embed/u-MagxjEcEE?autoplay=1&mute=0&rel=0&modestbranding=1",
    watchUrl: "https://www.timesnownews.com/mirror-now/live-tv",
    ytUrl: "https://www.youtube.com/watch?v=u-MagxjEcEE",
    thumb: "https://img.youtube.com/vi/u-MagxjEcEE/maxresdefault.jpg",
  },
];

const CSS = `
  .tv-panel { background:#050d12;border:1px solid #0f3040;border-radius:2px;overflow:hidden;position:relative; }
  .tv-panel::before { content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#00d4ff,transparent);opacity:.35; }

  .tv-header { padding:8px 12px;border-bottom:1px solid #0f3040;background:linear-gradient(90deg,#0a1e25,transparent);display:flex;align-items:center;gap:8px;font-family:'Teko',sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#7aacbe; }

  .ch-tabs { display:flex;gap:4px;padding:8px 10px;border-bottom:1px solid #0f3040;flex-wrap:wrap;background:#071419; }
  .ch-tab { padding:4px 10px;background:#020608;border:1px solid #0f3040;color:#3a6678;cursor:pointer;font-family:'Teko',sans-serif;font-size:11px;letter-spacing:1px;border-radius:1px;transition:all .15s;display:flex;align-items:center;gap:4px;white-space:nowrap; }
  .ch-tab:hover { border-color:#1a5068;color:#7aacbe; }
  .ch-tab.active { background:rgba(0,212,255,.1);border-color:#00d4ff;color:#00d4ff; }
  .ch-tab .dot { width:5px;height:5px;border-radius:50%;flex-shrink:0; }

  /* PLAYER AREA */
  .player-area { position:relative;background:#000; }
  .player-wrap { position:relative;width:100%;padding-top:56.25%; }
  .player-wrap iframe { position:absolute;top:0;left:0;width:100%;height:100%;border:none; }

  /* FALLBACK UI — shown when embed fails */
  .player-fallback { position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#071419;cursor:pointer; }
  .fallback-thumb { position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:.25; }
  .fallback-content { position:relative;z-index:2;text-align:center;padding:12px; }
  .fallback-play { width:56px;height:56px;background:rgba(255,45,45,.85);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 10px;border:2px solid rgba(255,100,100,.5);transition:all .2s; }
  .fallback-play:hover { background:rgba(255,45,45,1);transform:scale(1.05); }
  .fallback-title { font-family:'Teko',sans-serif;font-size:16px;letter-spacing:2px;color:#e8f4f8;margin-bottom:4px; }
  .fallback-sub { font-family:'Share Tech Mono',monospace;font-size:10px;color:#3a6678;margin-bottom:10px; }

  .open-btn { display:inline-flex;align-items:center;gap:6px;padding:6px 16px;background:rgba(255,45,45,.15);border:1px solid rgba(255,45,45,.5);color:#ff4444;font-family:'Teko',sans-serif;font-size:13px;letter-spacing:2px;text-decoration:none;border-radius:1px;transition:all .2s; }
  .open-btn:hover { background:rgba(255,45,45,.3);border-color:#ff4444;color:white; }
  .open-btn-sm { display:inline-flex;align-items:center;gap:4px;padding:3px 10px;background:rgba(255,45,45,.12);border:1px solid rgba(255,45,45,.35);color:#ff6666;font-family:'Teko',sans-serif;font-size:11px;letter-spacing:1px;text-decoration:none;border-radius:1px;transition:all .2s; }
  .open-btn-sm:hover { background:rgba(255,45,45,.25);color:white; }

  /* STATUS BAR */
  .tv-status { padding:6px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid #0f3040;background:#071419;flex-wrap:wrap; }
  .status-left { display:flex;align-items:center;gap:8px; }

  /* EMBED METHOD SWITCHER */
  .method-bar { display:flex;gap:3px;padding:6px 10px;border-bottom:1px solid #0f3040;background:#020608; }
  .method-btn { padding:2px 8px;background:none;border:1px solid #0f3040;color:#3a6678;cursor:pointer;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1px;border-radius:1px;transition:all .15s; }
  .method-btn:hover { border-color:#1a5068;color:#7aacbe; }
  .method-btn.active { background:rgba(0,212,255,.1);border-color:#00d4ff;color:#00d4ff; }

  @keyframes pulse-live { 0%,100%{opacity:1;box-shadow:0 0 6px #ff2d2d} 50%{opacity:.4} }
  .live-dot { display:inline-block;width:7px;height:7px;border-radius:50%;background:#ff2d2d;animation:pulse-live 1.2s infinite;flex-shrink:0; }

  .note-bar { padding:5px 10px;background:rgba(255,224,51,.05);border-top:1px solid rgba(255,224,51,.15);font-family:'Share Tech Mono',monospace;font-size:9px;color:#3a6678;text-align:center; }
`;

// Embed methods in priority order
const METHODS = [
  { id:"yt",    label:"YouTube" },
  { id:"site",  label:"Website" },
  { id:"direct",label:"Direct Link" },
];

export default function TVPanel({ compact = false }) {
  const [active,  setActive]  = useState(0);
  const [method,  setMethod]  = useState("yt");
  const [failed,  setFailed]  = useState({});

  const ch = CHANNELS[active];

  // Mark current embed as failed, auto-switch method
  function handleEmbedError() {
    setFailed(f => ({ ...f, [`${active}-${method}`]: true }));
    // auto-advance method
    if (method === "yt") setMethod("site");
    else if (method === "site") setMethod("direct");
  }

  function getSrc() {
    if (method === "yt") return ch.ytSrc;
    if (method === "site") return ch.embedSrc;
    return null;
  }

  const src = getSrc();
  const isDirect = method === "direct";
  const isFailed = failed[`${active}-${method}`];
  const showFallback = isDirect || isFailed;

  const credColor = ch.credibility>=85?"#00ff88":ch.credibility>=65?"#ffe033":"#ff6b00";

  return (
    <>
      <style>{CSS}</style>
      <div className="tv-panel">
        <div className="tv-header">
          <span style={{ color:"#00d4ff" }}>📺</span>
          LIVE NEWS TV
          <div className="live-dot" style={{ marginLeft:4 }}/>
          <span style={{ fontSize:10, color:"#ff2d2d", letterSpacing:1 }}>LIVE</span>
          <span style={{ marginLeft:"auto", fontSize:9, fontFamily:"Share Tech Mono", color:"#3a6678" }}>
            INDIA 24/7
          </span>
        </div>

        {/* Channel tabs */}
        <div className="ch-tabs">
          {CHANNELS.map((c, i) => (
            <button key={i}
              className={`ch-tab${active===i?" active":""}`}
              onClick={() => { setActive(i); setMethod("yt"); }}>
              <div className="dot" style={{ background:c.color }}/>
              {c.name}
            </button>
          ))}
        </div>

        {/* Embed method switcher */}
        <div className="method-bar">
          <span style={{ fontSize:9, fontFamily:"Share Tech Mono", color:"#3a6678", padding:"2px 4px", marginRight:4 }}>PLAYER:</span>
          {METHODS.map(m => (
            <button key={m.id}
              className={`method-btn${method===m.id?" active":""}`}
              onClick={() => setMethod(m.id)}>
              {m.label}
            </button>
          ))}
          <span style={{ marginLeft:"auto", fontSize:9, fontFamily:"Share Tech Mono", color:"#1a5068" }}>
            If blocked → try Website or Direct Link
          </span>
        </div>

        {/* Player */}
        <div className="player-area">
          <div className="player-wrap">
            {!showFallback && src ? (
              <iframe
                key={`${active}-${method}`}
                src={src}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                onError={handleEmbedError}
              />
            ) : null}

            {/* Fallback — always visible for direct method, or on error */}
            {showFallback && (
              <div className="player-fallback">
                <img src={ch.thumb} alt={ch.name} className="fallback-thumb"
                  onError={e => { e.target.style.display="none"; }}/>
                <div className="fallback-content">
                  <div className="fallback-play">▶</div>
                  <div className="fallback-title">{ch.name}</div>
                  <div className="fallback-sub">LIVE 24/7 · YouTube & Website embed restricted</div>
                  <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
                    <a href={ch.ytUrl} target="_blank" rel="noopener noreferrer" className="open-btn">
                      ▶ OPEN ON YOUTUBE
                    </a>
                    <a href={ch.watchUrl} target="_blank" rel="noopener noreferrer" className="open-btn" style={{ background:"rgba(0,212,255,.1)", borderColor:"rgba(0,212,255,.4)", color:"#00d4ff" }}>
                      🌐 OFFICIAL SITE
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="tv-status">
          <div className="status-left">
            <div className="live-dot"/>
            <span style={{ fontFamily:"Teko", fontSize:15, letterSpacing:1, color:"#e8f4f8" }}>{ch.name}</span>
            <span style={{ fontSize:10, color:"#3a6678" }}>{ch.desc}</span>
            <span style={{ fontSize:9, fontFamily:"Share Tech Mono", color:credColor, border:`1px solid ${credColor}`, padding:"1px 5px" }}>
              {ch.credibility}% {ch.credibility>=85?"HIGH":ch.credibility>=65?"MED":"LOW"}
            </span>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <a href={ch.ytUrl} target="_blank" rel="noopener noreferrer" className="open-btn-sm">▶ YouTube</a>
            <a href={ch.watchUrl} target="_blank" rel="noopener noreferrer" className="open-btn-sm">🌐 Website</a>
          </div>
        </div>

        <div className="note-bar">
          YouTube restricts live stream embedding on external sites — this is their global policy.
          Use WEBSITE player or open directly if YouTube shows "Video unavailable".
        </div>
      </div>
    </>
  );
}
