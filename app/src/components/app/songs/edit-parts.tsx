import { Button } from "@/components/ui/button";
import { Sortable, SortableContent, SortableItem, SortableItemHandle } from "@/components/ui/sortable";
import { Textarea } from "@/components/ui/textarea";
import { SongSchema } from "@/types/schemas/song.schema";
import ArrowsUpDownIcon from "@heroicons/react/20/solid/ArrowsUpDownIcon";
import Square2StackIcon from "@heroicons/react/24/solid/Square2StackIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { useState } from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

interface EditSongPartsProps {
  form: UseFormReturn<z.infer<typeof SongSchema>>
}

export default function EditSongParts({
  form
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
    append({ id: nextId, text: '' });
    console.log('preAppend', nextId);
    setNextId(nextId + 1);
    console.log('postAppend', nextId);
  }

  const handleDuplicate = (ix: number) => {
    const currentBlocks = form.getValues('blocks');
    insert(ix + 1, { id: nextId, text: currentBlocks[ix].text, chords: currentBlocks[ix].chords });
    console.log('preDupe', nextId);
    setNextId(nextId + 1);
    console.log('postDupe', nextId);
  }

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
                      <Textarea {...form.register(`blocks.${ix}.text`)} />
                      <SortableItemHandle asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          title={t('edit.reorder')}
                        >
                          <ArrowsUpDownIcon className="h-4 w-4" />
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
      >
        {t('edit.addPart')}
      </Button>
    </div>
  )
}
