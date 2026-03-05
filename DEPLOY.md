# V9 DEPLOYMENT INSTRUCTIONS

## What changed in V9
- NO MORE BACKEND API. All data fetches directly from browser using CORS-enabled free APIs.
- No serverless functions needed. No Vercel function detection issues. Simple SPA.

## Files to copy into your war-desk folder:
```
src/App.jsx           ← REPLACE
src/useLiveData.js    ← NEW (replaces useGDELT.js + useNews.js)
src/LiveMap.jsx       ← REPLACE
src/LiveNewsFeed.jsx  ← REPLACE
src/LivePricesBar.jsx ← NEW
vercel.json           ← REPLACE (simple SPA routing only)
vite.config.js        ← REPLACE
```

## Add your NewsAPI key to Vercel (IMPORTANT)
1. Go to vercel.com → war-desk → Settings → Environment Variables
2. Add: Name = VITE_NEWSAPI_KEY  Value = f7ea6d43610e49feb0baac76397afca9
   (Note: must start with VITE_ for Vite to expose it to browser)
3. Save

## Deploy
```
git add .
git commit -m "v9 browser-direct live data no backend"
git push
```

## What is now LIVE:
- GDELT events → plotted on map every 15 min (direct browser fetch)
- News articles → NDTV, The Hindu, BS Defence, WION + NewsAPI (every 5 min)
- INR/USD rate → exchangerate-api.com (every 10 min)  
- Brent crude + Gold → Yahoo Finance API (every 10 min)
- Breaking ticker → top articles from live news feed
- WhatsApp share on every event, article, Sindoor probability

## Free API limits:
- GDELT: unlimited, no key
- rss2json: 10,000 requests/month free
- exchangerate-api: 1,500 requests/month free
- Yahoo Finance: no official limit (public endpoint)
- NewsAPI: 100 requests/day free (upgrade $449/year if needed)

## For ₹500/month upgrade path:
- NewsAPI Developer plan: unlimited requests, 1 month free trial
- OR: mediastack.com (similar, cheaper at $9.99/month)
