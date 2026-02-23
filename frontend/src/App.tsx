import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { AdminLayout } from "@/components/AdminLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import KYC from "./pages/KYC";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Withdraw from "./pages/Withdraw";
import Transfer from "./pages/Transfer";
import Trade from "./pages/Trade";
import NotFound from "./pages/NotFound";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminWallets from "./pages/admin/AdminWallets";
import AdminFeatures from "./pages/admin/AdminFeatures";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminBlacklist from "./pages/admin/AdminBlacklist";
import AdminAlerts from "./pages/admin/AdminAlerts";
import AdminSettings from "./pages/admin/AdminSettings";
import { RequireAdmin, RequireVerified } from "@/components/RouteGuards";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          {/* Admin routes - no Navbar, uses AdminLayout */}
          <Route path="/admin" element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="wallets" element={<AdminWallets />} />
            <Route path="features" element={<AdminFeatures />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="blacklist" element={<AdminBlacklist />} />
            <Route path="alerts" element={<AdminAlerts />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Public routes with Navbar */}
          <Route path="*" element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/kyc" element={<RequireVerified><KYC /></RequireVerified>} />
                <Route path="/dashboard" element={<RequireVerified><Dashboard /></RequireVerified>} />
                <Route path="/assets" element={<RequireVerified><Assets /></RequireVerified>} />
                <Route path="/withdraw" element={<RequireVerified><Withdraw /></RequireVerified>} />
                <Route path="/transfer" element={<RequireVerified><Transfer /></RequireVerified>} />
                <Route path="/trade" element={<RequireVerified><Trade /></RequireVerified>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
