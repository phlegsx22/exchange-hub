import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getStoredAuth } from "@/lib/api";

function getEmailParam(email?: string) {
  return email ? `?email=${encodeURIComponent(email)}` : "";
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const auth = getStoredAuth();

  if (!auth?.accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function RequireVerified({ children }: { children: ReactNode }) {
  const location = useLocation();
  const auth = getStoredAuth();

  if (!auth?.accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!auth.user?.emailVerified) {
    return <Navigate to={`/verify-email${getEmailParam(auth.user?.email)}`} replace />;
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation();
  const auth = getStoredAuth();

  if (!auth?.accessToken) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (auth.user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

