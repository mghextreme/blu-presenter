import { createContext } from 'react';

export type InvitationProviderState = {
  id?: number;
  secret?: string;
  email?: string;
  organization?: string;
};

export const InvitationContext = createContext<InvitationProviderState>({});
