import { useSearch } from "@/hooks/search.provider";
import { SearchResultItem, SearchResultItemProps } from "./search-result-item";

export function SearchResultsList(props: SearchResultItemProps) {

  const {
    results
  } = useSearch();

  return results.map((item) => (
    <SearchResultItem key={item.id} item={item} {...props} />
  ));
}
