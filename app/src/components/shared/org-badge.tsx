import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const badgeColors = [
  'color-6',
  'color-1',
  'color-2',
  'color-3',
  'color-4',
  'color-5',
] as const;

interface OrgBadgeProps {
  organization?: { id?: number; name?: string; role?: unknown } | null;
  className?: string;
}

export function OrgBadge({ organization, className }: OrgBadgeProps) {
  const { t } = useTranslation("organizations");
  const { organizations } = useAuth();

  if (organization === undefined) {
    return null;
  }

  if (!organization?.id) {
    return (
      <Badge variant="outline" className={cn("me-3 my-auto", className)}>
        {t('publicArchive')}
      </Badge>
    );
  }

  const colorIndex = organizations.findIndex((org) => org.id === organization.id);
  const variant = colorIndex >= 0 ? badgeColors[colorIndex % badgeColors.length] : 'outline';

  return (
    <Badge variant={variant} className={cn("me-3 my-auto", className)}>
      {organization.name || t('defaultName')}
    </Badge>
  );
}
