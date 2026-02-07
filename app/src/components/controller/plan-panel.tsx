import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanSchedules } from "./plan-schedules";
import { PlanSearch } from "./plan-search";
import { PlanText } from "./plan-text";
import { PlanComment } from "./plan-comment";
import { PlanConfiguration } from "./plan-configuration";
import CalendarIcon from "@heroicons/react/24/solid/CalendarIcon";
import MusicalNoteIcon from "@heroicons/react/24/solid/MusicalNoteIcon";
import Bars3BottomLeftIcon from "@heroicons/react/24/solid/Bars3BottomLeftIcon";
import ChatBubbleLeftEllipsisIcon from "@heroicons/react/24/solid/ChatBubbleLeftEllipsisIcon";
import Cog6ToothIcon from "@heroicons/react/24/solid/Cog6ToothIcon";

type PlanPanelProps = {
  showConfiguration?: boolean;
  showSchedules?: boolean;
  showOpen?: boolean;
}

export function PlanPanel({ showConfiguration = true, showSchedules = true, showOpen = true }: PlanPanelProps) {

  const { t } = useTranslation("controller");

  return (
    <div
      id="plan"
      className="flex flex-col justify-start items-stretch p-3 h-full">
      <Tabs defaultValue={showSchedules ? 'schedules' : 'search'} className="flex flex-col h-full">
        <TabsList className="w-full">
          {showSchedules && (
            <TabsTrigger value="schedules" title={t('plan.tabs.schedules')}><CalendarIcon className="size-4" /></TabsTrigger>
          )}
          <TabsTrigger value="search" title={t('plan.tabs.searchSongs')}><MusicalNoteIcon className="size-4" /></TabsTrigger>
          <TabsTrigger value="text" title={t('plan.tabs.text')}><Bars3BottomLeftIcon className="size-4" /></TabsTrigger>
          <TabsTrigger value="comment" title={t('plan.tabs.comment')}><ChatBubbleLeftEllipsisIcon className="size-4" /></TabsTrigger>
          {showConfiguration && (
            <TabsTrigger value="configuration" title={t('plan.tabs.configuration')}><Cog6ToothIcon className="size-4" /></TabsTrigger>
          )}
        </TabsList>
        <hr className="border-t border-[1px]" />
        <div className="h-full">
          {showSchedules && (
            <TabsContent value="schedules" className="flex flex-col justify-stretch h-full">
              <PlanSchedules />
            </TabsContent>
          )}
          <TabsContent value="search" className="flex flex-col justify-stretch h-full">
            <PlanSearch showOpen={showOpen} />
          </TabsContent>
          <TabsContent value="text" className="h-full">
            <PlanText showOpen={showOpen} />
          </TabsContent>
          <TabsContent value="comment" className="h-full">
            <PlanComment />
          </TabsContent>
          {showConfiguration && (
            <TabsContent value="configuration" className="h-full">
              <PlanConfiguration />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
