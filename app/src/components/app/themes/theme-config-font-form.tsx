import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { ThemeSchema } from "@/types/schemas/theme.schema";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Toggle } from "@/components/ui/toggle";
import UppercaseIcon from "@/components/icons/uppercase";
import ItalicIcon from "@heroicons/react/24/solid/ItalicIcon";
import TextShadowIcon from "@/components/icons/text-shadow";
import { useEffect, useState } from "react";
import { ColorForm } from "./color-form";

const fontOptions = [
  {
    value: "font-epunda-slab",
    label: "Epunda Slab",
    isMonospace: false,
    minWeight: 300,
    maxWeight: 900,
  },
  {
    value: "font-inter",
    label: "Inter",
    isMonospace: false,
    minWeight: 100,
    maxWeight: 900,
  },
  {
    value: "font-montserrat",
    label: "Montserrat",
    isMonospace: false,
    minWeight: 100,
    maxWeight: 900,
  },
  {
    value: "font-open-sans",
    label: "Open Sans",
    isMonospace: false,
    minWeight: 300,
    maxWeight: 800,
  },
  {
    value: "font-outfit",
    label: "Outfit",
    isMonospace: false,
    minWeight: 100,
    maxWeight: 900,
  },
  {
    value: "font-playfair-display",
    label: "Playfair Display",
    isMonospace: false,
    minWeight: 400,
    maxWeight: 900,
  },
  {
    value: "font-raleway",
    label: "Raleway",
    isMonospace: false,
    minWeight: 100,
    maxWeight: 900,
  },
  {
    value: "font-roboto",
    label: "Roboto",
    isMonospace: false,
    minWeight: 100,
    maxWeight: 900,
  },
  {
    value: "font-roboto-condensed",
    label: "Roboto Condensed",
    isMonospace: false,
    minWeight: 100,
    maxWeight: 900,
  },
  {
    value: "font-roboto-mono",
    label: "Roboto Mono",
    isMonospace: true,
    minWeight: 100,
    maxWeight: 700,
  },
  {
    value: "font-source-code-pro",
    label: "Source Code Pro",
    isMonospace: true,
    minWeight: 200,
    maxWeight: 900,
  },
]

interface ThemeConfigFontFormProps {
  form: UseFormReturn<z.infer<typeof ThemeSchema>>
  name: 'title' | 'artist' | 'lyrics' | 'chords' | 'clock'
  showTransform?: boolean
}

export function ThemeConfigFontForm({
  form,
  name,
  showTransform = true,
}: ThemeConfigFontFormProps) {

  const { t } = useTranslation("themes");

  const [fontsToShow, setFontsToShow] = useState<typeof fontOptions>(fontOptions);
  const [defaultFont, setDefaultFont] = useState<string>("font-open-sans");

  useEffect(() => {
    const monospaceOnly = form.getValues('extends') === 'teleprompter';

    if (!monospaceOnly) {
      setDefaultFont("font-open-sans");
      setFontsToShow(fontOptions);
      return;
    }

    setFontsToShow(fontOptions.filter((font) => font.isMonospace));
    setDefaultFont("font-source-code-pro");
  }, [form.watch('extends')]);

  const toggleShadow = (field, value: boolean) => {
    field.onChange(value);

    if (!value) return;

    const curColor = form.getValues(`config.${name}.shadow.color`);
    if (!curColor) {
      form.setValue(`config.${name}.shadow.color`, "#000000");
    }

    const curOffset = form.getValues(`config.${name}.shadow.offset`);
    if (!curOffset) {
      form.setValue(`config.${name}.shadow.offset`, 8);
    }

    const curBlur = form.getValues(`config.${name}.shadow.blur`);
    if (!curBlur) {
      form.setValue(`config.${name}.shadow.blur`, 0);
    }
  }

  return (
    <>
      <div className="flex justify-between gap-2">
        <FormField
          control={form.control}
          name={`config.${name}.fontFamily`}
          render={({ field }) => (
            <FormItem className="w-32 flex-1">
              <FormLabel>{t('input.font.family')}</FormLabel>
              <Select value={field.value ?? defaultFont} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fontsToShow.map((font) => (
                    <SelectItem key={font.value} value={font.value} className={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}></FormField>

        <FormField
          control={form.control}
          name={`config.${name}.fontWeight`}
          render={({ field }) => (
            <FormItem className="w-28">
              <FormLabel>{t('input.font.weight')}</FormLabel>
              <Select value={field.value?.toString() ?? '400'} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger style={{ fontWeight: field.value ?? 400 }}>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 9 }, (_, i) => (i + 1) * 100).map((weight) => {
                    const selectedFontFamily = form.getValues(`config.${name}.fontFamily`) ?? defaultFont;
                    const selectedFont = fontsToShow.find((font) => font.value === selectedFontFamily);
                    if (!selectedFont || weight < selectedFont.minWeight || weight > selectedFont.maxWeight) {
                      return null;
                    }

                    return (
                      <SelectItem key={weight} value={weight.toString()} style={{ fontWeight: weight }}>
                        {t(`fontWeight.${weight}`)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}></FormField>

        <FormField
          control={form.control}
          name={`config.${name}.fontSize`}
          render={({ field }) => (
            <FormItem className="w-20">
              <FormLabel>{t('input.font.size')}</FormLabel>
                <Input type="number" step="5" {...field} />
              <FormMessage />
            </FormItem>
          )}></FormField>

        <FormField
          control={form.control}
          name={`config.${name}.italic`}
          render={({ field }) => (
            <FormItem className="min-w-8 flex-0">
              <FormLabel>&nbsp;</FormLabel>
              <Toggle pressed={field.value as boolean} onPressedChange={field.onChange} title={t('input.font.italic')}>
                <ItalicIcon className="size-4" />
              </Toggle>
              <FormMessage />
            </FormItem>
          )}></FormField>

        {showTransform && <FormField
          control={form.control}
          name={`config.${name}.transform`}
          render={({ field }) => (
            <FormItem className="min-w-8 flex-0">
              <FormLabel>&nbsp;</FormLabel>
              <Toggle pressed={field.value === "uppercase"} onPressedChange={(value) => field.onChange(value === true ? 'uppercase' : 'none')} title={t('input.font.uppercase')}>
                <UppercaseIcon className="size-5" />
              </Toggle>
              <FormMessage />
            </FormItem>
          )}></FormField>}

        <FormField
          control={form.control}
          name={`config.${name}.shadow.enabled`}
          render={({ field }) => (
            <FormItem className="min-w-8 flex-0">
              <FormLabel>&nbsp;</FormLabel>
              <Toggle pressed={field.value as boolean} onPressedChange={(value: boolean) => toggleShadow(field, value)} title={t('input.font.shadow')}>
                <TextShadowIcon className="size-4" />
              </Toggle>
              <FormMessage />
            </FormItem>
          )}></FormField>
      </div>
      {form.watch(`config.${name}.shadow.enabled`) && (
        <div className="flex justify-between gap-2">
          <ColorForm<z.infer<typeof ThemeSchema>>
            form={form}
            name={`config.${name}.shadow.color`}
            label={t('input.config.shadowColor')}
          />

        <FormField
          control={form.control}
          name={`config.${name}.shadow.offset`}
          render={({ field }) => (
            <FormItem className="w-24">
              <FormLabel>{t('input.config.shadowOffset')}</FormLabel>
                <Input type="number" step="2" {...field} />
              <FormMessage />
            </FormItem>
          )}></FormField>

        <FormField
          control={form.control}
          name={`config.${name}.shadow.blur`}
          render={({ field }) => (
            <FormItem className="w-24">
              <FormLabel>{t('input.config.shadowBlur')}</FormLabel>
                <Input type="number" step="5" {...field} />
              <FormMessage />
            </FormItem>
          )}></FormField>
        </div>
      )}
    </>
  );

};
