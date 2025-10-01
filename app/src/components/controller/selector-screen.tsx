/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWindow } from "@/hooks/window.provider";
import { useTranslation } from "react-i18next";
import { IBrowserWindow, IScreenDetails } from "@/types/browser";
import { ControllerMode, ITheme, LyricsTheme, SubtitlesTheme, TeleprompterTheme } from "@/types";
import SlideVisualizer from "./slide-visualizer";
import { useServices } from "@/hooks/services.provider";

interface SelectorScreenProps {
  setMode: (mode: ControllerMode) => void,
  defaultTheme?: ITheme,
  themeOptions?: ITheme[],
}

export default function SelectorScreen({
  setMode,
  defaultTheme,
  themeOptions,
}: SelectorScreenProps) {

  const { t } = useTranslation("controller");

  const [selectedTheme, setSelectedTheme] = useState<ITheme | undefined>(defaultTheme);
  useEffect(() => {
    if (!!selectedTheme) return;

    setSelectedTheme(defaultTheme);
  }, [defaultTheme]);

  const [selectedScreen, setSelectedScreen] = useState(false);
  const [displayOptions, setDisplayOptions] = useState<IScreenDetails[]>([]);
  const {childWindow} = useWindow();

  const setFullScreen = (ix: number) => {
    if (ix < 0 || ix >= displayOptions.length) return;

    const doc = childWindow?.document;
    if (!doc) return;

    const selectedDisplay = displayOptions[ix];
    const options = {
      navigationUI: "hide",
      screen: selectedDisplay,
    };

    const elem = doc.documentElement as any;
    const requestMethod = elem.requestFullScreen || elem.webkitRequestFullScreen || elem.mozRequestFullScreen || elem.msRequestFullScreen;
    if (requestMethod) {
      requestMethod.call(elem, options);
    }
    setSelectedScreen(true);
  }

  useEffect(() => {
    const browserWindow = childWindow as unknown as IBrowserWindow;
    const browserScreen = browserWindow?.screen || browserWindow?.currentScreen;

    if (!browserScreen || !(browserScreen?.isExtended) || !browserWindow?.getScreenDetails) {
      setSelectedScreen(true);
      return;
    }

    const screenDetailsPromise = browserWindow?.getScreenDetails();
    if (screenDetailsPromise) {
      screenDetailsPromise.then((details: {screens: IScreenDetails[]}) => {
        if (details.screens.length < 2) {
          setSelectedScreen(true);
          return;
        }

        setDisplayOptions(details.screens);
      });
    } else {
      setSelectedScreen(true);
    }
  }, []);

  const setThemeAndMode = (theme: ITheme) => {
    setSelectedTheme(theme);
    if (theme.extends === 'subtitles') {
      setMode('part');
    }
  }

  const {
    themesService,
  } = useServices();

  const [customThemeOptions, setCustomThemeOptions] = useState<ITheme[]>(themeOptions ?? []);
  useEffect(() => {
    if (selectedTheme || themeOptions) return;

    themesService.getAllForUser()
      .then((customThemes: ITheme[]) => {
        setCustomThemeOptions(customThemes);
      });
  }, []);

  useEffect(() => {
    if (!themeOptions) return;

    setCustomThemeOptions(themeOptions);
  }, [themeOptions]);

  return (
    <>
      <title>{(selectedTheme ? (selectedTheme.id === 0 ? t('theme.' + selectedTheme.name) : selectedTheme.name) + ' - ' : '') + t('watch.title') + ' - BluPresenter'}</title>
      {selectedTheme && selectedScreen && <SlideVisualizer theme={selectedTheme}></SlideVisualizer>}
      {(!selectedTheme || !selectedScreen) && (
        <div className="min-h-screen w-full py-4 px-12 flex flex-col justify-center items-stretch gap-3 text-center bg-black text-white text-[8vh]">
          {selectedTheme ? (
            <>
              <h3 className="mb-4">{t('watch.screenSelector.title')}</h3>
              <Button onClick={() => setSelectedScreen(true)}>{t('watch.screenSelector.windowed')}</Button>
              {displayOptions.map((m, ix) => (
                <Button key={ix} onClick={() => setFullScreen(ix)}>
                  {t('watch.screenSelector.fullScreen')} - {t('watch.screenSelector.display')} {ix + 1}
                  {m.label && <span className="text-sm opacity-60">({m.label})</span>}
                </Button>
              ))}
            </>
          ) : (
            <>
              <h3 className="mb-4">{t('watch.themeSelector.title')}</h3>
              {customThemeOptions.map(theme => (
                <Button key={theme.id} onClick={() => setThemeAndMode(theme)}>
                  {theme.name} <span className="text-sm opacity-60">({theme.organization?.name ? theme.organization?.name : t('organizations.defaultName')})</span>
                </Button>
              ))}
              <Button key="lyrics" onClick={() => setThemeAndMode(LyricsTheme)}>{t('theme.lyrics')} - {t('theme.description.lyrics')} <span className="text-sm opacity-60">({t('organizations.blupresenter')})</span></Button>
              <Button key="subtitles" onClick={() => setThemeAndMode(SubtitlesTheme)}>{t('theme.subtitles')} - {t('theme.description.subtitles')} <span className="text-sm opacity-60">({t('organizations.blupresenter')})</span></Button>
              <Button key="teleprompter" onClick={() => setThemeAndMode(TeleprompterTheme)}>{t('theme.teleprompter')} - {t('theme.description.teleprompter')} <span className="text-sm opacity-60">({t('organizations.blupresenter')})</span></Button>
            </>
          )}
        </div>
      )}
    </>
  );
}
