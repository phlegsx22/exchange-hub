import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, Shield, Zap, Users, Lock, ArrowRight, ShieldCheck, Globe, Gift } from "lucide-react";
import { useState, useEffect } from "react";

const stats = [
  { icon: Users, label: "10M+ traders worldwide" },
  { icon: Shield, label: "Bank-grade security" },
  { icon: Zap, label: "Instant execution" },
  { icon: Lock, label: "$350M insurance fund" },
];

const liveTrades = [
  "User ***42 just bought 0.5 BTC",
  "User ***87 just sold 12 ETH",
  "User ***15 just deposited 5,000 USDT",
  "User ***63 just bought 200 SOL",
  "User ***29 just earned $142 in rewards",
  "User ***51 just registered & got $100 bonus",
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [tradeIdx, setTradeIdx] = useState(0);
  const [onlineCount, setOnlineCount] = useState(48293);

  useEffect(() => {
    const t1 = setInterval(() => setTradeIdx(prev => (prev + 1) % liveTrades.length), 3000);
    const t2 = setInterval(() => setOnlineCount(prev => prev + Math.floor((Math.random() - 0.45) * 30)), 4000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/kyc");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-foreground text-background p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative">
          <div className="flex items-center gap-2 font-bold text-xl mb-2">
            <BarChart3 className="h-6 w-6" />
            NexTrade
          </div>
          <p className="text-background/60 text-sm">The world's leading crypto exchange</p>
        </div>
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight mb-3">Start trading in<br />under 60 seconds</h2>
            <p className="text-background/60 text-sm max-w-sm">Join millions of traders worldwide. Get $100 in trading bonus when you sign up today.</p>
          </div>
          <div className="space-y-3">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-background/70">
                <div className="h-8 w-8 rounded-lg bg-background/10 flex items-center justify-center">
                  <s.icon className="h-4 w-4" />
                </div>
                {s.label}
              </div>
            ))}
          </div>
        </div>
        <div className="relative space-y-3">
          {/* Live activity */}
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

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <BarChart3 className="h-8 w-8" />
              <span className="text-xl font-bold">NexTrade</span>
            </div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground mt-1">Start trading in minutes</p>
            <div className="inline-flex items-center gap-1.5 mt-3 rounded-full border border-warning/30 bg-warning/5 px-3 py-1 text-xs text-warning">
              <Gift className="h-3 w-3" /> Get $100 bonus on sign up
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" placeholder="••••••••" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="terms" required />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                I agree to the <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>
              </label>
            </div>
            <Button type="submit" className="w-full gap-2" size="lg">Create Account <ArrowRight className="h-4 w-4" /></Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-foreground underline underline-offset-4 hover:opacity-80">
              Log in
            </Link>
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t">
            {[
              { icon: ShieldCheck, label: "SOC 2" },
              { icon: Lock, label: "PCI DSS" },
              { icon: Globe, label: "180+ countries" },
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
