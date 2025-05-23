import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useServices } from "@/hooks/services.provider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Link, Params, useLoaderData, useNavigate } from "react-router-dom";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import { CheckIcon } from "@radix-ui/react-icons";
import { useTranslation } from "react-i18next";
import { IOrganizationUser } from "@/types";
import { OrganizationsService } from "@/services";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

export async function loader({ params, organizationsService }: { params: Params, organizationsService: OrganizationsService }) {
  return await organizationsService.getMember(Number(params.id));
}

const formSchema = z.object({
  role: z.enum(["admin", "member"]).default("member"),
});

export default function EditMember() {

  const { t } = useTranslation("organizations");

  const navigate = useNavigate();

  const { organizationsService } = useServices();
  const data = useLoaderData() as IOrganizationUser;

  const [isLoading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'member',
    },
  });

  const roles = [
    { label: t('role.admin'), value: 'admin' },
    { label: t('role.member'), value: 'member' },
  ] as { label: string; value: 'admin' | 'member' }[];

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      organizationsService.editMember(data.id, values.role)
        .then(() => {
          navigate("/app/organization", { replace: true });
        })
        .catch((e) => {
          toast({
            title: t('error.editMember'),
            description: e?.message || '',
            variant: "destructive",
          });
        })
    } finally {
      setLoading(false);
    }
  }

  const [openRoleSelector, setOpenRoleSelector] = useState<boolean>(false);

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-2">{t('editMember.title')}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-3">
          <FormItem>
            <FormLabel>{t('input.name')}</FormLabel>
            <Input value={data.name} disabled />
          </FormItem>
          <FormItem>
            <FormLabel>{t('input.email')}</FormLabel>
            <Input value={data.email} disabled />
          </FormItem>
          {data.role === 'owner' ? (
            <FormItem>
              <FormLabel>{t('input.role')}</FormLabel>
              <Input value={t('role.owner')} disabled />
            </FormItem>
          ) : (
            <FormField
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
            <Button className="flex-0" type="submit" disabled={isLoading}>
              {isLoading && (
                <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
              )}
              {t('button.update')}
              </Button>
            <Link to={`/app/organization`}><Button className="flex-0" type="button" variant="secondary">{t('button.cancel')}</Button></Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
