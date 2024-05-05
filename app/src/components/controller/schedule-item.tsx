import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardHeaderActions, CardHeaderText, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { useController } from "./controller-provider";
import { IScheduleItem } from "@/types";
import PlayIcon from "@heroicons/react/24/solid/PlayIcon";
import ChevronUpDownIcon from "@heroicons/react/24/solid/ChevronUpDownIcon";
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
    mode,
    setScheduleItem,
  } = useController();

  const loadSong = () => {
    setScheduleItem(index);
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
            <Button size="sm" title="Load song" onClick={loadSong}>
              <PlayIcon className="size-3"></PlayIcon>
            </Button>
          </CardHeaderActions>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="bg-background pt-3">
            {item?.slides.map((s, ix) => (
              <SlideSelector key={ix} slide={s} index={ix} color="background"></SlideSelector>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
