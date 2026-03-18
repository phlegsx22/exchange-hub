import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { AdminLayout } from "@/components/AdminLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import KYC from "./pages/KYC";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import AssetDetails from "./pages/AssetDetails";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Transfer from "./pages/Transfer";
import Trade from "./pages/Trade";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRegister from "./pages/admin/AdminRegister";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminWallets from "./pages/admin/AdminWallets";
import AdminAssets from "./pages/admin/AdminAssets";
import AdminFeatures from "./pages/admin/AdminFeatures";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminBlacklist from "./pages/admin/AdminBlacklist";
import AdminAlerts from "./pages/admin/AdminAlerts";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminKyc from "./pages/admin/AdminKyc";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import { RequireAdmin, RequireVerified, RequireKycApproved, RedirectIfAuthenticated } from "@/components/RouteGuards";

const queryClient = new QueryClient();

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Admin auth routes - redirect if already logged in as admin */}
            <Route
              path="/admin/login"
              element={
                <RedirectIfAuthenticated>
                  <AdminLogin />
                </RedirectIfAuthenticated>
              }
            />
            <Route
              path="/admin/register"
              element={
                <RedirectIfAuthenticated>
                  <AdminRegister />
                </RedirectIfAuthenticated>
              }
            />

            {/* Admin routes - strictly protected, only admins */}
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="wallets" element={<AdminWallets />} />
              <Route path="assets" element={<AdminAssets />} />
              <Route path="kyc" element={<AdminKyc />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
              <Route path="features" element={<AdminFeatures />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="blacklist" element={<AdminBlacklist />} />
              <Route path="alerts" element={<AdminAlerts />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Public + user routes with navbar */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              {/* Auth routes - redirect if already logged in */}
              <Route
                path="/login"
                element={
                  <RedirectIfAuthenticated>
                    <Login />
                  </RedirectIfAuthenticated>
                }
              />
              <Route
                path="/register"
                element={
                  <RedirectIfAuthenticated>
                    <Register />
                  </RedirectIfAuthenticated>
                }
              />
              <Route path="/verify-email" element={<VerifyEmail />} />

              {/* User routes - require verified email, no admins */}
              <Route
                path="/kyc"
                element={
                  <RequireVerified>
                    <KYC />
                  </RequireVerified>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RequireVerified>
                    <Dashboard />
                  </RequireVerified>
                }
              />
              <Route
                path="/assets"
                element={
                  <RequireVerified>
                    <Assets />
                  </RequireVerified>
                }
              />
              <Route
                path="/assets/:symbol"
                element={
                  <RequireVerified>
                    <AssetDetails />
                  </RequireVerified>
                }
              />
              <Route
                path="/deposit"
                element={
                  <RequireVerified>
                    <RequireKycApproved>
                      <Deposit />
                    </RequireKycApproved>
                  </RequireVerified>
                }
              />
              <Route
                path="/withdraw"
                element={
                  <RequireVerified>
                    <RequireKycApproved>
                      <Withdraw />
                    </RequireKycApproved>
                  </RequireVerified>
                }
              />
              <Route
                path="/transfer"
                element={
                  <RequireVerified>
                    <RequireKycApproved>
                      <Transfer />
                    </RequireKycApproved>
                  </RequireVerified>
                }
              />
              <Route
                path="/trade"
                element={
                  <RequireVerified>
                    <RequireKycApproved>
                      <Trade />
                    </RequireKycApproved>
                  </RequireVerified>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireVerified>
                    <Profile />
                  </RequireVerified>
                }
              />
              <Route
                path="/security"
                element={
                  <RequireVerified>
                    <Profile />
                  </RequireVerified>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
