import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandSeparator } from "../ui/command";
import { useEffect } from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/hooks/useOrganization";
import { IOrganization } from "@/types/organization.interface";

type OrganizationsButtonProps = {
  organizations: IOrganization[]
}

export default function OrganizationsButton({ organizations }: OrganizationsButtonProps) {

  const { t } = useTranslation("navbar");

  const { organizationId, setOrganizationId } = useOrganization();
  const [localOrganization, setLocalOrganization] = useState<{id: number, name?: string} | undefined>(undefined);

  useEffect(() => {
    if (organizationId) {
      const currentOrg = organizations.filter((x) => x.id === organizationId)[0];
      setLocalOrganization(currentOrg);
    } else {
      const currentOrg = organizations.filter((x) => !x.name)[0];
      setOrganizationId(currentOrg.id);
      setLocalOrganization(currentOrg);
    }
  }, [organizations, organizationId]);

  const [openSelector, setOpenSelector] = useState<boolean>(false);

  return (
    <Popover open={openSelector} onOpenChange={setOpenSelector}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between max-w-48">
          <span className="truncate">{localOrganization?.name || t('organizations.defaultName')}</span>
          <ChevronDownIcon className="size-3 shrink-0 opacity-50 ms-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={t('organizations.searchPlaceholder')} className="h-9" />
          <CommandEmpty>{t('organizations.searchNoneFound')}</CommandEmpty>
          <CommandGroup>
            {organizations.map((option) => (
              <CommandItem
                key={option.id}
                value={option.id.toString()}
                onSelect={() => {
                  setOrganizationId(option.id);
                  setOpenSelector(false);
                }}
              >
                {option.name || t('organizations.defaultName')}
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    organizationId === option.id ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
            <CommandSeparator className="my-1" />
            <CommandItem
              onSelect={() => alert('create')}>
                {t('organizations.create')}
                <PlusIcon className="ml-auto h-4 w-4" />
              </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
