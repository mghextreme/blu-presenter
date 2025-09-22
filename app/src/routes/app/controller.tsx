"use client"

import { PlanPanel } from "@/components/controller/plan-panel";
import { SchedulePanel } from "@/components/controller/schedule-panel";
import { LivePanel } from "@/components/controller/live-panel";
import { SearchProvider } from "@/hooks/search.provider";
import { useServices } from "@/hooks/services.provider";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ValidTab = 'plan' | 'schedule' | 'live';

export default function Controller() {

  const { t } = useTranslation("controller");

  const { songsService } = useServices();

  const [activeTab, setActiveTab] = useState<ValidTab>("plan");

  return (
    <>
      <div id="controller" className="p-3 flex flex-1 gap-3 overflow-hidden">
        <title>{t('title') + ' - BluPresenter'}</title>
        <SearchProvider songsService={songsService}>
          <div className={cn(
            'hidden lg:block w-full lg:w-1/3 bg-background rounded overflow-hidden',
            activeTab === 'plan' && 'block'
          )}>
            <PlanPanel />
          </div>
          <div className={cn(
            'hidden lg:block w-full lg:w-1/3 bg-background rounded overflow-hidden',
            activeTab === 'schedule' && 'block'
          )}>
            <SchedulePanel />
          </div>
          <div className={cn(
            'hidden lg:block w-full lg:w-1/3 bg-background rounded overflow-hidden',
            activeTab === 'live' && 'block'
          )}>
            <LivePanel />
          </div>
        </SearchProvider>
      </div>
      <div className="p-3 pt-0 lg:hidden">
        <Tabs defaultValue="plan" onValueChange={(value) => setActiveTab(value as ValidTab)}>
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
