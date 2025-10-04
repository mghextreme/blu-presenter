import { useEffect, useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { TFunction } from "i18next";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseTheme, ILanguage, ISession, isRoleHigherOrEqualThan, ITheme, supportedLanguagesMap, SupportedUILanguage } from "@/types";
import { SessionSchema } from "@/types/schemas/session.schema";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/hooks/useServices";
import ControllerProvider from "@/hooks/controller.provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import CheckIcon from "@heroicons/react/24/solid/CheckIcon";
import QRCode from "react-qr-code";
import { toast } from "sonner";

function LanguageAndIcon({ t, language }: { t: TFunction, language?: ILanguage["value"] | null }) {
  if (!language) return t('language.user');

  const lang = supportedLanguagesMap.find((lang) => lang.value === language);
  if (!lang) return t('language.user');

  const Icon = lang.icon;
  return (
    <>
      <Icon className="h-4 w-4 me-2" />
      {t('language.' + lang.label)}
    </>
  );
}

type EditSessionProps = {
  edit?: boolean
}

export default function EditSession({
  edit = true,
}: EditSessionProps) {

  const { t } = useTranslation("sessions");
  const navigate = useNavigate();
  const { organization } = useAuth();
  const { sessionsService, themesService } = useServices();

  const loadedData = useLoaderData() as ISession;
  const data = edit ? loadedData : {
    id: 0,
    name: '',
    language: undefined,
    theme: undefined,
    default: false,
  };

  if (!data) {
    throw new Error("Can't find session");
  }

  if (!isRoleHigherOrEqualThan(organization?.role, 'admin')) {
    throw new Error(t('error.noPermission'));
  }

  const selectedTheme = !data.theme ? undefined : (data.theme as BaseTheme) || Number(data.theme);
  const form = useForm<z.infer<typeof SessionSchema>>({
    resolver: zodResolver(SessionSchema),
    defaultValues: {
      id: data.id,
      name: data.default ? t('session.defaultName') : data.name,
      language: data.language,
      theme: selectedTheme,
    },
  });

  const [isLoading, setLoading] = useState<boolean>(false);

  const onSubmit = async (values: z.infer<typeof SessionSchema>) => {
    setLoading(true);

    const fixedValues = {
      ...values,
      theme: values.theme ? values.theme.toString() : undefined,
    };

    let action;
    if (edit) {
      action = sessionsService.update(values.id, fixedValues);
    } else {
      action = sessionsService.add(fixedValues);
    }
    action
      .then(() => {
        navigate(`/app/sessions`);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const orgName = organization?.name || t("organizations.defaultName");

  const [openLanguageSelector, setOpenLanguageSelector] = useState(false);
  const [openThemeSelector, setOpenThemeSelector] = useState(false);
  
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

  const nameFromTheme = (item?: {label: string; value: BaseTheme | number} | BaseTheme | number | null) => {
    if (!item) return t('theme.letUserPick');

    if (typeof item === 'number' || typeof item === 'string') {
      const customTheme = consolidatedOptions.find((theme) => theme.value.toString() == item.toString());
      if (customTheme) {
        return customTheme.label;
      }
    }

    return (item as {label: string})?.label;
  }

  const [consolidatedOptions, setConsolidatedOptions] = useState<{label: string; value: BaseTheme | number}[]>(defaultThemeOptions);
  useEffect(() => {
    themesService.getAll()
      .then((customThemes: ITheme[]) => {
        setConsolidatedOptions([
          ...customThemes.map((theme: ITheme) => ({
            value: theme.id,
            label: theme.name,
          })),
          ...defaultThemeOptions,
        ]);
      });
  }, [organization]);

  const [selectedThemeName, setSelectedThemeName] = useState<string>(nameFromTheme(selectedTheme));
  useEffect(() => {
    const theme = form.getValues('theme');
    setSelectedThemeName(nameFromTheme(theme));
  }, [selectedTheme, consolidatedOptions, form.watch('theme')]);
  
  const [sessionQrCodeUrl, setSessionQrCodeUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!edit) {
      setSessionQrCodeUrl(undefined);
      return;
    }

    const theme = form.watch("theme");

    const currentUrl = new URL(window.location.href);
    const themeParam = theme ? `/${theme}` : '';
    const completeUrl = `${currentUrl.protocol}//${currentUrl.host}/shared/session/${data?.organization?.id}/${data.id}/${data.secret ?? ''}${themeParam}`
    setSessionQrCodeUrl(completeUrl);
  }, [edit, data, form.watch("theme")]);

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
    <>
      <title>{(edit ? t('title.edit', { name: data.default ? t('session.defaultName') : data.name }) : t('title.add')) + ' - ' + orgName + ' - BluPresenter'}</title>
      <div className="flex items-center px-2 sm:px-8 py-3 bg-slate-200 dark:bg-slate-900 gap-x-2">
        <span className="text-sm">{t('input.organization')}: <b>{orgName}</b></span>
      </div>
      <div className="p-2 sm:p-8">
        <h1 className="text-3xl mb-4">{edit ? t('edit.title') : t('add.title')}</h1>
        <ControllerProvider>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-3">
              <FormField
                control={form.control}
                name="name"
                disabled={edit && data.default}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('input.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('input.language')}</FormLabel>
                    <Popover open={openLanguageSelector} onOpenChange={setOpenLanguageSelector}>
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
                            <LanguageAndIcon t={t} language={field.value} />
                            <ChevronDownIcon className="opacity-50 ms-auto me-0" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Command>
                          <CommandInput
                            placeholder={t('language.search')}
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>{t('language.notFound')}</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value={t('language.user')}
                                key={'none'}
                                onSelect={() => {
                                  form.setValue("language", null);
                                  setOpenLanguageSelector(false);
                                }}
                              >
                                {t('language.user')}
                                <CheckIcon
                                  className={cn(
                                    "ml-auto",
                                    !field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                              {(['en', 'pt'] as SupportedUILanguage[]).map((language) => (
                                <CommandItem
                                  value={`${language} ${t('language.' + language)}`}
                                  key={language}
                                  onSelect={() => {
                                    form.setValue("language", language)
                                    setOpenLanguageSelector(false);
                                  }}
                                >
                                  <LanguageAndIcon t={t} language={language} />
                                  <CheckIcon
                                    className={cn(
                                      "ml-auto",
                                      language === field.value
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

              <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('input.theme')}</FormLabel>
                      <Popover open={openThemeSelector} onOpenChange={setOpenThemeSelector}>
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
                              {selectedThemeName}
                              <ChevronDownIcon className="opacity-50 ms-auto me-0" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <Command>
                            <CommandInput
                              placeholder={t('theme.search')}
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>{t('theme.notFound')}</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                    value={t('theme.letUserPick')}
                                    key={'none'}
                                    onSelect={() => {
                                      form.setValue("theme", null);
                                      setOpenThemeSelector(false);
                                    }}
                                  >
                                    <span className="opacity-50">{t('theme.letUserPick')}</span>
                                    <CheckIcon
                                      className={cn(
                                        "ml-auto",
                                        !field.value
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
                                      form.setValue("theme", option.value);
                                      setOpenThemeSelector(false);
                                    }}
                                  >
                                    {nameFromTheme(option)}
                                    <CheckIcon
                                      className={cn(
                                        "ml-auto",
                                        option.value === field.value
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
              
              {edit && sessionQrCodeUrl && (
                <div className="flex items-stretch gap-3 mt-2">
                  <div className="max-h-[8em] aspect-square bg-white p-2 rounded-md">
                    <QRCode value={sessionQrCodeUrl} className="max-h-full max-w-full" />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <FormLabel className="mt-3">{t('input.publicUrl')}</FormLabel>
                    <Input value={sessionQrCodeUrl} disabled />
                    <Button onClick={copyShareableUrlToClipboard} type="button" className="w-auto me-auto">{t('button.copyUrl')}</Button>
                  </div>
                </div>
              )}

              <div className="flex flex-row align-start space-x-2">
                <Button className="flex-0" type="submit" disabled={isLoading}>
                  {isLoading && (
                    <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
                  )}
                  {t('button.' + (edit ? 'update' : 'add'))}
                </Button>
                <Button className="flex-0" type="button" variant="secondary" asChild><Link to={'/app/sessions'}>{t('button.cancel')}</Link></Button>
              </div>
            </form>
          </Form>
        </ControllerProvider>
      </div>
    </>
  );
}
