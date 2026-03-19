import { Button } from "@/components/ui/button";
import { Sortable, SortableContent, SortableItem, SortableItemHandle } from "@/components/ui/sortable";
import { Textarea } from "@/components/ui/textarea";
import { SongSchema } from "@/types/schemas/song.schema";
import { ISongPartLine } from "@/types";
import ArrowsUpDownIcon from "@heroicons/react/20/solid/ArrowsUpDownIcon";
import Square2StackIcon from "@heroicons/react/24/solid/Square2StackIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { useEffect, useState } from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

export type SongEditMode = 'lyrics' | 'chords';

interface EditSongPartsProps {
  form: UseFormReturn<z.infer<typeof SongSchema>>,
  mode: SongEditMode
}

function getLyricsText(lines: ISongPartLine[]): string {
  return lines
    .filter(line => line.type === 'lyrics')
    .map(line => line.content)
    .join('\n');
}

function getChordsText(lines: ISongPartLine[]): string {
  return lines
    .filter(line => line.type === 'chords')
    .map(line => line.content)
    .join('\n');
}

function updateLinesFromLyrics(existingLines: ISongPartLine[], newLyricsText: string): ISongPartLine[] {
  const existingChordLines = existingLines.filter(line => line.type === 'chords');
  const existingCommentLines = existingLines.filter(line => line.type === 'comments');
  const newLyricsLines: ISongPartLine[] = newLyricsText.split('\n').map(content => ({
    type: 'lyrics' as const,
    content,
  }));

  // Rebuild: interleave chord + lyrics lines (matching original pattern), then comments
  const result: ISongPartLine[] = [];
  const maxLen = Math.max(newLyricsLines.length, existingChordLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < existingChordLines.length) {
      result.push(existingChordLines[i]);
    }
    if (i < newLyricsLines.length) {
      result.push(newLyricsLines[i]);
    }
  }
  result.push(...existingCommentLines);
  return result;
}

function updateLinesFromChords(existingLines: ISongPartLine[], newChordsText: string): ISongPartLine[] {
  const existingLyricsLines = existingLines.filter(line => line.type === 'lyrics');
  const existingCommentLines = existingLines.filter(line => line.type === 'comments');
  const newChordLines: ISongPartLine[] = newChordsText.split('\n').map(content => ({
    type: 'chords' as const,
    content,
  }));

  // Rebuild: interleave chord + lyrics lines, then comments
  const result: ISongPartLine[] = [];
  const maxLen = Math.max(existingLyricsLines.length, newChordLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < newChordLines.length) {
      result.push(newChordLines[i]);
    }
    if (i < existingLyricsLines.length) {
      result.push(existingLyricsLines[i]);
    }
  }
  result.push(...existingCommentLines);
  return result;
}

export function EditSongParts({
  form,
  mode = 'lyrics',
}: EditSongPartsProps) {

  const { t } = useTranslation("songs");

  const { fields: blocks, append, remove, insert, move } = useFieldArray({
    name: "blocks",
    control: form.control,
    keyName: "key",
  });

  const [nextId, setNextId] = useState<number>(blocks?.length ?? 1000);

  const handleDrag = ({ active, over }) => {
    const activeIndex = active.data.current.sortable.index;
    const overIndex = over.data.current.sortable.index;
    if (activeIndex !== overIndex) {
      move(activeIndex, overIndex);
    }
  };

  const handleAppend = () => {
    append({ id: nextId, lines: [] });
    setNextId(nextId + 1);
  }

  const handleDuplicate = (ix: number) => {
    const currentBlocks = form.getValues('blocks');
    insert(ix + 1, { id: nextId, lines: [...currentBlocks[ix].lines] });
    setNextId(nextId + 1);
  }

  const updateBlocks = () => {
    const newBlocks = form.getValues('blocks');
    form.setValue('blocks', newBlocks);
  }

  useEffect(() => {
    updateBlocks();
  }, [mode]);

  const handleLyricsBlur = (ix: number, value: string) => {
    const currentLines = form.getValues(`blocks.${ix}.lines`) ?? [];
    const newLines = updateLinesFromLyrics(currentLines, value);
    form.setValue(`blocks.${ix}.lines`, newLines);
    updateBlocks();
  };

  const handleChordsBlur = (ix: number, value: string) => {
    const currentLines = form.getValues(`blocks.${ix}.lines`) ?? [];
    const newLines = updateLinesFromChords(currentLines, value);
    form.setValue(`blocks.${ix}.lines`, newLines);
    updateBlocks();
  };

  return (
    <div className="flex flex-col items-stretch space-y-2">
      <Sortable
        value={blocks}
        onDragEnd={handleDrag}
        getItemValue={(item) => item.id ?? 0}
      >
        <div>
          <SortableContent asChild>
            <ul className="flex flex-col items-stretch space-y-2">
              {blocks.map((field, ix: number) => (
                <SortableItem
                  key={`blocks[${ix}]`}
                  value={field.id ?? 0}
                  asChild
                >
                  <li key={field.id}>
                    <div className="flex justify-stretch align-start space-x-2">
                      { mode === 'chords' ? (
                        <div className="flex-1 grid grid-cols-1 grid-rows-1 border-input shadow-xs dark:bg-input/30">
                          <Textarea variant="invisible" className="col-start-1 row-start-1 pt-5 pb-0 font-source-code-pro leading-[3.2em] pointer-events-none text-muted-foreground" value={getLyricsText(blocks[ix].lines ?? [])} />
                          <Textarea
                            variant="transparent"
                            className="col-start-1 row-start-1 pt-0 pb-5 font-source-code-pro leading-[3.2em] min-h-full"
                            defaultValue={getChordsText(blocks[ix].lines ?? [])}
                            onBlur={(e) => handleChordsBlur(ix, e.target.value)}
                          />
                        </div>
                      ) : (
                        <Textarea
                          className="flex-1"
                          defaultValue={getLyricsText(blocks[ix].lines ?? [])}
                          onBlur={(e) => handleLyricsBlur(ix, e.target.value)}
                        />
                      )}
                      <SortableItemHandle asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          title={t('edit.reorder')}
                        >
                          <ArrowsUpDownIcon className="size-3" />
                        </Button>
                      </SortableItemHandle>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        title={t('edit.duplicatePart')}
                        onClick={() => handleDuplicate(ix)}
                      >
                        <Square2StackIcon className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        title={t('edit.deletePart')}
                        disabled={blocks.length <= 1}
                        onClick={() => remove(ix)}
                      >
                        <TrashIcon className="size-3" />
                      </Button>
                    </div>
                  </li>
                </SortableItem>
              ))}
            </ul>
          </SortableContent>
        </div>
      </Sortable>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleAppend}
        className="me-auto"
      >
        {t('edit.addPart')}
      </Button>
    </div>
  )
}
