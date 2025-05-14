import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { z } from "zod";

import { OrganizationsService } from "@/services";
import { useServices } from "@/hooks/services.provider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Params, useLoaderData, useNavigate } from "react-router-dom";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { useTranslation } from "react-i18next";
import { IOrganization } from "@/types/organization.interface";
import { ColumnDef } from "@tanstack/react-table"
import { DataTable, fuzzyFilter, fuzzySort } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { TFunction } from "i18next";
import { IOrganizationUser } from "@/types";

export async function loader({ params, organizationsService }: { params: Params, organizationsService: OrganizationsService }) {
  return await organizationsService.getById(Number(params.id));
}

const formSchema = z.object({
  id: z.number(),
  name: z.string().min(2),
});

type EditOrganizationProps = {
  edit?: boolean
}

const buildColumns = (t: TFunction, organization: IOrganization, organizationsService: OrganizationsService) => {
  const columns: ColumnDef<IOrganizationUser>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.name')} />
      ),
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.email')} />
      ),
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.role')} />
      ),
      cell: ({ row }) => {
        const role = row.getValue("role");
        return (
          t('role.' + role)
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex justify-end space-x-2 -m-1">
            <Link to={`/app/organizations/${organization.id}/member/${row.original.id}`}>
              <Button
                type="button"
                size="sm"
                title={t('actions.edit-member')}>
                <PencilIcon className="size-3" />
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              title={t('actions.remove-member')}
              onClick={() => organizationsService.delete(row.original.id)}>
              <TrashIcon className="size-3" />
            </Button>
          </div>
        )
      }
    },
  ];

  return columns;
}

export default function EditSong({
  edit = true
}: EditOrganizationProps) {

  const { t } = useTranslation("organizations");

  const loadedData = useLoaderData() as IOrganization;
  const data = edit ? loadedData : {
    id: 0,
    name: '',
  };
  const members = data.users ?? [];

  const navigate = useNavigate();

  const { organizationsService } = useServices();

  if (!data) {
    throw new Error("Can't find organization");
  }

  const [isLoading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: data.id,
      name: data.name,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      let action;
      if (edit) {
        action = organizationsService.update(data.id, {
          ...values,
        });
      } else {
        action = organizationsService.add({
          ...values,
        });
      }
      action
        .then(() => {
          navigate("/app/organizations", { replace: true });
        })
        .catch((err) => {
          console.error(err);
        })
    } finally {
      setLoading(false);
    }
  }

  const columns = buildColumns(t, data, organizationsService);

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-4">{t('edit.title')}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('input.name')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}></FormField>
          <div className="flex flex-row align-start space-x-2">
            <Button className="flex-0" type="submit" disabled={isLoading}>
              {isLoading && (
                <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
              )}
              {t('button.' + (edit ? 'update' : 'add'))}
              </Button>
            <Link to={'/app/organizations'}><Button className="flex-0" type="button" variant="secondary">{t('button.cancel')}</Button></Link>
          </div>
        </form>
      </Form>
      <h2 className="text-xl mt-6 mb-4">{t('edit.members')}</h2>
      <DataTable columns={columns} data={members ?? []} addButton={(
        <Link to={'/app/organizations/' + data.id + '/invite'}><Button>{t('actions.invite-member')}</Button></Link>
      )}></DataTable>
    </div>
  );
}
