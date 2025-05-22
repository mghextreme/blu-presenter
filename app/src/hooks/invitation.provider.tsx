import { createContext, useContext } from "react";

type InvitationProviderProps = {
  email?: string
  organization?: string
  children: React.ReactNode
}

export type InvitationProviderState = {
  email?: string,
  organization?: string
}

const initialState: InvitationProviderState = {
  email: undefined,
}

const InvitationContext = createContext<InvitationProviderState>(initialState);

export const InvitationProvider = ({ email, organization, children }: InvitationProviderProps) => {
  const value = {
    email,
    organization,
  };
  return <InvitationContext.Provider value={value}>{children}</InvitationContext.Provider>;
};

export const useInvitation = () => {
  return useContext(InvitationContext);
};
