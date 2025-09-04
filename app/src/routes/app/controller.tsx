"use client"

import { PlanPanel } from "@/components/controller/plan-panel";
import { SchedulePanel } from "@/components/controller/schedule-panel";
import { LivePanel } from "@/components/controller/live-panel";
import { SearchProvider } from "@/hooks/search.provider";
import { useServices } from "@/hooks/services.provider";
import { useTranslation } from "react-i18next";

export default function Controller() {

  const { t } = useTranslation("controller");

  const { songsService } = useServices();

  return (
    <div id="controller" className="p-3 flex flex-1 gap-3 overflow-hidden">
      <title>{t('title') + ' - BluPresenter'}</title>
      <SearchProvider songsService={songsService}>
        <PlanPanel></PlanPanel>
      </SearchProvider>
      <SchedulePanel></SchedulePanel>
      <LivePanel></LivePanel>
    </div>
  );
}
