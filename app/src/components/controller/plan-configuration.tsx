import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod"
import { IControllerConfig } from "@/hooks/controller.provider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import CheckIcon from "@heroicons/react/24/solid/CheckIcon";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import { useServices } from "@/hooks/useServices";
import { BaseTheme, ISession, ITheme } from "@/types";
import { useBroadcast } from "@/hooks/useBroadcast";
import { useController } from "@/hooks/useController";
import QRCode from "react-qr-code";
import { Input } from "../ui/input";
import { toast } from "sonner";

const controllerConfigurationSchema = z.object({
  autoAdvanceScheduleItem: z.boolean(),
  broadcastSession: z.number().optional(),
  broadcastSessionUrlTheme: z.object({
    label: z.string(),
    value: z.union([z.enum(['lyrics', 'subtitles', 'teleprompter']), z.number()]),
  }).optional(),
});

export function PlanConfiguration() {

  const { t } = useTranslation("controller");

  const {
    config,
    setConfig,
  } = useController();

  const {
    sessionsService,
    themesService,
  } = useServices();

  const {
    session,
    setSession,
    urlTheme,
    setUrlTheme,
  } = useBroadcast();

  const form = useForm<z.infer<typeof controllerConfigurationSchema>>({
    resolver: zodResolver(controllerConfigurationSchema),
    defaultValues: {
      autoAdvanceScheduleItem: config.autoAdvanceScheduleItem ?? false,
      broadcastSession: session?.id ?? undefined,
      broadcastSessionUrlTheme: urlTheme,
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
  }, [form.watch('autoAdvanceScheduleItem')]);

  const nameFromSession = (item?: ISession) => {
    if (!item) return t('session.dontBroadcast');

    return `${item.name ?? t('session.defaultName')} - ${item.organization?.name ?? t('organizations.defaultName')}`
  }

  const [openSessionSelector, setOpenSessionSelector] = useState<boolean>(false);
  const [openSessionUrlThemeSelector, setOpenSessionUrlThemeSelector] = useState<boolean>(false);

  const defaultThemeOptions: {label: string; value: BaseTheme | number}[] = [
    {
      value: "lyrics",
      label: t('theme.lyrics'),
    },
    {
      value: "subtitles",
      label: t('theme.subtitles'),
    },
    {
      value: "teleprompter",
      label: t('theme.teleprompter'),
    },
  ];

  const [consolidatedOptions, setConsolidatedOptions] = useState<{label: string; value: BaseTheme | number}[]>(defaultThemeOptions);
  const [selectedUrlTheme, setSelectedUrlTheme] = useState<{label: string; value: BaseTheme | number} | undefined>(undefined);
  useEffect(() => {
    if (!session) {
      setConsolidatedOptions(defaultThemeOptions);
      return;
    }

    themesService.getAll(session.orgId)
      .then((customThemes: ITheme[]) => {
        setConsolidatedOptions([
          ...customThemes.map((theme: ITheme) => ({
            value: theme.id,
            label: theme.name,
          })),
          ...defaultThemeOptions,
        ]);
      });
  }, [session]);
  
  useEffect(() => {
    const theUrlTheme = consolidatedOptions.find((theme) => theme.value == form.getValues('broadcastSessionUrlTheme')?.value);
    setSelectedUrlTheme(theUrlTheme);
  }, [urlTheme, consolidatedOptions, session]);

  const nameFromTheme = (item?: {label: string; value: string | number}) => {
    if (!item) return t('session.urlTheme.letUserPick');

    return item.label;
  }

  const [sessionQrCodeUrl, setSessionQrCodeUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!selectedSession) {
      setSessionQrCodeUrl(undefined);
      return;
    }

    const currentUrl = new URL(window.location.href);
    const theme = selectedUrlTheme?.value ? `/${selectedUrlTheme.value}` : '';
    const completeUrl = `${currentUrl.protocol}//${currentUrl.host}/shared/session/${selectedSession.organization?.id}/${selectedSession.id}/${selectedSession.secret ?? ''}${theme}`
    setSessionQrCodeUrl(completeUrl);
  }, [selectedSession, selectedUrlTheme]);

  const copyShareableUrlToClipboard = async () => {
    if (!sessionQrCodeUrl) return;

    const clipboard = navigator.clipboard;
    if (!!clipboard) {
      await navigator.clipboard.writeText(sessionQrCodeUrl);
      toast.success(t('message.share.title'), {
        description: t('message.share.description'),
      });
    } else {
      window.open(sessionQrCodeUrl, '_blank');
    }
  }

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
            <FormItem>
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

        {selectedSession && sessionQrCodeUrl && (
          <div className="flex items-stretch gap-3 mt-2">
            <div className="max-h-[8em] aspect-square bg-white p-2 rounded-md">
              <QRCode value={sessionQrCodeUrl} className="max-h-full max-w-full" />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {!selectedSession.theme && (
                <FormField
                  control={form.control}
                  name="broadcastSessionUrlTheme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('plan.configuration.broadcastSessionUrlTheme.label')}</FormLabel>
                      <FormDescription>{t('plan.configuration.broadcastSessionUrlTheme.description')}</FormDescription>
                      <Popover open={openSessionUrlThemeSelector} onOpenChange={setOpenSessionUrlThemeSelector}>
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
                              {nameFromTheme(selectedUrlTheme)}
                              <ChevronDownIcon className="opacity-50 ms-auto me-0" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <Command>
                            <CommandInput
                              placeholder={t('session.urlTheme.search')}
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>{t('session.urlTheme.notFound')}</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                    value={t('session.urlTheme.letUserPick')}
                                    key={'none'}
                                    onSelect={() => {
                                      setUrlTheme(undefined);
                                      form.setValue("broadcastSessionUrlTheme", undefined);
                                      setOpenSessionUrlThemeSelector(false);
                                    }}
                                  >
                                    <span className="opacity-50">{t('session.urlTheme.letUserPick')}</span>
                                    <CheckIcon
                                      className={cn(
                                        "ml-auto",
                                        !session?.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                {consolidatedOptions?.map((option) => (
                                  <CommandItem
                                    value={nameFromTheme(option)}
                                    key={option.value}
                                    onSelect={() => {
                                      setUrlTheme(option);
                                      form.setValue("broadcastSessionUrlTheme", option);
                                      setOpenSessionUrlThemeSelector(false);
                                    }}
                                  >
                                    {nameFromTheme(option)}
                                    <CheckIcon
                                      className={cn(
                                        "ml-auto",
                                        option.value === selectedUrlTheme?.value
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
              )}
              <FormLabel className="mt-3">{t('plan.configuration.broadcastSession.url')}</FormLabel>
              <Input value={sessionQrCodeUrl} disabled />
              <Button onClick={copyShareableUrlToClipboard} type="button" className="w-auto me-auto">{t('plan.configuration.broadcastSession.copyUrl')}</Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  )
}
