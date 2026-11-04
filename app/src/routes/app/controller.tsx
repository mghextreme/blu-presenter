"use client"

import { PlanPanel } from "@/components/controller/plan-panel";
import { SchedulePanel } from "@/components/controller/schedule-panel";
import { LivePanel } from "@/components/controller/live-panel";
import { SearchProvider } from "@/hooks/search.provider";
import { useServices } from "@/hooks/useServices";
import { useControllerPanels, ControllerPanel } from "@/hooks/useControllerPanels";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function Controller() {

  const { t } = useTranslation("controller");

  const { songsService } = useServices();

  const activePanel = useControllerPanels((s) => s.activePanel);
  const setActivePanel = useControllerPanels((s) => s.setActivePanel);
  const planTab = useControllerPanels((s) => s.planTab);
  const setPlanTab = useControllerPanels((s) => s.setPlanTab);

  return (
    <>
      <div id="controller" className="p-3 flex flex-1 gap-3 overflow-hidden">
        <title>{t('title') + ' - BluPresenter'}</title>
        <SearchProvider songsService={songsService}>
          <div className={cn(
            'hidden lg:block w-full lg:w-1/3 bg-background rounded overflow-hidden',
            activePanel === 'plan' && 'block'
          )}>
            <PlanPanel value={planTab} onValueChange={setPlanTab} />
          </div>
          <div className={cn(
            'hidden lg:block w-full lg:w-1/3 bg-background rounded overflow-hidden',
            activePanel === 'schedule' && 'block'
          )}>
            <SchedulePanel />
          </div>
          <div className={cn(
            'hidden lg:block w-full lg:w-1/3 bg-background rounded overflow-hidden',
            activePanel === 'live' && 'block'
          )}>
            <LivePanel />
          </div>
        </SearchProvider>
      </div>
      <div className="p-3 pt-0 lg:hidden">
        <Tabs value={activePanel} onValueChange={(value) => setActivePanel(value as ControllerPanel)}>
          <TabsList className="w-full">
            <TabsTrigger value="plan" title={t('tabs.plan')}>{t('tabs.plan')}</TabsTrigger>
            <TabsTrigger value="schedule" title={t('tabs.schedule')}>{t('tabs.schedule')}</TabsTrigger>
            <TabsTrigger value="live" title={t('tabs.live')}>{t('tabs.live')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </>
  );
}
