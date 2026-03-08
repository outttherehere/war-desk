import { useState, useEffect, useRef } from 'react';
import type { RssArticle, SindoorFactor, SindoorState } from '../types';

// ─── Base factors (independent of live news) ─────────────────────────────────
const BASE_FACTORS: SindoorFactor[] = [
  {
    id: 'nuclear-deterrence',
    label: 'Pakistan nuclear deterrence',
    description: `Pakistan's declared second-strike capability caps India's escalation ceiling`,
    direction: 'de-escalate',
    weight: -22,
    active: true,
    fromLiveNews: false,
  },
  {
    id: 'intl-pressure',
    label: 'International community pressure',
    description: 'US, China, Saudi Arabia all apply active back-channel de-escalation pressure',
    direction: 'de-escalate',
    weight: -12,
    active: true,
    fromLiveNews: false,
  },
  {
    id: 'economic-costs',
    label: 'India economic risk calculus',
    description: 'A full conflict would disrupt $3.5T economy and spook foreign investment',
    direction: 'de-escalate',
    weight: -10,
    active: true,
    fromLiveNews: false,
  },
  {
    id: 'pakistan-crisis',
    label: 'Pakistan internal instability',
    description: 'Unstable civil-military dynamics in Pakistan increase miscalculation risk',
    direction: 'escalate',
    weight: +14,
    active: true,
    fromLiveNews: false,
  },
  {
    id: 'new-normal-doctrine',
    label: 'India "new normal" strike doctrine',
    description: 'Post-2019 Balakot and post-Sindoor, India has established pre-emption as a norm',
    direction: 'escalate',
    weight: +16,
    active: true,
    fromLiveNews: false,
  },
  {
    id: 'china-two-front',
    label: 'China–Pakistan dual-front risk',
    description: 'India must avoid two-front war scenario; China coordination restrains India',
    direction: 'de-escalate',
    weight: -8,
    active: true,
    fromLiveNews: false,
  },
  {
    id: 'domestic-political',
    label: 'India domestic political pressure',
    description: 'Public opinion and electoral calculations can push leadership toward action',
    direction: 'escalate',
    weight: +10,
    active: true,
    fromLiveNews: false,
  },
];

// Base probability before live news adjustment
const BASE_PROBABILITY = 34;

// ─── Live news signal mappings ────────────────────────────────────────────────
interface NewsSignal {
  id: string;
  label: string;
  keywords: string[];
  direction: 'escalate' | 'de-escalate';
  weight: number;
}

const NEWS_SIGNALS: NewsSignal[] = [
  {
    id: 'sig-ceasefire-violation',
    label: 'LoC ceasefire violations in news',
    keywords: ['ceasefire', 'loc', 'line of control', 'firing', 'mortar', 'shelling'],
    direction: 'escalate',
    weight: +8,
  },
  {
    id: 'sig-terror-attack',
    label: 'Terror attack attributed to Pakistan-based groups',
    keywords: ['lashkar', 'jaish', 'pakistan-based', 'terror attack', 'suicide bomb', 'fidayeen'],
    direction: 'escalate',
    weight: +14,
  },
  {
    id: 'sig-peace-talks',
    label: 'Peace/diplomacy talks in progress',
    keywords: ['peace talks', 'back-channel', 'diplomatic', 'ceasefire agreement', 'negotiations', 'secretary-level'],
    direction: 'de-escalate',
    weight: -10,
  },
  {
    id: 'sig-military-buildup',
    label: 'Military buildup near LOC/border',
    keywords: ['military buildup', 'troop movement', 'deployed', 'mobilisation', 'battle group', 'strike corps'],
    direction: 'escalate',
    weight: +12,
  },
  {
    id: 'sig-nuclear-signal',
    label: 'Nuclear signalling by Pakistan',
    keywords: ['nuclear', 'nsa', 'second strike', 'nuclear weapon', 'atom bomb', 'warhead'],
    direction: 'de-escalate',
    weight: -16,
  },
  {
    id: 'sig-us-pressure',
    label: 'US or Saudi mediation/pressure reported',
    keywords: ['us secretary', 'white house', 'saudi', 'mediation', 'called pakistan', 'called india'],
    direction: 'de-escalate',
    weight: -9,
  },
  {
    id: 'sig-pak-instability',
    label: 'Pakistan internal instability rising',
    keywords: ['pakistan army', 'imran khan', 'political crisis pakistan', 'ttp attack', 'pakistan government'],
    direction: 'escalate',
    weight: +7,
  },
  {
    id: 'sig-cross-border-fire',
    label: 'Cross-border firing or infiltration attempt',
    keywords: ['cross-border', 'infiltration', 'encounter', 'militant killed', 'terrorist neutralised'],
    direction: 'escalate',
    weight: +9,
  },
  {
    id: 'sig-operation-sindoor',
    label: 'Operation Sindoor directly referenced',
    keywords: ['operation sindoor', 'sindoor', 'follow-up strike', 'india strike', 'surgical strike'],
    direction: 'escalate',
    weight: +18,
  },
];

function scoreArticlesForSignals(
  articles: RssArticle[],
  signals: NewsSignal[]
): Map<string, { triggered: boolean; matchedTitle: string }> {
  const result = new Map<string, { triggered: boolean; matchedTitle: string }>();

  for (const signal of signals) {
    let triggered = false;
    let matchedTitle = '';

    for (const article of articles) {
      const text = `${article.title} ${article.description}`.toLowerCase();
      if (signal.keywords.some((kw) => text.includes(kw))) {
        triggered = true;
        matchedTitle = article.title.slice(0, 70);
        break;
      }
    }

    result.set(signal.id, { triggered, matchedTitle });
  }

  return result;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function computeState(articles: RssArticle[]): SindoorState {
  const signalResults = scoreArticlesForSignals(articles, NEWS_SIGNALS);

  // Build live factors
  const liveFactors: SindoorFactor[] = NEWS_SIGNALS.map((sig): SindoorFactor => {
    const { triggered, matchedTitle } = signalResults.get(sig.id)!;
    return {
      id: sig.id,
      label: sig.label,
      description: triggered ? `Detected: "${matchedTitle}"` : 'Not detected in current feed',
      direction: sig.direction,
      weight: triggered ? sig.weight : 0,
      active: triggered,
      fromLiveNews: true,
    };
  }).filter((f) => f.active);

  // Sum up all weights
  const baseSum = BASE_FACTORS.reduce((acc, f) => acc + (f.active ? f.weight : 0), 0);
  const liveSum = liveFactors.reduce((acc, f) => acc + f.weight, 0);

  const rawProb = BASE_PROBABILITY + baseSum * 0.3 + liveSum * 0.8;
  const probability = Math.round(clamp(rawProb, 5, 95));

  const threatLevel =
    probability < 25 ? 'low' :
    probability < 50 ? 'elevated' :
    probability < 72 ? 'high' : 'critical';

  // Determine trend by comparing to base alone
  const baseOnlyProb = Math.round(clamp(BASE_PROBABILITY + baseSum * 0.3, 5, 95));
  const delta = probability - baseOnlyProb;
  const trend = Math.abs(delta) < 2 ? 'stable' : delta > 0 ? 'rising' : 'falling';

  return {
    probability,
    trend,
    trendDelta: delta,
    threatLevel,
    factors: [...BASE_FACTORS, ...liveFactors],
    lastCalculated: new Date(),
  };
}

export function useSindoorProbability(articles: RssArticle[]): SindoorState {
  const [state, setState] = useState<SindoorState>(() => computeState([]));
  const prevArticleCount = useRef(0);

  useEffect(() => {
    if (articles.length !== prevArticleCount.current) {
      prevArticleCount.current = articles.length;
      setState(computeState(articles));
    }
  }, [articles]);

  return state;
}
