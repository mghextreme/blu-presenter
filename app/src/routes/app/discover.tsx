/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useServices } from "@/hooks/services.provider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import MusicalNoteIcon from "@heroicons/react/24/solid/MusicalNoteIcon";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import i18next from "i18next";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/components/ui/multi-select";
import { ISongWithRole, isRoleHigherOrEqualThan, SupportedLanguage, supportedLanguagesMap } from "@/types";
import { cn } from "@/lib/utils";
import CheckIcon from "@heroicons/react/24/solid/CheckIcon";
import { Card, CardDescription, CardHeader, CardHeaderActions, CardHeaderText, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import { Link } from "react-router-dom";
import { CopySongToOrganization } from "@/components/app/songs/copy-song-to-organization";

type possibleOrgColor = 'color-1' | 'color-2' | 'color-3' | 'color-4' | 'color-5' | 'color-6';
const orgColors: possibleOrgColor[] = [
  'color-1',
  'color-2',
  'color-3',
  'color-4',
  'color-5',
  'color-6',
];

export default function Discover() {

  const { t } = useTranslation("discover");
  const curLang = (i18next.resolvedLanguage || 'en') as SupportedLanguage;
  const { organizations } = useAuth();

  const orgColorMap: {[orgId: number]: possibleOrgColor} = {};
  for (let i = 0; i < organizations.length; i++) {
    orgColorMap[organizations[i].id] = orgColors[i % 6];
  }

  const formSchema = z.object({
    query: z.string().min(2),
    languages: z.array(z.string().min(2).max(2)).optional(),
    organizations: z.array(z.string()).optional(),
    searchPublicArchive: z.boolean(),
  });

  const { songsService } = useServices();

  const [isLoading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: '',
      languages: [curLang],
      organizations: organizations?.map(o => o.id.toString()) || [],
      searchPublicArchive: true,
    },
  });

  const [searchResults, setSearchResults] = useState<ISongWithRole[]>([]);
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    songsService.advancedSearch({
      ...values,
      organizations: values.organizations?.map(x => parseInt(x)) || []
    })
      .then((results) => {
        setSearchResults(results);
      })
      .catch((e) => {
        toast.error(t('errors.search'), {
          description: e?.message || '',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-4">{t('title')}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap flex-row space-x-2 space-y-2 items-stretch">
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

          <div className="flex flex-col">
            <FormLabel>&nbsp;</FormLabel>
            <Button className="flex-0 mt-2" type="submit" disabled={isLoading}>
              {isLoading && (
                <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
              )}
              {t('actions.search')}
            </Button>
          </div>
        </form>
      </Form>
      <ul className="mt-4 space-y-2">
        {searchResults.map((item) => {
          const canEdit = isRoleHigherOrEqualThan(item.organization?.role, 'member');
          const hasChords = item.blocks?.some(block => block.chords && block.chords.length > 0);
          return (
            <Card key={item.id}>
              <CardHeader>
                <CardHeaderText>
                  <CardTitle>{item?.title}</CardTitle>
                  <CardDescription>{item?.artist}</CardDescription>
                </CardHeaderText>
                <CardHeaderActions>
                  {item.organization ? (
                    <Badge className="me-3 my-auto" variant={orgColorMap[item.organization.id]}>{item.organization.name}</Badge>
                  ) : (
                    <Badge className="me-3 my-auto" variant={"outline"}>{t('organization.publicArchive')}</Badge>
                  )}
                  <Badge className="me-3 p-1 my-auto" variant={hasChords ? "color-4" : "outline"} title={hasChords ? t('chords.available') : t('chords.notAvailable')}>
                    <MusicalNoteIcon className="size-2" />
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    title={t('actions.view')}
                    asChild>
                    <Link to={`/app/songs/${item.id}/view`}>
                      <EyeIcon className="size-3" />
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    title={t('actions.edit')}
                    asChild={canEdit}
                    disabled={!canEdit}>
                    {canEdit ? (
                      <Link to={`/app/songs/${item.id}/edit`}>
                        <PencilIcon className="size-3" />
                      </Link>
                    ) : (
                      <PencilIcon className="size-3" />
                    )}
                  </Button>
                  <CopySongToOrganization songId={item.id} title={item.title} artist={item.artist} variant="default"></CopySongToOrganization>
                </CardHeaderActions>
              </CardHeader>
            </Card>
          );
        })}
      </ul>
    </div>
  );
}
