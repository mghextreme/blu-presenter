import { IOrganization } from "@/types";
import { ReactNode, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

type OptionalOrganization = IOrganization | null | undefined;

interface OrganizationBarProps {
  organizations: OptionalOrganization[]
  subtitle?: string
  editable?: boolean
  multiselect?: boolean
  children?: ReactNode
  onOrganizationsChange?: (orgs: IOrganization[]) => void
}

export function OrganizationBar({
  organizations,
  subtitle,
  editable = false,
  multiselect = false,
  onOrganizationsChange,
  children,
}: OrganizationBarProps) {
  const { t } = useTranslation("organizations");

  const [orgNames, setOrgNames] = useState<string>("");

  useEffect(() => {
    const names: string[] = organizations.map((org: OptionalOrganization) => {
      if (!org) return t("publicArchive");
      if (!org.name) return t("defaultName");
      return org.name;
    });

    setOrgNames(names.join(', '));
  }, [organizations]);

  return (
    <>
      <div className="flex items-center px-2 sm:px-8 py-3 bg-slate-200 dark:bg-slate-900 gap-x-2">
        <span className="text-sm">
          {orgNames && <>
            {t(organizations.length > 1 ? 'plural' : 'singular')}: <b>{orgNames}</b>
            {subtitle && ' | '}
          </>}
          {subtitle}
        </span>
        <div className="buttons flex-1 flex justify-end gap-x-2">
          {children}
        </div>
      </div>
    </>
  );
}
