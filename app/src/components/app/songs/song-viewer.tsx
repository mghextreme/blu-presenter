import { ReactNode } from "react";
import { ISong } from "@/types";
import { Toggle } from "@/components/ui/toggle";
import { renderSongPartLines } from "@/lib/songs";
import { cn } from "@/lib/utils";
import { ReferencePlayer } from "@/components/app/songs/reference-player";
import { useTranslation } from "react-i18next";
import { useSongViewConfig } from "@/hooks/useSongViewConfig";

interface SongViewerProps {
  song: ISong;
  showReferences?: boolean;
  children?: ReactNode;
}

export function SongViewer({ song, showReferences = true, children }: SongViewerProps) {
  const { t } = useTranslation("songs");

  const { viewMode, toggleViewMode } = useSongViewConfig();

  const hasChords = song.blocks?.some(block => block.lines?.some(line => line.type === 'chords'));

  return (
    <div className="p-2 sm:p-8 max-w-3xl">
      <h1 className="text-3xl mb-2">{song.title}</h1>
      <h2 className="text-lg mb-2 opacity-50">{song.artist}</h2>
      {children}
      {showReferences && song.references && song.references.length > 0 && (
        <ReferencePlayer references={song.references} />
      )}
      {hasChords && (
        <Toggle variant="outline" pressed={viewMode === 'chords'} onPressedChange={toggleViewMode} className="mb-3 mt-3">
          {t('input.viewChords')}
        </Toggle>
      )}
      <div className={cn(
        'max-w-lg space-y-3',
        viewMode === 'chords' && 'font-source-code-pro'
      )}>
        {song.blocks?.map((block, ix) => (
          <div key={`block-${ix}`} className="border-s-1 ps-[.75em] py-[.2em] min-h-[.75em] whitespace-pre">
            {renderSongPartLines(
              block.lines,
              {
                includeTypes: hasChords && viewMode === 'chords' ? ['lyrics', 'chords'] : ['lyrics'],
                chordsClassName: 'font-bold',
              }
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
