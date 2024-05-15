import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table"
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { ISong } from "@/types";
import { Button } from "@/components/ui/button";
import { DataTable, fuzzyFilter, fuzzySort } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { SongsService } from "@/services/songs.service";

const columns: ColumnDef<ISong>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    filterFn: fuzzyFilter,
    sortingFn: fuzzySort,
  },
  {
    accessorKey: "artist",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Artist" />
    ),
    filterFn: fuzzyFilter,
    sortingFn: fuzzySort,
  },
  {
    id: "actions",
    cell: () => {
      return (
        <div className="flex justify-end space-x-2 -m-1">
          <Button
            size="sm"
            onClick={() => alert('Edit')}>
            <PencilIcon className="size-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => alert('Delete')}>
            <TrashIcon className="size-3" />
          </Button>
        </div>
      )
    }
  },
];

export default function Songs() {

  const songsService = new SongsService();

  const [songs, setSongs] = useState<ISong[]>([]);

  const updateSongs = () => {
    songsService.getAll().then((songs) => {
      setSongs(songs);
    });
  }

  useEffect(() => {
    updateSongs();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-4">Songs</h1>
      <DataTable columns={columns} data={songs}></DataTable>
    </div>
  );
}
