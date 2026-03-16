import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying session...</p>
      </div>
    </div>
  );
}

function getEmailParam(email?: string) {
  return email ? `?email=${encodeURIComponent(email)}` : "";
}

/**
 * Requires user to be authenticated (any role).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { status, accessToken } = useAuth();

  // Show loading while validating session
  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

/**
 * Requires user to be authenticated AND have verified email.
 * This is for regular user routes (dashboard, trade, etc.)
 */
export function RequireVerified({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { status, accessToken, user, isVerified, isAdmin } = useAuth();

  // Show loading while validating session
  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // If admin tries to access user routes, redirect to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (!isVerified) {
    return <Navigate to={`/verify-email${getEmailParam(user?.email)}`} replace />;
  }

  return <>{children}</>;
}

/**
 * Requires user KYC status to be approved for sensitive user actions.
 */
export function RequireKycApproved({ children }: { children: ReactNode }) {
  const { status, accessToken, user, isAdmin } = useAuth();

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (user?.kycStatus !== "approved") {
    return <Navigate to="/kyc" replace state={{ reason: "KYC approval required for this action." }} />;
  }

  return <>{children}</>;
}

/**
 * Requires user to be authenticated AND be an admin.
 * Admins have completely separate access from regular users.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { status, accessToken, isAdmin } = useAuth();

  // Show loading while validating session
  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (!accessToken) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  // Strict role check - only admins can access admin routes
  if (!isAdmin) {
    // Regular users trying to access admin routes get redirected to their dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * Redirects authenticated users away from auth pages (login, register).
 * Admins go to admin dashboard, regular users go to user dashboard.
 */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { status, accessToken, isAdmin } = useAuth();

  // Show loading while validating session
  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (accessToken) {
    // Redirect based on role
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
