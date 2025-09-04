import { useRef, useState } from "react";
import { UseFieldArrayRemove, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { SongSchema } from "@/types/schemas/song.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LinkIcon from "@heroicons/react/24/solid/LinkIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import ChatBubbleLeftEllipsisIcon from "@heroicons/react/24/solid/ChatBubbleLeftEllipsisIcon";
import ChevronUpDownIcon from "@heroicons/react/24/solid/ChevronUpDownIcon";
import ArrowTopRightOnSquareIcon from "@heroicons/react/24/solid/ArrowTopRightOnSquareIcon";

interface EditSongReferencesItemProps {
  form: UseFormReturn<z.infer<typeof SongSchema>>,
  ix: number,
  remove: UseFieldArrayRemove,
}

export default function EditSongReferencesItem({
  form,
  ix,
  remove,
}: EditSongReferencesItemProps) {

  const { t } = useTranslation("songs");

  const nameInput = useRef<HTMLInputElement>(null);
  const urlInput = useRef<HTMLInputElement>(null);

  const [expanded, setExpanded] = useState(false);
  const [hasValue, setHasValue] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const updateReferences = () => {
    const newReferences = form.getValues('references');
    form.setValue('references', newReferences);

    setTimeout(checkValidUrl, 100);
  }

  const checkValidUrl = async () => {
    const url = form.getValues(`references.${ix}.url`);
    setHasValue(!!url);

    await form.trigger(`references.${ix}.url`);
    const fieldError = form.control.getFieldState(`references.${ix}.url`).error;
    if (fieldError) {
      console.log(url, fieldError);
      setError(fieldError.message);
    } else {
      setError(undefined);
    }
  }

  const openUrl = () => {
    if (!!error) return;

    const url = form.getValues(`references.${ix}.url`);
    window.open(url, '_blank');
  }

  return (
    <li className="flex justify-stretch align-start space-x-2">
      <div className="self-stretch bg-primary text-primary-foreground rounded-md flex flex-col justify-center items-center px-1 min-w-8">
        <span className="text-lg font-bold">{ix + 1}</span>
      </div>
      <div className="flex flex-col w-full flex-1 space-y-2">
        <div className="flex space-x-2" title={t('input.placeholders.referenceUrl')}>
          <Button variant="secondary" size="icon" type="button" onClick={() => urlInput.current?.focus()}><LinkIcon className="size-4" /></Button>
          <Input placeholder={t('input.placeholders.referenceUrl')} className="flex-1" {...form.register(`references.${ix}.url`)} onBlur={updateReferences} />
          {hasValue && !error && (
            <Button variant="secondary" size="icon" type="button" onClick={openUrl}><ArrowTopRightOnSquareIcon className="size-4" /></Button>
          )}
        </div>
        {expanded && (
          <div className="flex space-x-2" title={t('input.placeholders.referenceName')}>
            <Button variant="secondary" size="icon" type="button" onClick={() => nameInput.current?.focus()}><ChatBubbleLeftEllipsisIcon className="size-4" /></Button>
            <Input placeholder={t('input.placeholders.referenceName')} className="flex-1" {...form.register(`references.${ix}.name`)} />
          </div>
        )}
        {error && (
          <span className="text-destructive">{error}</span>
        )}
      </div>
      <Button
        type="button"
        variant={expanded ? 'secondary' : 'default'}
        size="sm"
        title={t('edit.expandReference')}
        onClick={() => setExpanded(!expanded)}
        className="flex-0"
      >
        <ChevronUpDownIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        title={t('edit.deleteReference')}
        onClick={() => remove(ix)}
        className="flex-0"
      >
        <TrashIcon className="size-3" />
      </Button>
    </li>
  )
}
