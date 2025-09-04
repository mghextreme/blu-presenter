import { useFieldArray, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { SongSchema } from "@/types/schemas/song.schema";
import { Button } from "@/components/ui/button";
import EditSongReferencesItem from "./edit-references-item";

interface EditSongReferencesProps {
  form: UseFormReturn<z.infer<typeof SongSchema>>,
}

export default function EditSongReferences({
  form,
}: EditSongReferencesProps) {

  const { t } = useTranslation("songs");

  const { fields: references, append, remove } = useFieldArray({
    name: "references",
    control: form.control,
    keyName: "key",
  });

  const handleAppend = () => {
    append({ url: '', name: '' });
  }

  return (
    <div className="flex flex-col items-stretch space-y-2">
      <ul className="flex flex-col items-stretch space-y-2">
        {references.map((_, ix: number) => (
          <EditSongReferencesItem form={form} ix={ix} remove={remove} key={`reference-${ix}`}  />
        ))}
      </ul>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleAppend}
        className="me-auto"
      >
        {t('edit.addReference')}
      </Button>
    </div>
  )
}
