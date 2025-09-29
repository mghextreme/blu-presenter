import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod"
import { IControllerConfig, useController } from "@/hooks/controller.provider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import CheckIcon from "@heroicons/react/24/solid/CheckIcon";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import { useServices } from "@/hooks/services.provider";
import { ISession } from "@/types";
import { useBroadcast } from "@/hooks/broadcast.provider";

const controllerConfigurationSchema = z.object({
  autoAdvanceScheduleItem: z.boolean(),
  broadcastSession: z.number().optional(),
});

export function PlanConfiguration() {

  const { t } = useTranslation("controller");

  const {
    config,
    setConfig,
  } = useController();

  const {
    sessionsService,
  } = useServices();

  const {
    session,
    setSession,
  } = useBroadcast();

  const form = useForm<z.infer<typeof controllerConfigurationSchema>>({
    resolver: zodResolver(controllerConfigurationSchema),
    defaultValues: {
      autoAdvanceScheduleItem: config.autoAdvanceScheduleItem ?? false,
    },
  });

  const [sessions, setSessions] = useState<ISession[]>([]);
  useEffect(() => {
    sessionsService.getAllForUser()
      .then((sessions: ISession[]) => {
        setSessions(sessions);
      });
  }, []);

  const [selectedSession, setSelectedSession] = useState<ISession | undefined>(undefined);
  useEffect(() => {
    const theSession = sessions.find((session) => session.id == form.getValues('broadcastSession'));
    setSelectedSession(theSession);
  }, [sessions, session]);

  useEffect(() => {
    setConfig(form.getValues() as IControllerConfig);
  }, [form.watch()]);

  const nameFromSession = (item?: ISession) => {
    if (!item) return t('session.dontBroadcast');

    return `${item.name ?? t('session.defaultName')} - ${item.organization?.name ?? t('organizations.defaultName')}`
  }

  const [openSessionSelector, setOpenSessionSelector] = useState<boolean>(false);

  return (
    <Form {...form}>
      <form onSubmit={() => {}} className="flex flex-col w-full space-y-3">
        <FormField
          control={form.control}
          name="autoAdvanceScheduleItem"
          render={({field}) => (
            <FormItem className="flex-1 flex-row justify-between py-2">
              <FormLabel>{t('plan.configuration.autoAdvanceScheduleItem')}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}></FormField>

        <FormField
          control={form.control}
          name="broadcastSession"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('plan.configuration.broadcastSession.label')}</FormLabel>
              <FormDescription>{t('plan.configuration.broadcastSession.description')}</FormDescription>
              <Popover open={openSessionSelector} onOpenChange={setOpenSessionSelector}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "justify-start",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {nameFromSession(selectedSession)}
                      <ChevronDownIcon className="opacity-50 ms-auto me-0" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput
                      placeholder={t('session.search')}
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>{t('session.notFound')}</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                            value={t('session.dontBroadcast')}
                            key={'none'}
                            onSelect={() => {
                              setSession(undefined);
                              form.setValue("broadcastSession", undefined);
                              setOpenSessionSelector(false);
                            }}
                          >
                            <span className="opacity-50">{t('session.dontBroadcast')}</span>
                            <CheckIcon
                              className={cn(
                                "ml-auto",
                                !session?.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        {sessions?.map((option) => (
                          <CommandItem
                            value={nameFromSession(option)}
                            key={option.id}
                            onSelect={() => {
                              setSession({
                                id: option.id,
                                orgId: option.organization?.id,
                                secret: option.secret,
                              });
                              form.setValue("broadcastSession", option.id);
                              setOpenSessionSelector(false);
                            }}
                          >
                            {nameFromSession(option)}
                            <CheckIcon
                              className={cn(
                                "ml-auto",
                                option.id === session?.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
