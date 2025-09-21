import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod"
import { useController } from "@/hooks/controller.provider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

const controllerConfigurationSchema = z.object({
  autoAdvanceScheduleItem: z.boolean(),
});

export function PlanConfiguration() {

  const { t } = useTranslation("controller");

  const {
    config,
    setConfig,
  } = useController();

  const form = useForm<z.infer<typeof controllerConfigurationSchema>>({
    resolver: zodResolver(controllerConfigurationSchema),
    defaultValues: {
      autoAdvanceScheduleItem: config.autoAdvanceScheduleItem ?? false,
    },
  });

  useEffect(() => {
    setConfig(form.getValues());
  }, [form.watch()]);

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
      </form>
    </Form>
  )
}
