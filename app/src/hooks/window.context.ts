import { createContext } from 'react';

export type WindowProviderState = {
  childWindow?: Window;
};

const initialState: WindowProviderState = {
  childWindow: undefined,
};

export const WindowProviderContext = createContext<WindowProviderState>(initialState);
