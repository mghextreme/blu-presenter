import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useController } from "@/hooks/useController";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ITheme } from "@/types";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";

export function WindowControls() {

  const { t } = useTranslation("controller");

  const {
    windows,
    closeWindow,
    closeAllWindows,
  } = useController();

  if (windows.length === 0) return null;

  const themeName = (theme?: ITheme) => {
    if (!theme) return t('theme.none');
    // Built-in themes have id 0 and translated names
    return theme.id === 0 ? t('theme.' + theme.name) : theme.name;
  };

  return (
    <div className="flex">
      <Button
        title={t('controls.windows.closeAll')}
        className="rounded-r-none"
        onClick={() => closeAllWindows()}
      >
        <XMarkIcon className="size-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button title={t('controls.windows.list')} className="rounded-l-none px-2">
            <ChevronDownIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuLabel>{t('controls.windows.list')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {windows.map((w, ix) => (
            <div
              key={w.id}
              className={cn(
                "flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                ix > 0 && "mt-0.5"
              )}
            >
              <span className="truncate">
                {t('controls.windows.window', { index: ix + 1 })} &ndash; {themeName(w.theme)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                title={t('controls.windows.closeOne')}
                onClick={() => closeWindow(w.id)}
              >
                <XMarkIcon className="size-3.5" />
              </Button>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
