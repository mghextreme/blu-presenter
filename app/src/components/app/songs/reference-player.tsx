import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ISongReference } from "@/types";
import { SpotifyCode } from "@/components/app/songs/spotify-code";
import {
  getEmbedInfo,
  getReferenceType,
  resolveDeezerShareUrl,
} from "@/lib/songs";
import ArrowTopRightOnSquareIcon from "@heroicons/react/24/solid/ArrowTopRightOnSquareIcon";
import PlayIcon from "@heroicons/react/24/solid/PlayIcon";
import StopIcon from "@heroicons/react/24/solid/StopIcon";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className="rounded-lg border-0"
    />
  );
}

function DeezerEmbed({ trackId, shareUrl }: { trackId?: string; shareUrl?: string }) {
  const { t } = useTranslation("songs");
  const [resolvedTrackId, setResolvedTrackId] = useState<string | null>(trackId ?? null);
  const [loading, setLoading] = useState(!trackId && !!shareUrl);

  useEffect(() => {
    if (trackId || !shareUrl) return;

    const controller = new AbortController();
    setLoading(true);

    resolveDeezerShareUrl(shareUrl, controller.signal).then((id) => {
      if (controller.signal.aborted) return;
      setResolvedTrackId(id);
      setLoading(false);

      if (!id) {
        toast.error(t('references.embedFailed'));
      }
    });

    return () => { controller.abort(); };
  }, [trackId, shareUrl, t]);

  if (loading) {
    return <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (!resolvedTrackId) return null;

  return (
    <iframe
      src={`https://widget.deezer.com/widget/auto/track/${resolvedTrackId}`}
      width="100%"
      height={80}
      allow="autoplay; clipboard-write; encrypted-media"
      loading="lazy"
      className="rounded-lg border-0"
    />
  );
}

function SoundCloudEmbed({ trackUrl }: { trackUrl: string }) {
  const encodedUrl = encodeURIComponent(trackUrl);
  return (
    <iframe
      src={`https://w.soundcloud.com/player/?url=${encodedUrl}&auto_play=true&show_artwork=true&show_comments=false&visual=false`}
      width="100%"
      height={166}
      allow="autoplay"
      scrolling="no"
      loading="lazy"
      className="rounded-lg border-0"
    />
  );
}

function AppleMusicEmbed({ embedUrl }: { embedUrl: string }) {
  return (
    <iframe
      src={embedUrl}
      width="100%"
      height={175}
      allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
      sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
      loading="lazy"
      className="rounded-lg border-0"
    />
  );
}

function TidalEmbed({ trackId }: { trackId: string }) {
  return (
    <iframe
      src={`https://embed.tidal.com/tracks/${trackId}?layout=gridify`}
      width="100%"
      height={150}
      allow="autoplay; encrypted-media"
      loading="lazy"
      className="rounded-lg border-0"
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

  const embed = getEmbedInfo(activePlayerUrl);

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
      {embed?.type === 'spotify' && (
        <div className="mt-3">
          <SpotifyEmbed key={embed.trackId} trackId={embed.trackId} />
        </div>
      )}
      {embed?.type === 'youtube' && (
        <div className="mt-3 rounded-lg overflow-hidden">
          <YouTubeEmbed key={embed.videoId} videoId={embed.videoId} />
        </div>
      )}
      {embed?.type === 'deezer' && (
        <div className="mt-3 rounded-lg overflow-hidden">
          <DeezerEmbed
            key={activePlayerUrl!}
            trackId={embed.trackId}
            shareUrl={embed.shareUrl}
          />
        </div>
      )}
      {embed?.type === 'soundcloud' && (
        <div className="mt-3 rounded-lg overflow-hidden">
          <SoundCloudEmbed key={embed.trackUrl} trackUrl={embed.trackUrl} />
        </div>
      )}
      {embed?.type === 'apple-music' && (
        <div className="mt-3 rounded-lg overflow-hidden">
          <AppleMusicEmbed key={embed.embedUrl} embedUrl={embed.embedUrl} />
        </div>
      )}
      {embed?.type === 'tidal' && (
        <div className="mt-3 rounded-lg overflow-hidden">
          <TidalEmbed key={embed.trackId} trackId={embed.trackId} />
        </div>
      )}
    </div>
  );
}
