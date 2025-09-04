import { useEffect, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import { ISongPart, ISongWithRole, isRoleHigherOrEqualThan } from "@/types";
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

  const [compactedBlocks, setCompactedBlocks] = useState<ISongPart[]>([]);
  const [sequence, setSequence] = useState<number[]>([]);
  useEffect(() => {
    if (!data || !data.blocks) return;

    const simplifiedSequence: number[] = [];
    const simplifiedBlocks: ISongPart[] = [];

    for (let ix = 0; ix < (data.blocks.length ?? 0); ix++) {
      const sourceBlock = data.blocks[ix] ?? { text: '', chords: '' } as ISongPart;
      let added: boolean = false;
      for (let jx = 0; jx < simplifiedBlocks.length; jx++) {
        const comparisonBlock = simplifiedBlocks[jx];

        if (isBlockEqual(sourceBlock, comparisonBlock)) {
          simplifiedSequence.push(jx + 1);
          added = true;
          break;
        }
      }

      if (!added) {
        simplifiedSequence.push(simplifiedBlocks.length + 1);
        simplifiedBlocks.push(sourceBlock);
      }
    }

    setSequence(simplifiedSequence);
    setCompactedBlocks(simplifiedBlocks);
  }, [data.blocks]);

  const [showBlocks, setShowBlocks] = useState<ISongPart[]>([]);
  useEffect(() => {
    if (!data || !data.blocks) return;

    if (compactMode) {
      setShowBlocks(compactedBlocks);
    } else {
      setShowBlocks(data.blocks);
    }
  }, [data, compactedBlocks, compactMode]);

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

  return (
    <>
      <title>{t('title.print', { title: data.title, artist: data.artist }) + ' - BluPresenter'}</title>
      <div className="w-full bg-slate-200 print:hidden">
        <div className="max-w-2xl mx-auto flex flex-col md:flex-row flex-wrap items-center px-2 py-3 gap-y-2 gap-x-2">
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
                pressed={showNumbers}
                title={t('actions.numbers')}
                onPressedChange={toggleNumbers}>
                <NumberedListIcon className="size-3" />
              </Toggle>
              <Toggle
                variant="print"
                size="sm"
                pressed={compactMode}
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
      <div className="print:w-2xl screen:w-full screen:max-w-2xl px-2 font-mono" style={{ fontSize: `${fontSize}px` }}>
        <div className="flex flex-row justify-between items-center">
          <div>
            <h1 className="font-bold" style={{ fontSize: '1.5em' }}>{data.title}</h1>
            <h2 className="text-slate-600 mb-[.5em]" style={{ fontSize: '1.125em' }}>{data.artist}</h2>
          </div>
          {qrCodeUrl && <div className="max-h-[4em] aspect-square">
            <QRCode value={qrCodeUrl} className="max-h-full max-w-full" />
          </div>}
        </div>
        <div className="relative space-y-[.75em] leading-[1.6em]" style={{ fontSize: '0.875em' }}>
          {compactMode && showNumbers && <div className="absolute top-0 right-0 flex flex-col justify-start items-end">
            <b>{t('print.sequence')}</b>
            {sequence.map((item, ix) => (
              <span className="border-t-1 border-slate-300 text-center min-w-[1em] my-[.2em] py-[.2em]" key={`sequence-${ix}`}>{item}</span>
            ))}
          </div>}
          {showBlocks.map((block, ix) => (
            <div className="flex flex-row justify-stretch items-stretch" key={`chords-${ix}`}>
              {showNumbers && (
                <div className="py-[.2em] min-w-[1em] flex-0 text-center">
                  <p className="text-slate-600">{ix + 1}</p>
                </div>
              )}
              <div className={cn(
                'border-s-1 border-slate-300 ps-[.75em] py-[.2em] min-h-[.75em] text-slate-800 whitespace-pre',
                showNumbers && 'ms-[.75em]',
              )}>
                {alternateLyricsAndChords(block.text, showChords ? block.chords : undefined)}
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
    </>
  );
}
