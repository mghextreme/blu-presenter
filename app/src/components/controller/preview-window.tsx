import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SlideVisualizer } from './slide-visualizer';
import { useTranslation } from 'react-i18next';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ITheme, LyricsTheme, SubtitlesTheme, TeleprompterTheme } from '@/types';
import { IScreenDetails } from '@/types/browser';
import { getScreens, isScreenDetailsGranted } from '@/lib/screen-details';
import { useController } from '@/hooks/useController';
import { useServices } from '@/hooks/useServices';
import { usePreviewConfig } from '@/hooks/usePreviewConfig';

const defaultThemeOptions = [
  {
    value: LyricsTheme,
    label: 'lyrics',
  },
  {
    value: SubtitlesTheme,
    label: 'subtitles',
  },
  {
    value: TeleprompterTheme,
    label: 'teleprompter',
  },
];

const defaultRatioOptions = [
  {
    value: '16/9',
    label: '16 x 9',
  },
  {
    value: '4/3',
    label: '4 x 3',
  },
];

function toScreenRatioOptions(screens: IScreenDetails[]): { value: string; label: string }[] {
  return screens.map((s, ix: number) => {
    const screenZoom = s.devicePixelRatio;
    const w = Math.round(s.width * screenZoom);
    const h = Math.round(s.height * screenZoom);
    const name = s.label == '' ? 'Display ' + (ix + 1) : s.label;
    const resolution = '(' + (screenZoom != 1 ? 'aprox. ' : '') + w + ' x ' + h + ')';

    return {
      value: `${w}/${h}`,
      label: `${name} ${resolution}`,
    };
  });
}

interface PreviewWindowProps {
  closeWindow?: () => void;
  attachControllerMode?: boolean;
  theme?: ITheme;
  showThemeSelector?: boolean;
}

export function PreviewWindow({
  closeWindow,
  attachControllerMode = false,
  theme = LyricsTheme,
  showThemeSelector = true,
}: Readonly<PreviewWindowProps>) {
  const { t } = useTranslation('controller');

  const {
    previewTheme: storedTheme,
    previewRatio: storedRatio,
    setPreviewTheme: storeSetPreviewTheme,
    setPreviewRatio: storeSetPreviewRatio,
  } = usePreviewConfig();

  const [openPreviewThemeSelector, setOpenPreviewThemeSelector] = useState<boolean>(false);
  const [selectedPreviewTheme, setSelectedPreviewTheme] = useState<ITheme>(storedTheme);
  const previewTheme = showThemeSelector ? selectedPreviewTheme : theme;
  const [openPreviewRatioSelector, setOpenPreviewRatioSelector] = useState<boolean>(false);
  const [previewRatio, setPreviewRatio] = useState<string>(storedRatio);
  const [ratioOptions, setRatioOptions] =
    useState<{ value: string; label: string }[]>(defaultRatioOptions);

  const { mode, setMode } = useController((s) => ({ mode: s.mode, setMode: s.setMode }));

  const { themesService } = useServices();

  const attachModeToTheme = (theme: ITheme) => {
    if (attachControllerMode && mode !== 'part') {
      const newMode = theme.extends === 'subtitles' ? 'part' : 'slide';
      setMode(newMode);
    }
  };
  const updatePreviewTheme = (theme: ITheme) => {
    setSelectedPreviewTheme(theme);
    storeSetPreviewTheme(theme);
    attachModeToTheme(theme);
  };
  const updatePreviewRatio = (ratio: string) => {
    if (ratio === previewRatio) return;

    setPreviewRatio(ratio);
    storeSetPreviewRatio(ratio);
  };

  const initializeMode = useEffectEvent(() => {
    setMode(previewTheme?.extends === 'subtitles' ? 'part' : 'slide');
  });
  // Screen ratios need the window-management permission, which may prompt:
  // read them on mount only when already granted, otherwise when the user
  // opens the ratio selector (a click).
  const screenRatiosRequestedRef = useRef(false);
  const loadScreenRatios = async () => {
    if (screenRatiosRequestedRef.current) return;
    screenRatiosRequestedRef.current = true;

    const screens = await getScreens(window);
    if (screens) {
      setRatioOptions([...defaultRatioOptions, ...toScreenRatioOptions(screens)]);
    }
  };
  const onScreenDetailsGranted = useEffectEvent(() => void loadScreenRatios());
  useEffect(() => {
    initializeMode();
    void isScreenDetailsGranted(window).then((granted) => {
      if (granted) onScreenDetailsGranted();
    });
  }, []);

  const onThemePropChange = useEffectEvent((nextTheme: ITheme) => {
    if (!showThemeSelector) {
      attachModeToTheme(nextTheme);
    }
  });
  useEffect(() => onThemePropChange(theme), [theme]);

  const { data: customThemes } = useQuery({
    ...themesService.allForUserQuery(),
    enabled: showThemeSelector,
  });
  const consolidatedOptions = useMemo<typeof defaultThemeOptions>(
    () => [
      ...(customThemes ?? []).map((theme: ITheme) => ({
        value: theme,
        label: theme.name,
      })),
      ...defaultThemeOptions,
    ],
    [customThemes],
  );
  const previewThemeListId = 'preview-theme-selector-list';
  const previewRatioListId = 'preview-ratio-selector-list';

  return (
    <div className="flex-1 relative">
      <div className="sm:absolute sm:left-0 sm:top-0 sm:right-0 sm:bottom-0 sm:opacity-0 sm:hover:opacity-100 transition-opacity z-20">
        <div className="pb-3 sm:p-3 flex justify-stretch max-w-full space-x-2">
          {showThemeSelector && (
            <Popover open={openPreviewThemeSelector} onOpenChange={setOpenPreviewThemeSelector}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPreviewThemeSelector}
                  aria-controls={previewThemeListId}
                  className="flex-1 justify-between overflow-hidden"
                  title={t('preview.theme.title')}
                >
                  <span className="truncate">
                    {previewTheme.id === 0 ? t('theme.' + previewTheme.name) : previewTheme.name}
                  </span>
                  <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder={t('preview.theme.searchPlaceholder')}
                    className="h-9"
                  />
                  <CommandEmpty>{t('preview.theme.searchNoneFound')}</CommandEmpty>
                  <CommandGroup id={previewThemeListId}>
                    {consolidatedOptions.map((option) => {
                      let orgName: string | undefined = undefined;
                      if (option.value.id !== 0) {
                        orgName = option.value.organization?.name;

                        if (!orgName) {
                          orgName = t('organizations.defaultName');
                        }
                      }

                      return (
                        <>
                          <CommandItem
                            key={option.value.extends + '-' + option.value.id}
                            value={
                              option.value.id === 0
                                ? t('theme.' + option.label)
                                : `${option.value.id} ${option.value.name} ${orgName}`
                            }
                            onSelect={() => {
                              updatePreviewTheme(option.value);
                              setOpenPreviewThemeSelector(false);
                            }}
                          >
                            {option.value.id === 0 ? (
                              <>
                                {t('theme.' + option.label)}
                                <span className="text-xs opacity-70">
                                  ({t('organizations.blupresenter')})
                                </span>
                              </>
                            ) : (
                              <>
                                {option.value.name}
                                {orgName && <span className="text-xs opacity-70">({orgName})</span>}
                              </>
                            )}
                            <CheckIcon
                              className={cn(
                                'ml-auto h-4 w-4',
                                previewTheme === option.value ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                          </CommandItem>
                        </>
                      );
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          )}
          <Popover
            open={openPreviewRatioSelector}
            onOpenChange={(open) => {
              setOpenPreviewRatioSelector(open);
              if (open) void loadScreenRatios();
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openPreviewRatioSelector}
                aria-controls={previewRatioListId}
                className="flex-1 justify-between overflow-hidden"
                title={t('preview.resolution.title')}
              >
                <span className="truncate">
                  {ratioOptions.find((option) => option.value == previewRatio)?.label}
                </span>
                <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput
                  placeholder={t('preview.resolution.searchPlaceholder')}
                  className="h-9"
                />
                <CommandEmpty>{t('preview.resolution.searchNoneFound')}</CommandEmpty>
                <CommandGroup id={previewRatioListId}>
                  {ratioOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={(currentValue) => {
                        updatePreviewRatio(currentValue);
                        setOpenPreviewRatioSelector(false);
                      }}
                    >
                      {option.label}
                      <CheckIcon
                        className={cn(
                          'ml-auto h-4 w-4',
                          previewRatio === option.value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          {closeWindow && (
            <Button onClick={closeWindow} title={t('preview.closeTitle')} variant="outline">
              {t('preview.close')}
            </Button>
          )}
        </div>
      </div>
      <div className={'flex-1 rounded overflow-hidden'} style={{ aspectRatio: previewRatio }}>
        <SlideVisualizer theme={previewTheme}></SlideVisualizer>
      </div>
    </div>
  );
}
