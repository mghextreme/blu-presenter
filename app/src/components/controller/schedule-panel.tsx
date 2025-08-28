import { Button } from "@/components/ui/button";
import { useController } from "@/hooks/controller.provider";
import { ScheduleItem } from "./schedule-item";
import { useTranslation } from "react-i18next";
import InboxArrowDownIcon from "@heroicons/react/24/solid/InboxArrowDownIcon"
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";

export function SchedulePanel() {

  const { t } = useTranslation('controller');

  const {
    schedule,
    scheduleItem,
    addToSchedule,
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

  return (
    <div
      id="schedule"
      className="w-1/3 bg-background rounded flex flex-col justify-start items-stretch">
      <div className="p-3 pb-0 flex gap-2 flex-0 justify-between items-center">
        {schedule.length === 0 && hasLastSession && (
          <Button className="flex-1" onClick={loadLastSession} title={t('schedule.actions.restoreLastSession')}>
            <InboxArrowDownIcon className="size-4" />
          </Button>
        )}
        <Button className="flex-1" variant={"secondary"} onClick={removeAllFromSchedule} title={t('schedule.actions.clear')}>
          <TrashIcon className="size-4"></TrashIcon>
        </Button>
      </div>
      <div id="schedule-items" className="p-3 pt-0 flex flex-col justify-start overflow-y-auto">
      {schedule.map((item, ix) => (
        <ScheduleItem key={`${item.id}-${ix}`} item={item}
                      selected={ix === selection.scheduleItem && scheduleItem?.id === item.id}
                      index={ix}></ScheduleItem>
      ))}
      </div>
    </div>
  );
}
