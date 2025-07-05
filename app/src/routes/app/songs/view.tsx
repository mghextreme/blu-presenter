import { ISongWithRole } from "@/types";
import { SongsService } from "@/services";
import { Button } from "@/components/ui/button";
import { Link, Params, useLoaderData } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";

export async function loader({ params, songsService }: { params: Params, songsService: SongsService }) {
  return await songsService.getById(Number(params.id));
}

export default function ViewSong() {

  const { t } = useTranslation("songs");

  const data = useLoaderData() as ISongWithRole;

  if (!data) {
    throw new Error("Can't find song");
  }

  let orgName: string | undefined = t("organizations.publicArchive");
  if (data.organization) {
    orgName = data.organization.name || t("organizations.defaultName");
  }

  return (
    <>
      <div className="flex item-center px-8 py-4 bg-slate-200 dark:bg-slate-900 gap-x-2">
        <span className="text-sm">{t('input.organization')}: <b>{orgName}</b></span>
      </div>
      <div className="p-8">
        <h1 className="text-3xl mb-2">{data.title}</h1>
        <h2 className="text-lg mb-2 opacity-50">{data.artist}</h2>
        <div className="max-w-lg space-y-2">
          {data.blocks?.map((block) => (
            <Textarea value={block.text} className="resize-none" />
          ))}
        </div>
        <div className="flex flex-row align-start space-x-2 mt-4">
          <Link to={'/app/songs'}><Button className="flex-0" type="button" variant="secondary">{t('button.back')}</Button></Link>
        </div>
      </div>
    </>
  );
}
