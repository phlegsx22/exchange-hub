import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, ArrowRight, Lock, KeyRound } from "lucide-react";
import logo from "@/assets/logo.png";
import { api, setStoredAuth } from "@/lib/api";

export default function AdminRegister() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bootstrapSecret, setBootstrapSecret] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword || !bootstrapSecret) {
      setError("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.adminRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        bootstrapSecret,
      });
      if (data.user?.role !== "admin") {
        throw new Error("Admin registration failed.");
      }
      setStoredAuth(data);
      navigate("/admin", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
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
          <h1 className="text-2xl font-bold">Create Admin</h1>
          <p className="text-muted-foreground mt-1">Protected by a server bootstrap secret</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="admin-name">Display name</Label>
            <Input
              id="admin-name"
              placeholder="Admin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

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
                autoComplete="new-password"
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

          <div className="space-y-2">
            <Label htmlFor="admin-confirm-password">Confirm password</Label>
            <Input
              id="admin-confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bootstrap-secret">Bootstrap secret</Label>
            <div className="relative">
              <Input
                id="bootstrap-secret"
                type={showSecret ? "text" : "password"}
                placeholder="Enter server bootstrap secret"
                value={bootstrapSecret}
                onChange={(e) => setBootstrapSecret(e.target.value)}
                required
                className="pr-10"
                autoComplete="off"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowSecret(!showSecret)}
                aria-label={showSecret ? "Hide secret" : "Show secret"}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              This must match `ADMIN_BOOTSTRAP_SECRET` on the API server.
            </p>
          </div>

          <Button type="submit" className="w-full gap-2" size="lg" disabled={submitting}>
            {submitting ? "Creating…" : "Create Admin"} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t flex items-center justify-between text-sm">
          <Link to="/admin/login" className="text-muted-foreground hover:text-foreground">
            Back to admin login
          </Link>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <KeyRound className="h-3 w-3" /> secret protected
            <span className="mx-1">•</span>
            <Lock className="h-3 w-3" /> JWT secured
          </div>
        </div>
      </div>
    </div>
  );
}

