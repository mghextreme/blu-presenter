import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useController } from "@/hooks/controller.provider";
import { Button } from "@/components/ui/button";
import { Sortable, SortableContent, SortableItem, SortableItemHandle } from "@/components/ui/sortable";
import { ScheduleItem } from "./schedule-item";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import InboxArrowDownIcon from "@heroicons/react/24/solid/InboxArrowDownIcon"
import ArrowsUpDownIcon from "@heroicons/react/20/solid/ArrowsUpDownIcon";
import { ISortableScheduleItem } from "@/types";

export function SchedulePanel() {

  const { t } = useTranslation('controller');

  const {
    schedule,
    scheduleItem,
    addToSchedule,
    moveItemInSchedule,
    removeAllFromSchedule,
    selection,
  } = useController();

  const lastSessionSchedule = localStorage.getItem("controllerSchedule");
  let lastSessionScheduleParsed = [];
  try {
    if (lastSessionSchedule !== null) {
      lastSessionScheduleParsed = JSON.parse(lastSessionSchedule);
    }
  } catch (e) {
    localStorage.removeItem("controllerSchedule");
  }
  const hasLastSession = lastSessionScheduleParsed.length > 0;

  const loadLastSession = () => {
    addToSchedule(lastSessionScheduleParsed);
  };

  const [sorting, setSorting] = useState(false);
  const toggleSorting = () => {
    setSorting(!sorting);
  };

  const handleDrag = ({ active, over }) => {
    const activeIndex = active.data.current.sortable.index;
    const overIndex = over.data.current.sortable.index;
    if (activeIndex === overIndex) return;

    moveItemInSchedule(activeIndex, overIndex);
  };

  return (
    <div
      id="schedule"
      className="flex flex-col justify-start items-stretch h-full">
      <div className="p-3 pb-0 flex gap-2 flex-0 justify-between items-center">
        {schedule.length > 1 && <Button className="flex-1" variant={sorting ? "default" : "secondary"} onClick={toggleSorting} title={t('schedule.actions.sort')}>
          <ArrowsUpDownIcon className="size-4" />
        </Button>}
        {schedule.length === 0 && hasLastSession && (
          <Button className="flex-1" onClick={loadLastSession} title={t('schedule.actions.restoreLastSession')}>
            <InboxArrowDownIcon className="size-4" />
          </Button>
        )}
        {!sorting && <Button className="flex-1" variant={"secondary"} onClick={removeAllFromSchedule} title={t('schedule.actions.clear')}>
          <TrashIcon className="size-4" />
        </Button>}
      </div>
      <Sortable
        value={schedule as ISortableScheduleItem[]}
        onDragEnd={handleDrag}
        getItemValue={(item) => item.uniqueId ?? item.id}
      >
        <div className="p-3 pt-0 flex flex-col justify-stretch overflow-y-auto">
          <SortableContent asChild>
            <div id="schedule-items" className="flex-1">
            {(schedule as ISortableScheduleItem[]).map((item, ix) => (
              <SortableItem
                key={`schedule[${ix}]`}
                value={item.uniqueId ?? item.id}
                asChild>
                <div key={item.uniqueId ?? item.id}>
                  <ScheduleItem
                    item={item}
                    selected={ix === selection.scheduleItem && scheduleItem?.id === item.id}
                    index={ix}
                    buttonsOverride={sorting ? (
                      <SortableItemHandle asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          title={t('schedule.actions.reorder')}
                        >
                          <ArrowsUpDownIcon className="size-3" />
                        </Button>
                      </SortableItemHandle>
                    ) : null} />
                  </div>
              </SortableItem>
            ))}
            </div>
          </SortableContent>
        </div>
      </Sortable>
    </div>
  );
}
