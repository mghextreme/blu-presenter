import { useContext } from 'react';
import { InvitationContext } from './invitation.context';

export const useInvitation = () => {
  return useContext(InvitationContext);
};
