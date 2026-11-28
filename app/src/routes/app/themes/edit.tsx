import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  filterOrganizationsByFeature,
  isRoleHigherOrEqualThan,
  ITheme,
  LyricsTheme,
  SubtitlesTheme,
  TeleprompterTheme,
} from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useServices } from '@/hooks/useServices';
import { Button } from '@/components/ui/button';
import ArrowPathIcon from '@heroicons/react/24/solid/ArrowPathIcon';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ControllerProvider } from '@/hooks/controller.provider';
import { PreviewWindow } from '@/components/controller/preview-window';
import { Controls } from '@/components/controller/controls';
import { ThemePreviewSongForm } from '@/components/app/themes/theme-preview-song-form';
import { ThemeSchema } from '@/types/schemas/theme.schema';
import { ThemeConfigForm } from '@/components/app/themes/theme-config-form';
import { OrganizationBar, OptionalOrganization } from '@/components/app/organization-bar';
import { PageContent } from '@/components/shared/page-content';
import { NoOrganizationNotice } from '@/components/shared/no-organization-notice';
import { toast } from 'sonner';

type EditThemeProps = {
  edit?: boolean;
};

const newTheme: ITheme = {
  id: 0,
  name: '',
  extends: 'lyrics',
  config: LyricsTheme.config,
};

function presetConfigFor(baseTheme: string): ITheme['config'] {
  switch (baseTheme) {
    case 'subtitles':
      return SubtitlesTheme.config;
    case 'teleprompter':
      return TeleprompterTheme.config;
    default:
      return LyricsTheme.config;
  }
}

export function EditTheme({ edit = true }: Readonly<EditThemeProps>) {
  return edit ? <EditExistingTheme /> : <ThemeForm edit={false} data={newTheme} />;
}

function EditExistingTheme() {
  const { t } = useTranslation('themes');
  const params = useParams();
  const { themesService } = useServices();
  const { data } = useSuspenseQuery(themesService.byIdQuery(Number(params.id)));

  if (!data) {
    throw new Error(t('error.notFound'));
  }

  return <ThemeForm edit={true} data={data} />;
}

type ThemeFormProps = {
  edit: boolean;
  data: ITheme;
};

function ThemeForm({ edit, data }: Readonly<ThemeFormProps>) {
  const { t } = useTranslation('themes');
  const navigate = useNavigate();
  const { organization, organizations } = useAuth();
  const { themesService } = useServices();

  const organizationsToAddTo = filterOrganizationsByFeature(organizations, 'themes').filter((org) =>
    isRoleHigherOrEqualThan(org.role, 'member'),
  );

  const [selectedOrganizations, setSelectedOrganizations] = useState<OptionalOrganization[]>(() => {
    if (edit) {
      return [data.organization ?? null];
    }

    const initial =
      organizationsToAddTo.find((org) => org.id === organization?.id) ?? organizationsToAddTo[0];
    return initial ? [initial] : [];
  });

  if (edit && !isRoleHigherOrEqualThan(data.organization?.role, 'member')) {
    throw new Error(t('error.noPermission'));
  }

  const organizationId = edit ? data.organization?.id : selectedOrganizations[0]?.id;

  // zod 4: coerced fields have `unknown` input types, so zodResolver v7
  // infers a Resolver<Input> that no longer matches useForm<z.infer> (the
  // output type). The resolver still validates + coerces on submit, so
  // pin the form to the output type as zod 3 did.
  const form = useForm<z.output<typeof ThemeSchema>>({
    resolver: zodResolver(ThemeSchema) as Resolver<z.output<typeof ThemeSchema>>,
    defaultValues: {
      id: data.id,
      name: data.name,
      extends: data.extends,
      config: data.config,
    },
  });

  const [themeId, themeName, baseTheme, themeConfig] = useWatch({
    control: form.control,
    name: ['id', 'name', 'extends', 'config'],
  });
  const previewTheme = { id: themeId, name: themeName, extends: baseTheme, config: themeConfig };

  const resetConfigOnBaseThemeChange = (baseTheme: string) => {
    if (baseTheme !== form.getValues('extends')) {
      form.setValue('config', presetConfigFor(baseTheme));
    }
  };

  const saveTheme = useMutation({
    mutationFn: ({
      values,
      organizationId,
    }: {
      values: z.infer<typeof ThemeSchema>;
      organizationId: number;
    }) =>
      edit
        ? themesService.update(values.id, values, organizationId)
        : themesService.add(values, organizationId),
    onSuccess: () => navigate(`/app/themes`),
    onError: (err) => {
      console.error(err);
      toast.error(t('error.save'));
    },
  });

  if (!edit && organizationsToAddTo.length === 0) {
    return (
      <>
        <title>{t('title.add') + ' - BluPresenter'}</title>
        <NoOrganizationNotice
          title={t('add.noOrganization.title')}
          description={t('add.noOrganization.description')}
          actionLabel={t('add.noOrganization.create')}
          actionTo="/app/organizations/add"
        />
      </>
    );
  }

  const onSubmit = (values: z.infer<typeof ThemeSchema>) => {
    if (!organizationId) return;
    saveTheme.mutate({ values, organizationId });
  };

  return (
    <>
      <title>
        {(edit ? t('title.edit', { name: data.name }) : t('title.add')) + ' - BluPresenter'}
      </title>
      <OrganizationBar
        organizations={edit ? [data.organization ?? null] : organizationsToAddTo}
        selected={selectedOrganizations}
        editable={!edit}
        subtitle={edit ? undefined : t('add.to')}
        onOrganizationsChange={setSelectedOrganizations}
      />
      <PageContent>
        <ControllerProvider>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-row-reverse flex-wrap gap-3 justify-end"
            >
              <div className="flex-1 min-w-sm max-w-lg">
                <div className="relative w-full bg-[url(/images/sample-wallpaper.svg)] bg-cover bg-center rounded">
                  <PreviewWindow
                    theme={previewTheme}
                    attachControllerMode={true}
                    showThemeSelector={false}
                  />
                </div>
                <Controls showBlank={false} className="px-0" />
                {/* Preview content editor: a song-editor-driven form that pushes a synthetic schedule song into the controller above. */}
                <ThemePreviewSongForm baseTheme={baseTheme} />
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
                  )}
                ></FormField>

                <FormField
                  control={form.control}
                  name="extends"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('input.baseTheme')}</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          resetConfigOnBaseThemeChange(value);
                          field.onChange(value);
                        }}
                        value={field.value}
                      >
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
                  )}
                ></FormField>

                <hr />

                <ThemeConfigForm form={form} />

                <div className="flex flex-row align-start space-x-2">
                  <Button className="flex-0" type="submit" disabled={saveTheme.isPending}>
                    {saveTheme.isPending && (
                      <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
                    )}
                    {t('button.' + (edit ? 'update' : 'add'))}
                  </Button>
                  <Button className="flex-0" type="button" variant="secondary" asChild>
                    <Link to={'/app/themes'}>{t('button.cancel')}</Link>
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </ControllerProvider>
      </PageContent>
    </>
  );
}
