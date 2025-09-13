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
import { useController } from "@/hooks/controller.provider";

const themeOptions = [
  {
    value: LyricsTheme,
    label: "theme.lyrics",
  },
  {
    value: SubtitlesTheme,
    label: "theme.subtitles",
  },
  {
    value: TeleprompterTheme,
    label: "theme.teleprompter",
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
    mode,
    setMode,
  } = useController();

  const updatePreviewTheme = (theme: ITheme) => {
    if (previewTheme.id === theme.id && previewTheme.extends === theme.extends) return;

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

    setMode(previewTheme?.extends === 'subtitles' ? 'part': 'slide');
  }, []);

  useEffect(() => {
    updatePreviewTheme(theme);
  }, [theme]);

  return (
    <>
      <div className="absolute left-0 top-0 right-0 bottom-0 opacity-0 hover:opacity-100 transition-opacity z-20">
        <div className="p-3 flex justify-stretch max-w-full space-x-2">
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
                    className="truncate">{t(themeOptions.find((option) => option.value == previewTheme)?.label ?? 'theme.none')}</span>
                  <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder={t('preview.theme.searchPlaceholder')} className="h-9"/>
                  <CommandEmpty>{t('preview.theme.searchNoneFound')}</CommandEmpty>
                  <CommandGroup>
                    {themeOptions.map((option) => (
                      <CommandItem
                        key={option.value.extends + '-' + option.value.id}
                        value={option.value.id === 0 ? t('theme.' + option.value.title) : option.value.title}
                        onSelect={() => {
                          updatePreviewTheme(option.value);
                          setOpenPreviewThemeSelector(false);
                        }}
                      >
                        {t(option.label)}
                        <CheckIcon
                          className={cn(
                            "ml-auto h-4 w-4",
                            previewTheme === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
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
        <SlideVisualizer theme={theme} mode={mode}></SlideVisualizer>
      </div>
    </>
  );
}
