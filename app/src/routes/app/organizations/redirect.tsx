import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function OrganizationRedirect() {
  const navigate = useNavigate();
  const { organization, organizations } = useAuth();

  useEffect(() => {
    const target = organizations.find((org) => org.id === organization?.id)
      ?? organizations[0];

    if (target) {
      navigate(`/app/organization/${target.id}`, { replace: true });
    } else {
      navigate('/app/organizations/add', { replace: true });
    }
  }, []);

  return null;
}
