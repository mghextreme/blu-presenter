import { useTranslation } from "react-i18next";
import { ISongWithRole } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ListItemCard } from "@/components/shared/list-item-card";
import MusicalNoteIcon from "@heroicons/react/24/solid/MusicalNoteIcon";
import { ReactNode } from "react";

export type SearchResultItemProps = {
  getActions?: (item: ISongWithRole) => ReactNode;
}

export function SearchResultItem({
  item,
  getActions,
}: SearchResultItemProps & {
  item: ISongWithRole;
}) {

  const { t } = useTranslation('songs');
  const hasChords = item.blocks?.some(block => block.lines?.some(line => line.type === 'chords'));

  return (
    <ListItemCard
      title={item?.title}
      description={item?.artist}
      organization={item.organization}
      additionalBadges={(
        <Badge className="me-3 p-1 my-auto" variant={hasChords ? "color-4" : "outline"} title={hasChords ? t('chords.available') : t('chords.notAvailable')}>
          <MusicalNoteIcon className="size-2" />
        </Badge>
      )}
      actions={getActions && getActions(item)}
    />
  )
}
