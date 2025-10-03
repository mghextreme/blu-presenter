import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useController } from "@/hooks/useController";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { IScheduleItem } from "@/types";
import PlusIcon from "@heroicons/react/24/solid/PlusIcon";

const textFormSchema = z.object({
  title: z.string().min(2),
});

export function PlanComment() {

  const { t } = useTranslation("controller");

  const {
    addToSchedule,
  } = useController();

  const form = useForm<z.infer<typeof textFormSchema>>({
    resolver: zodResolver(textFormSchema),
    defaultValues: {
      title: "",
    },
  });

  const getScheduleItem = (values: z.infer<typeof textFormSchema>) => {
    return {
      id: Date.now(),
      type: "comment",
      title: values.title,
      slides: [{ isEmpty: true }],
    } as IScheduleItem;
  }

  const add = async (values: z.infer<typeof textFormSchema>) => {
    const scheduleItem = getScheduleItem(values);
    addToSchedule(scheduleItem);
  }

  const handleAdd = () => {
    form.handleSubmit(add)();
  }

  return (
    <Form {...form}>
      <form onSubmit={handleAdd} className="flex flex-col w-full space-y-3">
        <FormField
          control={form.control}
          name="title"
          render={({field}) => (
            <FormItem className="flex-1">
              <FormLabel>{t('plan.comment.input.title')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}></FormField>

        <div className="flex justify-end space-x-2">
          <Button type="button" title={t('plan.comment.actions.add')} onClick={handleAdd}>
            <PlusIcon className="size-3"></PlusIcon>
          </Button>
        </div>
      </form>
    </Form>
  )
}
