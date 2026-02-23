import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, ArrowRight, Lock } from "lucide-react";
import logo from "@/assets/logo.png";
import { api, setStoredAuth } from "@/lib/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api.adminLogin({ email: email.trim(), password });
      if (data.user?.role !== "admin") {
        throw new Error("This account is not an admin.");
      }
      setStoredAuth(data);
      navigate("/admin", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={logo} alt="Annex-Ebank" className="h-8 w-8" />
            <span className="text-xl font-bold">Annex-Ebank</span>
          </div>
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Admin Sign In</h1>
          <p className="text-muted-foreground mt-1">Access the Annex-Ebank admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@annex-ebank.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full gap-2" size="lg" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign In"} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t">
          {[
            { icon: Lock, label: "JWT secured" },
            { icon: Shield, label: "Admin-only endpoint" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <b.icon className="h-3 w-3" /> {b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

