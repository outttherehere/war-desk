export type ConflictIntensity = 'critical' | 'high' | 'moderate' | 'low';
export type ConflictImpact = 'direct' | 'indirect';
export type ConflictStatus = 'active' | 'escalating' | 'de-escalating' | 'frozen' | 'monitoring';

export interface Country {
  name: string;
  code: string;     // ISO 3166-1 alpha-2 for flag emoji
  flag: string;     // emoji
}

export interface Conflict {
  id: string;
  title: string;
  region: string;
  lat: number;
  lng: number;
  intensity: ConflictIntensity;
  impact: ConflictImpact;
  status: ConflictStatus;
  countries: Country[];
  summary: string;               // 2-3 sentence overview
  highlights: string[];          // bullet points (5-7 items)
  indiaRisk: string;             // concise India-specific risk assessment
  riskScore: number;             // 0–100 used for gauge/label
  keywordsForSindoor: string[];  // words that feed Sindoor probability if found in news
  lastUpdated: string;           // ISO timestamp seed; overridden by live data if available
  imageCredit?: string;
  type: 'cross-border' | 'domestic' | 'maritime' | 'proxy' | 'strategic-competition';
}

export interface RssArticle {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail?: string;
  author?: string;
  source: string;
  sourceLabel: string;
  category: NewsCategory;
}

export type NewsCategory = 'military' | 'diplomatic' | 'intelligence' | 'economic' | 'security' | 'humanitarian';

export interface SindoorFactor {
  id: string;
  label: string;
  description: string;
  direction: 'escalate' | 'de-escalate';
  weight: number;  // –100 to +100
  active: boolean;
  fromLiveNews: boolean;
}

export interface SindoorState {
  probability: number;           // 0–100
  trend: 'rising' | 'falling' | 'stable';
  trendDelta: number;            // change from last refresh
  threatLevel: 'low' | 'elevated' | 'high' | 'critical';
  factors: SindoorFactor[];
  lastCalculated: Date;
}
