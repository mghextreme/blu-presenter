import { Card, CardDescription, CardHeader, CardHeaderActions, CardHeaderText, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ISchedule, IScheduleItem, IScheduleSong, IScheduleText } from "@/types";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import MusicalNoteIcon from "@heroicons/react/24/solid/MusicalNoteIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import ShareIcon from "@heroicons/react/24/solid/ShareIcon";
import PlayIcon from "@heroicons/react/24/solid/PlayIcon";
import { parse, format } from "date-fns";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getLocaleConfig } from "@/components/ui/date-picker";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function ViewSchedule() {
  const { t, i18n } = useTranslation("schedules");
  const { isLoggedIn } = useAuth();
  const params = useParams();
  const data = useLoaderData() as ISchedule | null;

  if (!data) {
    throw new Error("Can't find schedule");
  }

  const lang = i18n.language?.substring(0, 2) ?? "en";
  const { dateFns, formatStr } = getLocaleConfig(lang);

  let formattedDate = "";
  if (data.date) {
    const parsed = parse(data.date, "yyyy-MM-dd", new Date());
    formattedDate = format(parsed, formatStr, { locale: dateFns });
  }

  const getSongLink = (item: IScheduleItem): string | null => {
    if (item.type !== "song") {
      return null;
    }

    const songItem = item as IScheduleSong;
    if (!params.secret) {
      return `/app/songs/${songItem.id}/view`;
    }

    let songUrl = `/shared/view/${songItem.id}/`;
    if (songItem.secret) {
      songUrl += songItem.secret;
    }

    return songUrl;
  };

  const getRehearsalLink = (): string => {
    if (params.secret) {
      return `/shared/schedules/${data.id}/${params.secret}/rehearsal`;
    }
    return `/app/schedules/${data.id}/rehearsal`;
  };

  const hasSongs = data.items?.some(item => item.type === 'song');

  const copyShareableUrlToClipboard = async () => {
    const currentUrl = new URL(window.location.href);
    const shareUrl = `${currentUrl.protocol}//${currentUrl.host}/shared/schedules/${data.id}/${data.secret ?? ''}`;
    const clipboard = navigator.clipboard;
    if (!!clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('message.share.title'), {
        description: t('message.share.description'),
      });
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <>
      <title>{t("title.view", { name: data.title }) + " - BluPresenter"}</title>
      <div className="flex items-center px-2 sm:px-8 py-3 bg-slate-200 dark:bg-slate-900 gap-x-2">
        <span className="text-sm">{t("list.title")}</span>
        <div className="buttons flex-1 flex justify-end gap-x-2">
          <Button
            type="button"
            size="sm"
            title={t("actions.share")}
            onClick={copyShareableUrlToClipboard}>
            <ShareIcon className="size-3" />
          </Button>
          {hasSongs && (
            <Button type="button" size="sm" title={t("actions.rehearsal")} asChild>
              <Link to={getRehearsalLink()}>
                <PlayIcon className="size-3" />
              </Link>
            </Button>
          )}
          {isLoggedIn && (
            <Button type="button" size="sm" title={t("actions.edit")} asChild>
              <Link to={`/app/schedules/${data.id}/edit`}>
                <PencilIcon className="size-3" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="p-2 sm:p-8 max-w-3xl">
        <h1 className="text-3xl mb-2">{data.title}</h1>
        {formattedDate && <h2 className="text-lg mb-4 opacity-50">{formattedDate}</h2>}

        <div className="space-y-3">
          {data.items?.map((item, index) => {
            const songItem = item.type === "song" ? (item as IScheduleSong) : null;
            const textItem = item as IScheduleText;
            const songLink = getSongLink(item);
            const hasChords = songItem?.blocks?.some(block => block.chords && block.chords.length > 0);

            return (
              <Card key={`schedule-item-${index}`} variant={item.type === "comment" ? "secondary" : "default"}>
                <CardHeader>
                  <CardHeaderText>
                    <CardTitle>{item.title || t("view.untitled")}</CardTitle>
                    {songItem && !!songItem.artist && (
                      <CardDescription>{songItem.artist}</CardDescription>
                    )}
                    {item.type === "text" && !!textItem.subtitle && (
                      <CardDescription>{textItem.subtitle}</CardDescription>
                    )}
                  </CardHeaderText>
                  <CardHeaderActions>
                    {songItem && (
                      <Badge className="me-3 p-1 my-auto" variant={hasChords ? "color-4" : "outline"} title={hasChords ? t("view.chords.available") : t("view.chords.notAvailable")}>
                        <MusicalNoteIcon className="size-2" />
                      </Badge>
                    )}
                    {songLink && (
                      <Button type="button" size="sm" title={t("actions.view")} asChild>
                        <Link to={songLink}>
                          <EyeIcon className="size-3" />
                        </Link>
                      </Button>
                    )}
                  </CardHeaderActions>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {isLoggedIn && (
          <div className="flex flex-row align-start space-x-2 mt-4">
            <Button className="flex-0" type="button" variant="secondary" asChild>
              <Link to="/app/schedules">{t("button.back")}</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
