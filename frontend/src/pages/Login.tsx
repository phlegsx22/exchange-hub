import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, ArrowRight, ShieldCheck, Fingerprint, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const liveTrades = [
  "User ***42 just bought 0.5 BTC",
  "User ***87 just sold 12 ETH",
  "User ***15 just deposited 5,000 USDT",
  "User ***63 just bought 200 SOL",
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tradeIdx, setTradeIdx] = useState(0);
  const [onlineCount, setOnlineCount] = useState(48293);

  useEffect(() => {
    const t1 = setInterval(() => setTradeIdx(prev => (prev + 1) % liveTrades.length), 3000);
    const t2 = setInterval(() => setOnlineCount(prev => prev + Math.floor((Math.random() - 0.45) * 30)), 4000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api.login({ email: email.trim(), password });
      // Use AuthContext login to properly set state
      login(data.user, data.accessToken);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      const code = (err as { code?: string }).code;
      if (code === "EMAIL_NOT_VERIFIED") {
        navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`, { replace: true });
        return;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-foreground text-background p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative">
          <div className="flex items-center gap-2 font-bold text-xl mb-2">
            <img src={logo} alt="Annex-Ebank" className="h-7 w-7" />
            Annex-Ebank
          </div>
          <p className="text-background/60 text-sm">The world's leading crypto exchange</p>
        </div>
        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight">Welcome back,<br />trader.</h2>
          <p className="text-background/60 text-sm max-w-sm">Access your portfolio, trade 350+ assets, and manage your crypto — all in one place.</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "$2.4B+", label: "24h Volume" },
              { value: "99.99%", label: "Uptime" },
              { value: "350+", label: "Trading pairs" },
              { value: "<30s", label: "Avg support" },
            ].map((s, i) => (
              <div key={i} className="rounded-lg bg-background/5 border border-background/10 p-3">
                <p className="font-mono font-bold text-lg">{s.value}</p>
                <p className="text-xs text-background/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative space-y-3">
          <div className="rounded-lg bg-background/5 border border-background/10 p-3">
            <div className="flex items-center gap-2 text-xs text-background/50 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-buy opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-buy" />
              </span>
              Live Activity
            </div>
            <p className="text-sm text-background/80 animate-[fade-in_0.5s_ease-out]" key={tradeIdx}>
              {liveTrades[tradeIdx]}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-background/40">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5"><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-buy" /></span>
              {onlineCount.toLocaleString()} online
            </div>
            <div className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> All systems operational</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <img src={logo} alt="Annex-Ebank" className="h-8 w-8" />
              <span className="text-xl font-bold">Annex-Ebank</span>
            </div>
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Fingerprint className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground mt-1">Log in to your Annex-Ebank account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                <span className="text-xs text-muted-foreground cursor-pointer hover:underline">Forgot password?</span>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" size="lg" disabled={submitting}>
              {submitting ? "Signing in…" : "Log In"} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-foreground underline underline-offset-4 hover:opacity-80">
              Sign up
            </Link>
          </p>

          <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t">
            {[
              { icon: Shield, label: "256-bit encryption" },
              { icon: Lock, label: "2FA protected" },
              { icon: ShieldCheck, label: "SOC 2 certified" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <b.icon className="h-3 w-3" /> {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
