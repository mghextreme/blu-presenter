import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { ISongWithRole } from "@/types";
import { useServices } from "@/hooks/services.provider";
import { useController } from "@/hooks/controller.provider";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BasicSearchForm } from "../app/search/basic-search-form";
import { SearchResultsList } from "../app/search/search-results-list";
import { AdvancedSearchForm } from "../app/search/advanced-search-form";
import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import PlayIcon from "@heroicons/react/24/solid/PlayIcon";

export function PlanSearch() {

  const { t } = useTranslation("controller");

  const { organizations } = useAuth();
  const { songsService } = useServices();
  const {
    addToSchedule,
    setScheduleItem,
  } = useController();

  const orgIndexMap: {[orgId: number]: number} = {};
  for (let i = 0; i < organizations.length; i++) {
    orgIndexMap[organizations[i].id] = i;
  }

  const getButtonOrgIndex = (item: ISongWithRole) => {
    if (!item.organization) {
      return -1;
    }

    return orgIndexMap[item.organization.id];
  }

  const getButtonActions = (item: ISongWithRole) => {
    return (
      <>
        <Button size="sm" title={t('songs.addToSchedule')} onClick={() => addToSchedule(songsService.toScheduleSong(item))}>
          <PlusIcon className="size-3"></PlusIcon>
        </Button>
        <Button size="sm" title={t('songs.open')} onClick={() => setScheduleItem(songsService.toScheduleSong(item))}>
          <PlayIcon className="size-3"></PlayIcon>
        </Button>
      </>
    );
  }

  return (
    <>
      <Tabs defaultValue="basic">
        <TabsList className="w-full">
          <TabsTrigger value="basic">{t('plan.search.basic')}</TabsTrigger>
          <TabsTrigger value="advanced">{t('plan.search.advanced')}</TabsTrigger>
        </TabsList>
        <TabsContent value="basic">
          <BasicSearchForm />
        </TabsContent>
        <TabsContent value="advanced">
          <AdvancedSearchForm />
        </TabsContent>
      </Tabs>
      <div
        className="mt-3 flex-1 overflow-y-auto flex flex-col justify-start items-stretch overflow-y-auto gap-3">
        <hr className="border-t border-[1px]" />
        <SearchResultsList getActions={getButtonActions} getColorIndex={getButtonOrgIndex} />
      </div>
    </>
  )
}
