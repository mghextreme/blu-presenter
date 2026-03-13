import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IScheduleItem, IScheduleSong } from "@/types";
import ChevronLeftIcon from "@heroicons/react/24/solid/ChevronLeftIcon";
import ChevronRightIcon from "@heroicons/react/24/solid/ChevronRightIcon";
import { useTranslation } from "react-i18next";

interface RehearsalNavProps {
  items: IScheduleItem[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function RehearsalNav({
  items,
  currentIndex,
  onSelect,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: RehearsalNavProps) {
  const { t } = useTranslation("schedules");

  return (
    <div className="flex items-center gap-x-2 px-2 sm:px-8 py-3 max-w-3xl">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onPrevious}
        disabled={!hasPrevious}
        title={t('rehearsal.previous')}
      >
        <ChevronLeftIcon className="size-4" />
      </Button>
      <Select
        value={String(currentIndex)}
        onValueChange={(value) => onSelect(Number(value))}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={t('rehearsal.selectSong')} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item, index) => {
            const isSong = item.type === 'song';
            const songItem = isSong ? (item as IScheduleSong) : null;
            const label = isSong
              ? `${index + 1}. ${item.title}${songItem?.artist ? ` - ${songItem.artist}` : ''}`
              : `${index + 1}. ${item.title || t('view.untitled')}`;

            return (
              <SelectItem
                key={`nav-item-${index}`}
                value={String(index)}
                disabled={!isSong}
              >
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onNext}
        disabled={!hasNext}
        title={t('rehearsal.next')}
      >
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>
  );
}
