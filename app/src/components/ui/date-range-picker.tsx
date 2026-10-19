import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format, isBefore, parse } from "date-fns";
import type { DateRange } from "react-day-picker";
import CalendarIcon from "@heroicons/react/24/solid/CalendarIcon";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getLocaleConfig } from "@/components/ui/date-picker";

type DateRangeValue = { from: string | null; to: string | null };

type DateRangePickerProps = {
  value?: DateRangeValue | null;
  onChange?: (value: DateRangeValue | null) => void;
  placeholder?: string;
  /** Accessible label for the clear ("x") button. */
  clearLabel: string;
  numberOfMonths?: number;
  className?: string;
};

function toDateRange(value?: DateRangeValue | null): DateRange | undefined {
  if (!value?.from) {
    return undefined;
  }
  return {
    from: parse(value.from, "yyyy-MM-dd", new Date()),
    to: value.to ? parse(value.to, "yyyy-MM-dd", new Date()) : undefined,
  };
}

function DateRangePicker({
  value,
  onChange,
  placeholder,
  clearLabel,
  numberOfMonths = 1,
  className,
}: DateRangePickerProps) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  // In-progress selection: the start date is picked, the end date is pending.
  // react-day-picker cannot drive this directly because (without min/max) its
  // range mode already emits a complete single-day range on the first click.
  const [draft, setDraft] = useState<DateRange | undefined>(undefined);

  const lang = i18n.language?.substring(0, 2) ?? "en";
  const { dateFns, dayPicker, formatStr } = getLocaleConfig(lang);

  const formatDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    try {
      return format(parse(dateStr, "yyyy-MM-dd", new Date()), formatStr, { locale: dateFns });
    } catch {
      return null;
    }
  };

  const fromText = formatDate(value?.from);
  const toText = formatDate(value?.to);
  const displayText = fromText && toText
    ? `${fromText} - ${toText}`
    : fromText
      ? `${fromText} - …`
      : null;

  const handleSelect = (_range: DateRange | undefined, clickedDate?: Date) => {
    if (!clickedDate) {
      // Selection cleared.
      setDraft(undefined);
      onChange?.(null);
      return;
    }

    if (!draft?.from) {
      // First click selects the start date; keep the picker open for the end
      // date.
      setDraft({ from: clickedDate, to: undefined });
      return;
    }

    if (isBefore(clickedDate, draft.from)) {
      // Clicked before the start date: restart the range from that day.
      setDraft({ from: clickedDate, to: undefined });
      return;
    }

    // Second click completes the range (clicking the start date again
    // selects a single-day range).
    setDraft(undefined);
    onChange?.({
      from: format(draft.from, "yyyy-MM-dd"),
      to: format(clickedDate, "yyyy-MM-dd"),
    });
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && draft?.from) {
      // Dismissed with only a start date picked: use it as the end date too.
      const dateStr = format(draft.from, "yyyy-MM-dd");
      onChange?.({ from: dateStr, to: dateStr });
    }
    setDraft(undefined);
    setOpen(next);
  };

  const handleClear = () => {
    setDraft(undefined);
    onChange?.(null);
    setOpen(false);
  };

  const today = new Date();
  const hasValue = !!(value?.from || value?.to);

  return (
    <div
      className={cn(
        "flex h-9 w-full items-center overflow-hidden rounded-md border bg-background text-sm font-normal shadow-xs transition-colors outline-none",
        "dark:border-input dark:bg-input/30",
        "hover:bg-accent hover:text-accent-foreground dark:hover:bg-input/50",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        !displayText && "text-muted-foreground",
        className,
      )}
    >
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 text-left"
          >
            <CalendarIcon className="size-4 shrink-0 opacity-50" />
            <span className="truncate">{displayText ?? placeholder ?? ""}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            numberOfMonths={numberOfMonths}
            selected={draft ?? toDateRange(value)}
            onSelect={handleSelect}
            locale={dayPicker}
            captionLayout="dropdown"
            startMonth={new Date(today.getFullYear() - 5, 0)}
            endMonth={new Date(today.getFullYear() + 5, 11)}
          />
        </PopoverContent>
      </Popover>
      {hasValue && !open && (
        <button
          type="button"
          aria-label={clearLabel}
          title={clearLabel}
          onClick={handleClear}
          className="mr-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <XMarkIcon className="size-4" />
        </button>
      )}
    </div>
  );
}

export { DateRangePicker };
export type { DateRangeValue };
