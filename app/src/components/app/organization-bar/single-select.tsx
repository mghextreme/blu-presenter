import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { CheckIcon } from "@radix-ui/react-icons";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import type { OptionalOrganization } from "./index";

interface OrganizationBarSelectorProps {
  organizations: OptionalOrganization[];
  selected: OptionalOrganization | undefined;
  onSelectedChange: (org: OptionalOrganization) => void;
  subtitle?: string;
}

export function OrganizationBarSelector({
  organizations,
  selected,
  onSelectedChange,
  subtitle,
}: OrganizationBarSelectorProps) {
  const { t } = useTranslation("organizations");

  const [openSelector, setOpenSelector] = useState<boolean>(false);
  const options = organizations.filter((org) => !!org);

  return (
    <>
      {subtitle && <span className="text-sm text-nowrap">{subtitle}</span>}
      <Popover open={openSelector} onOpenChange={setOpenSelector}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between max-w-48">
            <span className="truncate">{selected?.name || t('defaultName')}</span>
            <ChevronDownIcon className="size-3 shrink-0 opacity-50 ms-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={t('searchPlaceholder')} className="h-9" />
            <CommandEmpty>{t('searchNoneFound')}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option!.id}
                  value={option!.name?.toString() ?? t('defaultName')}
                  onSelect={() => {
                    setOpenSelector(false);
                    onSelectedChange(option!);
                  }}
                >
                  {option!.name || t('defaultName')}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      selected?.id === option!.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
