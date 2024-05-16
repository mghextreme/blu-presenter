import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { ISong } from "@/types";
import { SongsService } from "@/services";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLoaderData } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";

export async function loader({ params }) {
  const service = new SongsService();
  return await service.getById(Number(params.id));
}

const formSchema = z.object({
  id: z.number(),
  title: z.string().min(3),
  artist: z.string().min(3).optional().or(z.literal('')),
  blocks: z.array(
    z.object({
      id: z.number().optional(),
      text: z.string().optional(),
    }),
  ),
});

export default function EditSong() {

  const data = useLoaderData() as ISong;
  const songsService = new SongsService();

  const [loading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: data.id,
      title: data.title,
      artist: data.artist ?? '',
      blocks: data.blocks ?? [],
    },
  });

  const { fields: blocks, append, remove } = useFieldArray({
    name: "blocks",
    control: form.control,
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      await songsService.update(data.id, values);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-4">Edit song</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-3">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}></FormField>

          <FormField
            control={form.control}
            name="artist"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Artist</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}></FormField>

            <div className="flex flex-col items-stretch space-y-2">
              {blocks.map((field, ix: number) => (
                <FormField
                  control={form.control}
                  key={field.id}
                  name={`blocks.${ix}.text`}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className={cn(ix !== 0 && "sr-only")}>Parts</FormLabel>
                      <div className="flex justify-stretch align-start space-x-2">
                        <FormControl>
                          <Textarea resize="auto" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={blocks.length <= 1}
                          onClick={() => remove(ix)}
                        >
                          <TrashIcon className="size-3" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => append({ text: "" })}
            >
              Add Part
            </Button>
          </div>

          <div className="flex flex-row align-start space-x-2">
            <Button className="flex-0" type="submit" disabled={loading}>
              {loading ? (
                <>
                  Updating...
                  <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
                </>
              ) : (
                <span>Update</span>
              )}</Button>
            <Link to={'/songs'}><Button className="flex-0" type="button" variant="secondary">Cancel</Button></Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
