import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface EmptyListProps {
  className?: string;
}

export function EmptyList({ className }: EmptyListProps) {
  const { t } = useTranslation("app");

  return (
    <div className={cn(
      "flex items-center justify-center rounded-lg border border-dashed p-8 text-sm text-muted-foreground",
      className
    )}>
      {t('list.empty')}
    </div>
  );
}
