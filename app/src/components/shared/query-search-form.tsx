import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MagnifyingGlassIcon from "@heroicons/react/24/solid/MagnifyingGlassIcon";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

interface QuerySearchFormProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  /** When set, the current input is submitted automatically after the given milliseconds of inactivity. */
  debounceMs?: number;
  /** Optional fields rendered between the input and the search button. */
  children?: React.ReactNode;
}

export function QuerySearchForm({ onSearch, isLoading = false, placeholder, className, debounceMs, children }: QuerySearchFormProps) {
  const { t } = useTranslation("app");

  const [value, setValue] = useState<string>('');

  const { queue, flush } = useDebouncedCallback(onSearch, debounceMs);

  // Submit automatically while typing is paused (no-op when no debounce is
  // configured).
  useEffect(() => {
    queue(value);
  }, [value, queue]);

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        flush(value);
      }}
    >
      <div className="flex w-full gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        {children}
        <Button type="submit" size="icon" disabled={isLoading} title={t('actions.search')}>
          <MagnifyingGlassIcon className="size-4" />
        </Button>
      </div>
    </form>
  );
}
