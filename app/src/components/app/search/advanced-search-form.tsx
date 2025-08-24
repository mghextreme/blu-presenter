import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { useAuth } from "@/hooks/useAuth";
import { useSearch } from "@/hooks/search.provider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { SupportedLanguage, supportedLanguagesMap } from "@/types";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import CheckIcon from "@heroicons/react/24/solid/CheckIcon";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const advancedSearchFormSchema = z.object({
  query: z.string().min(2),
  languages: z.array(z.string().min(2).max(2)).optional(),
  organizations: z.array(z.string()).optional(),
  searchPublicArchive: z.boolean(),
});

export function AdvancedSearchForm() {

  const { t } = useTranslation('discover');
  const {
    advancedSearch,
    isSearching,
  } = useSearch();

  const curLang = (i18next.resolvedLanguage || 'en') as SupportedLanguage;
  const { organizations } = useAuth();

  const form = useForm<z.infer<typeof advancedSearchFormSchema>>({
    resolver: zodResolver(advancedSearchFormSchema),
    defaultValues: {
      query: '',
      languages: [curLang],
      organizations: organizations?.map(o => o.id.toString()) || [],
      searchPublicArchive: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof advancedSearchFormSchema>) => {
    advancedSearch({
      query: values.query,
      languages: values.languages as SupportedLanguage[],
      organizations: values.organizations?.map(x => parseInt(x)) || [],
      searchPublicArchive: values.searchPublicArchive,
    })
      .catch((e) => {
        toast.error(t('errors.search'), {
          description: e?.message || '',
        });
      })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-wrap flex-row space-x-2 space-y-2 items-stretch">
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem className="flex-1 min-w-48">
              <FormLabel>{t('input.query')}</FormLabel>
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
              <FormLabel>{t('input.languages')}</FormLabel>
              <FormControl>
                <MultiSelect
                  selected={field.value?.map(x => x.toString()) || []}
                  onChange={field.onChange}
                  options={supportedLanguagesMap}
                  placeholder={t('input.languagesPlaceholder')}
                  searchText={t('input.languagesSearch')}
                  emptyText={t('input.languagesEmpty')}
                  className="w-32"
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

        <FormField
          control={form.control}
          name="organizations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('input.organizations')}</FormLabel>
              <FormControl>
                <MultiSelect
                  selected={field.value?.map(x => x.toString()) || []}
                  onChange={field.onChange}
                  options={
                    organizations?.map(o => ({
                      value: o.id.toString(),
                      label: o.name || t('organizations.defaultName'),
                    })) || []
                  }
                  placeholder={t('input.organizationsPlaceholder')}
                  searchText={t('input.organizationsSearch')}
                  emptyText={t('input.organizationsEmpty')}
                  className="w-48"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}></FormField>

        <FormField
          control={form.control}
          name="searchPublicArchive"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('input.searchPublicArchive')}</FormLabel>
              <FormControl className="ms-3 mt-3">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
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
