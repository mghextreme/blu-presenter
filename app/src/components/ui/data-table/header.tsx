import { ReactNode, useState } from "react";
import { Table } from "@tanstack/react-table";
import { Input } from "../input";

interface DataTableHeaderProps<TData> {
  table: Table<TData>
  actions: ReactNode
}

export function DataTableHeader<TData>({
  table,
  actions = null,
}: DataTableHeaderProps<TData>) {
  const [query, setQuery] = useState<string>();

  const inputChanged = (event) => {
    const value = event.target.value;
    setQuery(value);
    table.setGlobalFilter(value);
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <Input
          placeholder="Filter..."
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
