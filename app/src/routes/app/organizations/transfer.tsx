import { useState } from "react";

import { useServices } from "@/hooks/services.provider";
import { Button } from "@/components/ui/button";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import { CheckIcon } from "@radix-ui/react-icons";
import { useTranslation } from "react-i18next";
import { IOrganization, IOrganizationUser, isRoleHigherOrEqualThan } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function TransferOrganization() {

  const { t } = useTranslation("organizations");

  const data = useLoaderData() as IOrganization;
  const members = data.users?.filter(x => x.role !== 'owner') || [];
  const [selectedMember, setSelectedMember] = useState<IOrganizationUser | undefined>(undefined);

  const navigate = useNavigate();
  const { organizationsService } = useServices();

  if (!isRoleHigherOrEqualThan(data.role, 'owner')) {
    throw new Error(t('error.noPermission'));
  }

  const [isLoading, setLoading] = useState<boolean>(false);

  const onSubmit = async () => {
    if (!selectedMember) {
      toast.error(t('error.selectMember'));
      return;
    }

    setLoading(true);
    organizationsService.transferOwnership(selectedMember.id)
      .then(() => {
        navigate("/app/organization", { replace: true });
      })
      .catch((e) => {
        toast.error(t('error.transfer'), {
          description: e?.message || '',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const [openRoleSelector, setOpenRoleSelector] = useState<boolean>(false);

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-4">{t('transfer.title')}</h1>
      <div className="max-w-lg space-y-3">
        <Label data-slot="form-label">{t('input.transferMember')}</Label>
        <div>
          <Popover open={openRoleSelector} onOpenChange={setOpenRoleSelector}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full justify-between",
                  !selectedMember && "text-muted-foreground"
                )}
              >
                {selectedMember ? (
                  <>{selectedMember.name} ({selectedMember.email})</>
                ) : (
                  <>{t('members.selectMember')}</>
                )}
                <ChevronDownIcon className="size-3 shrink-0 opacity-50 ms-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder={t('members.searchPlaceholder')} className="h-9" />
                <CommandEmpty>{t('members.searchNoneFound')}</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    {members.map((member) => (
                      <CommandItem
                        value={member.id.toString()}
                        key={member.id}
                        onSelect={() => {
                          setSelectedMember(member);
                          setOpenRoleSelector(false);
                        }}
                      >
                        {member.name} ({member.email})
                        <CheckIcon
                          className={cn(
                            "ml-auto h-4 w-4",
                            member.id === selectedMember?.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {members.length === 0 && (
            <div className="text-xs text-muted-foreground mt-2">
              {t('members.noOtherMembers')}
            </div>
          )}
        </div>
        <div className="flex flex-row align-start space-x-2">
          <Button className="flex-0" type="button" disabled={isLoading} onClick={onSubmit}>
            {isLoading && (
              <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
            )}
            {t('button.transfer')}
          </Button>
          <Link to={`/app/organization`}><Button className="flex-0" type="button" variant="secondary">{t('button.cancel')}</Button></Link>
        </div>
      </div>
    </div>
  );
}
