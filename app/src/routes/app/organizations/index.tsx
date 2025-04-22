import { Link, NavigateFunction, useLoaderData, useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table"
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { UserOrganization } from "@/types";
import { Button } from "@/components/ui/button";
import { DataTable, fuzzyFilter, fuzzySort } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { UsersService } from "@/services";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";

export async function loader({ usersService }: { usersService: UsersService }) {
  return await usersService.getUserOrganizations();
}

const buildColumns = (t: TFunction, navigate: NavigateFunction) => {
  const columns: ColumnDef<UserOrganization>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.name')} />
      ),
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
      cell: ({ row }) => {
        return (
          <div>
            {row.original.name ?? t('defaultName')}
          </div>
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex justify-end space-x-2 -m-1">
            <Button
              type="button"
              size="sm"
              title={t('actions.edit')}
              disabled={!row.original.canEdit()}
              onClick={() => navigate(`/app/organizations/${row.original.id}/edit`)}>
              <PencilIcon className="size-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              title={t('actions.delete')}
              disabled={true}
              onClick={() => console.log('TODO: Virtually remove organization')}>
              <TrashIcon className="size-3" />
            </Button>
          </div>
        )
      }
    },
  ];

  return columns;
}

export default function Organizations() {

  const { t } = useTranslation("organizations");
  const navigate = useNavigate();

  const data = useLoaderData() as UserOrganization[];

  const columns = buildColumns(t, navigate);

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-4">{t('list.title')}</h1>
      <DataTable columns={columns} data={data ?? []} addButton={(
        <Link to="/app/organizations/add"><Button>{t('actions.create')}</Button></Link>
      )}></DataTable>
    </div>
  );
}
