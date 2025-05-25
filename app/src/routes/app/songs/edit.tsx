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
import { useTranslation } from "react-i18next";

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
  const data = edit ? loadedData : {
    id: 0,
    title: '',
    blocks: [{
      text: '',
    }]
  };

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

  const { fields: blocks, append, remove, insert } = useFieldArray({
    name: "blocks",
    control: form.control,
  });

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
      <h1 className="text-3xl mb-4">{t('edit.title')}</h1>
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
              {blocks.map((field, ix: number) => (
                  <FormField
                    control={form.control}
                    key={field.id}
                    name={`blocks.${ix}.text`}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <div className="flex justify-stretch align-start space-x-2">
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            title={t('edit.duplicatePart')}
                            onClick={() => insert(ix + 1, { text: field.value })}
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => append({ text: "" })}
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
