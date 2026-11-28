import { useContext } from 'react';
import { WindowProviderContext } from './window.context';

export const useWindow = () => {
  const context = useContext(WindowProviderContext);

  if (context === undefined) throw new Error('useWindow must be used within a WindowProvider');

  return context;
};
