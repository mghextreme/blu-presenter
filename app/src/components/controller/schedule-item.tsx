import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardHeaderActions, CardHeaderText, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { useController } from "@/hooks/controller.provider";
import { IScheduleItem, IScheduleSong, IScheduleText } from "@/types";
import PlayIcon from "@heroicons/react/24/solid/PlayIcon";
import ChevronUpDownIcon from "@heroicons/react/24/solid/ChevronUpDownIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { SlideSelector } from "./slide-selector";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type ScheduleItemParams = {
  item: IScheduleItem
  selected?: boolean
  index: number
}

export default function ScheduleItem({
  item,
  selected = false,
  index,
}: ScheduleItemParams) {

  const { t } = useTranslation("controller");

  const {
    setScheduleItem,
    removeFromSchedule,
  } = useController();

  const loadItem = () => {
    setScheduleItem(index);
  }

  const removeItem = () => {
    removeFromSchedule(index);
  }

  const [isExpanded, setExpanded] = useState<boolean>(false);
  const song = item as IScheduleSong;
  const text = item as IScheduleText;

  return (
    <Card variant={item.type === 'comment' ? 'secondary' : 'default'}>
      <Collapsible
        open={isExpanded}
        onOpenChange={setExpanded}
        className="w-full">
        <CardHeader className={cn(
          item.type === 'comment' && 'py-2',
          selected && (item.type === 'comment' ? 'bg-gray-700' : 'bg-selected'),
        )}>
          <CardHeaderText>
            <CardTitle className={cn(
              item.type === 'comment' && 'font-normal text-sm text-muted-foreground'
            )}>{item?.title}</CardTitle>
            {item.type === 'song' && !!song?.artist && (
              <CardDescription>{song?.artist}</CardDescription>
            )}
            {item.type === 'text' && !!text?.subtitle && (
              <CardDescription>{text?.subtitle}</CardDescription>
            )}
          </CardHeaderText>
          <CardHeaderActions>
            {item.type === 'song' && (
              <CollapsibleTrigger asChild>
                <Button size="sm" title={t('songs.expand')}>
                  <ChevronUpDownIcon className="size-4"></ChevronUpDownIcon>
                </Button>
              </CollapsibleTrigger>
            )}
            <Button size="sm" title={t('songs.removeFromSchedule')} onClick={removeItem} variant={item.type === 'comment' ? 'secondary' : 'default'}>
              <TrashIcon className="size-3"></TrashIcon>
            </Button>
            <Button size="sm" title={t('songs.open')} onClick={loadItem} variant={item.type === 'comment' ? 'secondary' : 'default'}>
              <PlayIcon className="size-3"></PlayIcon>
            </Button>
          </CardHeaderActions>
        </CardHeader>
        {item.type === 'song' && item?.slides && (
          <CollapsibleContent>
            <CardContent className="bg-background pt-3">
              {item?.slides.map((s, ix) => (
                <SlideSelector key={ix} slide={s} index={ix} scheduleItemIndex={index}></SlideSelector>
              ))}
            </CardContent>
          </CollapsibleContent>
        )}
      </Collapsible>
    </Card>
  )
}
