"use client";

import { useCallback, useEffect, useRef } from "react";

const HEARTBEAT_SECONDS = 10;

interface VideoPlayerProps {
  /** Our DB Video.id — used for progress logging */
  videoId: string;
  /** YouTube video id (unlisted) */
  youtubeId: string;
  /** Resume point from VideoProgress.lastPositionSeconds */
  initialPositionSeconds?: number;
}

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement, opts: unknown) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
}

/**
 * Provider-agnostic wrapper (YouTube for MVP) that logs watch progress:
 * - counts real watch time (1s ticks while PLAYING)
 * - POSTs a heartbeat every 10s, on pause and on end
 * - flushes via sendBeacon when the tab closes
 * - resumes from the student's last position
 */
export function VideoPlayer({
  videoId,
  youtubeId,
  initialPositionSeconds = 0,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const watchedDeltaRef = useRef(0); // seconds watched since last heartbeat
  const lastPositionRef = useRef(initialPositionSeconds);

  const sendProgress = useCallback(
    (useBeacon = false) => {
      const payload = {
        videoId,
        positionSeconds: Math.floor(lastPositionRef.current),
        deltaSeconds: Math.min(120, Math.round(watchedDeltaRef.current)),
      };
      if (payload.deltaSeconds === 0 && !useBeacon) {
        // Still report position (e.g. after a seek), but skip no-op beats
        if (payload.positionSeconds === 0) return;
      }
      watchedDeltaRef.current = 0;

      const body = JSON.stringify(payload);
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/progress",
          new Blob([body], { type: "application/json" })
        );
      } else {
        fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    },
    [videoId]
  );

  useEffect(() => {
    let tickInterval: ReturnType<typeof setInterval> | null = null;
    let beatInterval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    function createPlayer() {
      if (cancelled || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: youtubeId,
        playerVars: {
          start: Math.floor(initialPositionSeconds),
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onStateChange: (e: { data: number }) => {
            if (e.data === window.YT!.PlayerState.PAUSED) sendProgress();
            if (e.data === window.YT!.PlayerState.ENDED) sendProgress();
          },
        },
      });

      // 1s tick: accumulate watch time + track position while playing
      tickInterval = setInterval(() => {
        const p = playerRef.current;
        if (!p || !window.YT) return;
        try {
          if (p.getPlayerState() === window.YT.PlayerState.PLAYING) {
            watchedDeltaRef.current += 1;
            lastPositionRef.current = p.getCurrentTime();
          }
        } catch {
          /* player not ready */
        }
      }, 1000);

      beatInterval = setInterval(() => sendProgress(), HEARTBEAT_SECONDS * 1000);
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
    }

    const onHide = () => {
      if (document.visibilityState === "hidden") sendProgress(true);
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onHide);
      if (tickInterval) clearInterval(tickInterval);
      if (beatInterval) clearInterval(beatInterval);
      sendProgress(true);
      try {
        playerRef.current?.destroy();
      } catch {
        /* already gone */
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, youtubeId]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border bg-black">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
