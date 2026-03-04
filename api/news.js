// api/news.js — CommonJS, defence-focused feeds
const FEEDS = [
  { url:"https://www.thehindu.com/news/national/feeder/default.rss",         source:"The Hindu",   credibility:91, bias:"Centre-Left" },
  { url:"https://feeds.feedburner.com/ndtvnews-india-news",                  source:"NDTV",        credibility:82, bias:"Centre" },
  { url:"https://www.theprint.in/feed/",                                     source:"The Print",   credibility:84, bias:"Centre" },
  { url:"https://www.wionews.com/rss/india.xml",                             source:"WION",        credibility:75, bias:"Centre-Right" },
  { url:"https://timesofindia.indiatimes.com/rssfeeds/1221656.cms",          source:"TOI Defence", credibility:78, bias:"Centre-Right" },
  { url:"https://www.business-standard.com/rss/defence-32.rss",              source:"BS Defence",  credibility:86, bias:"Centre" },
  { url:"https://www.financialexpress.com/about/defence/feed/",              source:"FE Defence",  credibility:80, bias:"Centre" },
  { url:"https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",           source:"PIB Official",credibility:95, bias:"Government" },
];

function classifyCategory(title) {
  const t = title||"";
  if (/terror|attack|blast|bomb|militant|ied|LeT|JeM|fidayeen/i.test(t))    return "TERROR";
  if (/army|military|navy|iaf|drdo|missile|rafale|brahmos|soldier|defence/i.test(t)) return "MILITARY";
  if (/china|lac|depsang|galwan|pla|tibet|arunachal/i.test(t))              return "CHINA";
  if (/pakistan|loc|pok|kashmir|isi|ceasefire|sindoor/i.test(t))            return "PAKISTAN";
  if (/iran|israel|gaza|ukraine|russia|houthi|hormuz/i.test(t))             return "GLOBAL";
  if (/economy|gdp|rupee|oil|inflation|rbi|forex/i.test(t))                 return "ECONOMY";
  if (/diplomacy|foreign|minister|ambassador|summit|bilateral/i.test(t))    return "DIPLOMATIC";
  return "SECURITY";
}

function timeAgo(dateStr) {
  const d=new Date(dateStr); if(isNaN(d.getTime()))return"Recent";
  const mins=Math.floor((Date.now()-d.getTime())/60000);
  if(mins<60)return`${mins}m ago`; if(mins<1440)return`${Math.floor(mins/60)}h ago`;
  return`${Math.floor(mins/1440)}d ago`;
}

async function fetchFeed({url,source,credibility,bias}) {
  try {
    const r=await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=8`,
      {signal:AbortSignal.timeout(6000)});
    if(!r.ok)return[];
    const data=await r.json(); if(!data?.items)return[];
    return data.items.map((item,i)=>({
      id:`${source}_${i}_${Date.now()}`, headline:item.title||"", url:item.link||"#",
      source, credibility, bias, category:classifyCategory(item.title),
      time:timeAgo(item.pubDate), pubDate:item.pubDate||"",
      description:(item.description||"").replace(/<[^>]+>/g,"").slice(0,200),
    }));
  } catch { return []; }
}

module.exports = async function handler(req,res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Cache-Control","s-maxage=600, stale-while-revalidate");
  try {
    const results  = await Promise.allSettled(FEEDS.map(fetchFeed));
    const allItems = results.flatMap(r=>r.status==="fulfilled"?r.value:[]);
    const seen=new Set();
    const deduped=allItems
      .sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate))
      .filter(item=>{ const k=item.headline.slice(0,40).toLowerCase(); if(seen.has(k))return false; seen.add(k); return true; })
      .slice(0,50);
    return res.status(200).json({ok:true,fetched_at:new Date().toISOString(),count:deduped.length,items:deduped});
  } catch(err) {
    return res.status(200).json({ok:false,error:err.message,items:[]});
  }
};
