import { useTranslation } from "react-i18next";
import { ITheme } from "@/types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const fontOptions = [
  {
    value: "font-inter",
    label: "Inter",
    isMonospace: false,
  },
  {
    value: "font-montserrat",
    label: "Montserrat",
    isMonospace: false,
  },
  {
    value: "font-open-sans",
    label: "Open Sans",
    isMonospace: false,
  },
  {
    value: "font-playfair-display",
    label: "Playfair Display",
    isMonospace: false,
  },
  {
    value: "font-roboto",
    label: "Roboto",
    isMonospace: false,
  },
  {
    value: "font-roboto-mono",
    label: "Roboto Mono",
    isMonospace: true,
  },
  {
    value: "font-source-code-pro",
    label: "Source Code Pro",
    isMonospace: true,
  },
]

interface ThemeConfigFontFormProps {
  theme: ITheme
  setTheme: (theme: ITheme) => void
  configKey: string
}

export function ThemeConfigFontForm({
  theme,
  setTheme,
  configKey,
}: ThemeConfigFontFormProps) {

  const { t } = useTranslation("themes");

  const setFontFamily = (value: string) => {
    setTheme({
      ...theme,
      config: {
        [configKey]: {
          ...theme[configKey],
          fontFamily: value,
        },
      } as ITheme["config"],
    });
  };

  const fontsToShow = theme.extends === "teleprompter" ? fontOptions.filter((font) => font.isMonospace) : fontOptions;
  const defaultFont = theme.extends === "teleprompter" ? "font-source-code-pro" : "font-open-sans";

  return (
    <div className="flex justify-between gap-2">
      <div className="flex flex-col gap-2 flex-1 w-50">
        <Label className="w-full truncate">{t("input.config.fontFamily")}</Label>
        <Select
          value={theme.config[configKey].fontFamily ?? defaultFont}
          onValueChange={setFontFamily}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder={theme.config[configKey].fontFamily ?? defaultFont} />
          </SelectTrigger>
          <SelectContent side="top">
            {fontsToShow.map((font) => (
              <SelectItem key={font.value} value={font.value} className={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2 flex-1 w-24">
        <Label className="w-full truncate">{t("input.config.fontSize")}</Label>
        <Input type="number" step={1} value={theme.config[configKey].fontSize} onChange={(e) => setTheme({
          ...theme,
          config: {
            ...theme.config,
            [configKey]: {
              ...theme.config[configKey],
              fontSize: Number(e.target.value),
            },
          } as ITheme["config"],
        })} />
      </div>
    </div>
  );

};
