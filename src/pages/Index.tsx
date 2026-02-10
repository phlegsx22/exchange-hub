import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, TrendingUp, BarChart3, Lock, Globe } from "lucide-react";

const stats = [
  { label: "24h Volume", value: "$2.4B+" },
  { label: "Supported Assets", value: "350+" },
  { label: "Users Worldwide", value: "10M+" },
  { label: "Countries", value: "180+" },
];

const features = [
  { icon: Zap, title: "Lightning Fast", desc: "Execute trades in milliseconds with our high-performance matching engine." },
  { icon: Shield, title: "Bank-Grade Security", desc: "Multi-layer security with cold storage, 2FA, and real-time monitoring." },
  { icon: TrendingUp, title: "Advanced Trading", desc: "Spot, margin, and futures trading with professional charting tools." },
  { icon: Lock, title: "Regulated", desc: "Fully compliant with global regulations and licensed in 30+ jurisdictions." },
  { icon: Globe, title: "Global Access", desc: "Trade from anywhere, 24/7 with multi-language and multi-currency support." },
  { icon: BarChart3, title: "Deep Liquidity", desc: "Access deep order books and tight spreads across all trading pairs." },
];

const markets = [
  { pair: "BTC/USDT", price: "97,245.30", change: "+2.34%", up: true },
  { pair: "ETH/USDT", price: "3,412.18", change: "+1.87%", up: true },
  { pair: "SOL/USDT", price: "198.45", change: "-0.52%", up: false },
  { pair: "XRP/USDT", price: "2.41", change: "+5.12%", up: true },
  { pair: "ADA/USDT", price: "0.982", change: "-1.23%", up: false },
];

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--muted))_0%,transparent_70%)]" />
        <div className="container relative py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <span className="h-2 w-2 rounded-full bg-buy animate-pulse" />
            Markets are live
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Trade Crypto with
            <br />
            <span className="text-muted-foreground">Confidence</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            The most trusted cryptocurrency exchange. Buy, sell, and trade 350+ digital assets with industry-leading security and zero hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-base px-8 gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/trade">
              <Button size="lg" variant="outline" className="text-base px-8">
                View Markets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card">
        <div className="container grid grid-cols-2 md:grid-cols-4 divide-x">
          {stats.map((stat) => (
            <div key={stat.label} className="py-8 text-center">
              <p className="text-2xl md:text-3xl font-bold font-mono">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Markets */}
      <section className="container py-20">
        <h2 className="text-3xl font-bold mb-2">Live Markets</h2>
        <p className="text-muted-foreground mb-8">Top performing assets in the last 24 hours</p>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pair</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Price</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">24h Change</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((m) => (
                <tr key={m.pair} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4 font-semibold">{m.pair}</td>
                  <td className="py-4 px-4 text-right font-mono">${m.price}</td>
                  <td className={`py-4 px-4 text-right font-mono font-medium ${m.up ? "text-buy" : "text-sell"}`}>
                    {m.change}
                  </td>
                  <td className="py-4 px-4 text-right hidden sm:table-cell">
                    <Link to="/trade">
                      <Button size="sm" variant="outline">Trade</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Features */}
      <section className="bg-card border-y">
        <div className="container py-20">
          <h2 className="text-3xl font-bold mb-2 text-center">Why NexTrade?</h2>
          <p className="text-muted-foreground text-center mb-12">Built for traders, by traders</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-lg border bg-background hover:shadow-md transition-shadow">
                <f.icon className="h-8 w-8 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Trading in Minutes</h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Create your account, complete verification, and start trading — it only takes a few minutes.
        </p>
        <Link to="/register">
          <Button size="lg" className="px-10 gap-2">
            Create Account <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container py-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-bold">
            <BarChart3 className="h-5 w-5" />
            NexTrade
          </div>
          <p className="text-sm text-muted-foreground">© 2026 NexTrade. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
