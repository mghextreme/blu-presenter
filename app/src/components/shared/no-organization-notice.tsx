import { Link } from "react-router-dom";
import { PageContent } from "@/components/shared/page-content";
import { Button } from "@/components/ui/button";

interface NoOrganizationNoticeProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}

/**
 * Shown instead of a creation form when none of the user's organizations
 * support the item being created (feature disabled or insufficient role).
 */
export function NoOrganizationNotice({
  title,
  description,
  actionLabel,
  actionTo,
}: Readonly<NoOrganizationNoticeProps>) {
  return (
    <PageContent className="flex flex-col flex-1 justify-center">
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        {actionLabel && actionTo && (
          <Button asChild variant="secondary" className="mt-2">
            <Link to={actionTo}>{actionLabel}</Link>
          </Button>
        )}
      </div>
    </PageContent>
  );
}
