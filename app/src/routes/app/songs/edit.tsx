import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";

import { ILanguage, ISongWithRole, isRoleHigherOrEqualThan, SupportedLanguage, supportedLanguagesMap } from "@/types";
import { SongsService } from "@/services";
import { useServices } from "@/hooks/services.provider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Params, useLoaderData, useNavigate } from "react-router-dom";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import CheckIcon from "@heroicons/react/24/solid/CheckIcon";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import i18next, { TFunction } from "i18next";
import EditSongParts, { SongEditMode } from "@/components/app/songs/edit-parts";
import { SongSchema } from "@/types/schemas/song.schema";
import { z } from "zod";
import { Toggle } from "@/components/ui/toggle";
import { useAuth } from "@/hooks/useAuth";
import Preview from "@/components/icons/preview";
import SongPreview from "@/components/app/songs/song-preview";
import ControllerProvider from "@/hooks/controller.provider";

export async function loader({ params, songsService }: { params: Params, songsService: SongsService }) {
  return await songsService.getById(Number(params.id));
}

function LanguageAndIcon({ t, language }: { t: TFunction, language: ILanguage["value"] }) {
  const lang = supportedLanguagesMap.find((lang) => lang.value === language);
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
  const curLang = (i18next.resolvedLanguage || 'en') as SupportedLanguage;
  const { organization } = useAuth();

  const loadedData = useLoaderData() as ISongWithRole;
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
    }],
    organization: organization,
  };

  if (!isRoleHigherOrEqualThan(data.organization?.role, 'guest')) {
    throw new Error(t('error.noPermission'));
  }

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

  let orgName: string | undefined = t("organizations.publicArchive");
  if (data.organization) {
    orgName = data.organization.name || t("organizations.defaultName");
  }

  return (
    <>
      <div className="flex items-center px-8 py-3 bg-slate-200 dark:bg-slate-900 gap-x-2">
        <span className="text-sm">{t('input.organization')}: <b>{orgName}</b></span>
        <div className="buttons flex-1 flex justify-end gap-x-2">
          <Button
            type="button"
            size="sm"
            title={t('actions.view')}
            asChild={true}>
            <Link to={`/app/songs/${data.id}/view`}>
              <EyeIcon className="size-3" />
            </Link>
          </Button>
          <ControllerProvider>
            <SongPreview song={data}>
              <Button
                type="button"
                size="sm"
                title={t('actions.preview')}>
                <Preview className="size-5" />
              </Button>
            </SongPreview>
          </ControllerProvider>
        </div>
      </div>
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
                            {supportedLanguagesMap.map((language) => (
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
    </>
  );
}
