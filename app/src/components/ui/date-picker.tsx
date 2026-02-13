import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format, parse } from "date-fns";
import { enUS as dfEnUS, ptBR as dfPtBR } from "date-fns/locale";
import { enUS as rdpEnUS, ptBR as rdpPtBR } from "react-day-picker/locale";
import type { Locale as DateFnsLocale } from "date-fns";
import type { DayPickerLocale } from "react-day-picker";
import CalendarIcon from "@heroicons/react/24/solid/CalendarIcon";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type LocaleConfig = {
  dateFns: DateFnsLocale;
  dayPicker: DayPickerLocale;
  formatStr: string;
};

const localeMap: Record<string, LocaleConfig> = {
  en: { dateFns: dfEnUS, dayPicker: rdpEnUS, formatStr: "MM/dd/yyyy" },
  pt: { dateFns: dfPtBR, dayPicker: rdpPtBR, formatStr: "dd/MM/yyyy" },
};

function getLocaleConfig(lang: string): LocaleConfig {
  return localeMap[lang] ?? localeMap.en;
}

type DatePickerProps = {
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  className?: string;
};

function DatePicker({ value, onChange, placeholder, className }: DatePickerProps) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const lang = i18n.language?.substring(0, 2) ?? "en";
  const { dateFns, dayPicker, formatStr } = getLocaleConfig(lang);

  const dateValue = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

  const displayText = dateValue
    ? format(dateValue, formatStr, { locale: dateFns })
    : null;

  const handleSelect = (day: Date | undefined) => {
    if (day) {
      onChange?.(format(day, "yyyy-MM-dd"));
    } else {
      onChange?.(null);
    }
    setOpen(false);
  };

  const today = new Date();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !displayText && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 opacity-50" />
          {displayText ?? <span>{placeholder ?? ""}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          locale={dayPicker}
          captionLayout="dropdown"
          defaultMonth={dateValue}
          startMonth={new Date(today.getFullYear() - 5, 0)}
          endMonth={new Date(today.getFullYear() + 5, 11)}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker, getLocaleConfig };
