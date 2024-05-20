import { Link, useLoaderData } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table"
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { ISong } from "@/types";
import { Button } from "@/components/ui/button";
import { DataTable, fuzzyFilter, fuzzySort } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { SongsService } from "@/services";
import { useServices } from "@/hooks/services.provider";

export async function loader({ songsService }: { songsService: SongsService }) {
  return await songsService.getAll();
}

const buildColumns = (songsService: SongsService) => {
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
      cell: ({ row }) => {
        return (
          <div className="flex justify-end space-x-2 -m-1">
            <Link to={`/app/songs/${row.original.id}/edit`}>
              <Button
                type="button"
                size="sm">
                <PencilIcon className="size-3" />
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => songsService.delete(row.original.id)}>
              <TrashIcon className="size-3" />
            </Button>
          </div>
        )
      }
    },
  ];

  return columns;
}

export default function Songs() {

  const data = useLoaderData() as ISong[];
  const { songsService } = useServices();

  const columns = buildColumns(songsService);

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-4">Songs</h1>
      <DataTable columns={columns} data={data ?? []} addButton={(
        <Link to="/app/songs/add"><Button>Add song</Button></Link>
      )}></DataTable>
    </div>
  );
}
