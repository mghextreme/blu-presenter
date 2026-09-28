import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MagnifyingGlassIcon from "@heroicons/react/24/solid/MagnifyingGlassIcon";

interface QuerySearchFormProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function QuerySearchForm({ onSearch, isLoading = false, placeholder, className }: QuerySearchFormProps) {
  const { t } = useTranslation("app");

  const [value, setValue] = useState<string>('');

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value);
      }}
    >
      <div className="flex w-full gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isLoading} title={t('actions.search')}>
          <MagnifyingGlassIcon className="size-4" />
        </Button>
      </div>
    </form>
  );
}
