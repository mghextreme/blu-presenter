import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The standard content column, for elements that must align with PageContent from the outside. */
export const pageContentColumn = "mx-auto w-full max-w-5xl px-2 sm:px-8";

interface PageContentProps {
  className?: string;
  children?: ReactNode;
}

/** Standard content container: limits the width and centers it on wide screens. */
export function PageContent({ className, children }: PageContentProps) {
  return (
    <div className={cn(pageContentColumn, "py-2 sm:py-8", className)}>
      {children}
    </div>
  );
}
