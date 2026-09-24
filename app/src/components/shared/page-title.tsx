import { useEffect } from "react";

import { usePageTitle } from "@/hooks/usePageTitle";

export function PageTitle({ value }: { value: string }) {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle(value);
    return () => setTitle(null);
  }, [value, setTitle]);

  return null;
}
