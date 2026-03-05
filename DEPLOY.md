# V10 COMPLETE DEPLOY GUIDE
# Every file listed — what to REPLACE, what to CREATE, what to KEEP

## ══ FILES TO REPLACE (overwrite existing) ══
src/App.jsx           ← REPLACE your current App.jsx
src/index.css         ← REPLACE your current index.css
vercel.json           ← REPLACE (simple SPA routing)

## ══ FILES TO CREATE (new folders + files) ══

# First create these folders:
src/hooks/
src/components/
src/music/

# Then copy these new files:
src/hooks/useLiveData.js          ← NEW (replaces useGDELT.js + useNews.js)
src/hooks/useMusicPlayer.js       ← NEW
src/components/LiveMap.jsx        ← NEW (replaces your old LiveMap.jsx)
src/components/ConflictMeters.jsx ← NEW
src/components/MusicWidget.jsx    ← NEW
src/components/GlobalNewsPanel.jsx← NEW ← KEY NEW FEATURE
src/music/conflictMusic.js        ← NEW

## ══ FILES TO DELETE (no longer needed) ══
src/useGDELT.js     ← DELETE (replaced by src/hooks/useLiveData.js)
src/useNews.js      ← DELETE (replaced by src/hooks/useLiveData.js)
src/LiveMap.jsx     ← DELETE (replaced by src/components/LiveMap.jsx)
src/OSINTPanel.jsx  ← DELETE (replaced by GlobalNewsPanel)
src/TVPanel.jsx     ← DELETE
src/HumanCostPanel.jsx ← DELETE (now inline in App.jsx)
src/SindoorMap.jsx  ← DELETE (now in LiveMap sindoorMode)
src/SindoorPanel.jsx← DELETE (now inline in App.jsx)

## ══ FILES TO KEEP UNCHANGED ══
src/main.jsx        ← KEEP (or use the new one — they're identical)
index.html          ← KEEP
package.json        ← KEEP
vite.config.js      ← KEEP
api/gdelt.js        ← KEEP (not used by V10 but harmless)
api/news.js         ← KEEP (not used by V10 but harmless)

## ══ FOLDER STRUCTURE AFTER DEPLOY ══
war-desk/
├── src/
│   ├── App.jsx                      ← REPLACED
│   ├── main.jsx                     ← KEPT
│   ├── index.css                    ← REPLACED
│   ├── hooks/
│   │   ├── useLiveData.js           ← NEW
│   │   └── useMusicPlayer.js        ← NEW
│   ├── components/
│   │   ├── LiveMap.jsx              ← NEW
│   │   ├── ConflictMeters.jsx       ← NEW
│   │   ├── MusicWidget.jsx          ← NEW
│   │   └── GlobalNewsPanel.jsx      ← NEW
│   └── music/
│       └── conflictMusic.js         ← NEW
├── api/
│   ├── gdelt.js                     ← KEPT
│   └── news.js                      ← KEPT
├── vercel.json                      ← REPLACED
├── index.html                       ← KEPT
├── package.json                     ← KEPT
└── vite.config.js                   ← KEPT

## ══ VERCEL ENVIRONMENT VARIABLES ══
Go to vercel.com → war-desk → Settings → Environment Variables
Add these (both Production + Preview + Development):

VITE_MEDIASTACK_KEY = 387b1d694cc1c4c49ab5576349a27af3
VITE_NEWSAPI_KEY    = f7ea6d43610e49feb0baac76397afca9

## ══ DEPLOY COMMANDS ══
cd war-desk
git add .
git commit -m "v10 complete - dominant map, global news panel, music system"
git push

## ══ WHAT IS NOW LIVE ══
1. MAP — 70% of screen, dominant, 25+ permanent conflict zones
2. GLOBAL NEWS PANEL — right column, world conflict news 24/7
   - 🇮🇳🇮🇳🇮🇳 INDIA DIRECT = affects India directly (red border)
   - 🇮🇳🇮🇳 INDIA HIGH = high India impact (orange border)
   - 🇮🇳 INDIA WATCH = some India relevance (yellow border)
   - GLOBAL = no direct India impact (grey, shown for completeness)
3. MUSIC — hover any conflict zone → playlist track plays
4. WW3 INDEX — computed from live GDELT + news
5. INDIA vs PAK + INDIA vs CHINA meters — live
6. MediaStack + RSS → news every 5 min
7. GDELT → map events every 15 min
8. INR/USD + Brent + Gold → every 10 min
9. WhatsApp share on everything
10. TACTICAL mode (data dense) + PULSE mode (minimal)
