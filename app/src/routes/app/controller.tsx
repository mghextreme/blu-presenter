"use client"

import PlanPanel from "@/components/controller/plan-panel";
import SchedulePanel from "@/components/controller/schedule-panel";
import LivePanel from "@/components/controller/live-panel";

export default function Controller() {
  return (
    <>
      <div id="controller" className="p-3 flex flex-1 gap-3 overflow-hidden">
        <PlanPanel></PlanPanel>
        <SchedulePanel></SchedulePanel>
        <LivePanel></LivePanel>
      </div>
    </>
  );
}
