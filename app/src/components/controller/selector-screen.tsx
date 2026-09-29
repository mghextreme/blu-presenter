/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWindow } from "@/hooks/window.provider";
import { useTranslation } from "react-i18next";
import { IBrowserWindow, IScreenDetails } from "@/types/browser";
import { ControllerMode, ITheme, LyricsTheme, SubtitlesTheme, TeleprompterTheme } from "@/types";
import { SlideVisualizer } from "./slide-visualizer";
import { useServices } from "@/hooks/useServices";

interface SelectorScreenProps {
  setMode: (mode: ControllerMode) => void,
  defaultTheme?: ITheme,
  themeOptions?: ITheme[],
}

export function SelectorScreen({
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

  const [customThemesByOrg, setCustomThemesByOrg] = useState<{ key: string; name: string; themes: ITheme[] }[]>([]);
  useEffect(() => {
    const defaultOrgName = t('organizations.defaultName');
    const sortedThemes = [...customThemeOptions].sort((a, b) => {
      const orgA = a.organization?.name ?? defaultOrgName;
      const orgB = b.organization?.name ?? defaultOrgName;
      return orgA.localeCompare(orgB) || a.name.localeCompare(b.name);
    });
    const groups: { key: string; name: string; themes: ITheme[] }[] = [];
    const byKey = new Map<string, { key: string; name: string; themes: ITheme[] }>();
    for (const theme of sortedThemes) {
      const key = theme.organization ? `org-${theme.organization.id}` : 'personal';
      const name = theme.organization?.name ?? defaultOrgName;
      let group = byKey.get(key);
      if (!group) {
        group = { key, name, themes: [] };
        byKey.set(key, group);
        groups.push(group);
      }
      group.themes.push(theme);
    }

    setCustomThemesByOrg(groups);
  }, [customThemeOptions, t]);

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
              {customThemesByOrg.map(group => (
                <div key={group.key} className="flex flex-col gap-3">
                  <h4 className="text-[2.5vh] opacity-60">{group.name}</h4>
                  <div className="flex flex-wrap justify-center gap-3">
                    {group.themes.map(theme => (
                      <Button key={theme.id} size="none" onClick={() => setThemeAndMode(theme)} className="text-[3.5vh] px-[2.5vh] py-[0.75vh]">
                        {theme.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-white/15 flex flex-col gap-2">
                <h4 className="text-[2vh] opacity-50">{t('watch.themeSelector.builtIn')}</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="link" size="none" className="text-[2vh] px-[1vh] py-[0.25vh]" onClick={() => setThemeAndMode(LyricsTheme)}>{t('theme.lyrics')} - {t('theme.description.lyrics')}</Button>
                  <Button variant="link" size="none" className="text-[2vh] px-[1vh] py-[0.25vh]" onClick={() => setThemeAndMode(SubtitlesTheme)}>{t('theme.subtitles')} - {t('theme.description.subtitles')}</Button>
                  <Button variant="link" size="none" className="text-[2vh] px-[1vh] py-[0.25vh]" onClick={() => setThemeAndMode(TeleprompterTheme)}>{t('theme.teleprompter')} - {t('theme.description.teleprompter')}</Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
