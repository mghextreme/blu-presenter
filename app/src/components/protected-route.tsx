import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/hooks/useServices";
import { isTokenExpired } from "@/lib/utils";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, session } = useAuth();
  const { authService } = useServices();
  const [isValidating, setIsValidating] = useState(() => {
    // Only need validation if we appear logged in but the token is expired
    return isLoggedIn && isTokenExpired(session?.access_token);
  });

  useEffect(() => {
    if (!isLoggedIn || !isTokenExpired(session?.access_token)) {
      return;
    }

    authService.tryRefreshSession().finally(() => {
      setIsValidating(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isValidating) {
    return null;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return children;
}
