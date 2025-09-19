import { useTranslation } from "react-i18next";
import { ThemeSchema } from "@/types/schemas/theme.schema";
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ThemeConfigFontForm } from "./theme-config-font-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ColorForm } from "./color-form";

interface ThemeConfigFormProps {
  form: UseFormReturn<z.infer<typeof ThemeSchema>>
}

export function ThemeConfigForm({
  form,
}: ThemeConfigFormProps) {

  const { t } = useTranslation("themes");

  return (
    <Accordion type="multiple" className="gap-2">
      <AccordionItem value="colors">
        <AccordionTrigger className="text-lg font-medium py-2">{t("input.titles.colors")}</AccordionTrigger>
        <AccordionContent className="flex flex-col pt-2 gap-3">
          <div className="grid grid-cols-2 gap-2">
            <ColorForm<z.infer<typeof ThemeSchema>>
              form={form}
              name="config.backgroundColor"
              label={t('input.config.backgroundColor')}
            />

            <ColorForm<z.infer<typeof ThemeSchema>>
              form={form}
              name="config.foregroundColor"
              label={t('input.config.foregroundColor')}
            />

            {form.watch('extends') === 'teleprompter' && (
              <>
                <ColorForm<z.infer<typeof ThemeSchema>>
                  form={form}
                  name="config.chords.color"
                  label={t('input.config.chordsColor')}
                />
                {form.watch('config.clock.enabled') && (
                  <ColorForm<z.infer<typeof ThemeSchema>>
                    form={form}
                    name="config.clock.color"
                    label={t('input.config.clockColor')}
                  />
                )}
              </>
            )}
          </div>
          <div>
            <FormField
              control={form.control}
              name="config.invisibleOnEmptyItems"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between w-full rounded-lg border p-3 shadow-sm gap-3 dark:bg-input/30">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="flex-1 space-y-0.5">
                    <FormLabel>{t('input.config.invisibleOnEmptyItems')}</FormLabel>
                    <FormDescription>
                      {t('input.config.invisibleOnEmptyItemsDescription')}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
      {form.watch('extends') !== 'teleprompter' && <AccordionItem value="alignment">
        <AccordionTrigger className="text-lg font-medium py-2">{t("input.titles.alignment")}</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 pt-2">
          <div className="flex justify-stretch gap-2">
            <FormField
              control={form.control}
              name="config.position"
              render={({ field }) => (
                <FormItem className="w-32 flex-1">
                  <FormLabel>{t('input.config.vertical')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? 'center'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem key="top" value="top">{t('position.top')}</SelectItem>
                      <SelectItem key="middle" value="middle">{t('position.middle')}</SelectItem>
                      <SelectItem key="bottom" value="bottom">{t('position.bottom')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}></FormField>

            <FormField
              control={form.control}
              name="config.alignment"
              render={({ field }) => (
                <FormItem className="w-32 flex-1">
                  <FormLabel>{t('input.config.horizontal')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? 'center'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem key="left" value="left">{t('alignment.left')}</SelectItem>
                      <SelectItem key="center" value="center">{t('alignment.center')}</SelectItem>
                      <SelectItem key="right" value="right">{t('alignment.right')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}></FormField>
          </div>
        </AccordionContent>
      </AccordionItem>}
      <AccordionItem value="title">
        <AccordionTrigger className="text-lg font-medium py-2">{t("input.titles.title")}</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 pt-2">
          <ThemeConfigFontForm form={form} name="title" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="artist">
        <AccordionTrigger className="text-lg font-medium py-2">{t("input.titles.artist")}</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 pt-2">
          <ThemeConfigFontForm form={form} name="artist" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="lyrics">
        <AccordionTrigger className="text-lg font-medium py-2">{t("input.titles.lyrics")}</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 pt-2">
          <ThemeConfigFontForm form={form} name="lyrics" />
        </AccordionContent>
      </AccordionItem>
      {form.watch('extends') === 'teleprompter' && (
        <>
          <AccordionItem value="chords">
            <AccordionTrigger className="text-lg font-medium py-2">{t("input.titles.chords")}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2 pt-2">
              <ThemeConfigFontForm form={form} name="chords" showTransform={false} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="clock">
            <AccordionTrigger className="text-lg font-medium py-2">{t("input.titles.clock")}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="config.clock.enabled"
                  render={({ field }) => (
                    <FormItem className="w-32 flex-1">
                      <FormLabel>{t('input.config.clockEnabled')}</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === 'true' ? true : false)} value={field.value === true ? 'true' : 'false'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key="true" value="true">{t('state.enabled')}</SelectItem>
                          <SelectItem key="false" value="false">{t('state.disabled')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}></FormField>

                <FormField
                  control={form.control}
                  name="config.clock.format"
                  render={({ field }) => (
                    <FormItem className="w-32 flex-1">
                      <FormLabel>{t('input.config.clockFormat')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? '24withSeconds'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key="12" value="12">{t('clockFormat.12')}</SelectItem>
                          <SelectItem key="24" value="24">{t('clockFormat.24')}</SelectItem>
                          <SelectItem key="12withSeconds" value="12withSeconds">{t('clockFormat.12withSeconds')}</SelectItem>
                          <SelectItem key="24withSeconds" value="24withSeconds">{t('clockFormat.24withSeconds')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}></FormField>
              </div>
              <ThemeConfigFontForm form={form} name="clock" showTransform={false} />
            </AccordionContent>
          </AccordionItem>
        </>
      )}
    </Accordion>
  );

};
