import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { useState } from "react";
import { FlagBr, FlagGb } from "@/components/logos/flags";
import i18next from "i18next";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import { Command, CommandGroup, CommandItem } from "../ui/command";
import { useTranslation } from "react-i18next";

type LanguageTogglerProps = {
  variant?: 'ghost' | 'outline';
}

export default function LanguageToggler({
  variant = 'outline',
}: LanguageTogglerProps) {

  const { t } = useTranslation("navbar");
  const curLang = i18next.resolvedLanguage || 'en';

  const [open, setOpen] = useState(false);

  const setValue = (lang: string) => {
    i18next.changeLanguage(lang);
  }

  const languages = [
    {
      label: 'English',
      value: 'en',
      flag: <FlagGb className="size-3 me-2" />,
    },
    {
      label: 'Português',
      value: 'pt',
      flag: <FlagBr className="size-3 me-2" />,
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          role="combobox"
          aria-expanded={open}
          className="w-auto justify-between"
          title={t('language.title')}
        >
          {languages.find((lang) => lang.value === curLang)?.flag}
          <ChevronDownIcon className="size-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandGroup>
            {languages.map((lang) => (
              <CommandItem
                key={lang.value}
                value={lang.value}
                onSelect={(currentValue) => {
                  setValue(currentValue)
                  setOpen(false)
                }}
              >
                {lang.flag}
                {lang.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
