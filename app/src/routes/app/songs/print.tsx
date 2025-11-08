import { useEffect, useMemo, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import { INumberedSongPart, ISongPart, ISongWithRole, isRoleHigherOrEqualThan } from "@/types";
import { usePrintConfig } from "@/hooks/usePrintConfig";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import PrinterIcon from "@heroicons/react/24/solid/PrinterIcon";
import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import MinusIcon from "@heroicons/react/24/solid/MinusIcon";
import BoldIcon from "@heroicons/react/24/solid/BoldIcon";
import NumberedListIcon from "@heroicons/react/24/solid/NumberedListIcon";
import ArrowsPointingInIcon from "@heroicons/react/24/solid/ArrowsPointingInIcon";
import { SpotifyCode } from "@/components/app/songs/spotify-code";
import { SpotifyIcon } from "@/components/logos/spotify";
import { alternateLyricsAndChords } from "@/lib/songs";

const isBlockEqual = (a: ISongPart, b: ISongPart) => {
  return a.text === b.text && a.chords === b.chords;
};

export default function PrintSong() {

  const { t } = useTranslation("songs");

  const data = useLoaderData() as ISongWithRole;
  const params = useParams();

  const {
    fontSize,
    increateFontSize,
    decreateFontSize,
    resetFontSize,
    showChords,
    toggleChords,
    showNumbers,
    toggleNumbers,
    compactMode,
    toggleCompactMode,
    showSpotifyCode,
    toggleSpotifyCode,
  } = usePrintConfig();

  if (!data) {
    throw new Error("Can't find song");
  }

  const hasAccess = isRoleHigherOrEqualThan(data.organization?.role, 'guest');
  if (!hasAccess && !!data.secret && params.secret !== data.secret) {
    throw new Error(t('error.noPermission'));
  }

  let orgName: string | undefined = t("organizations.publicArchive");
  if (data.organization) {
    orgName = data.organization.name || t("organizations.defaultName");
  }

  const canEdit = isRoleHigherOrEqualThan(data.organization?.role, 'member');

  const [numberedBlocks, setNumberedBlocks] = useState<INumberedSongPart[]>([]);
  const [compactedBlocks, setCompactedBlocks] = useState<INumberedSongPart[]>([]);
  const [sequence, setSequence] = useState<number[]>([]);
  useEffect(() => {
    if (!data || !data.blocks) return;

    const simplifiedSequence: number[] = [];
    const simplifiedBlocks: INumberedSongPart[] = [];
    const sequencedBlocks: INumberedSongPart[] = [];

    for (let ix = 0; ix < (data.blocks.length ?? 0); ix++) {
      const sourceBlock = data.blocks[ix] ?? { text: '', chords: '' } as ISongPart;
      let added: boolean = false;
      let sequenceNumber: number | undefined = undefined;
      for (let jx = 0; jx < simplifiedBlocks.length; jx++) {
        const comparisonBlock = simplifiedBlocks[jx];

        if (isBlockEqual(sourceBlock, comparisonBlock)) {
          sequenceNumber = jx + 1;
          simplifiedSequence.push(sequenceNumber);
          added = true;
          break;
        }
      }

      if (sequenceNumber) {
        sequencedBlocks.push({
          ...sourceBlock,
          sequence: sequenceNumber,
          isFirstAppearance: false,
        });
      } else {
        sequencedBlocks.push({
          ...sourceBlock,
          sequence: simplifiedBlocks.length + 1,
          isFirstAppearance: true,
        });
      }

      if (!added) {
        simplifiedSequence.push(simplifiedBlocks.length + 1);
        simplifiedBlocks.push({
          ...sourceBlock,
          sequence: simplifiedBlocks.length + 1,
        });
      }
    }

    setSequence(simplifiedSequence);
    setNumberedBlocks(sequencedBlocks);
    setCompactedBlocks(simplifiedBlocks);
  }, [data.blocks]);

  const showBlocks = useMemo(() => {
    if (!data || !data.blocks) return [];

    if (compactMode === 'compact') {
      return compactedBlocks;
    } else {
      return numberedBlocks;
    }
  }, [numberedBlocks, compactedBlocks, compactMode])

  const [qrCodeUrl, setQrCodeUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!data) return;

    const currentUrl = new URL(window.location.href);
    const completeUrl = `${currentUrl.protocol}//${currentUrl.host}/shared/view/${data.id}/${data.secret ?? ''}`
    setQrCodeUrl(completeUrl);
  }, [window, data]);

  const [spotifyUrl, setSpotifyUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!data || !data.references) {
      setSpotifyUrl(undefined);
      return;
    }

    const spotifyReference = data.references.find((ref) => ref.url.includes('spotify.com'));
    if (spotifyReference) {
      setSpotifyUrl(spotifyReference.url);
    } else {
      setSpotifyUrl(undefined);
    }
  }, [data]);

  const pages = 1;

  return (
    <>
      <title>{t('title.print', { title: data.title, artist: data.artist }) + ' - BluPresenter'}</title>
      <div className="w-full bg-slate-200 print:hidden">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row flex-wrap items-center px-2 py-3 gap-y-2 gap-x-2">
          <span className="text-sm w-full md:w-auto">{t('input.organization')}:<br/><b>{orgName}</b></span>
          <div className="buttons flex-1 flex flex-wrap justify-start md:justify-end items-center gap-x-2 gap-y-2">
            <div className="flex-0 flex gap-x-2">
              <Button
                type="button"
                variant="print"
                size="sm"
                title={t('actions.decreaseFont')}
                onClick={decreateFontSize}>
                <MinusIcon className="size-3" />
              </Button>
              <Button
                type="button"
                variant="print"
                size="sm"
                title={t('actions.resetFont')}
                onClick={resetFontSize}>
                <BoldIcon className="size-3" />
              </Button>
              <Button
                type="button"
                variant="print"
                size="sm"
                title={t('actions.increaseFont')}
                onClick={increateFontSize}>
                <PlusIcon className="size-3" />
              </Button>
            </div>
            <div className="h-7 border-s-1 border-slate-400"></div>
            <div className="flex-0 flex gap-x-2">
              <Toggle
                variant="print"
                size="sm"
                pressed={!!showNumbers}
                title={t('actions.numbers')}
                onPressedChange={toggleNumbers}>
                <NumberedListIcon className="size-3" />
              </Toggle>
              <Toggle
                variant="print"
                size="sm"
                pressed={!!compactMode}
                title={t('actions.compact')}
                onPressedChange={toggleCompactMode}>
                <ArrowsPointingInIcon className="size-3" />
              </Toggle>
              <Toggle
                variant="print"
                size="sm"
                pressed={showChords}
                onPressedChange={toggleChords}
                title={t('input.viewChords')}>
                {t('input.viewChords')}
              </Toggle>
              {spotifyUrl && <Toggle
                variant="print"
                size="sm"
                pressed={showSpotifyCode}
                onPressedChange={toggleSpotifyCode}
                title={t('actions.viewSpotifyCode')}>
                <SpotifyIcon className="size-3" />
              </Toggle>}
            </div>
            <div className="h-7 border-s-1 border-slate-400"></div>
            <div className="flex-0 flex gap-x-2">
              <Button
                type="button"
                variant="print"
                size="sm"
                title={t(canEdit ? 'actions.edit' : 'actions.view')}
                asChild>
                {hasAccess ? (
                  canEdit ? (
                    <Link to={`/app/songs/${data.id}/edit`}>
                      <PencilIcon className="size-3" />
                    </Link>
                  ) : (
                    <Link to={`/app/songs/${data.id}/view`}>
                      <EyeIcon className="size-3" />
                    </Link>
                  )
                ) : (
                  <Link to={`/shared/view/${data.id}/${data.secret ?? ''}`}>
                    <EyeIcon className="size-3" />
                  </Link>
                )}
              </Button>
              <Button
                type="button"
                variant="print"
                size="sm"
                title={t('actions.print')}
                onClick={() => window.print()}>
                <PrinterIcon className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
<style>
        @page {'{'} size: A4; margin: 0; {'}'}
      </style>
      <div className={cn(
        'w-full px-2 print:px-8 font-source-code-pro flex flex-col justify-center items-stretch',
       )} style={{ fontSize: `${fontSize}px` }}>
        {Array.from(Array(pages)).map((_, ix) => (
          <div
            key={`page-${ix}`}
            className={cn(
              'mx-auto w-full max-w-[21cm] flex flex-col justify-start items-stretch',
            )}
            style={{'breakInside': columns > 1 ? 'avoid' : undefined}}
          >
            {ix === 0 && (
              <div className="flex flex-row justify-between items-center flex-0">
          <div>
            <h1 className="font-bold" style={{ fontSize: '1.5em' }}>{data.title}</h1>
            <h2 className="text-slate-600 mb-[.5em]" style={{ fontSize: '1.125em' }}>{data.artist}</h2>
          </div>
          {qrCodeUrl && <div className="max-h-[4em] aspect-square">
            <QRCode value={qrCodeUrl} className="max-h-full max-w-full" />
          </div>}
        </div>
            )}
            <div
              className={cn(
                'relative space-y-[.75em] leading-[1.6em]',
                compactMode && showNumbers && 'pr-[3.5em]',
              )}
              style={{ fontSize: '0.875em' }}
            >
          {compactMode && showNumbers && <div className="absolute top-0 right-0 flex flex-col justify-start items-end">
            <b>{t('print.sequence')}</b>
            {sequence.map((item, ix) => (
              <span className="border-t-1 border-slate-300 text-center min-w-[1em] my-[.2em] py-[.2em]" key={`sequence-${ix}`}>{item}</span>
            ))}
          </div>}
          {showBlocks.map((block, ix) => (
                <div
                  key={`chords-${ix}`}
                  className={cn(
                    'flex flex-row justify-stretch items-stretch'
                  )}
                >
              {showNumbers && (
                    <div className="pt-[.5em] pb-[.2em] min-w-[1.2em] flex-0 text-center leading-[1.1em]">
                      <p className="text-slate-600">{block.sequence}</p>
                      {compactMode !== 'compact' && <p className="text-slate-400 text-[.8em]">{ix + 1}</p>}
                </div>
              )}
              <div className={cn(
                    'max-w-full flex-1 border-s-1 border-slate-300 ps-[.75em] py-[.2em] min-h-[.75em] text-slate-800 whitespace-pre-wrap',
                showNumbers && 'ms-[.75em]',
                  )} style={{'breakInside': 'avoid'}}>
                    {alternateLyricsAndChords(
                      block.text,
                      showChords ? block.chords : undefined,
                      {
                        chordsClassName: 'font-bold',
                        firstLineCompactMode: compactMode === 'firstLine' && !block.isFirstAppearance,
                      },
                    )}
              </div>
            </div>
          ))}
          {showSpotifyCode && !!spotifyUrl && (
            <div className="absolute bottom-0 right-0 max-w-[10em]">
              <SpotifyCode songUrl={spotifyUrl} />
            </div>
          )}
        </div>
          </div>
        ))}
      </div>
    </>
  );
}
