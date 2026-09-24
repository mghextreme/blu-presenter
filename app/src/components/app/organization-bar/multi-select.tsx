import { useTranslation } from "react-i18next";
import { MultiSelect } from "@/components/ui/multi-select";
import type { OptionalOrganization } from "./index";

const PUBLIC_ARCHIVE_VALUE = 'public-archive';

interface OrganizationBarFilterProps {
  organizations: OptionalOrganization[];
  selected: OptionalOrganization[] | undefined;
  onOrganizationsChange: (orgs: OptionalOrganization[]) => void;
}

export function OrganizationBarFilter({
  organizations,
  selected,
  onOrganizationsChange,
}: OrganizationBarFilterProps) {
  const { t } = useTranslation("organizations");

  const options = organizations.map((org) => (
    org
      ? { value: org.id.toString(), label: org.name || t('defaultName') }
      : { value: PUBLIC_ARCHIVE_VALUE, label: t('publicArchive') }
  ));

  const selectedValues = (selected ?? []).map((org) => (
    org ? org.id.toString() : PUBLIC_ARCHIVE_VALUE
  ));

  const handleChange = (values: string[]) => {
    const orgs = values
      .map((value) => {
        if (value === PUBLIC_ARCHIVE_VALUE) {
          return null;
        }
        const org = organizations.find((o) => !!o && o.id.toString() === value);
        return org === undefined ? undefined : org;
      })
      .filter((org): org is OptionalOrganization => org !== undefined);

    onOrganizationsChange(orgs);
  };

  return (
    <MultiSelect
      options={options}
      selected={selectedValues}
      onChange={handleChange}
      placeholder={t('all')}
      searchText={t('searchPlaceholder')}
      emptyText={t('searchNoneFound')}
      className="min-w-48 max-w-96"
      summaryRenderFunction={(selectedOptions, placeholder) => {
        if (selectedOptions.length === 0) {
          return <span className="truncate">{placeholder}</span>;
        }

        const publicArchiveOnly = selectedOptions.length === 1
          && selectedOptions[0].value === PUBLIC_ARCHIVE_VALUE;
        if (publicArchiveOnly) {
          return <span className="truncate">{t('all')} + {t('publicArchive')}</span>;
        }

        const labels = selectedOptions.map((option) => option.label).join(', ');
        return <span className="truncate">{labels}</span>;
      }}
    />
  );
}
