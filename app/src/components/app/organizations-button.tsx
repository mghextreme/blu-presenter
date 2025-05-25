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
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function OrganizationsButton() {

  const { t } = useTranslation("navbar");
  const navigate = useNavigate();

  const { organizations, organization, setOrganizationById } = useAuth();
  const [localOrganization, setLocalOrganization] = useState<{id: number, name?: string} | undefined>(undefined);

  useEffect(() => {
    if (organization) {
      setLocalOrganization({
        id: organization.id,
        name: organization.name,
      });
    } else {
      if (organizations && organizations.length > 0) {
        setLocalOrganization({
          id: organizations[0].id,
          name: organizations[0].name,
        });
      }
    }
  }, [organization]);

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
                  setOpenSelector(false);
                  setOrganizationById(option.id);
                }}
              >
                {option.name || t('organizations.defaultName')}
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    localOrganization?.id === option.id ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
            <CommandSeparator className="my-1" />
            <CommandItem
              onSelect={() => { setOpenSelector(false); navigate('/app/organizations/add'); }}>
                {t('organizations.create')}
                <PlusIcon className="ml-auto h-4 w-4" />
              </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
