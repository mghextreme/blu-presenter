import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import { useServices } from "@/hooks/services.provider";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod"
import SongSearchResult from "./song-search-result";
import { IScheduleSong } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const searchFormSchema = z.object({
  query: z.string().min(3),
});

export default function PlanPanel() {

  const { t } = useTranslation('controller');
  const { songsService } = useServices();

  const form = useForm<z.infer<typeof searchFormSchema>>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      query: "",
    },
  });
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<IScheduleSong[]>([]);

  const onSubmit = async (values: z.infer<typeof searchFormSchema>) => {
    try {
      setSearching(true);
      const songs = await songsService.search(values.query);
      setSearchResults(songs.map(songsService.toScheduleSong));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div
      id="plan"
      className="w-1/3 bg-background rounded flex flex-col justify-start items-stretch overflow-hidden">
      <Tabs defaultValue="songs" className="w-full p-3">
        <TabsList className="w-full mb-1">
          <TabsTrigger value="schedule" disabled={true}>{t('plan.tabs.schedule')}</TabsTrigger>
          <TabsTrigger value="songs">{t('plan.tabs.songs')}</TabsTrigger>
          <TabsTrigger value="text" disabled={true}>{t('plan.tabs.text')}</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule">
          developing...
        </TabsContent>
        <TabsContent value="songs">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-row w-full justify-stretch space-x-3">
              <FormField
                control={form.control}
                name="query"
                render={({field}) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder={t('plan.search.inputPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}></FormField>
              <Button className="flex-0" type="submit" disabled={searching}>
                {searching ? (
                  <>
                    {t('plan.search.buttonLoading')}
                    <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
                  </>
                ) : (
                  <span>{t('plan.search.button')}</span>
                )}</Button>
            </form>
          </Form>
          <div
            className="mt-3 flex-1 overflow-y-auto flex flex-col justify-start items-stretch overflow-y-auto gap-3">
            {searchResults.length > 0 && searchResults.map((item, ix) => (
              <SongSearchResult key={`${item.id}-${ix}`} item={item}></SongSearchResult>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="text">
          developing...
        </TabsContent>
      </Tabs>
    </div>
  );
}
