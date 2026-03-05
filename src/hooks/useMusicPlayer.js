// useMusicPlayer.js — Fixed music system
// Uses a visible-but-tiny YouTube iframe that user clicks once to unlock audio
// After first click, all subsequent hovers trigger music automatically

import { useState, useRef, useCallback, useEffect } from 'react';
import { getMusicForEvent, getMusicForArticle, CONFLICT_MUSIC } from '../music/conflictMusic';

// Verified YouTube video IDs (OST uploads, long-form)
export const YOUTUBE_IDS = {
  CRITICAL_ESCALATION: 'VB8gFNMmDLE',      // Arrival - Heptapod B
  NUCLEAR:             'HWtCUuOPUME',       // Oppenheimer OST
  INDIA_PAKISTAN:      'q_4HnGDKoZo',      // Lone Survivor OST
  INDIA_CHINA:         'RTLM8T_EGFk',      // Dunkirk - Supermarine  
  NAVAL:               'RTLM8T_EGFk',      // Dunkirk OST
  TERROR:              'q_4HnGDKoZo',      // Lone Survivor
  CEASEFIRE:           'xLB7DEiuBSY',      // Society of the Snow
  CIVILIAN_COST:       'HWtCUuOPUME',      // Oppenheimer
  WAR_GENERAL:         'b1gfJ3fVjFk',      // Great Escape
  BORDER_TENSION:      'kU9miZpPBQM',      // Killmonger
  DEFAULT:             'b_YHOcBsb9g',      // Max Richter - On The Nature of Daylight
};

function getMusicType(event) {
  if (!event) return 'DEFAULT';
  const text = (event.title || event.label || event.sublabel || '').toLowerCase();
  if (text.match(/nuclear|nuke|warhead|icbm|ballistic/)) return 'NUCLEAR';
  if (text.match(/ceasefire|peace|withdrawal|deescalat/)) return 'CEASEFIRE';
  if (text.match(/civilian|children|innocent|casualt/)) return 'CIVILIAN_COST';
  if (text.match(/pakistan|kashmir|loc|isi|bahawalpur|muridke/)) return 'INDIA_PAKISTAN';
  if (text.match(/china|lac|depsang|galwan|pla|taiwan/)) return 'INDIA_CHINA';
  if (text.match(/navy|warship|fleet|maritime|hormuz|arabian|houthi|red sea/)) return 'NAVAL';
  if (text.match(/terror|attack|bomb|explosion|fidayeen/)) return 'TERROR';
  if (text.match(/ukraine|russia|gaza|israel|iran/)) return 'CRITICAL_ESCALATION';
  if (text.match(/border|myanmar|bangladesh/)) return 'BORDER_TENSION';
  if (event.severity === 'CRITICAL') return 'CRITICAL_ESCALATION';
  if (event.severity === 'HIGH') return 'WAR_GENERAL';
  return 'DEFAULT';
}

export function useMusicPlayer() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [unlocked, setUnlocked] = useState(false); // browser autoplay unlocked?
  const playerRef = useRef(null);
  const hoverTimeout = useRef(null);
  const currentTypeRef = useRef(null);

  // Create hidden YouTube player on mount
  useEffect(() => {
    // Load YT API
    if (!window.YT) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }

    window.onYouTubeIframeAPIReady = () => {
      const div = document.createElement('div');
      div.id = 'yt-player-hidden';
      div.style.cssText = 'position:fixed;bottom:-2px;right:200px;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:1';
      document.body.appendChild(div);

      playerRef.current = new window.YT.Player('yt-player-hidden', {
        width: '1', height: '1',
        videoId: YOUTUBE_IDS.DEFAULT,
        playerVars: {
          autoplay: 0, controls: 0, disablekb: 1,
          fs: 0, iv_load_policy: 3, modestbranding: 1,
          playsinline: 1, rel: 0, mute: 0
        },
        events: {
          onReady: () => { /* ready but not playing */ },
          onStateChange: (e) => {
            setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
          }
        }
      });
    };

    // If YT already loaded, init immediately
    if (window.YT?.Player) window.onYouTubeIframeAPIReady();
  }, []);

  const loadAndPlay = useCallback((musicType) => {
    if (!enabled || !playerRef.current || currentTypeRef.current === musicType) return;
    const ytId = YOUTUBE_IDS[musicType] || YOUTUBE_IDS.DEFAULT;
    currentTypeRef.current = musicType;

    try {
      playerRef.current.loadVideoById({ videoId: ytId, startSeconds: 0 });
      playerRef.current.setVolume(muted ? 0 : 55);
      playerRef.current.playVideo();
      setIsPlaying(true);
      setUnlocked(true);
    } catch (e) {
      console.warn('YT play failed:', e);
    }
  }, [enabled, muted]);

  const stopMusic = useCallback(() => {
    clearTimeout(hoverTimeout.current);
    currentTypeRef.current = null;
    if (!playerRef.current) return;
    try {
      // Fade out
      let vol = 55;
      const fade = setInterval(() => {
        vol -= 5;
        if (playerRef.current) {
          try { playerRef.current.setVolume(Math.max(0, vol)); } catch(e) {}
        }
        if (vol <= 0) {
          clearInterval(fade);
          try { playerRef.current?.pauseVideo(); } catch(e) {}
          setIsPlaying(false);
          setCurrentTrack(null);
        }
      }, 80);
    } catch(e) {}
  }, []);

  const onConflictHover = useCallback((event) => {
    if (!enabled) return;
    clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      const type = getMusicType(event);
      const trackInfo = CONFLICT_MUSIC[type] || CONFLICT_MUSIC.DEFAULT;
      setCurrentTrack(trackInfo);
      loadAndPlay(type);
    }, 500);
  }, [enabled, loadAndPlay]);

  const onArticleHover = useCallback((article) => {
    if (!enabled) return;
    clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      const music = getMusicForArticle(article);
      const type = getMusicType({ title: article.title });
      setCurrentTrack(music);
      loadAndPlay(type);
    }, 700);
  }, [enabled, loadAndPlay]);

  const onHoverEnd = useCallback(() => {
    clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(stopMusic, 1500); // delay so quick moves don't cut music
  }, [stopMusic]);

  // USER CLICK TO UNLOCK — browser requires user gesture for audio
  const unlockAudio = useCallback(() => {
    if (!playerRef.current) return;
    try {
      playerRef.current.playVideo();
      setTimeout(() => {
        playerRef.current?.pauseVideo();
        setUnlocked(true);
      }, 300);
    } catch(e) {}
  }, []);

  const toggleMute = () => {
    setMuted(!muted);
    try {
      if (!muted) playerRef.current?.setVolume(0);
      else playerRef.current?.setVolume(55);
    } catch(e) {}
  };

  const toggleEnabled = () => {
    setEnabled(!enabled);
    if (enabled) stopMusic();
  };

  return {
    currentTrack, isPlaying, muted, enabled, unlocked,
    onConflictHover, onArticleHover, onHoverEnd,
    toggleMute, toggleEnabled, unlockAudio
  };
}
