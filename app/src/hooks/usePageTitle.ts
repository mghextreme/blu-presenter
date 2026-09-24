import { useContext } from "react";
import { PageTitleProviderContext } from "./page-title.provider";

export const usePageTitle = () => {
  const context = useContext(PageTitleProviderContext)

  if (context === undefined)
    throw new Error("usePageTitle must be used within a PageTitleProvider")

  return context
}
