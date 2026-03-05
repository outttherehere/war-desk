// useMusicPlayer.js — Ambient conflict music system
// Uses YouTube IFrame API for audio (free, no licensing issues)
// Fades in on hover, fades out on cursor leave

import { useState, useRef, useCallback, useEffect } from 'react';
import { getMusicForEvent, getMusicForArticle, CONFLICT_MUSIC } from '../music/conflictMusic';

// Curated YouTube video IDs for each track (instrumental/OST, safe for use)
// These are official uploads or licensed OST channels
const YOUTUBE_IDS = {
  'Hans Zimmer Arrival Heptapod B': 'VB8gFNMmDLE',
  'Ludwig Goransson Oppenheimer Can You Hear The Music': 'HWtCUuOPUME',
  'Lone Survivor OST Surrender Explosions in the Sky': '7dK9GF5VIw8',
  'Hans Zimmer Dunkirk Supermarine': 'RTLM8T_EGFk',
  'Hans Zimmer Dunkirk The Mole': 'RTLM8T_EGFk',
  'Society of the Snow OST La Sociedad de la Nieve Michael Giacchino': 'xLB7DEiuBSY',
  'Ludwig Goransson Oppenheimer Destroyer of Worlds': 'HWtCUuOPUME',
  'Great Escape Elmer Bernstein Prague Philharmonic': 'b1gfJ3fVjFk',
  'Ludwig Goransson Killmonger Black Panther OST': 'kU9miZpPBQM',
  'Max Richter On The Nature Of Daylight': 'b_YHOcBsb9g',
};

export function useMusicPlayer() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [enabled, setEnabled] = useState(true); // user can toggle music off
  const playerRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const iframeRef = useRef(null);

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (window.YT) return;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
    
    window.onYouTubeIframeAPIReady = () => {
      // API ready
    };
  }, []);

  const fadeIn = useCallback((targetVol) => {
    if (!playerRef.current || muted || !enabled) return;
    clearInterval(fadeIntervalRef.current);
    let vol = 0;
    fadeIntervalRef.current = setInterval(() => {
      vol = Math.min(targetVol * 100, vol + 2);
      try { playerRef.current?.setVolume(vol); } catch(e) {}
      if (vol >= targetVol * 100) clearInterval(fadeIntervalRef.current);
    }, 50);
  }, [muted, enabled]);

  const fadeOut = useCallback(() => {
    if (!playerRef.current) return;
    clearInterval(fadeIntervalRef.current);
    let vol = 50;
    fadeIntervalRef.current = setInterval(() => {
      vol = Math.max(0, vol - 3);
      try { playerRef.current?.setVolume(vol); } catch(e) {}
      if (vol <= 0) {
        clearInterval(fadeIntervalRef.current);
        try { playerRef.current?.pauseVideo(); } catch(e) {}
        setIsPlaying(false);
      }
    }, 60);
  }, []);

  const playTrack = useCallback((music) => {
    if (!enabled || !music) return;
    const ytId = YOUTUBE_IDS[music.query] || YOUTUBE_IDS[Object.keys(YOUTUBE_IDS)[0]];
    
    setCurrentTrack(music);
    
    if (!playerRef.current && window.YT?.Player) {
      // Create hidden player div if not exists
      let playerDiv = document.getElementById('yt-music-player');
      if (!playerDiv) {
        playerDiv = document.createElement('div');
        playerDiv.id = 'yt-music-player';
        playerDiv.style.cssText = 'position:fixed;bottom:-1px;left:-1px;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1';
        document.body.appendChild(playerDiv);
      }
      
      playerRef.current = new window.YT.Player('yt-music-player', {
        height: '1', width: '1',
        videoId: ytId,
        playerVars: { autoplay: 1, loop: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e) => {
            e.target.setVolume(0);
            e.target.playVideo();
            setIsPlaying(true);
            fadeIn(music.volume || 0.5);
          }
        }
      });
    } else if (playerRef.current) {
      try {
        playerRef.current.loadVideoById(ytId);
        playerRef.current.setVolume(0);
        playerRef.current.playVideo();
        setIsPlaying(true);
        fadeIn(music.volume || 0.5);
      } catch(e) {}
    }
  }, [enabled, fadeIn]);

  // Called when hovering over a conflict zone
  const onConflictHover = useCallback((event) => {
    if (!enabled) return;
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      const music = getMusicForEvent(event);
      playTrack(music);
    }, 600); // 600ms delay before music starts
  }, [enabled, playTrack]);

  // Called when hovering over a news article
  const onArticleHover = useCallback((article) => {
    if (!enabled) return;
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      const music = getMusicForArticle(article);
      playTrack(music);
    }, 800);
  }, [enabled, playTrack]);

  // Called on mouse leave
  const onHoverEnd = useCallback(() => {
    clearTimeout(hoverTimeoutRef.current);
    setTimeout(() => fadeOut(), 300);
  }, [fadeOut]);

  const toggleMute = () => {
    setMuted(!muted);
    if (!muted) {
      try { playerRef.current?.setVolume(0); } catch(e) {}
    } else {
      try { playerRef.current?.setVolume(50); } catch(e) {}
    }
  };

  const toggleEnabled = () => {
    setEnabled(!enabled);
    if (enabled) {
      fadeOut();
      setCurrentTrack(null);
    }
  };

  return {
    currentTrack,
    isPlaying,
    volume,
    muted,
    enabled,
    onConflictHover,
    onArticleHover,
    onHoverEnd,
    toggleMute,
    toggleEnabled,
    playTrack
  };
}
