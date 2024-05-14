import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardHeaderActions, CardHeaderText, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { useController } from "./controller-provider";
import { IScheduleSong } from "@/types";
import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import ChevronUpDownIcon from "@heroicons/react/24/solid/ChevronUpDownIcon";
import SlideSelector from "./slide-selector";
import PlayIcon from "@heroicons/react/24/solid/PlayIcon";

type SongSearchResultParams = {
  item: IScheduleSong
}

export default function SongSearchResult({
  item,
}: SongSearchResultParams) {
  const {
    addToSchedule,
    setScheduleItem,
  } = useController();

  const addSong = () => {
    addToSchedule(item);
  }

  const loadSong = () => {
    setScheduleItem(item);
  }

  const [isExpanded, setExpanded] = useState<boolean>(false);

  return (
    <Card>
      <Collapsible
        open={isExpanded}
        onOpenChange={setExpanded}
        className="w-full">
        <CardHeader>
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
            <Button size="sm" title="Add song to schedule" onClick={addSong}>
              <PlusIcon className="size-3"></PlusIcon>
            </Button>
            <Button size="sm" title="Load song" onClick={loadSong}>
              <PlayIcon className="size-3"></PlayIcon>
            </Button>
          </CardHeaderActions>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="bg-background pt-3">
            {item?.slides.map((s, ix) => (
              <SlideSelector key={ix} slide={s} index={ix} disabled={true}></SlideSelector>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
