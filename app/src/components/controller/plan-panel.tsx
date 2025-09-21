import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanSearch } from "./plan-search";
import { PlanText } from "./plan-text";
import { PlanComment } from "./plan-comment";
import { PlanConfiguration } from "./plan-configuration";
import MusicalNoteIcon from "@heroicons/react/24/solid/MusicalNoteIcon";
import Bars3BottomLeftIcon from "@heroicons/react/24/solid/Bars3BottomLeftIcon";
import ChatBubbleLeftEllipsisIcon from "@heroicons/react/24/solid/ChatBubbleLeftEllipsisIcon";
import Cog6ToothIcon from "@heroicons/react/24/solid/Cog6ToothIcon";

export function PlanPanel() {

  const { t } = useTranslation("controller");

  return (
    <div
      id="plan"
      className="w-1/3 bg-background rounded flex flex-col justify-start items-stretch overflow-hidden p-3">
      <Tabs defaultValue="search">
        <TabsList className="w-full">
          <TabsTrigger value="search" title={t('plan.tabs.searchSongs')}><MusicalNoteIcon className="size-4" /></TabsTrigger>
          <TabsTrigger value="text" title={t('plan.tabs.text')}><Bars3BottomLeftIcon className="size-4" /></TabsTrigger>
          <TabsTrigger value="comment" title={t('plan.tabs.comment')}><ChatBubbleLeftEllipsisIcon className="size-4" /></TabsTrigger>
          <TabsTrigger value="configuration" title={t('plan.tabs.configuration')}><Cog6ToothIcon className="size-4" /></TabsTrigger>
        </TabsList>
        <hr className="border-t border-[1px]" />
        <TabsContent value="search">
          <PlanSearch />
        </TabsContent>
        <TabsContent value="text">
          <PlanText />
        </TabsContent>
        <TabsContent value="comment">
          <PlanComment />
        </TabsContent>
        <TabsContent value="configuration">
          <PlanConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  );
}
