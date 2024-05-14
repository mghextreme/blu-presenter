import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardHeaderActions, CardHeaderText, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { useController } from "./controller-provider";
import { IScheduleItem } from "@/types";
import PlayIcon from "@heroicons/react/24/solid/PlayIcon";
import ChevronUpDownIcon from "@heroicons/react/24/solid/ChevronUpDownIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import SlideSelector from "./slide-selector";

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
  const {
    setScheduleItem,
    removeFromSchedule,
  } = useController();

  const loadSong = () => {
    setScheduleItem(index);
  }

  const removeSong = () => {
    removeFromSchedule(index);
  }

  const [isExpanded, setExpanded] = useState<boolean>(false);

  return (
    <Card>
      <Collapsible
        open={isExpanded}
        onOpenChange={setExpanded}
        className="w-full">
        <CardHeader className={selected ? 'bg-selected' : ''}>
          <CardHeaderText>
            <CardTitle>{item?.title}</CardTitle>
            <CardDescription>{item?.artist}</CardDescription>
          </CardHeaderText>
          <CardHeaderActions>
            <CollapsibleTrigger asChild>
              <Button size="sm" title="Expand">
                <ChevronUpDownIcon className="size-4"></ChevronUpDownIcon>
              </Button>
            </CollapsibleTrigger>
            <Button size="sm" title="Remove song" onClick={removeSong}>
              <TrashIcon className="size-3"></TrashIcon>
            </Button>
            <Button size="sm" title="Load song" onClick={loadSong}>
              <PlayIcon className="size-3"></PlayIcon>
            </Button>
          </CardHeaderActions>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="bg-background pt-3">
            {item?.slides.map((s, ix) => (
              <SlideSelector key={ix} slide={s} index={ix} scheduleItemIndex={index}></SlideSelector>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
