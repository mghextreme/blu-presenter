import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useSearch } from "@/hooks/search.provider";
import { SearchResultItem, SearchResultItemProps } from "./search-result-item";
import { LoadMoreButton } from "@/components/shared/load-more";

export function SearchResultsList(props: SearchResultItemProps) {

  const { t } = useTranslation('songs');

  const {
    results,
    hasMore,
    loadMore,
    isSearching,
  } = useSearch();

  const handleLoadMore = () => {
    loadMore().catch((e) => {
      toast.error(t('errors.search'), {
        description: e?.message || '',
      });
    });
  };

  return (
    <>
      {results.map((item) => (
        <SearchResultItem key={item.id} item={item} {...props} />
      ))}
      {hasMore && (
        <LoadMoreButton onClick={handleLoadMore} isLoading={isSearching} />
      )}
    </>
  );
}
