import { ReactNode } from "react";
import { Card, CardDescription, CardHeader, CardHeaderActions, CardHeaderText, CardTitle } from "@/components/ui/card";
import { OrgBadge } from "@/components/shared/org-badge";

interface ListItemCardProps {
  title: string;
  description?: string;
  organization?: { id?: number; name?: string } | null;
  additionalBadges?: ReactNode;
  actions?: ReactNode;
}

export function ListItemCard({
  title,
  description,
  organization,
  additionalBadges,
  actions,
}: ListItemCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardHeaderText>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeaderText>
        <CardHeaderActions>
          <OrgBadge organization={organization} />
          {additionalBadges}
          {actions}
        </CardHeaderActions>
      </CardHeader>
    </Card>
  );
}
