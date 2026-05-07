import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface ThemeConfigFormProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  label: string
  defaultValue?: string
}

export function ColorForm<T extends FieldValues>({
  form,
  name,
  label,
  defaultValue,
}: ThemeConfigFormProps<T>) {

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const value = (field.value as string | undefined) ?? defaultValue ?? '';
        return (
          <FormItem className="flex-1 min-w-[40%]">
            <FormLabel>{label}</FormLabel>
            <div className="flex gap-2">
              <div className="w-auto h-full aspect-square rounded" style={{ backgroundColor: value }}></div>
              <Input {...field} value={value} />
            </div>
            <FormMessage />
          </FormItem>
        );
      }}></FormField>
  )
}
