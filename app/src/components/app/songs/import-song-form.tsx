import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getChordsData } from "@/lib/songs";
import { ISongPart, ISongPartLine, SongEditMode } from "@/types";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import MusicalNoteIcon from "@heroicons/react/24/solid/MusicalNoteIcon";
import ChevronUpDownIcon from "@heroicons/react/24/solid/ChevronUpDownIcon";
import MinusIcon from "@heroicons/react/24/solid/MinusIcon";
import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import ArrowsPointingOutIcon from "@heroicons/react/24/solid/ArrowsPointingOutIcon";

type ExpandableMode = 'slash-colon';

interface IImportLine {
  content: string
  enabled: boolean
  isDivision: boolean
  type: SongEditMode
  expandableMode?: ExpandableMode
}

interface ImportSongFormProps {
  fullText: string,
}

export interface ImportSongFormHandle {
  getSongParts: () => ISongPart[]
}

export const ImportSongForm = forwardRef<ImportSongFormHandle, ImportSongFormProps>((
  {
    fullText,
  }: ImportSongFormProps,
  ref,
) => {

  const { t } = useTranslation("songs");

  const [parts, setParts] = useState<IImportLine[]>([]);
  useEffect(() => {
    const lines = fullText.split(/\n/);
    const partsValue: IImportLine[] = [];

    let isDivision = false;
    let hasSlashColon = false;
    let expandableMode: ExpandableMode | undefined = undefined;

    for (const line of lines) {
      const prop = getChordsData(line);

      const isEmpty = line.trim() === '';
      const isLyrics = prop.proportion < 0.75;
      isDivision = isEmpty && !isDivision;

      if (hasSlashColon) {
        if (line.trimEnd().endsWith(':/')) {
          expandableMode = 'slash-colon';
          hasSlashColon = false;
        }
      } else if (line.trimStart().startsWith('/:')) {
        hasSlashColon = true;
      }

      partsValue.push({
        enabled: !isEmpty,
        isDivision: isDivision,
        type: isLyrics ? 'lyrics' : 'chords',
        content: line,
        expandableMode,
      });

      expandableMode = undefined;
      if (isDivision) {
        hasSlashColon = false;
      }
    }

    setParts(partsValue);
  }, [fullText]);

  const updatePart = (index: number, update: Partial<IImportLine>) => {
    setParts((prevParts) => prevParts.map((part, i) =>
      i === index ? { ...part, ...update } : part
    ));
  };

  const setPartType = (index: number, to: SongEditMode) => updatePart(index, { type: to });

  const setPartDivision = (index: number, to: boolean) => updatePart(index, { isDivision: to });

  const setPartEnabled = (index: number, to: boolean) => updatePart(index, { enabled: to });

  const expandPartSlashColon = (index: number, part: IImportLine) => {
    let repeatType = part.type;
    let beginRepetition: number | undefined = undefined;
    let beginBlock: number | undefined = undefined;

    for (let i = index; i >= 0; i--) {
      const testPart = parts[i];

      if (testPart.type !== repeatType) continue;
      if (testPart.content?.trimStart().startsWith('/:')) {
        beginRepetition = i;

        if (i > 0 && testPart.type === 'lyrics' && parts[i - 1].type === 'chords') {
          beginBlock = i - 1;
        } else {
          beginBlock = i;
        }
        break;
      }
    }

    if (beginBlock === undefined || beginRepetition === undefined) return;

    // Clone to avoid mutating state
    const originalBlocks = parts.slice(beginBlock, index + 1).map(b => ({ ...b }));

    // Remove /: at the beginning
    let firstLyricsLine = originalBlocks[beginRepetition - beginBlock].content?.trimStart().slice(2).trimStart();

    // Trim first line + chords without breaking chord alignment
    if (beginBlock !== beginRepetition) {
      const reducedAmount = (originalBlocks[beginRepetition - beginBlock].content?.length ?? 0) - (firstLyricsLine?.length ?? 0);
      const firstBlockReduceableAmount = (originalBlocks[0].content?.length ?? 0) - (originalBlocks[0].content?.trimStart().length ?? 0);

      if (firstBlockReduceableAmount >= reducedAmount) {
        const newContent = originalBlocks[0].content?.slice(reducedAmount);
        originalBlocks[0] = { ...originalBlocks[0], content: newContent ?? '' };
      } else if (firstBlockReduceableAmount > 0) {
        firstLyricsLine = ' '.repeat(reducedAmount - firstBlockReduceableAmount) + firstLyricsLine;

        const newContent = originalBlocks[0].content?.slice(firstBlockReduceableAmount);
        originalBlocks[0] = { ...originalBlocks[0], content: newContent ?? '' };
      } else {
        firstLyricsLine = ' '.repeat(reducedAmount) + firstLyricsLine;
      }
    }

    originalBlocks[beginRepetition - beginBlock] = { ...originalBlocks[beginRepetition - beginBlock], content: firstLyricsLine ?? '' };

    // Remove :/ at the end
    const lastIdx = originalBlocks.length - 1;
    const lastBlockLine = originalBlocks[lastIdx].content?.trimEnd().slice(0, -2).trimEnd();
    originalBlocks[lastIdx] = { ...originalBlocks[lastIdx], content: lastBlockLine ?? '', expandableMode: undefined };

    // Duplicate blocks
    const newBlocks = structuredClone(originalBlocks);
    newBlocks[0] = { ...newBlocks[0], isDivision: true };

    setParts((prevParts) => {
      const newParts = [
        ...prevParts.slice(0, beginBlock),
        ...originalBlocks,
        ...newBlocks,
        ...prevParts.slice(index + 1),
      ];
      return newParts;
    });
  }

  const expandPart = (index: number, part: IImportLine) => {
    if (!part?.expandableMode) return;

    switch (part.expandableMode) {
      case 'slash-colon':
        expandPartSlashColon(index, part);
        break;
    }
  };

  const getSongParts = () => {
    const blocks: ISongPart[] = [];

    let currentLines: ISongPartLine[] = [];

    for (const part of parts) {
      if (part.isDivision) {
        if (currentLines.length > 0) {
          blocks.push({
            lines: currentLines,
            id: blocks.length,
          });
          currentLines = [];
        }
      }

      if (!part.enabled) {
        continue;
      }

      currentLines.push({
        type: part.type,
        content: part.content,
      });
    }

    if (currentLines.length > 0) {
      blocks.push({
        lines: currentLines,
        id: blocks.length,
      });
    }

    return blocks;
  }

  useImperativeHandle(ref, () => {
    return {
      getSongParts,
    };
  });

  return (
    <div className="flex flex-col items-stretch">
      {parts.map((part, index) => (
        <div className="flex flex-col gap-y-2" key={`part-${index}`}>
          <div className="grid grid-cols-1 grid-rows-1 items-center text-center">
            <div className={cn(
              'col-start-1 row-start-1 w-full border-t-[1px] border-slate-200 dark:border-slate-900',
              !part.isDivision && 'border-slate-200 dark:border-slate-900',
              part.isDivision && 'border-slate-400 dark:border-slate-700',
            )}></div>
            <div className="col-start-1 row-start-1 mx-auto w-4 h-full bg-background"></div>
            <Button
              variant="invisible"
              size={part.isDivision ? "default" : "none"}
              className={cn(
                'col-start-1 row-start-1 w-full flex justify-center opacity-20 hover:opacity-100 focus:opacity-100 focus:outline-none cursor-pointer p-0',
                part.isDivision && 'opacity-100 hover:opacity-50 focus:opacity-50',
              )}
              tabIndex={0}
              onClick={() => setPartDivision(index, !part.isDivision)}
            >
              <ChevronUpDownIcon className="size-2"></ChevronUpDownIcon>
            </Button>
          </div>
          <div key={`part-${index}`} className="flex gap-x-2">
            <div className="flex items-center gap-x-2 me-3">
              <Button
                size="xs"
                variant={part.enabled ? 'destructive' : 'secondary'}
                title={part.enabled ? t('input.importLine.remove') : t('input.importLine.add')}
                onClick={() => setPartEnabled(index, !part.enabled)}>
                {part.enabled ? <MinusIcon className="size-2" /> : <PlusIcon className="size-2" />}
              </Button>
              <Toggle
                size="xs"
                pressed={part.type === 'chords'}
                title={part.type === 'chords' ? t('input.lineType.chords') : t('input.lineType.lyrics')}
                onPressedChange={() => setPartType(index, part.type === 'chords' ? 'lyrics' : 'chords')}>
                <MusicalNoteIcon className="size-2" />
              </Toggle>
            </div>
            <div className={cn(
              'flex-1 font-source-code-pro whitespace-pre',
              part.type === 'chords' && 'font-bold',
              !part.enabled && 'opacity-40',
            )}>
              {part.content}
            </div>
            {!!part.expandableMode && <div className="flex items-center gap-x-2 ms-3">
              <Button
                size="xs"
                variant="default"
                title={t('input.expand')}
                onClick={() => expandPart(index, part)}>
                <ArrowsPointingOutIcon className="size-2" />
              </Button>
            </div>}
          </div>
        </div>
      ))}
    </div>
  );

});

ImportSongForm.displayName = 'ImportSongForm';
