import { useRef, useState } from "react";
import { z } from "zod";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import { SupportedLanguage } from "@/types";
import { SongSchema } from "@/types/schemas/song.schema";
import { ImportSongSchema } from "@/types/schemas/import-song.schema";
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/hooks/useAuth";
import { ControllerProvider } from "@/hooks/controller.provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EditSongForm, EditSongFormHandle } from "@/components/app/songs/edit-form";
import { SongPreview } from "@/components/app/songs/song-preview";
import { PreviewIcon } from "@/components/icons/preview";
import { parseSongText } from "@/lib/songs";

export function ImportSong() {

  const { t } = useTranslation("songs");
  const { organization } = useAuth();
  const curLang = (i18next.resolvedLanguage || 'en') as SupportedLanguage;

  const [step, setStep] = useState<number>(1);

  const form = useForm<z.infer<typeof ImportSongSchema>>({
    resolver: zodResolver(ImportSongSchema),
    defaultValues: {
      fullText: '',
      blocks: [],
    },
  });

  const onSubmitStep1 = (data: z.infer<typeof ImportSongSchema>) => {
    const parsed = parseSongText(data.fullText);
    setInitialFormValues({
      id: 0,
      title: parsed.title,
      artist: parsed.artist,
      language: curLang,
      blocks: parsed.blocks,
      references: [],
    });
    setStep(2);
  }

  const [initialFormValues, setInitialFormValues] = useState<z.infer<typeof SongSchema> | null>(null);

  const editFormRef = useRef<EditSongFormHandle>(null);

  return (
    <>
      <title>{t('title.import') + ' - BluPresenter'}</title>
      <div className="flex items-center px-2 sm:px-8 py-3 bg-slate-200 dark:bg-slate-900 gap-x-2">
        <span className="text-sm">{t('input.organization')}: <b>{organization?.name ?? t('organizations.defaultName')}</b></span>
        <div className="buttons flex-1 flex justify-end gap-x-2">
          {step === 2 && (
            <ControllerProvider>
              <SongPreview getSong={() => editFormRef.current?.getFormValues()}>
                <Button
                  type="button"
                  size="sm"
                  title={t('actions.preview')}>
                  <PreviewIcon className="size-5" />
                </Button>
              </SongPreview>
            </ControllerProvider>
          )}
        </div>
      </div>
      <div className="p-2 sm:p-8">
        <h1 className="text-3xl mb-4">{t('import.title')}</h1>
        {step === 1 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitStep1)} className="flex flex-col space-y-3">
              <div className="min-w-sm max-w-2xl space-y-3 flex-1">
                <FormField
                  control={form.control}
                  name="fullText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('input.import.label')}</FormLabel>
                      <FormDescription>{t('input.import.description')}</FormDescription>
                      <FormControl>
                        <Textarea {...field} className="min-h-[300px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}></FormField>

                <div className="flex flex-row align-start space-x-2">
                  <Button className="flex-0" type="submit">{t('button.continue')}</Button>
                  <Button className="flex-0" type="button" variant="secondary" asChild><Link to={'/app/songs'}>{t('button.cancel')}</Link></Button>
                </div>
              </div>
            </form>
          </Form>
        )}
        {step === 2 && (
          <EditSongForm
            edit={false}
            formValues={initialFormValues ?? undefined}
            ref={editFormRef}
            additionalSubmitButtons={(
              <Button className="flex-0" type="button" variant="secondary" onClick={() => setStep(1)}>{t('button.back')}</Button>
            )}
          />
        )}
      </div>
    </>
  );
}
