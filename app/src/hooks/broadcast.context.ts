import { createContext } from 'react';
import type { BaseTheme, IBroadcastSession } from '@/types';

export type BroadcastProviderState = {
  session?: IBroadcastSession;
  setSession: (session?: IBroadcastSession) => void;

  urlTheme?: { label: string; value: BaseTheme | number };
  setUrlTheme: (theme?: { label: string; value: BaseTheme | number }) => void;
};

const initialState: BroadcastProviderState = {
  session: undefined,
  setSession: () => null,

  urlTheme: undefined,
  setUrlTheme: () => null,
};

export const BroadcastProviderContext = createContext<BroadcastProviderState>(initialState);
