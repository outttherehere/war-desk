# 🇮🇳 India Geopolitical War Desk

Open-source, India-focused live geopolitical conflict monitoring dashboard.

## Setup in 5 Minutes

```bash
npm install
npm run dev
```

Then open: http://localhost:5173

## Add Live News (optional)
1. Go to https://newsapi.org → sign up free → copy API key
2. Open `src/useNews.js`
3. Replace `YOUR_KEY_HERE` with your actual key
4. Save — live news will start flowing automatically

## Deploy Free on Vercel
1. Push this folder to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Click Deploy — done. Live URL in 2 minutes.

## Data Sources
- News: NewsAPI.org (free tier)
- Conflict data: ACLED API (free for research)
- Events: GDELT Project (free)
- Terrorism: SATP.org RSS
- Maps: OpenStreetMap + Leaflet.js
- Credibility: Media Bias/Fact Check

## License
MIT — open source, use freely.
