import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function LoadMoreButton({ onClick, isLoading, disabled = false }: LoadMoreButtonProps) {
  const { t } = useTranslation("app");

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading && <ArrowPathIcon className="size-4 me-2 animate-spin" />}
      {t('actions.loadMore')}
    </Button>
  );
}
