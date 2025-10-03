import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import SlideVisualizer from "./slide-visualizer";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { ITheme, LyricsTheme, SubtitlesTheme, TeleprompterTheme } from "@/types";
import { IBrowserWindow, IScreenDetails } from "@/types/browser";
import { useController } from "@/hooks/useController";
import { useServices } from "@/hooks/services.provider";

const defaultThemeOptions = [
  {
    value: LyricsTheme,
    label: "lyrics",
  },
  {
    value: SubtitlesTheme,
    label: "subtitles",
  },
  {
    value: TeleprompterTheme,
    label: "teleprompter",
  },
];

const defaultRatioOptions = [
  {
    value: "16/9",
    label: "16 x 9",
  },
  {
    value: "4/3",
    label: "4 x 3",
  },
];

interface PreviewWindowProps {
  closeWindow?: () => void
  attachControllerMode?: boolean
  theme?: ITheme
  showThemeSelector?: boolean
}

export function PreviewWindow({
  closeWindow,
  attachControllerMode = false,
  theme = LyricsTheme,
  showThemeSelector = true,
}: PreviewWindowProps) {

  const { t } = useTranslation('controller');

  const [openPreviewThemeSelector, setOpenPreviewThemeSelector] = useState<boolean>(false);
  const [previewTheme, setPreviewTheme] = useState<ITheme>(theme);
  const [openPreviewRatioSelector, setOpenPreviewRatioSelector] = useState<boolean>(false);
  const [previewRatio, setPreviewRatio] = useState<string>("16/9");
  const [ratioOptions, setRatioOptions] = useState<{ value: string, label: string }[]>(defaultRatioOptions);

  const {
    setMode,
  } = useController();

  const {
    themesService,
  } = useServices();

  const updatePreviewTheme = (theme: ITheme) => {
    setPreviewTheme(theme);

    if (attachControllerMode) {
      const mode = theme.extends === 'subtitles' ? 'part': 'slide';
      setMode(mode);
    }
  }
  const updatePreviewRatio = (ratio: string) => {
    if (ratio === previewRatio) return;

    setPreviewRatio(ratio);
  }

  useEffect(() => {
    setMode(previewTheme?.extends === 'subtitles' ? 'part': 'slide');

    const browserWindow = window as unknown as IBrowserWindow;
    if (!browserWindow?.getScreenDetails) return;
    const screenDetailsPromise = browserWindow?.getScreenDetails();
    if (screenDetailsPromise) {
      screenDetailsPromise.then((details: { screens: IScreenDetails[] }) => {
        const screenRatioOptions = details.screens.map((s, ix: number) => {
          const screenZoom = s.devicePixelRatio;
          const w = Math.round(s.width * screenZoom);
          const h = Math.round(s.height * screenZoom);
          const name = s.label == '' ? 'Display ' + (ix + 1) : s.label;
          const resolution = '(' + (screenZoom != 1 ? 'aprox. ' : '') + w + ' x ' + h + ')';

          return {
            value: `${w}/${h}`,
            label: `${name} ${resolution}`,
          }
        });

        setRatioOptions([
          ...defaultRatioOptions,
          ...screenRatioOptions,
        ]);
      })
    }
  }, []);

  useEffect(() => {
    updatePreviewTheme(theme);
  }, [theme]);

  const [consolidatedOptions, setConsolidatedOptions] = useState<typeof defaultThemeOptions>(defaultThemeOptions);
  useEffect(() => {
    themesService.getAllForUser()
      .then((customThemes: ITheme[]) => {
        setConsolidatedOptions([
          ...customThemes.map((theme: ITheme) => ({
            value: theme,
            label: theme.name,
          })),
          ...defaultThemeOptions,
        ]);
      });
  }, []);

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
                  className="flex-1 justify-between overflow-hidden"
                  title={t('preview.theme.title')}
                >
                  <span
                    className="truncate">{previewTheme.id === 0 ? t('theme.' + previewTheme.name) : previewTheme.name}</span>
                  <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder={t('preview.theme.searchPlaceholder')} className="h-9"/>
                  <CommandEmpty>{t('preview.theme.searchNoneFound')}</CommandEmpty>
                  <CommandGroup>
                    {consolidatedOptions.map(option => {
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
                            value={option.value.id === 0 ? t('theme.' + option.label) : `${option.value.id} ${option.value.name} ${orgName}`}
                            onSelect={() => {
                              updatePreviewTheme(option.value);
                              setOpenPreviewThemeSelector(false);
                            }}
                          >
                            {option.value.id === 0 ? (
                              <>
                                {t('theme.' + option.label)}
                                <span className="text-xs opacity-70">({t('organizations.blupresenter')})</span>
                              </>
                             ) : (
                              <>
                                {option.value.name}
                                {orgName && <span className="text-xs opacity-70">({orgName})</span>}
                              </>
                            )}
                            <CheckIcon
                              className={cn(
                                "ml-auto h-4 w-4",
                                previewTheme === option.value ? "opacity-100" : "opacity-0"
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
          <Popover open={openPreviewRatioSelector} onOpenChange={setOpenPreviewRatioSelector}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="flex-1 justify-between overflow-hidden"
                title={t('preview.resolution.title')}
              >
                <span
                  className="truncate">{ratioOptions.find((option) => option.value == previewRatio)?.label}</span>
                <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder={t('preview.resolution.searchPlaceholder')} className="h-9"/>
                <CommandEmpty>{t('preview.resolution.searchNoneFound')}</CommandEmpty>
                <CommandGroup>
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
                          "ml-auto h-4 w-4",
                          previewRatio === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          {closeWindow && (
            <Button
              onClick={closeWindow}
              title={t('preview.closeTitle')}
              variant="outline">
              {t('preview.close')}
            </Button>
          )}
        </div>
      </div>
      <div className={"flex-1 rounded overflow-hidden"} style={{aspectRatio: previewRatio}}>
        <SlideVisualizer theme={previewTheme}></SlideVisualizer>
      </div>
    </div>
  );
}
