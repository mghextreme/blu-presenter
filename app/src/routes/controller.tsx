"use client"

import { useEffect, useRef, useState } from "react";

import SlideVisualizer from "@/components/controller/slide-visualizer";
import SlideSelector from "@/components/controller/slide-selector";
import ScheduleItem from "@/components/controller/schedule-item";
import SongSearchResult from "@/components/controller/song-search-result";
import { useController } from "@/components/controller/controller-provider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";
import ArrowRightIcon from "@heroicons/react/24/outline/ArrowRightIcon";
import StopSolidIcon from "@heroicons/react/24/solid/StopIcon";
import FingerPrintSolidIcon from "@heroicons/react/24/solid/FingerPrintIcon";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { IScheduleSong, IWindow } from "@/types";
import { v4 } from "uuid";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SongsService } from "@/services/songs.service";

const searchFormSchema = z.object({
  query: z.string().min(3),
});

const themeOptions = [
  {
    value: "black",
    label: "Black (slide)",
  },
  {
    value: "chromaKey",
    label: "Chroma Key (subtitles)",
  },
];

export default function Controller() {
  const {
    mode,
    schedule,
    slideIndex,
    scheduleItem,
    scheduleItemIndex,
    next,
    previous,
    setBlank,
    setLogo,
    overrideSlide,
  } = useController();

  const contentWrapper = useRef();
  const slideRefs = useRef([]);

  useEffect(() => {
    slideRefs.current = slideRefs.current.slice(0, (scheduleItem?.slides?.length ?? 0));
 }, [scheduleItem]);

 useEffect(() => {
  const wrapper: Element = contentWrapper.current;
  const slide: Element = slideRefs.current[slideIndex];

  if (!wrapper || !slide) return;

  const slideTo = slide.offsetTop - wrapper.offsetTop - 50;
  wrapper?.scrollTo({
    top: slideTo,
    behavior: "smooth"
  });
}, [slideIndex]);

  const [preview, setPreview] = useState<IWindow | undefined>(undefined);
  const openPreview = () => {
    setPreview({id: v4(), theme: previewTheme, mode: previewTheme == 'black' ? 'slide' : 'part'} as IWindow);
  }
  const closePreview = () => {
    setPreview(undefined);
  }

  const [openPreviewSelector, setOpenPreviewSelector] = useState<boolean>(false);
  const [previewTheme, setPreviewTheme] = useState<string>("black");

  const updatePreviewTheme = (theme: string) => {
    if (theme === preview?.theme) return;

    setPreview({id: v4(), theme: theme, mode: theme == 'black' ? 'slide' : 'part'} as IWindow);
    setPreviewTheme(theme);
  }

  const form = useForm<z.infer<typeof searchFormSchema>>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      query: "",
    },
  });
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<IScheduleSong[]>([]);
  const songsService = new SongsService();

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
    <>
      <div id="controller" className="p-3 flex flex-1 gap-3 overflow-hidden">
        <div id="plan" className="w-1/3 bg-background rounded flex flex-col justify-start items-stretch overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-3 flex flex-row w-full justify-stretch space-x-3">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Search songs..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}></FormField>
              <Button className="flex-0" type="submit" disabled={searching}>
                {searching ? (
                  <>
                    Searching...
                    <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
                  </>
                ) : (
                  <span>Search</span>
                )}</Button>
            </form>
          </Form>
          <div className="p-3 pt-0 flex-1 overflow-y-auto flex flex-col justify-start items-stretch overflow-y-auto gap-3">
            {searchResults.length > 0 && searchResults.map((item, ix) => (
              <SongSearchResult key={`${item.id}-${ix}`} item={item}></SongSearchResult>
            ))}
          </div>
        </div>
        <div id="schedule" className="w-1/3 p-3 bg-background rounded flex flex-col justify-start items-stretch overflow-y-auto gap-3">
          {schedule.map((item, ix) => (
            <ScheduleItem key={`${item.id}-${ix}`} item={item} selected={ix === scheduleItemIndex && scheduleItem?.id === item.id} index={ix}></ScheduleItem>
          ))}
        </div>
        <div id="live" className="w-1/3 bg-background rounded flex flex-col items-stretch overflow-hidden">
          <div id="preview" className="relative p-3 pb-0 flex justify-stretch flex-0">
            {!preview && <Button onClick={openPreview} title="Open Preview" className="flex-1">
              Open preview
            </Button>}
            {preview && (
              <>
                <div className="absolute left-3 top-3 right-3 bottom-0 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="p-3 flex justify-end">
                    <Popover open={openPreviewSelector} onOpenChange={setOpenPreviewSelector}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="flex-1 justify-between"
                        >
                          {themeOptions.find((option) => option.value === previewTheme)?.label}
                          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search theme..." className="h-9" />
                          <CommandEmpty>No theme found.</CommandEmpty>
                          <CommandGroup>
                            {themeOptions.map((option) => (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={(currentValue) => {
                                  updatePreviewTheme(currentValue);
                                  setOpenPreviewSelector(false);
                                }}
                              >
                                {option.label}
                                <CheckIcon
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    previewTheme === option.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button
                      onClick={closePreview}
                      title="Close preview"
                      className="ms-3"
                      variant="outline">
                      Close
                    </Button>
                  </div>
                </div>
                <div className="flex-1 aspect-[16/9] rounded overflow-hidden">
                  <SlideVisualizer theme={preview.theme} fontSize={'2.2vh'} mode={preview.mode}></SlideVisualizer>
                </div>
              </>
            )}
          </div>
          <div id="controls" className="p-3 grid grid-cols-4 gap-2 flex-0">
            <Button onClick={previous} title="Previous">
              <ArrowLeftIcon className="size-4"></ArrowLeftIcon>
            </Button>
            <Button onClick={setBlank} title="Blank" variant={overrideSlide?.id == 'blank' ? 'muted' : 'default'}>
              <StopSolidIcon className="size-4"></StopSolidIcon>
            </Button>
            <Button onClick={setLogo} title="Visual identity" variant={overrideSlide?.id == 'logo' ? 'muted' : 'default'}>
              <FingerPrintSolidIcon className="size-4"></FingerPrintSolidIcon>
            </Button>
            <Button onClick={next} title="Next">
              <ArrowRightIcon className="size-4"></ArrowRightIcon>
            </Button>
          </div>
          <div id="content" className="p-3 pt-0 flex-1 overflow-y-auto" ref={contentWrapper}>
          {scheduleItem?.slides.map((s, ix) => (
            <div key={`${mode}-${ix}`} ref={el => slideRefs.current[ix] = el}>
              <SlideSelector
                slide={s}
                index={ix}
                selected={slideIndex == ix}></SlideSelector>
            </div>
          ))}
          </div>
        </div>
      </div>
    </>
  );
}
