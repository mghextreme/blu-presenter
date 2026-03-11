import { useEffect, useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ISchedule, IScheduleItem, isRoleHigherOrEqualThan } from "@/types";
import { ScheduleSchema } from "@/types/schemas/schedule.schema";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/hooks/useServices";
import { useController } from "@/hooks/useController";
import { ControllerProvider } from "@/hooks/controller.provider";
import { SearchProvider } from "@/hooks/search.provider";
import { PlanPanel } from "@/components/controller/plan-panel";
import { SchedulePanel } from "@/components/controller/schedule-panel";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";

type EditScheduleProps = {
  edit?: boolean
}

export function EditSchedule({
  edit = true,
}: EditScheduleProps) {

  const { t } = useTranslation("schedules");
  const navigate = useNavigate();
  const { organization } = useAuth();
  const { schedulesService, songsService } = useServices();

  const loadedData = useLoaderData() as ISchedule;
  const data = edit ? loadedData : {
    id: 0,
    title: '',
    date: null,
    items: [],
  };

  if (!data) {
    throw new Error("Can't find schedule");
  }

  if (!isRoleHigherOrEqualThan(organization?.role, 'member')) {
    throw new Error(t('error.noPermission'));
  }

  const form = useForm<z.infer<typeof ScheduleSchema>>({
    resolver: zodResolver(ScheduleSchema),
    defaultValues: {
      id: data.id,
      title: data.title,
      date: data.date || '',
    },
  });

  const orgName = organization?.name || t("organizations.defaultName");

  return (
    <>
      <title>{(edit ? t('title.edit', { name: data.title }) : t('title.add')) + ' - ' + orgName + ' - BluPresenter'}</title>
      <div className="flex items-center px-2 sm:px-8 py-3 bg-slate-200 dark:bg-slate-900 gap-x-2">
        <span className="text-sm">{t('input.organization')}: <b>{orgName}</b></span>
        <div className="buttons flex-1 flex justify-end gap-x-2">
          {edit && (
            <Button
              type="button"
              size="sm"
              title={t('actions.view')}
              asChild>
              <Link to={`/app/schedules/${data.id}/view`}>
                <EyeIcon className="size-3" />
              </Link>
            </Button>
          )}
        </div>
      </div>
      <div className="p-2 sm:p-8 flex flex-col flex-1 overflow-hidden">
        <h1 className="text-3xl mb-4">{edit ? t('edit.title') : t('add.title')}</h1>
        <ControllerProvider>
          <SearchProvider songsService={songsService}>
            <EditScheduleForm
              form={form}
              edit={edit}
              data={data}
              schedulesService={schedulesService}
              songsService={songsService}
              navigate={navigate}
              t={t}
            />
          </SearchProvider>
        </ControllerProvider>
      </div>
    </>
  );
}

function EditScheduleForm({
  form,
  edit,
  data,
  schedulesService,
  songsService,
  navigate,
  t,
}: {
  form: ReturnType<typeof useForm<z.infer<typeof ScheduleSchema>>>,
  edit: boolean,
  data: ISchedule,
  schedulesService: ReturnType<typeof useServices>['schedulesService'],
  songsService: ReturnType<typeof useServices>['songsService'],
  navigate: ReturnType<typeof useNavigate>,
  t: ReturnType<typeof useTranslation>['t'],
}) {
  const { schedule, replaceSchedule } = useController();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && data.items && data.items.length > 0) {
      replaceSchedule(songsService.resolveScheduleItems(data.items));
      setInitialized(true);
    }
  }, [data.items]);

  const onSubmit = async (values: z.infer<typeof ScheduleSchema>) => {
    setLoading(true);

    const items = schedule.map((item: IScheduleItem) => {
      if (item.type === 'song') {
        return { type: item.type, id: item.id, secret: (item as any).secret, title: item.title, artist: (item as any).artist };
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
    };

    let action;
    if (edit) {
      action = schedulesService.update(values.id, payload);
    } else {
      action = schedulesService.add(payload);
    }
    action
      .then((savedSchedule: ISchedule | null) => {
        navigate(`/app/schedules/${savedSchedule?.id}/view`);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 gap-4">
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
          <Button className="flex-0" type="submit" disabled={isLoading}>
            {isLoading && (
              <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
            )}
            {t('button.' + (edit ? 'update' : 'add'))}
          </Button>
          <Button className="flex-0" type="button" variant="secondary" asChild><Link to={'/app/schedules'}>{t('button.cancel')}</Link></Button>
        </div>
      </form>
    </Form>
  );
}
