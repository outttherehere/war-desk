// api/gdelt.js
// Vercel serverless function — runs on Vercel's servers, not the browser
// This bypasses CORS restrictions that block direct GDELT calls from frontend
// Deploy: auto-deploys with your existing GitHub → Vercel pipeline
// Endpoint: https://war-desk.vercel.app/api/gdelt

export default async function handler(req, res) {
  // Allow requests from your own site
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Cache-Control", "s-maxage=900"); // cache 15 min on Vercel CDN

  const { query = "india border conflict terror military", days = 3 } = req.query;

  try {
    // GDELT DOC 2.0 API — free, no key needed, updates every 15 minutes
    // Returns articles geo-tagged with lat/lng, tone score, themes
    const gdeltUrl = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
    gdeltUrl.searchParams.set("query", query);
    gdeltUrl.searchParams.set("mode", "artlist");
    gdeltUrl.searchParams.set("maxrecords", "50");
    gdeltUrl.searchParams.set("format", "json");
    gdeltUrl.searchParams.set("timespan", `${days * 24}h`);
    gdeltUrl.searchParams.set("sort", "datedesc");
    // Only articles with geo data
    gdeltUrl.searchParams.set("geolimit", "yes");

    const response = await fetch(gdeltUrl.toString(), {
      headers: { "User-Agent": "IndiaWarDesk/1.0 OSINT-Monitor" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`GDELT returned ${response.status}`);

    const data = await response.json();
    const articles = data?.articles || [];

    // Parse and enrich each article
    const events = articles
      .filter(a => a.sourcecountry || a.geolat)
      .map((a, i) => ({
        id:          `gdelt_${Date.now()}_${i}`,
        title:       a.title || "Untitled",
        url:         a.url || "#",
        source:      a.domain || "Unknown",
        seendate:    a.seendate || "",
        tone:        parseFloat(a.tone) || 0,        // negative = negative sentiment
        lat:         parseFloat(a.geolat) || null,
        lng:         parseFloat(a.geolong) || null,
        country:     a.sourcecountry || "Unknown",
        language:    a.language || "English",
        // Classify severity from tone score
        // tone < -5 = critical, -5 to -2 = high, -2 to 0 = medium
        severity:    parseFloat(a.tone) < -5 ? "critical"
                   : parseFloat(a.tone) < -2 ? "high"
                   : parseFloat(a.tone) < 0  ? "medium" : "low",
        // India relevance: does it mention India-specific terms?
        india_relevant: /india|pakistan|china|lac|loc|kashmir|terror|sindoor|border|army|navy|iaf|isro|drdo/i
                          .test((a.title || "") + (a.url || "")),
      }))
      .filter(e => e.lat && e.lng); // must have coordinates

    // Separate India-relevant from global
    const indiaEvents  = events.filter(e => e.india_relevant);
    const globalEvents = events.filter(e => !e.india_relevant).slice(0, 20);

    // Sindoor probability signal — count of negative India-relevant articles
    // in last 24h. Scale: 0 (none) → 1.0 (many critical)
    const now = Date.now();
    const recent = indiaEvents.filter(e => {
      // seendate format: YYYYMMDDTHHmmssZ
      const ds = e.seendate;
      if (!ds || ds.length < 8) return false;
      const d = new Date(`${ds.slice(0,4)}-${ds.slice(4,6)}-${ds.slice(6,8)}`);
      return (now - d.getTime()) < 24 * 60 * 60 * 1000;
    });

    const criticalCount = recent.filter(e => e.severity === "critical").length;
    const highCount     = recent.filter(e => e.severity === "high").length;
    const negativeScore = Math.min(1.0, (criticalCount * 0.15 + highCount * 0.07));

    res.status(200).json({
      ok:            true,
      fetched_at:    new Date().toISOString(),
      total:         events.length,
      india_events:  indiaEvents,
      global_events: globalEvents,
      sindoor_signal: {
        score:          negativeScore,         // 0–1
        critical_24h:   criticalCount,
        high_24h:       highCount,
        description:    criticalCount > 3
                          ? "Multiple critical India-relevant events detected — probability elevated"
                          : criticalCount > 1
                            ? "Elevated India-relevant conflict activity"
                            : "Normal baseline activity",
      }
    });

  } catch (err) {
    console.error("GDELT fetch error:", err.message);
    res.status(200).json({
      ok:            false,
      error:         err.message,
      fetched_at:    new Date().toISOString(),
      india_events:  [],
      global_events: [],
      sindoor_signal: { score: 0, critical_24h: 0, high_24h: 0, description: "Feed unavailable" }
    });
  }
}
