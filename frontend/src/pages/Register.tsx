import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Zap, Users, Lock, ArrowRight, ShieldCheck, Globe } from "lucide-react";
import { useState } from "react";
import logoImg from "@/assets/logo.png";
import { registerFormSchema } from "@/lib/validation";
import { api } from "@/lib/api";

const stats = [
  { icon: Users, label: "10M+ traders worldwide" },
  { icon: Shield, label: "Bank-grade security" },
  { icon: Zap, label: "Instant execution" },
  { icon: Lock, label: "$350M insurance fund" },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", promotionCode: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = registerFormSchema.safeParse({
      name: form.name,
      email: form.email,
      password: form.password,
      confirm: form.confirm,
      promotionCode: form.promotionCode,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      const flat = parsed.error.flatten();
      if (flat.fieldErrors) {
        for (const [k, v] of Object.entries(flat.fieldErrors))
          if (v?.[0]) next[k] = v[0];
      }
      setErrors(next);
      return;
    }
    setSubmitting(true);
    try {
      await api.register({
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
        confirmPassword: parsed.data.confirm,
        promotionCode: parsed.data.promotionCode,
      });
      navigate(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      const code = (err as { code?: string }).code;
      if (code === "EMAIL_TAKEN") setErrors({ email: "This email is already registered." });
      else setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-foreground text-background p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative">
          <div className="flex items-center gap-2 font-bold text-xl mb-2">
            <img src={logoImg} alt="Annex-Ebank" className="h-7 w-7" />
            Annex-Ebank
          </div>
          <p className="text-background/60 text-sm">Secure asset management for verified accounts</p>
        </div>
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight mb-3">Create your<br />asset account</h2>
            <p className="text-background/60 text-sm max-w-sm">Manage PAX Gold, crypto assets, and mobile transfers after verification.</p>
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
              Account Activity
            </div>
            <p className="text-sm text-background/80">
              Your deposits, withdrawals, and transfers will appear after your account is active.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-background/40">
            <div className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> All systems operational</div>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <img src={logoImg} alt="Annex-Ebank" className="h-8 w-8" />
              <span className="text-xl font-bold">Annex-Ebank</span>
            </div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground mt-1">Start trading in minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{errors.form}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 chars, upper, lower, number, special" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" placeholder="••••••••" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="promotionCode">Promotion Code <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="promotionCode" placeholder="Enter promo code" value={form.promotionCode} onChange={(e) => setForm({ ...form, promotionCode: e.target.value })} />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="terms" required />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                I agree to the <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>
              </label>
            </div>
            <Button type="submit" className="w-full gap-2" size="lg" disabled={submitting}>
              {submitting ? "Creating account…" : "Create Account"} <ArrowRight className="h-4 w-4" />
            </Button>
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
