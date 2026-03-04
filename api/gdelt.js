// api/gdelt.js — CommonJS
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate");
  const query = req.query.query || "india border conflict terror military";
  const days  = parseInt(req.query.days) || 2;
  try {
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=50&format=json&timespan=${days*24}h&sort=datedesc`;
    const r   = await fetch(url, { headers:{"User-Agent":"IndiaWarDesk/1.0"}, signal:AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`GDELT ${r.status}`);
    const data     = await r.json();
    const articles = data?.articles || [];
    const events   = articles.filter(a=>a.geolat&&a.geolong).map((a,i)=>{
      const tone = parseFloat(a.tone)||0;
      return { id:`gdelt_${Date.now()}_${i}`, title:a.title||"Untitled", url:a.url||"#", source:a.domain||"Unknown",
        seendate:a.seendate||"", tone, lat:parseFloat(a.geolat), lng:parseFloat(a.geolong),
        country:a.sourcecountry||"Unknown",
        severity: tone<-5?"critical":tone<-2?"high":tone<0?"medium":"low",
        india_relevant:/india|pakistan|china|lac|loc|kashmir|terror|sindoor|border|army|navy|iaf/i.test((a.title||"")+(a.url||"")) };
    });
    const indiaEvents  = events.filter(e=>e.india_relevant);
    const globalEvents = events.filter(e=>!e.india_relevant).slice(0,20);
    const now=Date.now();
    const recent=indiaEvents.filter(e=>{
      const ds=e.seendate; if(!ds||ds.length<8)return false;
      return (now-new Date(`${ds.slice(0,4)}-${ds.slice(4,6)}-${ds.slice(6,8)}`).getTime())<86400000;
    });
    const criticalCount=recent.filter(e=>e.severity==="critical").length;
    const highCount=recent.filter(e=>e.severity==="high").length;
    const score=Math.min(1.0,criticalCount*0.15+highCount*0.07);
    // Compute live risk index: weighted average of recent event severities
    const sevScore = e => e.severity==="critical"?100:e.severity==="high"?70:e.severity==="medium"?40:15;
    const allRecent = events.filter(e=>{
      const ds=e.seendate; if(!ds||ds.length<8)return false;
      return (now-new Date(`${ds.slice(0,4)}-${ds.slice(4,6)}-${ds.slice(6,8)}`).getTime())<86400000;
    });
    const liveRiskIndex = allRecent.length
      ? Math.round(allRecent.reduce((a,e)=>a+sevScore(e),0)/allRecent.length)
      : null;
    return res.status(200).json({
      ok:true, fetched_at:new Date().toISOString(), total:events.length,
      india_events:indiaEvents, global_events:globalEvents,
      live_risk_index: liveRiskIndex,
      sindoor_signal:{ score, critical_24h:criticalCount, high_24h:highCount,
        description: criticalCount>3?"Multiple critical India events — probability elevated"
          :criticalCount>1?"Elevated India conflict activity":"Normal baseline activity" }
    });
  } catch(err) {
    return res.status(200).json({ ok:false, error:err.message, fetched_at:new Date().toISOString(),
      india_events:[], global_events:[], live_risk_index:null,
      sindoor_signal:{score:0,critical_24h:0,high_24h:0,description:"Feed unavailable"} });
  }
};
