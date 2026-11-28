import { useEffect, useEffectEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';

export function OrganizationRedirect() {
  const navigate = useNavigate();
  const { organization, organizations } = useAuth();

  const redirectToOrganization = useEffectEvent(() => {
    const target = organizations.find((org) => org.id === organization?.id) ?? organizations[0];

    if (target) {
      void navigate(`/app/organization/${target.id}`, { replace: true });
    } else {
      void navigate('/app/organizations/add', { replace: true });
    }
  });

  useEffect(() => {
    redirectToOrganization();
  }, []);

  return null;
}
