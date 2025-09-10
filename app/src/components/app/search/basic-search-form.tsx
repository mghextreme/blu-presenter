import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next";
import { useSearch } from "@/hooks/search.provider";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";

const basicSearchFormSchema = z.object({
  query: z.string().min(3),
});

interface BasicSearchFormProps {
  includeBlocks?: boolean;
}

export function BasicSearchForm({
  includeBlocks = false,
}: BasicSearchFormProps) {

  const { t } = useTranslation('discover');
  const {
    search,
    isSearching,
  } = useSearch();

  const form = useForm<z.infer<typeof basicSearchFormSchema>>({
    resolver: zodResolver(basicSearchFormSchema),
    defaultValues: {
      query: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof basicSearchFormSchema>) => {
    await search(values.query, includeBlocks);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-row w-full justify-stretch space-x-3">
        <FormField
          control={form.control}
          name="query"
          render={({field}) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input placeholder={t('input.basicSearchPlaceholder')} autoComplete="off" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}></FormField>
        <Button className="flex-0" type="submit" disabled={isSearching}>
          {isSearching ? (
            <>
              {t('actions.searching')}
              <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
            </>
          ) : (
            <span>{t('actions.search')}</span>
          )}</Button>
      </form>
    </Form>
  );
}
