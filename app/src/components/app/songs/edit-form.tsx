import { forwardRef, ReactNode, useImperativeHandle, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";

import { ILanguage, ISong, supportedLanguagesMap } from "@/types";
import { useServices } from "@/hooks/services.provider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import CheckIcon from "@heroicons/react/24/solid/CheckIcon";
import { TFunction } from "i18next";
import EditSongParts, { SongEditMode } from "@/components/app/songs/edit-parts";
import { SongSchema } from "@/types/schemas/song.schema";
import { z } from "zod";
import { Toggle } from "@/components/ui/toggle";
import EditSongReferences from "@/components/app/songs/edit-references";

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

type EditSongFormProps = {
  edit?: boolean
  defaultEditMode?: SongEditMode
  formValues?: z.infer<typeof SongSchema>
  additionalSubmitButtons?: ReactNode
}

export const EditSongForm = forwardRef((
  {
    edit = true,
    defaultEditMode = 'lyrics',
    formValues,
    additionalSubmitButtons = null,
  }: EditSongFormProps,
  ref,
) => {

  const { t } = useTranslation("songs");

  const navigate = useNavigate();

  const { songsService } = useServices();

  if (edit && (!formValues || !formValues.id)) {
    return null;
  }

  const [isLoading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof SongSchema>>({
    resolver: zodResolver(SongSchema),
    defaultValues: formValues,
  });

  const [editMode, setEditMode] = useState<SongEditMode>(defaultEditMode);
  const changeEditMode = () => {
    if (editMode === 'lyrics') {
      setEditMode('chords');
    } else {
      setEditMode('lyrics');
    }
  }

  const onSubmit = async (values: z.infer<typeof SongSchema>) => {
    setLoading(true);
    let action;
    if (edit) {
      action = songsService.update(values.id, values);
    } else {
      action = songsService.add(values);
    }
    action
      .then((newSong: ISong) => {
        navigate(`/app/songs/${newSong.id}/view`);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useImperativeHandle(ref, () => {
    return {
      getFormValues() {
        return form.getValues();
      },
    };
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap space-x-3 space-y-3 justify-start">
        <div className="min-w-sm max-w-lg space-y-3 flex-1">
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
                          "justify-start",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <LanguageAndIcon t={t} language={field.value!} />
                        <ChevronDownIcon className="opacity-50 ms-auto me-0" />
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

          <FormField
            control={form.control}
            name="references"
            render={() => (
              <FormItem>
                <FormLabel>{t('input.references')}</FormLabel>
                <EditSongReferences form={form} />
                <FormMessage />
              </FormItem>
            )}></FormField>

          <div className="flex flex-row align-start space-x-2">
            <Button className="flex-0" type="submit" disabled={isLoading}>
              {isLoading && (
                <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
              )}
              {t('button.' + (edit ? 'update' : 'add'))}
            </Button>
            {additionalSubmitButtons}
            <Link to={'/app/songs'}><Button className="flex-0" type="button" variant="secondary">{t('button.cancel')}</Button></Link>
          </div>
        </div>

        <div className="flex flex-col items-stretch min-w-md max-w-lg space-y-3 flex-1">
          <FormLabel>{t('input.parts')}</FormLabel>
          <Toggle variant="outline" pressed={editMode == 'chords'} onPressedChange={changeEditMode} className="me-auto">{t('input.editChords')}</Toggle>
          <EditSongParts form={form} mode={editMode} />
          <div className="flex flex-row align-start space-x-2">
            <Button className="flex-0" type="submit" disabled={isLoading}>
              {isLoading && (
                <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
              )}
              {t('button.' + (edit ? 'update' : 'add'))}
            </Button>
            {additionalSubmitButtons}
            <Link to={'/app/songs'}><Button className="flex-0" type="button" variant="secondary">{t('button.cancel')}</Button></Link>
          </div>
        </div>
      </form>
    </Form>
  );
});
