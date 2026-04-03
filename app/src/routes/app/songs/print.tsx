import { useMemo, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import { INumberedSongPart, ISongWithRole, isRoleHigherOrEqualThan, LineStyle } from "@/types";
import { usePrintConfig } from "@/hooks/usePrintConfig";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import PrinterIcon from "@heroicons/react/24/solid/PrinterIcon";
import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import MinusIcon from "@heroicons/react/24/solid/MinusIcon";
import AdjustmentsHorizontalIcon from "@heroicons/react/24/solid/AdjustmentsHorizontalIcon";
import { SpotifyCode } from "@/components/app/songs/spotify-code";
import { SpotifyIcon } from "@/components/logos/spotify";
import { renderSongPartLines, computeNumberedBlocks, findSpotifyUrl } from "@/lib/songs";
import { lineStyleToCSS } from "@/types";

// ─── LineStyleEditor ──────────────────────────────────────────────────────────

interface LineStyleEditorProps {
  label: string;
  style: LineStyle;
  onChange: (patch: Partial<LineStyle>) => void;
  showLabel: string;
  enabledId: string;
  boldId: string;
  italicId: string;
}

function LineStyleEditor({ label, style, onChange, showLabel, enabledId, boldId, italicId }: LineStyleEditorProps) {
  const { t } = useTranslation("songs");
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <Switch
            id={enabledId}
            checked={style.enabled}
            onCheckedChange={(v) => onChange({ enabled: v })}
          />
          <Label htmlFor={enabledId} className="text-sm">{showLabel}</Label>
        </div>
        {style.enabled && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">{t('print.color')}</label>
              <input
                type="color"
                value={style.color ?? '#000000'}
                onChange={(e) => onChange({ color: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={boldId}
                checked={style.bold}
                onCheckedChange={(v) => onChange({ bold: v })}
              />
              <Label htmlFor={boldId} className="text-sm">{t('print.bold')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={italicId}
                checked={style.italic}
                onCheckedChange={(v) => onChange({ italic: v })}
              />
              <Label htmlFor={italicId} className="text-sm">{t('print.italic')}</Label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PrintSong ────────────────────────────────────────────────────────────────

const SECTION_LABEL_CLASS = "text-xs font-semibold text-slate-500 uppercase tracking-wide";

export function PrintSong() {

  const { t } = useTranslation("songs");

  const data = useLoaderData() as ISongWithRole;
  const params = useParams();

  const {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    showNumbers,
    toggleNumbers,
    columns,
    compactMode,
    setCompactMode,
    showSpotifyCode,
    toggleSpotifyCode,
    chordsStyle,
    setChordsStyle,
    commentsStyle,
    setCommentsStyle,
  } = usePrintConfig();

  const [customizeOpen, setCustomizeOpen] = useState(false);

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

  // ─── Derived data ─────────────────────────────────────────────

  const { numberedBlocks, compactedBlocks, acronymSequence } = useMemo(
    () => computeNumberedBlocks(data.blocks ?? []),
    [data.blocks],
  );

  const showBlocks: INumberedSongPart[] = useMemo(
    () => compactMode === 'compact' ? compactedBlocks : numberedBlocks,
    [numberedBlocks, compactedBlocks, compactMode],
  );

  const qrCodeUrl = useMemo(() => {
    const currentUrl = new URL(window.location.href);
    return `${currentUrl.protocol}//${currentUrl.host}/shared/view/${data.id}/${data.secret ?? ''}`;
  }, [data.id, data.secret]);

  const spotifyUrl = useMemo(
    () => findSpotifyUrl(data.references),
    [data.references],
  );

  // Detect which line types exist in the song
  const hasChordLines = useMemo(
    () => data?.blocks?.some(block => block.lines.some(line => line.type === 'chords')) ?? false,
    [data?.blocks],
  );

  const hasCommentLines = useMemo(
    () => data?.blocks?.some(block => block.lines.some(line => line.type === 'comments')) ?? false,
    [data?.blocks],
  );

  // Build the includeTypes array for renderSongPartLines
  const includeTypes = useMemo(() => {
    const types: Array<'lyrics' | 'chords' | 'comments'> = ['lyrics'];
    if (chordsStyle.enabled) types.push('chords');
    if (commentsStyle.enabled) types.push('comments');
    return types;
  }, [chordsStyle.enabled, commentsStyle.enabled]);

  // Build inline styles for chords and comments
  const chordsInlineStyle = lineStyleToCSS(chordsStyle);
  const commentsInlineStyle = lineStyleToCSS(commentsStyle);

  return (
    <>
      <title>{t('title.print', { title: data.title, artist: data.artist }) + ' - BluPresenter'}</title>

      {/* Top toolbar */}
      <div className="w-full bg-slate-200 print:hidden">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row flex-wrap items-center px-2 py-3 gap-y-2 gap-x-2">
          <span className="text-sm w-full md:w-auto">{t('input.organization')}:<br/><b>{orgName}</b></span>
          <div className="buttons flex-1 flex flex-wrap justify-start md:justify-end items-center gap-x-2 gap-y-2">
            <Button
              type="button"
              variant="print"
              size="sm"
              title={t('print.customize')}
              onClick={() => setCustomizeOpen(v => !v)}
              className={cn(customizeOpen && 'bg-slate-300')}
            >
              <AdjustmentsHorizontalIcon className="size-3 me-1" />
              {t('print.customize')}
            </Button>
            <div className="h-7 border-s-1 border-slate-400"></div>
            <div className="flex-0 flex gap-x-2">
              {hasAccess ? <>
                <Button
                  type="button"
                  variant="print"
                  size="sm"
                  title={t('actions.view')}
                  asChild>
                  <Link to={`/app/songs/${data.id}/view`}>
                    <EyeIcon className="size-3" />
                  </Link>
                </Button>
                {canEdit && (
                  <Button
                    type="button"
                    variant="print"
                    size="sm"
                    title={t('actions.edit')}
                    asChild>
                    <Link to={`/app/songs/${data.id}/edit`}>
                      <PencilIcon className="size-3" />
                    </Link>
                  </Button>
                )}
              </> : (
                <Button
                  type="button"
                  variant="print"
                  size="sm"
                  title={t('actions.view')}
                  asChild>
                  <Link to={`/shared/view/${data.id}/${data.secret ?? ''}`}>
                    <EyeIcon className="size-3" />
                  </Link>
                </Button>
              )}
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

      {/* Customize panel */}
      {customizeOpen && (
        <div className="w-full bg-white border-b border-slate-200 print:hidden">
          <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col gap-5">

            {/* Font size */}
            <div className="flex flex-col gap-1.5">
              <span className={SECTION_LABEL_CLASS}>{t('print.fontSize')}</span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" className="size-7" title={t('actions.decreaseFont')} onClick={decreaseFontSize}>
                  <MinusIcon className="size-3" />
                </Button>
                <button
                  type="button"
                  className="text-sm font-mono w-10 text-center cursor-pointer hover:text-slate-500"
                  title={t('actions.resetFont')}
                  onClick={resetFontSize}
                >
                  {fontSize}px
                </button>
                <Button type="button" variant="outline" size="icon" className="size-7" title={t('actions.increaseFont')} onClick={increaseFontSize}>
                  <PlusIcon className="size-3" />
                </Button>
              </div>
            </div>

            {/* Compact mode */}
            <div className="flex flex-col gap-1.5">
              <span className={SECTION_LABEL_CLASS}>{t('print.compactMode')}</span>
              <Select
                value={compactMode ?? 'off'}
                onValueChange={(val) => setCompactMode(val === 'off' ? undefined : val as 'compact' | 'firstLine')}
              >
                <SelectTrigger className="w-48 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">{t('print.compactModeOff')}</SelectItem>
                  <SelectItem value="compact">{t('print.compactModeCompact')}</SelectItem>
                  <SelectItem value="firstLine">{t('print.compactModeFirstLine')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chords styling */}
            {hasChordLines && (
              <LineStyleEditor
                label={t('print.chords')}
                style={chordsStyle}
                onChange={setChordsStyle}
                showLabel={t('print.showChords')}
                enabledId="chords-enabled"
                boldId="chords-bold"
                italicId="chords-italic"
              />
            )}

            {/* Comments styling */}
            {hasCommentLines && (
              <LineStyleEditor
                label={t('print.comments')}
                style={commentsStyle}
                onChange={setCommentsStyle}
                showLabel={t('print.showComments')}
                enabledId="comments-enabled"
                boldId="comments-bold"
                italicId="comments-italic"
              />
            )}

            {/* Numbering */}
            <div className="flex flex-col gap-2">
              <span className={SECTION_LABEL_CLASS}>{t('print.numbering')}</span>
              <div className="flex items-center gap-2">
                <Switch
                  id="show-numbers"
                  checked={showNumbers}
                  onCheckedChange={toggleNumbers}
                />
                <Label htmlFor="show-numbers" className="text-sm">{t('print.showNumbers')}</Label>
              </div>
            </div>

            {/* Spotify code */}
            {spotifyUrl && (
              <div className="flex flex-col gap-2">
                <span className={cn(SECTION_LABEL_CLASS, "flex items-center gap-1")}>
                  <SpotifyIcon className="size-3" />
                  {t('print.spotifyCode')}
                </span>
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-spotify"
                    checked={showSpotifyCode}
                    onCheckedChange={toggleSpotifyCode}
                  />
                  <Label htmlFor="show-spotify" className="text-sm">{t('print.showSpotifyCode')}</Label>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <style>
        @page {'{'} size: A4; margin: 0; {'}'}
      </style>
      <div className={cn(
        'w-full px-2 print:px-8 font-source-code-pro flex flex-col justify-center items-stretch',
       )} style={{ fontSize: `${fontSize}px` }}>
        <div
          className={cn(
            'mx-auto w-full max-w-[21cm] flex flex-col justify-start items-stretch',
          )}
          style={{'breakInside': columns > 1 ? 'avoid' : undefined}}
        >
          <div className="flex flex-row justify-between items-center flex-0">
            <div>
              <h1 className="font-bold" style={{ fontSize: '1.5em' }}>{data.title}</h1>
              <h2 className="text-slate-600 mb-[.5em]" style={{ fontSize: '1.125em' }}>{data.artist}</h2>
            </div>
            {qrCodeUrl && <div className="w-[4em] h-[4em] flex-shrink-0">
              <QRCode value={qrCodeUrl} className="w-full h-full" />
            </div>}
          </div>
          <div
            className={cn(
              'relative space-y-[.75em] leading-[1.6em]',
              compactMode && showNumbers && 'pr-[3.5em]',
            )}
            style={{ fontSize: '0.875em' }}
          >
            {compactMode && showNumbers && <div className="absolute top-0 right-0 flex flex-col justify-start items-end">
              <b>{t('print.sequence')}</b>
              {acronymSequence.map((item, ix) => (
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
                    <p className="text-slate-600">{block.acronym ?? block.sequence}</p>
                    {compactMode !== 'compact' && <p className="text-slate-400 text-[.8em]">{ix + 1}</p>}
                  </div>
                )}
                <div className={cn(
                  'max-w-full flex-1 border-s-1 border-slate-300 ps-[.75em] py-[.2em] min-h-[.75em] text-slate-800 whitespace-pre-wrap',
                  showNumbers && 'ms-[.75em]',
                )} style={{'breakInside': 'avoid'}}>
                  {renderSongPartLines(
                    block.lines,
                    {
                      includeTypes,
                      chordsStyle: chordsInlineStyle,
                      commentsStyle: commentsInlineStyle,
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
      </div>
    </>
  );
}
