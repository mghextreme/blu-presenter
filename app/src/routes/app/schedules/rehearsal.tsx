import { useCallback, useMemo, useState } from "react";
import { ISchedule, IScheduleSong } from "@/types";
import { Button } from "@/components/ui/button";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import ShareIcon from "@heroicons/react/24/solid/ShareIcon";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import PrinterIcon from "@heroicons/react/24/solid/PrinterIcon";
import { RehearsalNav } from "@/components/app/schedules/rehearsal-nav";
import { SongViewer } from "@/components/app/songs/song-viewer";
import { OrganizationBar } from "@/components/app/organization-bar";
import { toast } from "sonner";

export function RehearsalSchedule() {
  const { t } = useTranslation("schedules");
  const { isLoggedIn } = useAuth();
  const params = useParams();
  const data = useLoaderData() as ISchedule | null;

  if (!data) {
    throw new Error("Can't find schedule");
  }

  const songIndices = useMemo(() => {
    return data.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.type === 'song')
      .map(({ index }) => index);
  }, [data.items]);

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    return songIndices.length > 0 ? songIndices[0] : -1;
  });

  const currentSongPosition = songIndices.indexOf(currentIndex);
  const hasPrevious = currentSongPosition > 0;
  const hasNext = currentSongPosition < songIndices.length - 1;

  const goToPrevious = useCallback(() => {
    if (hasPrevious) {
      setCurrentIndex(songIndices[currentSongPosition - 1]);
    }
  }, [hasPrevious, songIndices, currentSongPosition]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      setCurrentIndex(songIndices[currentSongPosition + 1]);
    }
  }, [hasNext, songIndices, currentSongPosition]);

  const handleSelect = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const currentItem = currentIndex >= 0 ? data.items[currentIndex] as IScheduleSong : null;

  const isShared = !!params.secret;

  const copyShareableUrlToClipboard = async () => {
    const currentUrl = new URL(window.location.href);
    const shareUrl = `${currentUrl.protocol}//${currentUrl.host}/shared/schedules/${data.id}/${data.secret ?? ''}/rehearsal`;
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

  const getViewLink = () => {
    if (isShared) {
      return `/shared/schedules/${data.id}/${params.secret}`;
    }
    return `/app/schedules/${data.id}/view`;
  };

  const getPrintLink = () => {
    if (!currentItem) return '#';
    if (isShared) {
      return `/shared/print/${currentItem.id}/${currentItem.secret ?? ''}`;
    }
    return `/app/songs/${currentItem.id}/print`;
  };

  if (songIndices.length === 0) {
    return (
      <>
        <title>{t("rehearsal.title") + " - " + data.title + " - BluPresenter"}</title>
        <OrganizationBar organizations={[data.organization]} subtitle={data.title}>
          <Button type="button" size="sm" title={t("actions.view")} asChild>
            <Link to={getViewLink()}>
              <EyeIcon className="size-3" />
            </Link>
          </Button>
        </OrganizationBar>
        <div className="p-2 sm:p-8">
          <p className="text-muted-foreground">{t('rehearsal.noSongs')}</p>
          {isLoggedIn && (
            <div className="flex flex-row align-start space-x-2 mt-4">
              <Button className="flex-0" type="button" variant="secondary" asChild>
                <Link to={`/app/schedules/${data.id}/view`}>{t('button.back')}</Link>
              </Button>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <title>{t("rehearsal.title") + " - " + data.title + " - BluPresenter"}</title>
      <OrganizationBar organizations={[data.organization]} subtitle={data.title}>
        <Button type="button" size="sm" title={t("rehearsal.print")} asChild>
          <Link to={getPrintLink()}>
            <PrinterIcon className="size-3" />
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          title={t("actions.share")}
          onClick={copyShareableUrlToClipboard}
        >
          <ShareIcon className="size-3" />
        </Button>
        <Button type="button" size="sm" title={t("actions.view")} asChild>
          <Link to={getViewLink()}>
            <EyeIcon className="size-3" />
          </Link>
        </Button>
        {isLoggedIn && (
          <Button type="button" size="sm" title={t("actions.edit")} asChild>
            <Link to={`/app/schedules/${data.id}/edit`}>
              <PencilIcon className="size-3" />
            </Link>
          </Button>
        )}
      </OrganizationBar>

      <RehearsalNav
        items={data.items}
        currentIndex={currentIndex}
        onSelect={handleSelect}
        onPrevious={goToPrevious}
        onNext={goToNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />

      {currentItem && (
        <SongViewer song={currentItem} />
      )}

      <RehearsalNav
        items={data.items}
        currentIndex={currentIndex}
        onSelect={handleSelect}
        onPrevious={goToPrevious}
        onNext={goToNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />

      {isLoggedIn && (
        <div className="flex flex-row align-start space-x-2 px-2 sm:px-8 pb-8">
          <Button className="flex-0" type="button" variant="secondary" asChild>
            <Link to={`/app/schedules/${data.id}/view`}>{t('button.back')}</Link>
          </Button>
        </div>
      )}
    </>
  );
}
