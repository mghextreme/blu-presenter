import ScheduleItem from "./schedule-item";
import { useController } from "@/hooks/controller.provider";

export default function SchedulePanel() {

  const {
    schedule,
    scheduleItem,
    selection,
  } = useController();

  return (
    <div
      id="schedule"
      className="w-1/3 p-3 bg-background rounded flex flex-col justify-start items-stretch overflow-y-auto gap-3">
      {schedule.map((item, ix) => (
        <ScheduleItem key={`${item.id}-${ix}`} item={item}
                      selected={ix === selection.scheduleItem && scheduleItem?.id === item.id}
                      index={ix}></ScheduleItem>
      ))}
    </div>
  );
}
