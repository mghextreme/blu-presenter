import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ISchedule,
  IScheduleItem,
  filterOrganizationsByFeature,
  isRoleHigherOrEqualThan,
} from '@/types';
import { ScheduleSchema } from '@/types/schemas/schedule.schema';
import { useAuth } from '@/hooks/useAuth';
import { useServices } from '@/hooks/useServices';
import { useController } from '@/hooks/useController';
import { ControllerProvider } from '@/hooks/controller.provider';
import { SearchProvider } from '@/hooks/search.provider';
import { PlanPanel } from '@/components/controller/plan-panel';
import { SchedulePanel } from '@/components/controller/schedule-panel';
import { OrganizationBar, OptionalOrganization } from '@/components/app/organization-bar';
import { PageContent } from '@/components/shared/page-content';
import { NoOrganizationNotice } from '@/components/shared/no-organization-notice';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EditSongReferences } from '@/components/app/songs/edit-references';
import { EditPlaylistReference } from '@/components/app/schedules/edit-playlist-reference';
import { SCHEDULE_PLAYLIST_PROVIDERS } from '@/components/app/schedules/playlist-providers';
import { toast } from 'sonner';
import ArrowPathIcon from '@heroicons/react/24/solid/ArrowPathIcon';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import EyeIcon from '@heroicons/react/24/solid/EyeIcon';

type EditScheduleProps = {
  edit?: boolean;
};

const newSchedule: ISchedule = {
  id: 0,
  title: '',
  date: null,
  items: [],
};

export function EditSchedule({ edit = true }: Readonly<EditScheduleProps>) {
  return edit ? <EditSavedSchedule /> : <ScheduleEditor edit={false} data={newSchedule} />;
}

function EditSavedSchedule() {
  const { t } = useTranslation('schedules');
  const params = useParams();
  const { schedulesService } = useServices();
  const { data } = useSuspenseQuery(schedulesService.byIdQuery(Number(params.id)));

  if (!data) {
    throw new Error(t('error.notFound'));
  }

  return <ScheduleEditor edit={true} data={data} />;
}

function ScheduleEditor({ edit, data }: Readonly<{ edit: boolean; data: ISchedule }>) {
  const { t } = useTranslation('schedules');
  const navigate = useNavigate();
  const { organization, organizations } = useAuth();
  const { schedulesService, songsService } = useServices();

  const organizationsToAddTo = filterOrganizationsByFeature(organizations, 'schedules').filter(
    (org) => isRoleHigherOrEqualThan(org.role, 'member'),
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

  const form = useForm<z.infer<typeof ScheduleSchema>>({
    resolver: zodResolver(ScheduleSchema),
    defaultValues: {
      id: data.id,
      title: data.title,
      date: data.date || '',
      references: data.references ?? [],
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

  return (
    <>
      <title>
        {(edit ? t('title.edit', { name: data.title }) : t('title.add')) + ' - BluPresenter'}
      </title>
      <OrganizationBar
        organizations={edit ? [data.organization ?? null] : organizationsToAddTo}
        selected={selectedOrganizations}
        editable={!edit}
        subtitle={edit ? undefined : t('add.to')}
        onOrganizationsChange={setSelectedOrganizations}
      >
        {edit && (
          <Button type="button" size="sm" title={t('actions.view')} asChild>
            <Link to={`/app/schedules/${data.id}/view`}>
              <EyeIcon className="size-3" />
            </Link>
          </Button>
        )}
      </OrganizationBar>
      <PageContent className="flex flex-col flex-1 overflow-hidden">
        <ControllerProvider>
          <SearchProvider songsService={songsService}>
            <EditScheduleForm
              form={form}
              edit={edit}
              data={data}
              organizationId={organizationId}
              schedulesService={schedulesService}
              songsService={songsService}
              navigate={navigate}
              t={t}
            />
          </SearchProvider>
        </ControllerProvider>
      </PageContent>
    </>
  );
}

function EditScheduleForm({
  form,
  edit,
  data,
  organizationId,
  schedulesService,
  songsService,
  navigate,
  t,
}: Readonly<{
  form: ReturnType<typeof useForm<z.infer<typeof ScheduleSchema>>>;
  edit: boolean;
  data: ISchedule;
  organizationId: number | undefined;
  schedulesService: ReturnType<typeof useServices>['schedulesService'];
  songsService: ReturnType<typeof useServices>['songsService'];
  navigate: ReturnType<typeof useNavigate>;
  t: ReturnType<typeof useTranslation>['t'];
}>) {
  const { schedule, replaceSchedule } = useController((s) => ({
    schedule: s.schedule,
    replaceSchedule: s.replaceSchedule,
  }));
  const services = useServices();
  const [addItemOpen, setAddItemOpen] = useState<boolean>(false);
  const scheduleLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!scheduleLoadedRef.current && data.items && data.items.length > 0) {
      replaceSchedule(songsService.resolveScheduleItems(data.items));
      scheduleLoadedRef.current = true;
    }
  }, [data.items, replaceSchedule, songsService]);

  const saveSchedule = useMutation({
    mutationFn: async ({
      scheduleId,
      payload,
      organizationId,
    }: {
      scheduleId: number;
      payload: Partial<ISchedule>;
      organizationId: number;
    }) => {
      if (!edit) {
        return await schedulesService.add(payload, organizationId);
      }

      // Generated playlists are managed server-side: saving the form never
      // drops them (a stale form must not detach a playlist created in the
      // meantime), so the ones the user removed are detached explicitly.
      const removedPlaylistProviders = SCHEDULE_PLAYLIST_PROVIDERS.filter(
        (provider) =>
          !!provider.findReference(data.references) && !provider.findReference(payload.references),
      );

      const savedSchedule = await schedulesService.update(scheduleId, payload, organizationId);
      await Promise.all(
        removedPlaylistProviders.map((provider) => provider.remove(services, data)),
      );
      return savedSchedule;
    },
    onSuccess: (savedSchedule, { scheduleId }) => {
      // An edited schedule keeps its id; a create that returned no schedule
      // has no page to show, so go back to the list.
      const id = savedSchedule?.id ?? (edit ? scheduleId : undefined);
      void navigate(id ? `/app/schedules/${id}/view` : '/app/schedules');
    },
    onError: (err) => {
      console.error(err);
      toast.error(t('error.save'));
    },
  });

  const onSubmit = (values: z.infer<typeof ScheduleSchema>) => {
    if (!organizationId) {
      console.error('Cannot save schedule: no organization selected (organizationId is undefined)');
      return;
    }

    const items = schedule.map((item: IScheduleItem) => {
      if (item.type === 'song') {
        return {
          type: item.type,
          id: item.id,
          secret: (item as any).secret,
          title: item.title,
          artist: (item as any).artist,
        };
      }
      if (item.type === 'text') {
        return { type: item.type, title: item.title, subtitle: (item as any).subtitle };
      }
      if (item.type === 'comment') {
        return { type: item.type, title: item.title };
      }
      return item;
    });

    const payload: Partial<ISchedule> = {
      title: values.title,
      date: values.date || null,
      items: items as IScheduleItem[],
      references: values.references as ISchedule['references'],
    };

    saveSchedule.mutate({ scheduleId: values.id, payload, organizationId });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          // Surface silent validation aborts (e.g. nested reference fields,
          // which have no FormMessage to render their errors).
          console.error('Schedule form validation failed', errors);
          toast.error(t('error.validation'));
        })}
        className="flex flex-col flex-1 gap-4"
      >
        <div className="flex flex-col gap-3 max-w-2xl">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>{t('input.title')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('input.date')}</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value || null}
                    onChange={(val) => field.onChange(val ?? '')}
                    placeholder={t('input.date')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="max-w-2xl">
          <h3 className="font-medium text-sm mb-2">{t('input.references')}</h3>
          <EditSongReferences
            form={form}
            renderAutoReference={(ix, remove) => (
              <EditPlaylistReference form={form} ix={ix} remove={remove} schedule={data} />
            )}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-card rounded border max-w-2xl">
          <div className="p-3 pb-0 flex gap-2 items-center">
            <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
              <DialogTrigger asChild>
                <Button type="button" size="sm">
                  <PlusIcon className="size-4 me-1" />
                  {t('actions.addItem')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>{t('actions.addItem')}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                  <PlanPanel showConfiguration={false} showSchedules={false} showOpen={false} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SchedulePanel showRestore={false} showOpen={false} />
          </div>
        </div>

        <div className="flex flex-row align-start space-x-2">
          <Button className="flex-0" type="submit" disabled={saveSchedule.isPending}>
            {saveSchedule.isPending && (
              <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
            )}
            {t('button.' + (edit ? 'update' : 'add'))}
          </Button>
          <Button className="flex-0" type="button" variant="secondary" asChild>
            <Link to={'/app/schedules'}>{t('button.cancel')}</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
