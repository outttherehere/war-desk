// conflictMusic.js — Maps conflict zones/types to music tracks
// All tracks from YouTube (free, no copyright issues for personal use)
// User's playlist: Killmonger, Lone Survivor OST, Arrival OST, Oppenheimer OST,
//                  Dunkirk OST, Society of the Snow OST, Great Escape, Essential War Film Themes

// YouTube search queries mapped to conflict types
// These are searched dynamically — no hardcoded URLs needed
export const CONFLICT_MUSIC = {
  // HIGH ESCALATION — missile strikes, active war
  CRITICAL_ESCALATION: {
    track: 'Hans Zimmer Arrival Heptapod B',
    query: 'Hans Zimmer Arrival Heptapod B',
    ytSearch: 'https://www.youtube.com/results?search_query=Hans+Zimmer+Arrival+Heptapod+B',
    mood: 'dread, inevitable',
    bpm: 'slow, building',
    volume: 0.7
  },
  // NUCLEAR THREAT / WW3 ESCALATION
  NUCLEAR: {
    track: 'Oppenheimer - Can You Hear The Music',
    query: 'Ludwig Goransson Oppenheimer Can You Hear The Music',
    ytSearch: 'https://www.youtube.com/results?search_query=Oppenheimer+Can+You+Hear+The+Music+soundtrack',
    mood: 'existential, weight',
    volume: 0.6
  },
  // INDIA-PAKISTAN CONFLICT
  INDIA_PAKISTAN: {
    track: 'Lone Survivor - Surrender (Explosions in the Sky)',
    query: 'Lone Survivor OST Surrender Explosions in the Sky',
    ytSearch: 'https://www.youtube.com/results?search_query=lone+survivor+ost+surrender+explosions+in+the+sky',
    mood: 'tense, military',
    volume: 0.65
  },
  // INDIA-CHINA CONFLICT
  INDIA_CHINA: {
    track: 'Dunkirk - Supermarine',
    query: 'Hans Zimmer Dunkirk Supermarine',
    ytSearch: 'https://www.youtube.com/results?search_query=Hans+Zimmer+Dunkirk+Supermarine',
    mood: 'urgent, mechanical',
    volume: 0.6
  },
  // NAVAL / MARITIME TENSION
  NAVAL: {
    track: 'Dunkirk - The Mole',
    query: 'Hans Zimmer Dunkirk The Mole',
    ytSearch: 'https://www.youtube.com/results?search_query=Hans+Zimmer+Dunkirk+The+Mole+soundtrack',
    mood: 'vast, foreboding',
    volume: 0.55
  },
  // TERRORIST ATTACK / TERROR EVENT
  TERROR: {
    track: 'Lone Survivor - Inception (Action)',
    query: 'Lone Survivor OST full album action',
    ytSearch: 'https://www.youtube.com/results?search_query=lone+survivor+soundtrack+full',
    mood: 'sharp, immediate',
    volume: 0.65
  },
  // CEASEFIRE / DE-ESCALATION
  CEASEFIRE: {
    track: 'Society of the Snow - La Sociedad de la Nieve',
    query: 'Society of the Snow OST La Sociedad de la Nieve Michael Giacchino',
    ytSearch: 'https://www.youtube.com/results?search_query=society+of+the+snow+ost+soundtrack',
    mood: 'somber, relief',
    volume: 0.45
  },
  // CIVILIAN CASUALTIES / HUMAN COST
  CIVILIAN_COST: {
    track: 'Oppenheimer - Destroyer of Worlds',
    query: 'Ludwig Goransson Oppenheimer Destroyer of Worlds',
    ytSearch: 'https://www.youtube.com/results?search_query=Oppenheimer+destroyer+of+worlds+soundtrack',
    mood: 'grief, weight of consequence',
    volume: 0.5
  },
  // GENERAL WAR ZONE HOVER
  WAR_GENERAL: {
    track: 'The Great Escape Main Theme - Elmer Bernstein',
    query: 'Great Escape Elmer Bernstein Prague Philharmonic',
    ytSearch: 'https://www.youtube.com/results?search_query=Great+Escape+Elmer+Bernstein+Prague+Philharmonic',
    mood: 'heroic tension',
    volume: 0.5
  },
  // BORDER TENSION (not active conflict)
  BORDER_TENSION: {
    track: 'Killmonger - Ludwig Goransson',
    query: 'Ludwig Goransson Killmonger Black Panther OST',
    ytSearch: 'https://www.youtube.com/results?search_query=Ludwig+Goransson+Killmonger+Black+Panther',
    mood: 'dangerous calm',
    volume: 0.55
  },
  // DEFAULT / MONITORING
  DEFAULT: {
    track: 'Arrival - On The Nature Of Daylight (Max Richter)',
    query: 'Max Richter On The Nature Of Daylight',
    ytSearch: 'https://www.youtube.com/results?search_query=Max+Richter+On+The+Nature+Of+Daylight',
    mood: 'contemplative, vast',
    volume: 0.35
  }
};

// Maps conflict zone IDs to music types
export const ZONE_MUSIC_MAP = {
  'gaza': 'CRITICAL_ESCALATION',
  'israel': 'CRITICAL_ESCALATION',
  'ukraine': 'CRITICAL_ESCALATION',
  'russia': 'CRITICAL_ESCALATION',
  'iran': 'NUCLEAR',
  'nuclear': 'NUCLEAR',
  'pakistan': 'INDIA_PAKISTAN',
  'kashmir': 'INDIA_PAKISTAN',
  'loc': 'INDIA_PAKISTAN',
  'china': 'INDIA_CHINA',
  'lac': 'INDIA_CHINA',
  'depsang': 'INDIA_CHINA',
  'taiwan': 'INDIA_CHINA',
  'arabian': 'NAVAL',
  'indian ocean': 'NAVAL',
  'hormuz': 'NAVAL',
  'red sea': 'NAVAL',
  'houthi': 'NAVAL',
  'terror': 'TERROR',
  'attack': 'TERROR',
  'ceasefire': 'CEASEFIRE',
  'sudan': 'CIVILIAN_COST',
  'myanmar': 'BORDER_TENSION',
  'bangladesh': 'BORDER_TENSION',
  'default': 'DEFAULT'
};

// Determine music type from event title/severity
export function getMusicForEvent(event) {
  if (!event) return CONFLICT_MUSIC.DEFAULT;
  
  const text = (event.title || event.label || '').toLowerCase();
  
  for (const [keyword, musicType] of Object.entries(ZONE_MUSIC_MAP)) {
    if (text.includes(keyword)) {
      return CONFLICT_MUSIC[musicType] || CONFLICT_MUSIC.DEFAULT;
    }
  }
  
  // Fallback by severity
  if (event.severity === 'CRITICAL') return CONFLICT_MUSIC.CRITICAL_ESCALATION;
  if (event.severity === 'HIGH') return CONFLICT_MUSIC.WAR_GENERAL;
  return CONFLICT_MUSIC.DEFAULT;
}

// Determine music from news article
export function getMusicForArticle(article) {
  if (!article) return CONFLICT_MUSIC.DEFAULT;
  const text = (article.title + ' ' + (article.desc || '')).toLowerCase();
  
  if (text.match(/nuclear|nuke|warhead|ballistic|icbm/)) return CONFLICT_MUSIC.NUCLEAR;
  if (text.match(/ceasefire|peace|agreement|withdrawal/)) return CONFLICT_MUSIC.CEASEFIRE;
  if (text.match(/civilian|children|killed|casualties|dead/)) return CONFLICT_MUSIC.CIVILIAN_COST;
  if (text.match(/pakistan|kashmir|loc|isi/)) return CONFLICT_MUSIC.INDIA_PAKISTAN;
  if (text.match(/china|lac|depsang|pla/)) return CONFLICT_MUSIC.INDIA_CHINA;
  if (text.match(/navy|warship|fleet|maritime|hormuz|arabian/)) return CONFLICT_MUSIC.NAVAL;
  if (text.match(/terror|attack|bomb|explosion|strike/)) return CONFLICT_MUSIC.TERROR;
  
  return CONFLICT_MUSIC.WAR_GENERAL;
}
