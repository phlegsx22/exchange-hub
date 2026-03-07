import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { label: "Trade", path: "/trade" },
  { label: "Assets", path: "/assets" },
  { label: "Deposit", path: "/deposit" },
  { label: "Transfer", path: "/transfer" },
  { label: "Withdraw", path: "/withdraw" },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { status, user, isAdmin, logout } = useAuth();

  const isLoggedIn = status === "authenticated" && !!user;
  const isLanding = location.pathname === "/";

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  // Don't show user nav on landing page - keep it clean
  const showUserNav = isLoggedIn && !isLanding && !isAdmin;
  // Only show admin button to admins, and not on landing
  const showAdminButton = isLoggedIn && isAdmin && !isLanding;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <img src={logo} alt="Annex-Ebank" className="h-7 w-7" />
          <span>Annex-Ebank</span>
        </Link>

        {/* Desktop nav - only for regular users, not on landing */}
        <nav className="hidden md:flex items-center gap-1">
          {showUserNav && navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                location.pathname === link.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {showUserNav ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard">
                <Button variant={location.pathname === "/dashboard" ? "default" : "outline"} size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </Button>
            </div>
          ) : showAdminButton ? (
            <div className="flex items-center gap-2">
              <Link to="/admin">
                <Button variant={location.pathname.startsWith("/admin") ? "default" : "outline"} size="sm">
                  Admin Panel
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </Button>
            </div>
          ) : !isLoggedIn ? (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm">Log In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          ) : null}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-2">
          {showUserNav && navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 text-sm font-medium rounded-md hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
          {showUserNav ? (
            <div className="space-y-2 pt-2 border-t">
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button className="w-full" size="sm">Dashboard</Button>
              </Link>
              <Button className="w-full" size="sm" variant="outline" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Logout
              </Button>
            </div>
          ) : showAdminButton ? (
            <div className="space-y-2 pt-2 border-t">
              <Link to="/admin" onClick={() => setMobileOpen(false)}>
                <Button className="w-full" size="sm">Admin Panel</Button>
              </Link>
              <Button className="w-full" size="sm" variant="outline" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Logout
              </Button>
            </div>
          ) : !isLoggedIn ? (
            <div className="flex gap-2 pt-2 border-t">
              <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">Log In</Button>
              </Link>
              <Link to="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">Sign Up</Button>
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </header>
  );
}
