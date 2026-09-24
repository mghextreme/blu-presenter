import { ReactNode } from "react";
import { IOrganization } from "@/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { pageContentColumn } from "@/components/shared/page-content";
import { OrganizationBarSelector } from "./single-select";
import { OrganizationBarFilter } from "./multi-select";
import { OrganizationBarLabel } from "./read-only-label";

export type OptionalOrganization = IOrganization | null;

interface OrganizationBarProps {
  /** Options to pick from. A `null` entry represents the public archive. */
  organizations: OptionalOrganization[];
  /** Controlled selection. Empty or undefined means "all organizations". */
  selected?: OptionalOrganization[];
  subtitle?: string;
  /** Single-select picker for choosing the target organization of new content. */
  editable?: boolean;
  /** Multi-select filter for list pages. */
  multiselect?: boolean;
  onOrganizationsChange?: (orgs: OptionalOrganization[]) => void;
  children?: ReactNode;
}

export function OrganizationBar({
  organizations,
  selected,
  subtitle,
  editable = false,
  multiselect = false,
  onOrganizationsChange,
  children,
}: OrganizationBarProps) {
  const handleChange = (orgs: OptionalOrganization[]) => {
    if (editable && orgs[0]) {
      const org = useAuth.getState().organizations.find((o) => o.id === orgs[0]?.id);
      if (org) {
        useAuth.getState().setOrganizationById(org.id);
      }
    }
    onOrganizationsChange?.(orgs);
  };

  return (
    <div className="sticky top-0 z-40 py-3 bg-slate-200 dark:bg-slate-900 shadow-2">
      <div className={cn(pageContentColumn, "flex items-center flex-wrap gap-x-2")}>
        {editable ? (
          <OrganizationBarSelector
            organizations={organizations}
            selected={selected?.[0]}
            onSelectedChange={(org) => handleChange([org])}
            subtitle={subtitle}
          />
        ) : multiselect ? (
          <OrganizationBarFilter
            organizations={organizations}
            selected={selected}
            onOrganizationsChange={handleChange}
          />
        ) : (
          <OrganizationBarLabel
            organizations={organizations}
            subtitle={subtitle}
          />
        )}
        {children && (
          <div className="buttons flex-1 flex flex-wrap justify-end gap-x-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
