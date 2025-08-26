import { useTranslation } from "react-i18next";
import { ISongWithRole } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardHeaderActions, CardHeaderText, CardTitle } from "@/components/ui/card";
import MusicalNoteIcon from "@heroicons/react/24/solid/MusicalNoteIcon";
import { ReactNode } from "react";

type possibleBadgeColor = 'color-1' | 'color-2' | 'color-3' | 'color-4' | 'color-5' | 'color-6';
const badgeColors: possibleBadgeColor[] = [
  'color-6',
  'color-1',
  'color-2',
  'color-3',
  'color-4',
  'color-5',
];

export type SearchResultItemProps = {
  getColorIndex?: (item: ISongWithRole) => number;
  getActions?: (item: ISongWithRole) => ReactNode;
}

export function SearchResultItem({
  item,
  getColorIndex,
  getActions,
}: SearchResultItemProps & {
  item: ISongWithRole;
}) {

  const { t } = useTranslation('discover');
  const hasChords = item.blocks?.some(block => block.chords && block.chords.length > 0);

  return (
    <Card key={item.id}>
      <CardHeader>
        <CardHeaderText>
          <CardTitle>{item?.title}</CardTitle>
          <CardDescription>{item?.artist}</CardDescription>
        </CardHeaderText>
        <CardHeaderActions>
          {item.organization ? (
            <Badge className="me-3 my-auto" variant={badgeColors[(getColorIndex ? getColorIndex(item) : item.organization.id) % badgeColors.length]}>{item.organization.name || t('organizations.defaultName')}</Badge>
          ) : (
            <Badge className="me-3 my-auto" variant={"outline"}>{t('organizations.publicArchive')}</Badge>
          )}
          <Badge className="me-3 p-1 my-auto" variant={hasChords ? "color-4" : "outline"} title={hasChords ? t('chords.available') : t('chords.notAvailable')}>
            <MusicalNoteIcon className="size-2" />
          </Badge>
          {getActions && getActions(item)}
        </CardHeaderActions>
      </CardHeader>
    </Card>
  )
}
