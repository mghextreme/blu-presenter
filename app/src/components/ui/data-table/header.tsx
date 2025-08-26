import { ChangeEvent, ReactNode, useState } from "react";
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

interface DataTableHeaderProps<TData> {
  table: Table<TData>
  actions: ReactNode
}

export function DataTableHeader<TData>({
  table,
  actions = null,
}: DataTableHeaderProps<TData>) {
  const [query, setQuery] = useState<string>();

  const { t } = useTranslation("data-table");

  const inputChanged = (event: ChangeEvent) => {
    const target = event.target as HTMLInputElement;
    const value = target?.value;
    setQuery(value);
    table.setGlobalFilter(value);
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <Input
          placeholder={t("filter") + '...'}
          value={query}
          onChange={inputChanged}
          className="max-w-sm"
        />
      </div>
      <div>
        {(actions)}
      </div>
    </div>
  )
}
