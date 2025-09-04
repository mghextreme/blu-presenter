import {useState} from "react";
import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form";
import {z} from "zod";

import {useServices} from "@/hooks/services.provider";
import { useAuth } from "@/hooks/useAuth";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Link, useLoaderData, useNavigate} from "react-router-dom";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import {CheckIcon} from "@radix-ui/react-icons";
import {useTranslation} from "react-i18next";
import {IOrganization, isRoleHigherOrEqualThan} from "@/types";
import {OrganizationsService} from "@/services";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Command, CommandGroup, CommandItem, CommandList} from "@/components/ui/command";
import {cn} from "@/lib/utils";
import { toast } from "sonner";

export async function loader({organizationsService}: { organizationsService: OrganizationsService }) {
  return await organizationsService.getCurrent();
}

const formSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "guest"]).default("guest"),
});

export default function InviteOrganizationMember() {

  const { t } = useTranslation("organizations");

  const navigate = useNavigate();

  const { organization } = useAuth();

  const { organizationsService } = useServices();
  const data = useLoaderData() as IOrganization;
  
  if (!isRoleHigherOrEqualThan(data.role, 'admin')) {
    throw new Error(t('error.noPermission'));
  }

  const [isLoading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    //@ts-expect-error // TODO investigar
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      role: 'guest',
    },
  });

  const roles = [
    {label: t('role.admin'), value: 'admin'},
    {label: t('role.member'), value: 'member'},
    {label: t('role.guest'), value: 'guest'},
  ] as { label: string; value: 'admin' | 'member' | 'guest' }[];

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    organizationsService.inviteMember(values.email, values.role)
      .then(() => {
        navigate("/app/organization", {replace: true});
      })
      .catch((e) => {
        toast.error(t('error.inviteMember'), {
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
      <title>{t('title.invite', {organization: organization?.name || t('organizations.defaultName')}) + ' - BluPresenter'}</title>
      <h1 className="text-3xl mb-2">{t('invite.title')}</h1>
      <h2 className="text mb-4 opacity-50">{data.name || t('defaultName')}</h2>
      <Form {...form}>
        <form
          //@ts-expect-error // Erro nos parâmetros do handleSubmit/tipo inválido
          onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-3">
          <FormField
            //@ts-expect-error // Erro na referência de control/tipo inválido
            control={form.control}
            name="email"
            render={({field}) => (
              <FormItem>
                <FormLabel>{t('input.email')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage/>
              </FormItem>
            )}></FormField>
          <FormField
            //@ts-expect-error // Erro na referência de control/tipo inválido
            control={form.control}
            name="role"
            render={({field}) => (
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
                          <ChevronDownIcon className="size-3 shrink-0 opacity-50 ms-2"/>
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
                <FormDescription className="text-xs opacity-70">
                  {t('role.description.' + field.value)}
                </FormDescription>
                <FormMessage/>
              </FormItem>
            )}></FormField>
          <div className="flex flex-row align-start space-x-2">
            <Button className="flex-0" type="submit" disabled={isLoading}>
              {isLoading && (
                <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
              )}
              {t('button.invite')}
            </Button>
            <Link to={`/app/organization`}><Button className="flex-0" type="button"
                                                   variant="secondary">{t('button.cancel')}</Button></Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
