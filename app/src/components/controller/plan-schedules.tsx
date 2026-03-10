import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { format, parse } from "date-fns";
import { useServices } from "@/hooks/useServices";
import { useController } from "@/hooks/useController";
import { ISchedule } from "@/types";
import { getLocaleConfig } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardHeaderActions, CardHeaderText, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ChevronUpDownIcon from "@heroicons/react/24/solid/ChevronUpDownIcon";
import InboxArrowDownIcon from "@heroicons/react/24/solid/InboxArrowDownIcon";

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function PlanSchedules() {
  const { t, i18n } = useTranslation("controller");
  const { schedulesService, songsService } = useServices();
  const { schedule, replaceSchedule } = useController();

  const [allSchedules, setAllSchedules] = useState<ISchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const lang = i18n.language?.substring(0, 2) ?? "en";
  const { dateFns, formatStr } = getLocaleConfig(lang);
  const todayString = getTodayString();

  useEffect(() => {
    setLoading(true);
    schedulesService
      .getAll()
      .then((data) => setAllSchedules(data ?? []))
      .catch(() => setAllSchedules([]))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";
    try {
      const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
      return format(parsed, formatStr, { locale: dateFns });
    } catch {
      return dateStr;
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return allSchedules;

    const query = search.toLowerCase();
    return allSchedules.filter((s) => {
      const titleMatch = s.title.toLowerCase().includes(query);
      const dateMatch = s.date
        ? formatDate(s.date).toLowerCase().includes(query) ||
          s.date.toLowerCase().includes(query)
        : false;
      return titleMatch || dateMatch;
    });
  }, [allSchedules, search, lang]);

  const { todaySchedules, otherSchedules } = useMemo(() => {
    const today: ISchedule[] = [];
    const other: ISchedule[] = [];
    for (const s of filtered) {
      if (s.date === todayString) {
        today.push(s);
      } else {
        other.push(s);
      }
    }
    return { todaySchedules: today, otherSchedules: other };
  }, [filtered, todayString]);

  const handleLoad = async (scheduleId: number) => {
    const fullSchedule = await schedulesService.fetchById(scheduleId);
    if (fullSchedule?.items) {
      replaceSchedule(songsService.resolveScheduleItems(fullSchedule.items));
    }
  };

  const hasControllerItems = schedule.length > 0;

  return (
    <div className="flex flex-col h-full gap-3">
      <Input
        placeholder={t("plan.schedules.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="text-sm text-muted-foreground text-center py-4">...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            {t("plan.schedules.noResults")}
          </div>
        )}
        {!loading && (
          <div className="flex flex-col gap-3">
            {todaySchedules.length > 0 && (
              <>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("plan.schedules.today")}
                </span>
                {todaySchedules.map((s) => (
                  <ScheduleListItem
                    key={s.id}
                    schedule={s}
                    formatDate={formatDate}
                    onLoad={handleLoad}
                    hasControllerItems={hasControllerItems}
                    t={t}
                    highlight
                  />
                ))}
                {otherSchedules.length > 0 && (
                  <hr className="border-t border-[1px]" />
                )}
              </>
            )}
            {otherSchedules.map((s) => (
              <ScheduleListItem
                key={s.id}
                schedule={s}
                formatDate={formatDate}
                onLoad={handleLoad}
                hasControllerItems={hasControllerItems}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type ScheduleListItemProps = {
  schedule: ISchedule;
  formatDate: (date: string | null | undefined) => string;
  onLoad: (scheduleId: number) => void;
  hasControllerItems: boolean;
  t: ReturnType<typeof useTranslation>["t"];
  highlight?: boolean;
};

function ScheduleListItem({
  schedule,
  formatDate,
  onLoad,
  hasControllerItems,
  t,
  highlight = false,
}: ScheduleListItemProps) {
  const [isExpanded, setExpanded] = useState(false);
  const itemCount = schedule.items?.length ?? 0;

  const loadButton = (
    <Button
      size="sm"
      title={t("plan.schedules.load")}
      onClick={!hasControllerItems ? () => onLoad(schedule.id) : undefined}
    >
      <InboxArrowDownIcon className="size-3" />
    </Button>
  );

  return (
    <Card variant={highlight ? "default" : "default"}>
      <Collapsible open={isExpanded} onOpenChange={setExpanded} className="w-full">
        <CardHeader className={highlight ? "bg-selected" : undefined}>
          <CardHeaderText>
            <CardTitle>{schedule.title}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              {schedule.date ? formatDate(schedule.date) : ""}
              {itemCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {itemCount}
                </Badge>
              )}
            </CardDescription>
          </CardHeaderText>
          <CardHeaderActions>
            {itemCount > 0 && (
              <CollapsibleTrigger asChild>
                <Button size="sm" title={t("schedule.items.expand")}>
                  <ChevronUpDownIcon className="size-4" />
                </Button>
              </CollapsibleTrigger>
            )}
            {hasControllerItems ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  {loadButton}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("plan.schedules.confirmReplace.title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("plan.schedules.confirmReplace.description")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("plan.schedules.confirmReplace.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={() => onLoad(schedule.id)}>
                      {t("plan.schedules.confirmReplace.confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              loadButton
            )}
          </CardHeaderActions>
        </CardHeader>
        {itemCount > 0 && (
          <CollapsibleContent>
            <CardContent className="bg-background py-3">
              <ul className="flex flex-col gap-1">
                {schedule.items.map((item, ix) => (
                  <li key={ix} className="text-sm text-muted-foreground truncate">
                    <span className="text-xs text-muted-foreground/60 me-2">{ix + 1}.</span>
                    {item.type === 'song' ? `${item.title} | ${(item as any).artist}` : item.title || "—"}
                  </li>
                ))}
              </ul>
            </CardContent>
          </CollapsibleContent>
        )}
      </Collapsible>
    </Card>
  );
}
