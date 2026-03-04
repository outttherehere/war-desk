// src/useGDELT.js
// Custom React hook — polls /api/gdelt every 15 minutes
// Returns live conflict events for the map + Sindoor signal

import { useState, useEffect, useCallback, useRef } from "react";

const POLL_INTERVAL = 15 * 60 * 1000; // 15 minutes — GDELT updates this often
const API_URL = "/api/gdelt";

// Fallback static events shown while GDELT loads OR if it fails
// These are always present as a baseline
export const STATIC_BASELINE = [
  { id:"s1",  lat:34.1,  lng:78.2,  severity:"critical", type:"⚔️", title:"LAC — Depsang Plains",      detail:"PLA patrol activity. Indian Army on alert.",        country:"India/China",     india:"DIRECT",    updated:"Static baseline", isStatic:true },
  { id:"s2",  lat:33.5,  lng:74.3,  severity:"critical", type:"⚔️", title:"LoC — Post Sindoor",        detail:"Elevated posture. Ceasefire fragile.",              country:"India/Pakistan",  india:"DIRECT",    updated:"Static baseline", isStatic:true },
  { id:"s3",  lat:26.5,  lng:55.0,  severity:"critical", type:"🔥", title:"Iran — USA Standoff",       detail:"IRGC activity in Arabian Sea.",                     country:"Iran/USA",        india:"CRITICAL",  updated:"Static baseline", isStatic:true },
  { id:"s4",  lat:31.5,  lng:34.8,  severity:"critical", type:"💥", title:"Israel–Gaza–Lebanon",       detail:"Active conflict. Regional escalation risk.",        country:"Israel/Palestine",india:"Oil routes", updated:"Static baseline", isStatic:true },
  { id:"s5",  lat:24.5,  lng:93.9,  severity:"high",     type:"⚔️", title:"Myanmar — Manipur Border",  detail:"Arakan Army near Indian territory.",               country:"India/Myanmar",   india:"DIRECT",    updated:"Static baseline", isStatic:true },
  { id:"s6",  lat:16.8,  lng:43.2,  severity:"high",     type:"⚓", title:"Yemen — Houthi Strikes",    detail:"Anti-ship missiles. Indian vessels rerouted.",     country:"Yemen",           india:"Shipping",  updated:"Static baseline", isStatic:true },
  { id:"s7",  lat:26.0,  lng:56.3,  severity:"critical", type:"🛢️", title:"Strait of Hormuz",         detail:"Iran threatens closure. 40% of India's crude.",    country:"Iran/Gulf",       india:"CRITICAL",  updated:"Static baseline", isStatic:true },
  { id:"s8",  lat:49.0,  lng:32.0,  severity:"high",     type:"💥", title:"Russia–Ukraine War",        detail:"Active frontline. 800K+ casualties.",              country:"Ukraine",         india:"Indirect",  updated:"Static baseline", isStatic:true },
  { id:"s9",  lat:8.0,   lng:77.5,  severity:"high",     type:"⚓", title:"Indian Ocean Watch",        detail:"Chinese vessels near Andaman.",                    country:"Indian Ocean",    india:"DIRECT",    updated:"Static baseline", isStatic:true },
  { id:"s10", lat:23.5,  lng:119.0, severity:"high",     type:"🛡️", title:"Taiwan Strait",            detail:"PLA exercises. US carrier deployed.",              country:"China/Taiwan",    india:"Supply",    updated:"Static baseline", isStatic:true },
];

// Convert a GDELT article into a map event object
function gdeltToEvent(article) {
  const severityEmoji = {
    critical: "🔴",
    high:     "🟠",
    medium:   "🟡",
    low:      "🟢",
  };

  return {
    id:      article.id,
    lat:     article.lat,
    lng:     article.lng,
    severity: article.severity,
    type:    severityEmoji[article.severity] || "📰",
    title:   article.title.length > 60 ? article.title.slice(0, 60) + "…" : article.title,
    detail:  `${article.source} — ${article.title}`,
    country: article.country,
    india:   article.india_relevant ? "Relevant" : "Global",
    updated: formatGDELTDate(article.seendate),
    url:     article.url,
    isLive:  true,   // ← this marker makes live events show differently on map
    tone:    article.tone,
  };
}

function formatGDELTDate(seendate) {
  if (!seendate || seendate.length < 8) return "Recent";
  try {
    const d = new Date(`${seendate.slice(0,4)}-${seendate.slice(4,6)}-${seendate.slice(6,8)}`);
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 60)   return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  } catch {
    return "Recent";
  }
}

export function useGDELT() {
  const [events,         setEvents]        = useState(STATIC_BASELINE);
  const [gdeltEvents,    setGdeltEvents]   = useState([]);
  const [sindoorSignal,  setSindoorSignal] = useState(null);
  const [loading,        setLoading]       = useState(true);
  const [error,          setError]         = useState(null);
  const [lastFetch,      setLastFetch]     = useState(null);
  const [fetchCount,     setFetchCount]    = useState(0);
  const intervalRef = useRef(null);

  const fetchGDELT = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch India-focused events
      const [indiaRes, globalRes] = await Promise.allSettled([
        fetch(`${API_URL}?query=india+conflict+terror+military+border+attack&days=2`),
        fetch(`${API_URL}?query=iran+israel+ukraine+china+war+conflict+military&days=1`),
      ]);

      let indiaData  = { ok: false, india_events: [], global_events: [], sindoor_signal: null };
      let globalData = { ok: false, india_events: [], global_events: [], sindoor_signal: null };

      if (indiaRes.status === "fulfilled" && indiaRes.value.ok) {
        indiaData = await indiaRes.value.json();
      }
      if (globalRes.status === "fulfilled" && globalRes.value.ok) {
        globalData = await globalRes.value.json();
      }

      // Combine all GDELT articles into map events
      const liveArticles = [
        ...(indiaData.india_events  || []),
        ...(indiaData.global_events || []),
        ...(globalData.india_events  || []),
        ...(globalData.global_events || []),
      ];

      // Deduplicate by URL
      const seen = new Set();
      const uniqueArticles = liveArticles.filter(a => {
        if (seen.has(a.url)) return false;
        seen.add(a.url);
        return true;
      });

      const liveEvents = uniqueArticles.map(gdeltToEvent);
      setGdeltEvents(liveEvents);

      // Merge: static baseline + live GDELT events
      // Static events always shown (permanent hotspots)
      // Live events layered on top
      setEvents([...STATIC_BASELINE, ...liveEvents]);

      // Sindoor signal from India-focused query
      if (indiaData.sindoor_signal) {
        setSindoorSignal(indiaData.sindoor_signal);
      }

      setLastFetch(new Date());
      setFetchCount(c => c + 1);
      setLoading(false);

    } catch (err) {
      console.error("GDELT hook error:", err);
      setError(err.message);
      // Keep showing static events on failure
      setEvents(STATIC_BASELINE);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchGDELT();

    // Poll every 15 minutes
    intervalRef.current = setInterval(fetchGDELT, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchGDELT]);

  const timeUntilNext = () => {
    if (!lastFetch) return "Fetching...";
    const elapsed = Date.now() - lastFetch.getTime();
    const remaining = POLL_INTERVAL - elapsed;
    if (remaining <= 0) return "Refreshing...";
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return {
    events,           // All events (static + live GDELT)
    gdeltEvents,      // Only the live GDELT events
    staticEvents: STATIC_BASELINE,
    sindoorSignal,    // Signal object for Sindoor panel
    loading,
    error,
    lastFetch,
    fetchCount,
    refetch: fetchGDELT,
    timeUntilNext,
    liveCount: gdeltEvents.length,
  };
}
