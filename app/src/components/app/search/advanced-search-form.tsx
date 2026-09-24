import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearch } from "@/hooks/search.provider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { SupportedLanguage, supportedLanguagesMap } from "@/types";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import CheckIcon from "@heroicons/react/24/solid/CheckIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const advancedSearchFormSchema = z.object({
  query: z.string().optional(),
  languages: z.array(z.string().min(2).max(2)).optional(),
});

interface AdvancedSearchFormProps {
  includeBlocks?: boolean;
}

export function AdvancedSearchForm({
  includeBlocks = false,
}: AdvancedSearchFormProps) {

  const { t } = useTranslation('songs');
  const {
    formValues,
    advancedSearch,
    isSearching,
    filtersResetAt,
  } = useSearch();

  const form = useForm<z.infer<typeof advancedSearchFormSchema>>({
    resolver: zodResolver(advancedSearchFormSchema),
    defaultValues: {
      query: '',
      languages: formValues.languages || [],
    },
  });

  useEffect(() => {
    if (filtersResetAt > 0) {
      form.reset({ query: '', languages: [] });
    }
  }, [filtersResetAt, form]);

  const onSubmit = async (values: z.infer<typeof advancedSearchFormSchema>) => {
    advancedSearch(values.query, {
      languages: values.languages as SupportedLanguage[],
      includeBlocks,
    })
      .catch((e) => {
        toast.error(t('errors.search'), {
          description: e?.message || '',
        });
      })
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => { e.stopPropagation(); form.handleSubmit(onSubmit)(e); }} className="flex w-full flex-wrap flex-col sm:flex-row space-x-2 space-y-2 items-stretch">
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem className="flex-1 min-w-48">
              <FormLabel>{t('searchInput.query')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}></FormField>

        <FormField
          control={form.control}
          name="languages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('searchInput.languages')}</FormLabel>
              <FormControl>
                <MultiSelect
                  selected={field.value?.map(x => x.toString()) || []}
                  onChange={field.onChange}
                  options={supportedLanguagesMap}
                  placeholder={t('searchInput.languagesPlaceholder')}
                  searchText={t('searchInput.languagesSearch')}
                  emptyText={t('searchInput.languagesEmpty')}
                  className="min-w-32"
                  summaryRenderFunction={(options, placeholder) => {
                    if (options.length === 0) {
                      return <span className="truncate">{placeholder}</span>;
                    }

                    return <div className="flex flex-row gap-x-2">
                      {options.map(option => <option.icon key={option.value} />)}
                    </div>;
                  }}
                  itemRenderFunction={(option, isSelected) => (
                    <>
                      <option.icon className="h-4 w-4 me-2" />
                      {t('language.' + option.label)}
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </>
                  )}
                >
                </MultiSelect>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}></FormField>

        <div className="flex flex-col ms-auto me-0">
          <FormLabel>&nbsp;</FormLabel>
          <Button className="flex-0 mt-2" type="submit" disabled={isSearching}>
            {isSearching ? (
              <>
                {t('actions.searching')}
                <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
              </>
            ) : (
              <span>{t('actions.search')}</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
