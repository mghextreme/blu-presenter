import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { ISong } from "@/types";
import { SongsService } from "@/services";
import { useServices } from "@/hooks/services.provider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Params, useLoaderData, useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import Square2StackIcon from "@heroicons/react/24/solid/Square2StackIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import ArrowsUpDownIcon from "@heroicons/react/20/solid/ArrowsUpDownIcon";
import { useTranslation } from "react-i18next";
import { Sortable, SortableContent, SortableItem, SortableItemHandle } from "@/components/ui/sortable";

export async function loader({ params, songsService }: { params: Params, songsService: SongsService }) {
  return await songsService.getById(Number(params.id));
}

const formSchema = z.object({
  id: z.number(),
  title: z.string().min(2),
  artist: z.string().min(2).optional().or(z.literal('')),
  blocks: z.array(
    z.object({
      id: z.number().optional(),
      text: z.string().optional(),
    }),
  ),
});

type EditSongProps = {
  edit?: boolean
}

export default function EditSong({
  edit = true
}: EditSongProps) {

  const { t } = useTranslation("songs");

  const loadedData = useLoaderData() as ISong;
  if (loadedData) {
    loadedData.blocks = loadedData?.blocks?.map((block, index) => { return {
      id: index,
      ...block,
    }});
  }
  const data = edit ? loadedData : {
    id: 0,
    title: '',
    artist: undefined,
    blocks: [{
      id: 0,
      text: '',
    }]
  };

  const [nextId, setNextId] = useState<number>(data.blocks?.length ?? 0);

  const navigate = useNavigate();

  const { songsService } = useServices();

  if (!data) {
    throw new Error("Can't find song");
  }

  const [isLoading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: data.id,
      title: data.title,
      artist: data.artist ?? '',
      blocks: data.blocks ?? [],
    },
  });

  const { fields: blocks, append, remove, insert, move } = useFieldArray({
    name: "blocks",
    control: form.control,
    keyName: "key",
  });

  const handleDrag = ({ active, over }) => {
    const activeIndex = active.data.current.sortable.index;
    const overIndex = over.data.current.sortable.index;
    if (activeIndex !== overIndex) {
      move(activeIndex, overIndex);
    }
  };

  const handleAppend = () => {
    append({ id: nextId, text: '' });
    setNextId(nextId + 1);
  }

  const handleDuplicate = (ix: number) => {
    insert(ix + 1, { id: nextId, text: blocks[ix].text });
    setNextId(nextId + 1);
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      let action;
      if (edit) {
        action = songsService.update(data.id, values);
      } else {
        action = songsService.add(values);
      }
      action
        .then(() => {
          navigate("/app/songs", { replace: true });
        })
        .catch((err) => {
          console.error(err);
        })
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-4">{edit ? t('edit.title') : t('add.title')}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-3">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('input.title')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}></FormField>

          <FormField
            control={form.control}
            name="artist"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('input.artist')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}></FormField>

            <div className="flex flex-col items-stretch space-y-2">
              <FormLabel>{t('input.parts')}</FormLabel>
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
          <div className="flex flex-row align-start space-x-2">
            <Button className="flex-0" type="submit" disabled={isLoading}>
              {isLoading && (
                <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
              )}
              {t('button.' + (edit ? 'update' : 'add'))}
              </Button>
            <Link to={'/app/songs'}><Button className="flex-0" type="button" variant="secondary">{t('button.cancel')}</Button></Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
