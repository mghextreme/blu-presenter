import { useEffect, useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { BaseTheme, isRoleHigherOrEqualThan, ITheme, LyricsTheme, SubtitlesTheme, TeleprompterTheme } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/hooks/services.provider";
import { Button } from "@/components/ui/button";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ControllerProvider from "@/hooks/controller.provider";
import { PreviewWindow } from "@/components/controller/preview-window";
import { Controls } from "@/components/controller/controls";
import { PreviewWindowTextForm } from "@/components/app/themes/preview-window-text-form";
import { ThemeSchema } from "@/types/schemas/theme.schema";
import { ThemeConfigForm } from "@/components/app/themes/theme-config-form";

type EditThemeProps = {
  edit?: boolean
}

export default function EditTheme({
  edit = true,
}: EditThemeProps) {

  const { t } = useTranslation("themes");
  const navigate = useNavigate();
  const { organization } = useAuth();
  const { themesService } = useServices();

  const loadedData = useLoaderData() as ITheme;
  const data = edit ? loadedData : {
    id: 0,
    name: '',
    extends: 'lyrics' as BaseTheme,
    config: LyricsTheme.config,
  };

  if (!data) {
    throw new Error("Can't find theme");
  }

  if (!isRoleHigherOrEqualThan(organization?.role, 'member')) {
    throw new Error(t('error.noPermission'));
  }

  const form = useForm<z.infer<typeof ThemeSchema>>({
    resolver: zodResolver(ThemeSchema),
    defaultValues: {
      id: data.id,
      name: data.name,
      extends: data.extends,
      config: data.config,
    },
  });

  const [extendsValue, setExtendsValue] = useState(data.extends);
  useEffect(() => {
    const curExtends = form.getValues('extends');
    if (curExtends === extendsValue) {
      return;
    }

    setExtendsValue(curExtends);
    switch (curExtends) {
      case "subtitles":
        form.setValue('config', SubtitlesTheme.config);
        return;
      case "teleprompter":
        form.setValue('config', TeleprompterTheme.config);
        return;
    }

    form.setValue('config', LyricsTheme.config);
  }, [form.watch('extends')]);

  const [isLoading, setLoading] = useState<boolean>(false);

  const onSubmit = async (values: z.infer<typeof ThemeSchema>) => {
    setLoading(true);
    let action;
    if (edit) {
      action = themesService.update(values.id, values);
    } else {
      action = themesService.add(values);
    }
    action
      .then(() => {
        navigate(`/app/themes`);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const orgName = organization?.name || t("organizations.defaultName");

  return (
    <>
      <title>{(edit ? t('title.edit', { name: data.name }) : t('title.add')) + ' - ' + orgName + ' - BluPresenter'}</title>
      <div className="flex items-center px-8 py-3 bg-slate-200 dark:bg-slate-900 gap-x-2">
        <span className="text-sm">{t('input.organization')}: <b>{orgName}</b></span>
      </div>
      <div className="p-8">
        <h1 className="text-3xl mb-4">{edit ? t('edit.title') : t('add.title')}</h1>
        <ControllerProvider>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-row-reverse flex-wrap gap-3 justify-end">
              <div className="flex-1 min-w-sm max-w-lg">
                <div className="relative w-full bg-[url(/src/images/sample-wallpaper.svg)] bg-cover bg-center rounded">
                  <PreviewWindow theme={form.watch()} attachControllerMode={true} showThemeSelector={false} />
                </div>
                <Controls showBlank={false} className="px-0" />
                <PreviewWindowTextForm baseTheme={form.watch('extends')} />
              </div>
              <div className="min-w-sm max-w-lg space-y-3 flex-1">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('input.name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}></FormField>

                <FormField
                  control={form.control}
                  name="extends"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('input.baseTheme')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('input.baseTheme')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lyrics">{t('theme.lyrics')}</SelectItem>
                          <SelectItem value="subtitles">{t('theme.subtitles')}</SelectItem>
                          <SelectItem value="teleprompter">{t('theme.teleprompter')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}></FormField>

                <hr />

                <ThemeConfigForm form={form} />

                <div className="flex flex-row align-start space-x-2">
                  <Button className="flex-0" type="submit" disabled={isLoading}>
                    {isLoading && (
                      <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
                    )}
                    {t('button.' + (edit ? 'update' : 'add'))}
                  </Button>
                  <Button className="flex-0" type="button" variant="secondary" asChild><Link to={'/app/themes'}>{t('button.cancel')}</Link></Button>
                </div>
              </div>
            </form>
          </Form>
        </ControllerProvider>
      </div>
    </>
  );
}
