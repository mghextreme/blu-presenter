import { useCallback, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command"
import CheckIcon from "@heroicons/react/24/solid/CheckIcon"
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon"

export type Option = {
  value: string
  label: string
}

interface MultiSelectProps<T extends Option> {
  options: T[]
  selected: string[]
  onChange: (selected: any[]) => void
  placeholder?: string
  searchText?: string
  emptyText?: string
  className?: string
  summaryRenderFunction?: (options: T[], placeholder: React.ReactNode) => React.ReactNode
  itemRenderFunction?: (option: T, isSelected: boolean) => React.ReactNode
}

const defaultSummaryRenderFunction = (options: Option[], placeholder: React.ReactNode) => {
  const selectedLabels = options
    .map((option) => option.label)
    .join(", ")

  return (
    <span className="truncate">{selectedLabels || placeholder}</span>
  )
}

const defaultItemRenderFunction = (option: Option, isSelected: boolean) => (
  <>
    {option.label}
    <CheckIcon
      className={cn(
        "ml-auto h-4 w-4",
        isSelected ? "opacity-100" : "opacity-0"
      )}
    />
  </>
)

export function MultiSelect<T extends Option>({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  searchText = "Search options...",
  emptyText = "No options found.",
  className,
  summaryRenderFunction = defaultSummaryRenderFunction,
  itemRenderFunction = defaultItemRenderFunction,
}: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false)

  const handleSelect = useCallback(
    (value: string) => {
      const updatedSelected = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
      onChange(updatedSelected)
    },
    [selected, onChange],
  )

  const selectedItems = useMemo<T[]>(
    () =>
      selected
        .map((value) => options.find((option) => option.value === value))
        .filter(Boolean) as T[],
    [selected, options],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {summaryRenderFunction(selectedItems, placeholder)}
          <ChevronDownIcon className="size-3 shrink-0 opacity-50 ms-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={searchText} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} value={option.value} onSelect={() => handleSelect(option.value)}>
                  {itemRenderFunction(option, selected.includes(option.value))}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
