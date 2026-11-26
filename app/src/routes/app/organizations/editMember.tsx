import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';

import { useServices } from '@/hooks/useServices';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useParams } from 'react-router';
import ArrowPathIcon from '@heroicons/react/24/solid/ArrowPathIcon';
import ChevronDownIcon from '@heroicons/react/24/solid/ChevronDownIcon';
import { CheckIcon } from '@radix-ui/react-icons';
import { useTranslation } from 'react-i18next';
import { isRoleHigherOrEqualThan, OrganizationRoleOptions } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { PageContent } from '@/components/shared/page-content';

export function EditMember() {
  const { t } = useTranslation('organizations');

  const navigate = useNavigate();

  const { organizationsService } = useServices();
  const { organizations, user } = useAuth();
  const params = useParams();
  const { data } = useSuspenseQuery(
    organizationsService.memberQuery(Number(params.id), Number(params.orgId)),
  );

  const organization = organizations.find((org) => org.id === Number(params.orgId));

  const formSchema = z.object({
    role: z.enum(['admin', 'member', 'guest']).default('guest'),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    //@ts-expect-error // TODO ver problemas de undefinable
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: (['admin', 'member', 'guest'].includes(data.role) ? data.role : 'guest') as
        | 'admin'
        | 'member'
        | 'guest',
    },
  });

  const roles = [
    { label: t('role.admin'), value: 'admin' },
    { label: t('role.member'), value: 'member' },
    { label: t('role.guest'), value: 'guest' },
  ] as { label: string; value: 'admin' | 'member' | 'guest' }[];

  const editMember = useMutation({
    mutationFn: (role: OrganizationRoleOptions) =>
      organizationsService.editMember(data.id, role, organization?.id ?? 0),
    onSuccess: () => {
      void navigate(`/app/organization/${organization?.id ?? 0}`, { replace: true });
    },
    onError: (e) => {
      toast.error(t('error.editMember'), {
        description: e?.message || '',
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    editMember.mutate(values.role);
  };

  const [openRoleSelector, setOpenRoleSelector] = useState<boolean>(false);
  const roleSelectorListId = 'edit-member-role-selector-list';
  const canEdit = data.role !== 'owner' && data.email != user?.email; // TODO: Use internal users ID to compare instead of email

  if (!isRoleHigherOrEqualThan(organization?.role, 'admin')) {
    throw new Error(t('error.noPermissions'));
  }

  return (
    <PageContent>
      <title>
        {t('title.member', {
          member: data.name || data.email,
          organization: organization?.name || t('organizations.defaultName'),
        }) + ' - BluPresenter'}
      </title>
      <Form {...form}>
        {/*
        // @ts-expect-error //TODO investigar  */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-3">
          <FormItem>
            <FormLabel>{t('input.name')}</FormLabel>
            <Input value={data.name} disabled />
          </FormItem>
          <FormItem>
            <FormLabel>{t('input.email')}</FormLabel>
            <Input value={data.email} disabled />
          </FormItem>
          {!canEdit ? (
            <FormItem>
              <FormLabel>{t('input.role')}</FormLabel>
              <Input value={t('role.' + data.role)} disabled />
            </FormItem>
          ) : (
            <FormField
              // @ts-expect-error TODO investigate react-hook-form typing
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('input.role')}</FormLabel>
                  <div>
                    <Popover open={openRoleSelector} onOpenChange={setOpenRoleSelector}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openRoleSelector}
                            aria-controls={roleSelectorListId}
                            className={cn(
                              'w-[200px] justify-between',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value
                              ? roles.find((role) => role.value === field.value)?.label
                              : t('input.selectRole')}
                            <ChevronDownIcon className="size-3 shrink-0 opacity-50 ms-2" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandList id={roleSelectorListId}>
                            <CommandGroup>
                              {roles.map((role) => (
                                <CommandItem
                                  value={role.label}
                                  key={role.value}
                                  onSelect={() => {
                                    form.setValue('role', role.value);
                                    setOpenRoleSelector(false);
                                  }}
                                >
                                  {role.label}
                                  <CheckIcon
                                    className={cn(
                                      'ml-auto h-4 w-4',
                                      role.value === field.value ? 'opacity-100' : 'opacity-0',
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
          )}
          <div className="flex flex-row align-start space-x-2">
            <Button className="flex-0" type="submit" disabled={editMember.isPending || !canEdit}>
              {editMember.isPending && (
                <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
              )}
              {t('button.update')}
            </Button>
            <Button className="flex-0" type="button" variant="secondary" asChild>
              <Link to={`/app/organization/${organization?.id ?? 0}`}>{t('button.cancel')}</Link>
            </Button>
          </div>
        </form>
      </Form>
    </PageContent>
  );
}
