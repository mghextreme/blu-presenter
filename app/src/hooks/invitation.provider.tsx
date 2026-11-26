import { InvitationContext } from './invitation.context';

type InvitationProviderProps = {
  id?: number;
  secret?: string;
  email?: string;
  organization?: string;
  children: React.ReactNode;
};

export const InvitationProvider = ({
  id,
  secret,
  email,
  organization,
  children,
}: Readonly<InvitationProviderProps>) => {
  const value = {
    id,
    secret,
    email,
    organization,
  };
  return <InvitationContext.Provider value={value}>{children}</InvitationContext.Provider>;
};
