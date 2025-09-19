import ThemeToggler from "@/components/ui/theme-toggler";
import ModeToggler from "@/components/ui/mode-toggler";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useController } from "@/hooks/controller.provider";
import { v4 } from "uuid";
import { IWindow } from "@/types";
import PlayIcon from "@heroicons/react/24/solid/PlayIcon";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";
import LanguageToggler from "@/components/ui/language-toggler";
import { useTranslation } from "react-i18next";
import Clock from "./clock";

export default function ControllerNavbar() {

  const { t } = useTranslation("controller");

  const {
    windows,
    addWindow,
    closeAllWindows,
  } = useController();

  return (
    <header className="flex flex-0 w-full drop-shadow-1 bg-background">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 xl:px-6">
        <div className="flex flex-row items-center">
          <Link to="/app">
            <span className="text-2xl">BluPresenter</span>
          </Link>
        </div>
        <div className="flex-0 flex flex-row items-center space-x-2">
          <Button variant="outline" disabled>
            <Clock />
          </Button>
          <LanguageToggler></LanguageToggler>
          <ThemeToggler></ThemeToggler>
          <ModeToggler></ModeToggler>
          <Button onClick={() => addWindow({id: v4()} as IWindow)}>
            {t('controls.windows.open')}
            <PlayIcon className="ms-2 size-4"></PlayIcon>
          </Button>
          {windows.length > 0 && <Button title={t('controls.windows.closeAll')} onClick={() => closeAllWindows()}>
            <XMarkIcon className="size-4"></XMarkIcon>
          </Button>}
        </div>
      </div>
    </header>
  )
}
