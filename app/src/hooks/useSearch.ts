import { useContext } from 'react';
import { SearchContext } from './search.context';

export const useSearch = () => {
  return useContext(SearchContext);
};
