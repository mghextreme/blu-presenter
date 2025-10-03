import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useServices } from "@/hooks/useServices";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Link, Params, useLoaderData, useNavigate } from "react-router-dom";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import { CheckIcon } from "@radix-ui/react-icons";
import { useTranslation } from "react-i18next";
import { IOrganizationUser, isRoleHigherOrEqualThan } from "@/types";
import { OrganizationsService } from "@/services";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export async function loader({ params, organizationsService }: { params: Params, organizationsService: OrganizationsService }) {
  return await organizationsService.getMember(Number(params.id));
}

export default function EditMember() {

  const { t } = useTranslation("organizations");

  const navigate = useNavigate();

  const { organizationsService } = useServices();
  const { organization, user } = useAuth();
  const data = useLoaderData() as IOrganizationUser;

  if (!isRoleHigherOrEqualThan(data.role, 'admin')) {
    throw new Error(t('error.noPermission'));
  }

  const [isLoading, setLoading] = useState<boolean>(false);

  const formSchema = z.object({
    role: z.enum(["admin", "member", "guest"]).default("guest"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    //@ts-expect-error // TODO ver problemas de undefinable
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: (["admin", "member", "guest"].includes(data.role) ? data.role : 'guest') as 'admin' | 'member' | 'guest',
    },
  });

  const roles = [
    { label: t('role.admin'), value: 'admin' },
    { label: t('role.member'), value: 'member' },
    { label: t('role.guest'), value: 'guest' },
  ] as { label: string; value: 'admin' | 'member' | 'guest' }[];

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    organizationsService.editMember(data.id, values.role)
      .then(() => {
        navigate("/app/organization", { replace: true });
      })
      .catch((e) => {
        toast.error(t('error.editMember'), {
          description: e?.message || '',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const [openRoleSelector, setOpenRoleSelector] = useState<boolean>(false);
  const canEdit = data.role !== 'owner' && data.email != user?.email; // TODO: Use internal users ID to compare instead of email

  return (
    <div className="p-2 sm:p-8">
      <title>{t('title.member', {member: data.name || data.email, organization: organization?.name || t('organizations.defaultName')}) + ' - BluPresenter'}</title>
      <h1 className="text-3xl mb-4">{t('editMember.title')}</h1>
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
              //TODO investigate
              // @ts-expect-error
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
                            className={cn(
                              "w-[200px] justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? roles.find(
                                (role) => role.value === field.value
                              )?.label
                              : t('input.selectRole')}
                            <ChevronDownIcon className="size-3 shrink-0 opacity-50 ms-2" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {roles.map((role) => (
                                <CommandItem
                                  value={role.label}
                                  key={role.value}
                                  onSelect={() => {
                                    form.setValue("role", role.value);
                                    setOpenRoleSelector(false);
                                  }}
                                >
                                  {role.label}
                                  <CheckIcon
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      role.value === field.value ? "opacity-100" : "opacity-0"
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
              )}></FormField>
          )}
          <div className="flex flex-row align-start space-x-2">
            <Button className="flex-0" type="submit" disabled={isLoading || !canEdit}>
              {isLoading && (
                <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
              )}
              {t('button.update')}
            </Button>
            <Button className="flex-0" type="button" variant="secondary" asChild><Link to={`/app/organization`}>{t('button.cancel')}</Link></Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
