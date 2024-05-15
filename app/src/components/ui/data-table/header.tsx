import { useState } from "react";
import { Table } from "@tanstack/react-table";
import { Input } from "../input";

interface DataTableHeaderProps<TData> {
  table: Table<TData>
}

export function DataTableHeader<TData>({
  table,
}: DataTableHeaderProps<TData>) {
  const [query, setQuery] = useState<string>();

  const inputChanged = (event) => {
    const value = event.target.value;
    setQuery(value);
    table.setGlobalFilter(value);
  }

  return (
    <div className="flex items-center">
      <Input
        placeholder="Filter..."
        value={query}
        onChange={inputChanged}
        className="max-w-sm"
      />
    </div>
  )
}
