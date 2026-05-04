import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ISongWithRole } from "@/types";
import { useServices } from "@/hooks/useServices";
import { useController } from "@/hooks/useController";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicSearchForm } from "@/components/app/search/basic-search-form";
import { SearchResultsList } from "@/components/app/search/search-results-list";
import { AdvancedSearchForm } from "@/components/app/search/advanced-search-form";
import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import PlayIcon from "@heroicons/react/24/solid/PlayIcon";

type PlanSearchProps = {
  showOpen?: boolean;
}

export function PlanSearch({ showOpen = true }: PlanSearchProps) {

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
        <Button type="button" size="sm" title={t('schedule.items.addToSchedule')} onClick={() => {
          addToSchedule(songsService.toScheduleSong(item));
          toast.success(t('plan.search.addedToSchedule', { title: item.title }));
        }}>
          <PlusIcon className="size-3"></PlusIcon>
        </Button>
        {showOpen && (
          <Button type="button" size="sm" title={t('schedule.items.open')} onClick={() => setScheduleItem(songsService.toScheduleSong(item))}>
            <PlayIcon className="size-3"></PlayIcon>
          </Button>
        )}
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
          <BasicSearchForm includeBlocks={true} />
        </TabsContent>
        <TabsContent value="advanced">
          <AdvancedSearchForm includeBlocks={true} />
        </TabsContent>
      </Tabs>
      <hr className="border-t border-[1px] my-3" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3">
          <SearchResultsList getActions={getButtonActions} getColorIndex={getButtonOrgIndex} />
        </div>
      </div>
    </>
  )
}
