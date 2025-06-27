import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";

import { ISong } from "@/types";
import { SongsService } from "@/services";
import { useServices } from "@/hooks/services.provider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Params, useLoaderData, useNavigate } from "react-router-dom";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import { useTranslation } from "react-i18next";
import { FlagBr, FlagDe, FlagEs, FlagFr, FlagGb, FlagIt } from "@/components/logos/flags";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import CheckIcon from "@heroicons/react/24/solid/CheckIcon";
import i18next, { TFunction } from "i18next";
import EditSongParts, { SongEditMode } from "@/components/app/songs/edit-parts";
import { SongSchema } from "@/types/schemas/song.schema";
import { z } from "zod";
import { Toggle } from "@/components/ui/toggle";

interface ILanguage {
  value: "en" | "pt" | "es" | "fr" | "de" | "it";
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const languages = [
  {
    value: "en",
    label: "english",
    icon: FlagGb,
  },
  {
    value: "pt",
    label: "portuguese",
    icon: FlagBr,
  },
  {
    value: "es",
    label: "spanish",
    icon: FlagEs,
  },
  {
    value: "fr",
    label: "french",
    icon: FlagFr,
  },
  {
    value: "de",
    label: "german",
    icon: FlagDe,
  },
  {
    value: "it",
    label: "italian",
    icon: FlagIt,
  },
] as ILanguage[];

export async function loader({ params, songsService }: { params: Params, songsService: SongsService }) {
  return await songsService.getById(Number(params.id));
}

function LanguageAndIcon({ t, language }: { t: TFunction, language: ILanguage["value"] }) {
  const lang = languages.find((lang) => lang.value === language);
  if (!lang) return null;

  const Icon = lang.icon;
  return (
    <>
      <Icon className="h-4 w-4 me-2" />
      {t('language.' + lang.label)}
    </>
  );
}

type EditSongProps = {
  edit?: boolean
}

export default function EditSong({
  edit = true
}: EditSongProps) {

  const { t } = useTranslation("songs");
  const curLang = (i18next.resolvedLanguage || 'en') as 'en' | 'pt' | 'es' | 'fr' | 'de' | 'it';

  const loadedData = useLoaderData() as ISong;
  if (loadedData) {
    loadedData.blocks = loadedData?.blocks?.map((block, index) => {
      return {
        ...block,
        id: index,
      };
    });
  }
  const data = edit ? loadedData : {
    id: 0,
    title: '',
    language: undefined,
    artist: undefined,
    blocks: [{
      id: 0,
      text: '',
      chords: '',
    }]
  };

  const navigate = useNavigate();

  const { songsService } = useServices();

  if (!data) {
    throw new Error("Can't find song");
  }

  const [isLoading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof SongSchema>>({
    resolver: zodResolver(SongSchema),
    defaultValues: {
      id: data.id,
      language: data.language ?? curLang,
      title: data.title,
      artist: data.artist ?? '',
      blocks: data.blocks ?? [],
    },
  });

  const [editMode, setEditMode] = useState<SongEditMode>('lyrics');
  const changeEditMode = () => {
    if (editMode === 'lyrics') {
      setEditMode('chords');
    } else {
      setEditMode('lyrics');
    }
  }

  const onSubmit = async (values: z.infer<typeof SongSchema>) => {
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

          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('input.language')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <LanguageAndIcon t={t} language={field.value!} />
                        <ChevronDownIcon className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput
                        placeholder={t('language.search')}
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>{t('language.notFound')}</CommandEmpty>
                        <CommandGroup>
                          {languages.map((language) => (
                            <CommandItem
                              value={language.label}
                              key={language.value}
                              onSelect={() => {
                                form.setValue("language", language.value)
                              }}
                            >
                              <LanguageAndIcon t={t} language={language.value} />
                              <CheckIcon
                                className={cn(
                                  "ml-auto",
                                  language.value === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormLabel>{t('input.parts')}</FormLabel>
          <Toggle variant="outline" pressed={editMode == 'chords'} onPressedChange={changeEditMode}>{t('input.editChords')}</Toggle>
          <EditSongParts form={form} mode={editMode} />

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
