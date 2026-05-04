import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner";
import { useController } from "@/hooks/useController";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { IScheduleText, ISlideTitleContent } from "@/types";
import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import PlayIcon from "@heroicons/react/24/solid/PlayIcon";

type PlanTextProps = {
  showOpen?: boolean;
}

const textFormSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
});

export function PlanText({ showOpen = true }: PlanTextProps) {

  const { t } = useTranslation("controller");

  const {
    addToSchedule,
    setScheduleItem,
  } = useController();

  const form = useForm<z.infer<typeof textFormSchema>>({
    resolver: zodResolver(textFormSchema),
    defaultValues: {
      title: "",
      subtitle: "",
    },
  });

  const getScheduleItem = (values: z.infer<typeof textFormSchema>) => {
    return {
      id: Date.now(),
      type: "text",
      title: values.title,
      subtitle: values.subtitle,
      slides: [
        {},
        {
          content: [
            {
              type: "title",
              title: values.title,
              subtitle: values.subtitle,
            } as ISlideTitleContent,
          ],
        },
        {},
      ],
    } as IScheduleText;
  }

  const add = async (values: z.infer<typeof textFormSchema>) => {
    const scheduleItem = getScheduleItem(values);
    addToSchedule(scheduleItem);
    toast.success(t('plan.text.addedToSchedule', { title: values.title }));
    form.reset();
  }

  const open = async (values: z.infer<typeof textFormSchema>) => {
    const scheduleItem = getScheduleItem(values);
    setScheduleItem(scheduleItem);
  }

  const handleAdd = (e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    form.handleSubmit(add)();
  }

  const handleOpen = () => {
    form.handleSubmit(open)();
  }

  return (
    <Form {...form}>
      <form onSubmit={handleAdd} className="flex flex-col w-full space-y-3">
        <FormField
          control={form.control}
          name="title"
          render={({field}) => (
            <FormItem className="flex-1">
              <FormLabel>{t('plan.text.input.title')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}></FormField>

        <FormField
          control={form.control}
          name="subtitle"
          render={({field}) => (
            <FormItem className="flex-1">
              <FormLabel>{t('plan.text.input.subtitle')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}></FormField>

        <div className="flex justify-end space-x-2">
          <Button type="submit" title={t('plan.text.actions.add')}>
            <PlusIcon className="size-3"></PlusIcon>
          </Button>
          {showOpen && (
            <Button type="button" title={t('plan.text.actions.open')} onClick={handleOpen}>
              <PlayIcon className="size-3"></PlayIcon>
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
