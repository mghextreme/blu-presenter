import { useTranslation } from "react-i18next";
import type { OptionalOrganization } from "./index";

interface OrganizationBarLabelProps {
  organizations: OptionalOrganization[];
  subtitle?: string;
}

export function OrganizationBarLabel({
  organizations,
  subtitle,
}: OrganizationBarLabelProps) {
  const { t } = useTranslation("organizations");

  const orgNames = organizations.map((org) => {
    if (!org) return t('publicArchive');
    if (!org.name) return t('defaultName');
    return org.name;
  });

  return (
    <span className="text-sm">
      {orgNames.length > 0 && <>
        {t(organizations.length > 1 ? 'plural' : 'singular')}: <b>{orgNames.join(', ')}</b>
        {subtitle && ' | '}
      </>}
      {subtitle}
    </span>
  );
}
