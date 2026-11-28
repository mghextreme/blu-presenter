/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useWindow } from '@/hooks/useWindow';
import { useTranslation } from 'react-i18next';
import { IBrowserWindow, IScreenDetails } from '@/types/browser';
import { getScreens, isScreenDetailsGranted } from '@/lib/screen-details';
import { ControllerMode, ITheme, LyricsTheme, SubtitlesTheme, TeleprompterTheme } from '@/types';
import { SlideVisualizer } from './slide-visualizer';
import { useServices } from '@/hooks/useServices';

const NO_THEMES: ITheme[] = [];

function canChooseScreen(browserWindow: IBrowserWindow | undefined): boolean {
  const browserScreen = browserWindow?.screen ?? browserWindow?.currentScreen;
  return !!browserScreen?.isExtended && !!browserWindow?.getScreenDetails;
}

interface SelectorScreenProps {
  setMode: (mode: ControllerMode) => void;
  defaultTheme?: ITheme;
  themeOptions?: ITheme[];
  onThemeChange?: (theme: ITheme) => void;
}

export function SelectorScreen({
  setMode,
  defaultTheme,
  themeOptions,
  onThemeChange,
}: Readonly<SelectorScreenProps>) {
  const { t } = useTranslation('controller');

  const [selectedTheme, setSelectedTheme] = useState<ITheme | undefined>(defaultTheme);
  if (!selectedTheme && defaultTheme) {
    setSelectedTheme(defaultTheme);
  }

  const { childWindow } = useWindow();
  const [selectedScreen, setSelectedScreen] = useState(
    () => !canChooseScreen(childWindow as unknown as IBrowserWindow),
  );
  const [displayOptions, setDisplayOptions] = useState<IScreenDetails[]>([]);

  const setFullScreen = (ix: number) => {
    if (ix < 0 || ix >= displayOptions.length) return;

    const doc = childWindow?.document;
    if (!doc) return;

    const selectedDisplay = displayOptions[ix];
    const options = {
      navigationUI: 'hide',
      screen: selectedDisplay,
    };

    const elem = doc.documentElement as any;
    const requestMethod =
      elem.requestFullScreen ||
      elem.webkitRequestFullScreen ||
      elem.mozRequestFullScreen ||
      elem.msRequestFullScreen;
    if (requestMethod) {
      requestMethod.call(elem, options);
    }
    setSelectedScreen(true);
  };

  // Reading the screens needs the window-management permission, which may
  // prompt: load them on mount only when already granted, otherwise from the
  // "full-screen options" button (a click).
  const loadDisplayOptions = async () => {
    if (!childWindow) return;

    const screens = await getScreens(childWindow);
    if (!screens || screens.length < 2) {
      // Denied or a single screen: fall back to windowed mode.
      setSelectedScreen(true);
      return;
    }
    setDisplayOptions(screens);
  };
  const loadGrantedDisplayOptions = useEffectEvent(() => {
    if (!childWindow || !canChooseScreen(childWindow as unknown as IBrowserWindow)) return;
    void isScreenDetailsGranted(childWindow).then((granted) => {
      if (granted) void loadDisplayOptions();
    });
  });
  useEffect(() => loadGrantedDisplayOptions(), []);

  const setThemeAndMode = (theme: ITheme) => {
    setSelectedTheme(theme);
    onThemeChange?.(theme);
    if (theme.extends === 'subtitles') {
      setMode('part');
    }
  };

  const { themesService } = useServices();

  const { data: userThemes } = useQuery({
    ...themesService.allForUserQuery(),
    enabled: !selectedTheme && !themeOptions,
  });
  const customThemeOptions = themeOptions ?? userThemes ?? NO_THEMES;

  const customThemesByOrg = useMemo(() => {
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
    return groups;
  }, [customThemeOptions, t]);

  return (
    <>
      <title>
        {(selectedTheme
          ? (selectedTheme.id === 0 ? t('theme.' + selectedTheme.name) : selectedTheme.name) + ' - '
          : '') +
          t('watch.title') +
          ' - BluPresenter'}
      </title>
      {selectedTheme && selectedScreen && <SlideVisualizer theme={selectedTheme}></SlideVisualizer>}
      {(!selectedTheme || !selectedScreen) && (
        <div className="min-h-screen w-full py-4 px-12 flex flex-col justify-center items-stretch gap-3 text-center bg-black text-white text-[8vh]">
          {selectedTheme ? (
            <>
              <h3 className="mb-4">{t('watch.screenSelector.title')}</h3>
              <Button onClick={() => setSelectedScreen(true)}>
                {t('watch.screenSelector.windowed')}
              </Button>
              {displayOptions.length === 0 && (
                <Button onClick={() => void loadDisplayOptions()}>
                  {t('watch.screenSelector.showFullScreenOptions')}
                </Button>
              )}
              {displayOptions.map((m, ix) => (
                <Button key={ix} onClick={() => setFullScreen(ix)}>
                  {t('watch.screenSelector.fullScreen')} - {t('watch.screenSelector.display')}{' '}
                  {ix + 1}
                  {m.label && <span className="text-sm opacity-60">({m.label})</span>}
                </Button>
              ))}
            </>
          ) : (
            <>
              <h3 className="mb-4">{t('watch.themeSelector.title')}</h3>
              {customThemesByOrg.map((group) => (
                <div key={group.key} className="flex flex-col gap-3">
                  <h4 className="text-[2.5vh] opacity-60">{group.name}</h4>
                  <div className="flex flex-wrap justify-center gap-3">
                    {group.themes.map((theme) => (
                      <Button
                        key={theme.id}
                        size="none"
                        onClick={() => setThemeAndMode(theme)}
                        className="text-[3.5vh] px-[2.5vh] py-[0.75vh]"
                      >
                        {theme.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-white/15 flex flex-col gap-2">
                <h4 className="text-[2vh] opacity-50">{t('watch.themeSelector.builtIn')}</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="link"
                    size="none"
                    className="text-[2vh] px-[1vh] py-[0.25vh]"
                    onClick={() => setThemeAndMode(LyricsTheme)}
                  >
                    {t('theme.lyrics')} - {t('theme.description.lyrics')}
                  </Button>
                  <Button
                    variant="link"
                    size="none"
                    className="text-[2vh] px-[1vh] py-[0.25vh]"
                    onClick={() => setThemeAndMode(SubtitlesTheme)}
                  >
                    {t('theme.subtitles')} - {t('theme.description.subtitles')}
                  </Button>
                  <Button
                    variant="link"
                    size="none"
                    className="text-[2vh] px-[1vh] py-[0.25vh]"
                    onClick={() => setThemeAndMode(TeleprompterTheme)}
                  >
                    {t('theme.teleprompter')} - {t('theme.description.teleprompter')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
