"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSongs } from "@/lib/services";
import type { Song } from "@/lib/types";

type View = "library" | "now-playing";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicPlayerPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("library");

  // Player state
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "all" | "one">("off");
  const [searchQuery, setSearchQuery] = useState("");

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);
  const currentIndexRef = useRef(-1);
  const isScrubbingRef = useRef(false);

  const currentSong: Song | null = currentIndex >= 0 ? songs[currentIndex] ?? null : null;
  // Keep ref in sync so lock-screen callbacks always see the latest index
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase();
    return songs.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  }, [songs, searchQuery]);

  // Load songs from Firebase
  useEffect(() => {
    let mounted = true;
    getSongs()
      .then((data) => { if (mounted) setSongs(data); })
      .catch(console.error)
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Direct audio play — must be defined before handleNext/handlePrev so iOS click-chain is unbroken
  const playSongAtIndex = useCallback((index: number) => {
    if (songs.length === 0 || index < 0 || index >= songs.length) return;
    const song = songs[index];
    const audio = audioRef.current;
    if (!audio) return;
    currentIndexRef.current = index;
    setCurrentIndex(index);
    audio.src = song.audioUrl;
    audio.load();
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch((err) => { console.error("Playback failed:", err); setIsPlaying(false); });
    }
  }, [songs]);

  const handleNext = useCallback(() => {
    if (songs.length === 0) return;
    const prev = currentIndexRef.current;
    let next: number;
    if (shuffle) {
      next = Math.floor(Math.random() * songs.length);
      if (songs.length > 1) while (next === prev) next = Math.floor(Math.random() * songs.length);
    } else {
      next = prev + 1;
      if (next >= songs.length) {
        if (repeat === "off") return;
        next = 0;
      }
    }
    playSongAtIndex(next);
  }, [songs.length, shuffle, repeat, playSongAtIndex]);

  const handlePrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const prev = currentIndexRef.current;
    playSongAtIndex(prev <= 0 ? songs.length - 1 : prev - 1);
  }, [songs.length, playSongAtIndex]);

  // MediaSession: metadata — update on song change
  useEffect(() => {
    if (!currentSong || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        artwork: currentSong.imageUrl
          ? [{ src: currentSong.imageUrl, sizes: "512x512", type: "image/png" }]
          : [],
      });
    } catch (e) { /* unsupported */ }
  }, [currentSong]);

  // MediaSession: playbackState — crucial for iOS lock screen stability
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    } catch (e) { /* unsupported */ }
  }, [isPlaying]);

  // MediaSession: action handlers — re-bind whenever prev/next callbacks change
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const actions: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ["play", () => { audioRef.current?.play(); }],
      ["pause", () => { audioRef.current?.pause(); }],
      ["previoustrack", handlePrev],
      ["nexttrack", handleNext],
      ["seekto", (details) => {
        if (details.seekTime !== undefined && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
        }
      }],
    ];
    for (const [action, handler] of actions) {
      try { navigator.mediaSession.setActionHandler(action, handler); }
      catch (e) { /* action not supported on this platform */ }
    }
  }, [handlePrev, handleNext]);

  const handlePlaySong = useCallback(
    (index: number) => {
      const song = filteredSongs[index];
      const realIndex = songs.indexOf(song);
      if (realIndex === currentIndex) {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) { audio.play().catch(() => {}); }
        else { audio.pause(); }
        return;
      }
      playSongAtIndex(realIndex);
      setView("now-playing");
    },
    [filteredSongs, songs, currentIndex, playSongAtIndex]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    const audio = audioRef.current;
    if (audio) audio.currentTime = val;
  }, []);

  const handleEnded = useCallback(() => {
    if (repeat === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return;
    }
    handleNext();
  }, [repeat, handleNext]);

  const handleShuffleAll = useCallback(() => {
    if (songs.length === 0) return;
    setShuffle(true);
    const randomIndex = Math.floor(Math.random() * songs.length);
    playSongAtIndex(randomIndex);
    setView("now-playing");
  }, [songs.length, playSongAtIndex]);

  const cycleRepeat = useCallback(() => {
    setRepeat((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  // ──────── Library View ────────
  function renderLibrary() {
    return (
      <div className="flex flex-col min-h-screen bg-love-paper pb-44">
        {/* Header */}
        <div className="px-5 pt-6 pb-2">
          <p className="text-xs font-semibold tracking-widest text-love-dot/70 uppercase">
            Your Collection
          </p>
          <div className="flex items-center justify-between mt-1">
            <h1 className="text-4xl font-bold text-love-brown font-[family-name:var(--font-playfair)]">
              Library
            </h1>
            <button
              type="button"
              onClick={handleShuffleAll}
              disabled={songs.length === 0}
              className="flex items-center gap-2 rounded-full bg-love-pink px-5 py-2.5 text-xs font-bold tracking-wider text-white uppercase shadow-md transition hover:opacity-90 disabled:opacity-50"
            >
              <ShuffleIcon className="w-4 h-4" /> Shuffle All
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 mt-3">
          <div className="flex items-center gap-2 rounded-2xl bg-love-dot/10 px-4 py-3">
            <SearchIcon className="w-4 h-4 text-love-dot/60 shrink-0" />
            <input
              type="text"
              placeholder="Search songs, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-love-brown outline-none placeholder:text-love-dot/50"
            />
          </div>
        </div>

        {/* Song List */}
        <div className="mt-4 px-5 flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-love-dot/60">
              <div className="h-8 w-8 rounded-full border-2 border-love-pink border-t-transparent animate-spin" />
              <p className="text-sm">Loading songs...</p>
            </div>
          ) : filteredSongs.length === 0 ? (
            <div className="py-16 text-center text-love-dot/60">
              <p className="text-sm">{searchQuery ? "No songs match your search." : "No songs yet. Add music in Firebase."}</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredSongs.map((song, idx) => {
                const realIndex = songs.indexOf(song);
                const isActive = realIndex === currentIndex;
                return (
                  <li key={song.id}>
                    <button
                      type="button"
                      onClick={() => handlePlaySong(idx)}
                      className={`w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                        isActive
                          ? "bg-love-pink/20 shadow-sm"
                          : "hover:bg-love-dot/5"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-love-dot/10 shadow-sm">
                        {song.imageUrl ? (
                          <img
                            src={song.imageUrl}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <NoteIcon className="w-6 h-6 text-love-dot/40" />
                          </div>
                        )}
                        {isActive && isPlaying ? (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <EqualizerIcon className="w-5 h-5 text-white" />
                          </div>
                        ) : null}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isActive ? "text-love-pink" : "text-love-brown"}`}>
                          {song.title}
                        </p>
                        <p className="text-xs text-love-dot/70 truncate">{song.artist}</p>
                      </div>

                      {/* Duration */}
                      <span className="text-xs text-love-dot/60 tabular-nums shrink-0">
                        {formatTime(song.duration)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // ──────── Now Playing View ────────
  function renderNowPlaying() {
    if (!currentSong) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-love-paper pb-40 px-6 text-center">
          <NoteIcon className="w-16 h-16 text-love-dot/30 mb-4" />
          <p className="text-love-dot/70 text-sm">Select a song from the library to start playing.</p>
          <button
            type="button"
            onClick={() => setView("library")}
            className="mt-4 text-love-pink font-semibold text-sm"
          >
            Go to Library
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col min-h-screen bg-love-paper pb-44 px-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-6 pb-4">
          <button type="button" onClick={() => setView("library")} className="p-1">
            <ChevronDownIcon className="w-6 h-6 text-love-brown" />
          </button>
          <div className="text-center">
            <p className="text-[10px] tracking-widest text-love-dot/60 uppercase font-semibold">
              Playing from Library
            </p>
            <p className="text-xs font-bold text-love-pink">Your Collection</p>
          </div>
          <div className="w-6" />
        </div>

        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="relative w-full max-w-[320px] aspect-square">
            {/* Glow behind art */}
            <div
              className="absolute inset-4 rounded-3xl blur-2xl opacity-30"
              style={{ backgroundColor: "#CB7D7C" }}
            />
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-love-brown/10">
              {currentSong.imageUrl ? (
                <img
                  src={currentSong.imageUrl}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-love-brown/20 to-love-pink/20 flex items-center justify-center">
                  <NoteIcon className="w-20 h-20 text-love-dot/30" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Song Info */}
        <div className="text-center mt-2 mb-4">
          <h2 className="text-2xl font-bold text-love-brown font-[family-name:var(--font-playfair)] truncate">
            {currentSong.title}
          </h2>
          <p className="text-sm text-love-dot/80 mt-1">{currentSong.artist}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <input
            ref={progressRef}
            type="range"
            min={0}
            max={audioDuration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            onPointerDown={() => { isScrubbingRef.current = true; }}
            onPointerUp={() => { isScrubbingRef.current = false; }}
            className="music-range w-full h-2 appearance-none rounded-full outline-none cursor-pointer touch-none"
            style={{
              background: `linear-gradient(to right, #a23d69 ${progress}%, rgba(150,111,96,0.2) ${progress}%)`,
            }}
          />
          <div className="flex justify-between mt-1 text-xs text-love-dot/60 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(audioDuration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 mb-6">
          <button
            type="button"
            onClick={() => setShuffle((s) => !s)}
            className={`p-2 transition ${shuffle ? "text-love-pink" : "text-love-brown/50"}`}
          >
            <ShuffleIcon className="w-5 h-5" />
          </button>

          <button type="button" onClick={handlePrev} className="p-2 text-love-brown">
            <PrevIcon className="w-7 h-7" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-love-brown flex items-center justify-center shadow-lg transition hover:opacity-90"
          >
            {isPlaying ? (
              <PauseIcon className="w-7 h-7 text-white" />
            ) : (
              <PlayIcon className="w-7 h-7 text-white ml-0.5" />
            )}
          </button>

          <button type="button" onClick={handleNext} className="p-2 text-love-brown">
            <NextIcon className="w-7 h-7" />
          </button>

          <button
            type="button"
            onClick={cycleRepeat}
            className={`relative p-2 transition ${repeat !== "off" ? "text-love-pink" : "text-love-brown/50"}`}
          >
            <RepeatIcon className="w-5 h-5" />
            {repeat === "one" ? (
              <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold text-love-pink">1</span>
            ) : null}
          </button>
        </div>
      </div>
    );
  }

  // ──────── Mini Player ────────
  function renderMiniPlayer() {
    if (!currentSong || view === "now-playing") return null;
    return (
      <div className="fixed bottom-[170px] left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setView("now-playing")}
          onKeyDown={(e) => { if (e.key === "Enter") setView("now-playing"); }}
          className="w-full flex items-center gap-3 rounded-2xl bg-white/90 backdrop-blur-md px-3 py-2.5 shadow-xl border border-love-brown/10 text-left cursor-pointer"
        >
          {/* Tiny art */}
          <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-love-dot/10 shadow-sm">
            {currentSong.imageUrl ? (
              <img src={currentSong.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <NoteIcon className="w-4 h-4 text-love-dot/40" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-love-brown truncate">{currentSong.title}</p>
            <p className="text-[11px] text-love-dot/60 flex items-center gap-1">
              {isPlaying ? <span className="inline-block w-1.5 h-1.5 rounded-full bg-love-pink animate-pulse" /> : null}
              {isPlaying ? "Now Playing" : "Paused"}
            </p>
          </div>

          {/* Mini controls */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="p-1.5 text-love-brown">
              <PrevIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="p-2 text-love-brown"
            >
              {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-0.5" />}
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); handleNext(); }} className="p-1.5 text-love-brown">
              <NextIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ──────── Bottom Tabs ────────
  function renderTabs() {
    return (
      <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-40 w-[89%] max-w-md flex rounded-2xl overflow-hidden bg-white/60 backdrop-blur-md shadow-lg border border-love-brown/10">
        <button
          type="button"
          onClick={() => setView("library")}
          className={`flex-1 flex flex-col items-center py-2.5 transition ${
            view === "library" ? "text-love-pink" : "text-love-dot/60"
          }`}
        >
          <LibraryIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5 tracking-wide uppercase">Library</span>
        </button>
        <button
          type="button"
          onClick={() => setView("now-playing")}
          className={`flex-1 flex flex-col items-center py-2.5 transition ${
            view === "now-playing" ? "text-love-pink" : "text-love-dot/60"
          }`}
        >
          <PlayIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5 tracking-wide uppercase">Now Playing</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        playsInline
        onTimeUpdate={() => { if (!isScrubbingRef.current) setCurrentTime(audioRef.current?.currentTime ?? 0); }}
        onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration ?? 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
      />

      {view === "library" ? renderLibrary() : renderNowPlaying()}
      {renderMiniPlayer()}
      {renderTabs()}
    </>
  );
}

// ──────── Inline SVG Icons ────────

function ShuffleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function NoteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function EqualizerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="4" y="10" width="3" height="10" rx="1.5">
        <animate attributeName="height" values="10;6;10" dur="0.8s" repeatCount="indefinite" />
        <animate attributeName="y" values="10;14;10" dur="0.8s" repeatCount="indefinite" />
      </rect>
      <rect x="10.5" y="6" width="3" height="14" rx="1.5">
        <animate attributeName="height" values="14;8;14" dur="0.6s" repeatCount="indefinite" />
        <animate attributeName="y" values="6;10;6" dur="0.6s" repeatCount="indefinite" />
      </rect>
      <rect x="17" y="8" width="3" height="12" rx="1.5">
        <animate attributeName="height" values="12;4;12" dur="0.7s" repeatCount="indefinite" />
        <animate attributeName="y" values="8;14;8" dur="0.7s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function PrevIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <polygon points="19 20 9 12 19 4 19 20" />
      <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function NextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function RepeatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function LibraryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M12 6v7l3-2 3 2V6" />
    </svg>
  );
}
