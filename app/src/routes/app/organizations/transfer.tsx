import { useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';

import { useServices } from '@/hooks/useServices';
import { PageContent } from '@/components/shared/page-content';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ArrowPathIcon from '@heroicons/react/24/solid/ArrowPathIcon';
import ChevronDownIcon from '@heroicons/react/24/solid/ChevronDownIcon';
import { CheckIcon } from '@radix-ui/react-icons';
import { useTranslation } from 'react-i18next';
import { IOrganizationUser, isRoleHigherOrEqualThan } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

export function TransferOrganization() {
  const { t } = useTranslation('organizations');

  const params = useParams();
  const navigate = useNavigate();
  const { organizationsService } = useServices();
  const { data } = useSuspenseQuery(organizationsService.currentQuery(Number(params.orgId)));
  const members = data.users?.filter((x) => x.role !== 'owner') || [];
  const [selectedMember, setSelectedMember] = useState<IOrganizationUser | undefined>(undefined);

  const transferOwnership = useMutation({
    mutationFn: (member: IOrganizationUser) =>
      organizationsService.transferOwnership(member.id, data.id),
    onSuccess: () => {
      navigate(`/app/organization/${data.id}`, { replace: true });
    },
    onError: (e) => {
      toast.error(t('error.transfer'), {
        description: e?.message || '',
      });
    },
  });

  const onSubmit = () => {
    if (!selectedMember) {
      toast.error(t('error.selectMember'));
      return;
    }

    transferOwnership.mutate(selectedMember);
  };

  const [openRoleSelector, setOpenRoleSelector] = useState<boolean>(false);
  const memberSelectorListId = 'transfer-member-selector-list';

  // After the transfer the organization is refetched with the user no longer
  // owner, while this page is still shown until the navigation completes.
  if (!transferOwnership.isSuccess && !isRoleHigherOrEqualThan(data.role, 'owner')) {
    throw new Error(t('error.noPermission'));
  }

  return (
    <PageContent>
      <title>
        {t('title.transfer', { organization: data.name || t('defaultName') }) + ' - BluPresenter'}
      </title>
      <div className="max-w-lg space-y-3">
        <Label data-slot="form-label">{t('input.transferMember')}</Label>
        <div>
          <Popover open={openRoleSelector} onOpenChange={setOpenRoleSelector}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openRoleSelector}
                aria-controls={memberSelectorListId}
                className={cn('w-full justify-between', !selectedMember && 'text-muted-foreground')}
              >
                {selectedMember ? (
                  <>
                    {selectedMember.name} ({selectedMember.email})
                  </>
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
                <CommandList id={memberSelectorListId}>
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
                            'ml-auto h-4 w-4',
                            member.id === selectedMember?.id ? 'opacity-100' : 'opacity-0',
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
            <div className="text-xs text-muted-foreground mt-2">{t('members.noOtherMembers')}</div>
          )}
        </div>
        <div className="flex flex-row align-start space-x-2">
          <Button
            className="flex-0"
            type="button"
            disabled={transferOwnership.isPending || !selectedMember}
            onClick={onSubmit}
          >
            {transferOwnership.isPending && (
              <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
            )}
            {t('button.transfer')}
          </Button>
          <Button className="flex-0" type="button" variant="secondary" asChild>
            <Link to={`/app/organization/${data.id}`}>{t('button.cancel')}</Link>
          </Button>
        </div>
      </div>
    </PageContent>
  );
}
