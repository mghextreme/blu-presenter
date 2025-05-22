import { Link, useLoaderData, useRevalidator } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table"
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { ISong } from "@/types";
import { Button } from "@/components/ui/button";
import { DataTable, fuzzyFilter, fuzzySort } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { SongsService } from "@/services";
import { useServices } from "@/hooks/services.provider";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export async function loader({ songsService }: { songsService: SongsService }) {
  return await songsService.getAll();
}

const buildColumns = (t: TFunction, songsService: SongsService) => {
  const columns: ColumnDef<ISong>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.title')} />
      ),
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
    },
    {
      accessorKey: "artist",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.artist')} />
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
                size="sm"
                title={t('actions.edit')}>
                <PencilIcon className="size-3" />
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              title={t('actions.delete')}
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

  const { t } = useTranslation("songs");
  const { organization } = useAuth();

  const data = useLoaderData() as ISong[];
  const { revalidate } = useRevalidator();
  const { songsService } = useServices();

  const columns = buildColumns(t, songsService);

  useEffect(() => {
    revalidate();
  }, [organization]);

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-4">{t('list.title')}</h1>
      <DataTable columns={columns} data={data ?? []} addButton={(
        <Link to="/app/songs/add"><Button>{t('actions.create')}</Button></Link>
      )}></DataTable>
    </div>
  );
}
