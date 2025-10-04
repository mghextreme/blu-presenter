import { forwardRef, ReactNode, useEffect, useImperativeHandle, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";

import { ILanguage, ISong, supportedLanguagesMap } from "@/types";
import { useServices } from "@/hooks/useServices";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { capitalizeText } from "@/lib/songs";

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
    if (hasUppercaseWarning && !ignoreWarning) return;

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

  const [ignoreWarning, setIgnoreWarning] = useState<boolean>(false);
  const [hasUppercaseWarning, setHasUppercaseWarning] = useState<boolean>(false);
  const checkUppercase = () => {
    const blocks = form.watch('blocks');

    let uppercaseCount = 0;
    let addUppercaseWarning = false;
    for (const block of blocks) {
      let blockText = block?.text;
      if (!blockText) continue;

      blockText = blockText.trim();
      if (blockText.length > 0 && blockText === blockText.toUpperCase()) {
        uppercaseCount++;
      }

      if (uppercaseCount >= 3) {
        addUppercaseWarning = true;
        break;
      }
    }

    setHasUppercaseWarning(addUppercaseWarning);
  }

  useEffect(() => {
    checkUppercase();
  }, [form.watch('blocks')]);

  const autoFixUppercase = () => {
    const blocks = form.getValues('blocks');
    for (let i = 0; i < blocks.length; i++) {
      let blockText = blocks[i]?.text?.trimEnd();
      if (!blockText) continue;

      if (blockText.length > 0) {
        form.setValue(`blocks.${i}.text`, capitalizeText(blockText));
      }
    }

    checkUppercase();
  }

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

          <SubmitButtons t={t} edit={edit} isLoading={isLoading} additionalSubmitButtons={additionalSubmitButtons} hasUppercaseWarning={hasUppercaseWarning} ignoreWarning={ignoreWarning} setIgnoreWarning={setIgnoreWarning} autoFixUppercase={autoFixUppercase} />
        </div>

        <div className="flex flex-col items-stretch min-w-md max-w-lg space-y-3 flex-1">
          <FormLabel>{t('input.parts')}</FormLabel>
          <Toggle variant="outline" pressed={editMode == 'chords'} onPressedChange={changeEditMode} className="me-auto">{t('input.editChords')}</Toggle>
          <EditSongParts form={form} mode={editMode} />

          <SubmitButtons t={t} edit={edit} isLoading={isLoading} additionalSubmitButtons={additionalSubmitButtons} hasUppercaseWarning={hasUppercaseWarning} ignoreWarning={ignoreWarning} setIgnoreWarning={setIgnoreWarning} autoFixUppercase={autoFixUppercase} />
        </div>
      </form>
    </Form>
  );
});

function SubmitButtons({
  t,
  edit,
  isLoading,
  hasUppercaseWarning,
  additionalSubmitButtons,
  ignoreWarning,
  setIgnoreWarning,
  autoFixUppercase,
}: {
  t: TFunction
  edit?: boolean
  isLoading?: boolean
  hasUppercaseWarning?: boolean
  additionalSubmitButtons?: ReactNode
  ignoreWarning: boolean
  setIgnoreWarning: (value: boolean) => void
  autoFixUppercase: () => void
}) {
  return (
    <>
      {hasUppercaseWarning && <div>
        <Alert variant="warning">
          <AlertTitle>{t('warning.uppercase.title')}</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 text-yellow-600 dark:text-yellow-100">
            <p className="text-xs whitespace-pre-wrap">{t('warning.uppercase.description')}</p>
            <div className="flex flex-row justify-start gap-4">
              <Button
                variant="warning"
                size="sm"
                className="w-auto me-auto text-sm"
                type="button"
                onClick={autoFixUppercase}
              >{t('warning.uppercase.autoFix')}</Button>
              <div className="flex-1 flex items-center gap-2">
                <Checkbox
                  id="terms"
                  checked={ignoreWarning}
                  onCheckedChange={setIgnoreWarning}
                  className="rounded border-yellow-600 data-[state=checked]:bg-yellow-600 data-[state=checked]:text-primary-foreground"
                />
                <Label htmlFor="terms" className="pb-1">{t('warning.uppercase.ignore')}</Label>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>}
      <div className="flex flex-row align-start space-x-2">
        <Button className="flex-0" type="submit" disabled={isLoading || (hasUppercaseWarning && !ignoreWarning)}>
          {isLoading && (
            <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
          )}
          {t('button.' + (edit ? 'update' : 'add'))}
        </Button>
        {additionalSubmitButtons}
        <Button className="flex-0" type="button" variant="secondary" asChild><Link to={'/app/songs'}>{t('button.cancel')}</Link></Button>
      </div>
    </>
  );
}
