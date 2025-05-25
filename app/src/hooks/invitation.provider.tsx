import { createContext, useContext } from "react";

type InvitationProviderProps = {
  id?: number
  secret?: string
  email?: string
  organization?: string
  children: React.ReactNode
}

export type InvitationProviderState = {
  id?: number;
  secret?: string;
  email?: string,
  organization?: string
}

const InvitationContext = createContext<InvitationProviderState>({});

export const InvitationProvider = ({ id, secret, email, organization, children }: InvitationProviderProps) => {
  const value = {
    id,
    secret,
    email,
    organization,
  };
  return <InvitationContext.Provider value={value}>{children}</InvitationContext.Provider>;
};

export const useInvitation = () => {
  return useContext(InvitationContext);
};
