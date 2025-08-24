"use client"

import { PlanPanel } from "@/components/controller/plan-panel";
import { SchedulePanel } from "@/components/controller/schedule-panel";
import { LivePanel } from "@/components/controller/live-panel";
import { SearchProvider } from "@/hooks/search.provider";
import { useServices } from "@/hooks/services.provider";

export default function Controller() {
  const { songsService } = useServices();

  return (
    <>
      <div id="controller" className="p-3 flex flex-1 gap-3 overflow-hidden">
        <SearchProvider songsService={songsService}>
          <PlanPanel></PlanPanel>
        </SearchProvider>
        <SchedulePanel></SchedulePanel>
        <LivePanel></LivePanel>
      </div>
    </>
  );
}
