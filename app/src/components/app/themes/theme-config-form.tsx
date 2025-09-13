import { forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import { ITeleprompterThemeConfig, ITheme } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemeConfigFontForm } from "./theme-config-font-form";

interface ThemeConfigFormProps {
  theme: ITheme
  setTheme: (theme: ITheme) => void
}

export const ThemeConfigForm = forwardRef((
  {
    theme,
    setTheme,
  }: ThemeConfigFormProps,
  ref,
) => {

  const { t } = useTranslation("themes");

  const getThemeConfig = () => {
    return {};
  }

  useImperativeHandle(ref, () => {
    return {
      getThemeConfig,
    };
  });

  const updateBackgroundColor = (backgroundColor: string) => {
    setTheme({
      ...theme,
      config: {
        ...theme.config,
        backgroundColor,
      } as ITheme["config"],
    });
  };

  const updateForegroundColor = (foregroundColor: string) => {
    setTheme({
      ...theme,
      config: {
        ...theme.config,
        foregroundColor,
      } as ITheme["config"],
    });
  };

  const updateChordsColor = (chordsColor: string) => {
    const themeConfig = theme.config as ITeleprompterThemeConfig;

    setTheme({
      ...theme,
      config: {
        ...themeConfig,
        chords: {
          ...themeConfig?.chords,
          color: chordsColor,
        },
      } as ITheme["config"],
    });
  };

  const teleprompterConfig = theme.config as ITeleprompterThemeConfig;

  return (
    <div className="flex flex-col gap-2" key={theme.extends}>
      <h3 className="text-lg font-medium">{t("input.titles.colors")}</h3>
      <div className="flex justify-between gap-2">
        <div className="flex flex-col gap-2 flex-1 w-1/3">
          <Label className="w-full truncate">{t("input.config.backgroundColor")}</Label>
          <Input name="backgroundColor" value={theme.config?.backgroundColor} onChange={(e) => updateBackgroundColor(e.target.value)}  />
        </div>
        <div className="flex flex-col gap-2 flex-1 w-1/3">
          <Label className="w-full truncate">{t("input.config.foregroundColor")}</Label>
          <Input name="foregroundColor" value={theme.config?.foregroundColor} onChange={(e) => updateForegroundColor(e.target.value)}  />
        </div>
        {theme.extends === 'teleprompter' && <div className="flex flex-col gap-2 flex-1 w-1/3">
          <Label className="w-full truncate">{t("input.config.chords.color")}</Label>
          <Input name="chordsColor" value={teleprompterConfig?.chords?.color} onChange={(e) => updateChordsColor(e.target.value)}  />
        </div>}
      </div>
      <h3 className="text-lg font-medium mt-4">{t("input.titles.title")}</h3>
      <ThemeConfigFontForm theme={theme} setTheme={setTheme} configKey="title" />
    </div>
  );

});
