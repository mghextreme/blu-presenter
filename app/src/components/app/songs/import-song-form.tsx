import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getChordsData } from "@/lib/songs";
import { ISongPart } from "@/types";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import MusicalNoteIcon from "@heroicons/react/24/solid/MusicalNoteIcon";
import ChevronUpDownIcon from "@heroicons/react/24/solid/ChevronUpDownIcon";
import MinusIcon from "@heroicons/react/24/solid/MinusIcon";
import PlusIcon from "@heroicons/react/24/solid/PlusIcon";

export type SongEditMode = 'lyrics' | 'chords';

interface IImportSongPart extends ISongPart {
  enabled: boolean
  isDivision: boolean
  type: SongEditMode
}

interface ImportSongFormProps {
  fullText: string,
}

export const ImportSongForm = forwardRef((
  {
    fullText,
  }: ImportSongFormProps,
  ref,
) => {

  const { t } = useTranslation("songs");

  const [parts, setParts] = useState<IImportSongPart[]>([]);
  useEffect(() => {
    const lines = fullText.split(/\n/);
    const partsValue: IImportSongPart[] = [];

    for (const line of lines) {
      const prop = getChordsData(line);

      const isDivision = line.trim() === '';
      partsValue.push({
        enabled: !isDivision,
        isDivision: isDivision,
        type: prop.proportion < 0.75 ? 'lyrics' : 'chords',
        text: line,
        chords: line,
      });
    }

    setParts(partsValue);
  }, [fullText]);

  const setPartType = (index: number, to: SongEditMode) => {
    setParts((prevParts) => {
      const newParts = [...prevParts];
      newParts[index].type = to;
      return newParts;
    });
  };

  const setPartDivision = (index: number, to: boolean) => {
    setParts((prevParts) => {
      const newParts = [...prevParts];
      newParts[index].isDivision = to;
      return newParts;
    });
  };

  const setPartEnabled = (index: number, to: boolean) => {
    setParts((prevParts) => {
      const newParts = [...prevParts];
      newParts[index].enabled = to;
      return newParts;
    });
  };

  const getSongParts = () => {
    const blocks: ISongPart[] = [];

    let currentText = '';
    let currentChords = '';

    for (const part of parts) {
      if (part.isDivision) {
        if (currentText.length > 0 || currentChords?.length > 0) {
          const finalText = currentText.trimEnd();
          const finalChords = currentChords.trimEnd();
          blocks.push({
            text: finalText.length > 0 ? finalText : undefined,
            chords: finalChords.length > 0 ? finalChords : undefined,
            id: blocks.length,
          });
          currentText = '';
          currentChords = '';
        }
      }

      if (!part.enabled) {
        continue;
      }

      if (part.type === 'lyrics') {
        currentText += part.text + '\n';
      } else {
        currentChords += part.chords + '\n';
      }
    }

    if (currentText.length > 0 || currentChords?.length > 0) {
      const finalText = currentText.trimEnd();
      const finalChords = currentChords.trimEnd();
      blocks.push({
        text: finalText.length > 0 ? finalText : undefined,
        chords: finalChords.length > 0 ? finalChords : undefined,
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
              'font-source-code-pro whitespace-pre',
              part.type === 'chords' && 'font-bold',
            )}>
              {part.text}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

});
