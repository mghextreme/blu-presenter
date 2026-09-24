import { useTranslation } from "react-i18next";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";
import { Button } from "@/components/ui/button";

interface FiltersActiveNoticeProps {
  onReset: () => void;
}

export function FiltersActiveNotice({ onReset }: FiltersActiveNoticeProps) {
  const { t } = useTranslation("app");

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span>{t('filters.active')}</span>
      <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={onReset}>
        <XMarkIcon className="size-3 me-1" />
        {t('filters.reset')}
      </Button>
    </div>
  );
}
