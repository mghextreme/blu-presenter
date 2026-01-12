import { FlagBr, FlagDe, FlagEs, FlagFr, FlagGb, FlagIt } from "@/components/logos/flags";

export type SupportedLanguage = 'en' | 'pt' | 'es' | 'fr' | 'de' | 'it';
export type SupportedUILanguage = 'en' | 'pt';

export interface ILanguage {
  value: SupportedLanguage;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export const supportedLanguagesMap = [
  {
    value: "en",
    label: "english",
    icon: FlagGb,
  },
  {
    value: "pt",
    label: "portuguese",
    icon: FlagBr,
  },
  {
    value: "es",
    label: "spanish",
    icon: FlagEs,
  },
  {
    value: "fr",
    label: "french",
    icon: FlagFr,
  },
  {
    value: "de",
    label: "german",
    icon: FlagDe,
  },
  {
    value: "it",
    label: "italian",
    icon: FlagIt,
  },
] as ILanguage[];
