import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { CaretSortIcon } from "@radix-ui/react-icons";
import DocumentDuplicateIcon from "@heroicons/react/24/solid/DocumentDuplicateIcon";
import CheckIcon from "@heroicons/react/24/solid/CheckIcon";
import { useServices } from "@/hooks/useServices";
import { toast } from "sonner";
import { isRoleHigherOrEqualThan } from "@/types";

interface CopyThemeToOrganizationProps {
  themeId: number;
  name: string;
  variant?: "default" | "secondary";
}

export function CopyThemeToOrganization({
  themeId, name, variant = "secondary"
}: CopyThemeToOrganizationProps) {

  const { t } = useTranslation("themes");
  const { organizations, organization } = useAuth();
  const { themesService } = useServices();

  const possibleOrgs = organizations.filter(
    org => org.id !== organization?.id && isRoleHigherOrEqualThan(organization?.role, "member")
  ).map((org) => {
    if (!org.name) {
      org.name = t('message.copyToOrganization.defaultName');
    }

    return org;
  });

  const startingOrg = possibleOrgs.length === 1 ? possibleOrgs[0].id : undefined;

  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [selectedOrg, setSelectedOrg] = useState<number | undefined>(startingOrg);

  const onSubmit = async () => {
    if (!selectedOrg) {
      return;
    }

    setLoading(true);
    themesService.copyToOrganization(themeId, selectedOrg)
      .catch((e) => {
        toast.error(t('error.copyToOrganization'), {
          description: e?.message || '',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" className="flex-0" variant={variant} title={t('actions.copyToOrganization')}>
          <DocumentDuplicateIcon className="size-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('message.copyToOrganization.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            <h4 className="text-lg mt-2 mb-4">{name}</h4>
            <div className="mb-2">
              {t('message.copyToOrganization.description')}
            </div>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedOrg
                    ? possibleOrgs.find((org) => org.id === selectedOrg)?.name
                    : t('message.copyToOrganization.selectOrg')
                  }
                  <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder={t('message.copyToOrganization.searchOrgs')} className="h-9" />
                  <CommandList>
                    <CommandEmpty>{t('message.copyToOrganization.noOrgFound')}</CommandEmpty>
                    <CommandGroup>
                      {possibleOrgs.map((org) => (
                        <CommandItem
                          key={org.id}
                          value={org.id.toString()}
                          onSelect={(currentValue: string) => {
                            setSelectedOrg(Number(currentValue) === selectedOrg ? undefined : Number(currentValue));
                            setOpen(false);
                          }}
                        >
                          {org.name}
                          <CheckIcon
                            className={cn(
                              "ml-auto",
                              selectedOrg === org.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('button.cancel')}</AlertDialogCancel>
          <AlertDialogAction disabled={!selectedOrg || loading} onClick={onSubmit}>{t('button.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
