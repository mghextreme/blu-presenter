import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ISongReference } from "@/types";
import { SpotifyCode } from "@/components/app/songs/spotify-code";
import { getSpotifyTrackId, getYouTubeVideoId, getReferenceType } from "@/lib/songs";
import ArrowTopRightOnSquareIcon from "@heroicons/react/24/solid/ArrowTopRightOnSquareIcon";
import PlayIcon from "@heroicons/react/24/solid/PlayIcon";
import StopIcon from "@heroicons/react/24/solid/StopIcon";
import { useTranslation } from "react-i18next";

// Spotify iFrame API types
interface SpotifyIFrameAPI {
  createController(
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: SpotifyEmbedController) => void,
  ): void;
}

interface SpotifyEmbedController {
  play(): void;
  pause(): void;
  resume(): void;
  togglePlay(): void;
  destroy(): void;
  addListener(event: string, callback: (e?: unknown) => void): void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
    SpotifyIframeApi?: SpotifyIFrameAPI;
  }
}

/**
 * Loads the Spotify iFrame API script and resolves with the API object.
 * Subsequent calls return the same promise (singleton).
 */
let spotifyApiPromise: Promise<SpotifyIFrameAPI> | null = null;

function loadSpotifyIFrameApi(): Promise<SpotifyIFrameAPI> {
  if (spotifyApiPromise) return spotifyApiPromise;

  spotifyApiPromise = new Promise<SpotifyIFrameAPI>((resolve) => {
    // If the API is already loaded (e.g. from a previous mount)
    if (window.SpotifyIframeApi) {
      resolve(window.SpotifyIframeApi);
      return;
    }

    // The API calls this global function when ready
    window.onSpotifyIframeApiReady = (api) => {
      window.SpotifyIframeApi = api;
      resolve(api);
    };

    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    document.head.appendChild(script);
  });

  return spotifyApiPromise;
}

function SpotifyEmbed({ trackId }: { trackId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let destroyed = false;

    loadSpotifyIFrameApi().then((api) => {
      if (destroyed || !containerRef.current) return;

      api.createController(
        containerRef.current,
        {
          uri: `spotify:track:${trackId}`,
          width: "100%",
          height: 80,
        },
        (controller) => {
          if (destroyed) {
            controller.destroy();
            return;
          }
          controllerRef.current = controller;
          controller.addListener("ready", () => {
            if (!destroyed) {
              controller.play();
            }
          });
        },
      );
    });

    return () => {
      destroyed = true;
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
      }
    };
  }, [trackId]);

  return <div ref={containerRef} className="rounded-lg overflow-hidden" />;
}

function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
      width="100%"
      height={200}
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className="rounded-lg"
    />
  );
}

interface ReferencePlayerProps {
  references: ISongReference[];
}

export function ReferencePlayer({ references }: ReferencePlayerProps) {
  const { t } = useTranslation("songs");
  const [activePlayerUrl, setActivePlayerUrl] = useState<string | null>(null);

  const togglePlayer = useCallback((url: string) => {
    setActivePlayerUrl(prev => prev === url ? null : url);
  }, []);

  const activeReferenceType = activePlayerUrl ? getReferenceType(activePlayerUrl) : null;
  const activeSpotifyTrackId = activePlayerUrl ? getSpotifyTrackId(activePlayerUrl) : null;
  const activeYouTubeVideoId = activePlayerUrl ? getYouTubeVideoId(activePlayerUrl) : null;

  return (
    <div className="max-w-lg space-y-2 mt-3">
      <h3 className="font-medium text-sm">{t('input.references')}</h3>
      {references.map((reference, ix) => {
        const refType = getReferenceType(reference.url);
        const isPlayable = refType !== 'other';
        const isActive = activePlayerUrl === reference.url;

        return (
          <div className="flex items-center gap-x-2" key={`references-${ix}`}>
            <Button variant="secondary" size="icon" type="button" onClick={() => window.open(reference.url, '_blank')}>
              <ArrowTopRightOnSquareIcon className="size-4" />
            </Button>
            {isPlayable && (
              <Button
                variant={isActive ? "default" : "secondary"}
                size="icon"
                type="button"
                title={isActive ? t('references.stopPlaying') : t('references.play')}
                onClick={() => togglePlayer(reference.url)}
              >
                {isActive ? <StopIcon className="size-4" /> : <PlayIcon className="size-4" />}
              </Button>
            )}
            <div className="flex-1 text-sm text-muted-foreground truncate">
              {reference.name || reference.url}
            </div>
            {reference.url.includes('spotify.com') && (
              <SpotifyCode songUrl={reference.url} imgWidth={320} className="max-w-28" colorScheme="theme" />
            )}
          </div>
        );
      })}
      {activeReferenceType === 'spotify' && activeSpotifyTrackId && (
        <div className="mt-3">
          <SpotifyEmbed key={activeSpotifyTrackId} trackId={activeSpotifyTrackId} />
        </div>
      )}
      {activeReferenceType === 'youtube' && activeYouTubeVideoId && (
        <div className="mt-3 rounded-lg overflow-hidden">
          <YouTubeEmbed key={activeYouTubeVideoId} videoId={activeYouTubeVideoId} />
        </div>
      )}
    </div>
  );
}
