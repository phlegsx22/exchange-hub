import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Shield, Zap, TrendingUp, BarChart3, Lock, Globe,
  ArrowUpRight, ArrowDownRight, Smartphone, Apple, Monitor,
  Users, Award, Clock, Flame, Star, ChevronRight, Bell,
  Wallet, CreditCard, Building2, Gift, BookOpen, Headphones
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Line, LineChart } from "recharts";
import { useEffect, useState } from "react";

// Sparkline data generators
const generateSparkline = (trend: "up" | "down" | "volatile") => {
  const base = 50;
  return Array.from({ length: 24 }, (_, i) => ({
    v: trend === "up"
      ? base + i * 2 + Math.random() * 10
      : trend === "down"
        ? base + 48 - i * 2 + Math.random() * 10
        : base + Math.sin(i * 0.8) * 20 + Math.random() * 15,
  }));
};

const tickerData = [
  { symbol: "BTC", price: "97,245.30", change: "+2.34%", up: true },
  { symbol: "ETH", price: "3,412.18", change: "+1.87%", up: true },
  { symbol: "BNB", price: "612.45", change: "+0.92%", up: true },
  { symbol: "SOL", price: "198.45", change: "-0.52%", up: false },
  { symbol: "XRP", price: "2.41", change: "+5.12%", up: true },
  { symbol: "ADA", price: "0.982", change: "-1.23%", up: false },
  { symbol: "DOGE", price: "0.342", change: "+8.45%", up: true },
  { symbol: "AVAX", price: "42.18", change: "+3.21%", up: true },
  { symbol: "DOT", price: "8.94", change: "-0.87%", up: false },
  { symbol: "LINK", price: "18.32", change: "+2.76%", up: true },
  { symbol: "MATIC", price: "1.24", change: "-2.11%", up: false },
  { symbol: "UNI", price: "12.87", change: "+1.45%", up: true },
];

const hotPairs = [
  { pair: "BTC/USDT", price: "97,245.30", change: "+2.34%", up: true, vol: "2.1B", sparkline: generateSparkline("up") },
  { pair: "ETH/USDT", price: "3,412.18", change: "+1.87%", up: true, vol: "1.4B", sparkline: generateSparkline("up") },
  { pair: "SOL/USDT", price: "198.45", change: "-0.52%", up: false, vol: "890M", sparkline: generateSparkline("down") },
  { pair: "XRP/USDT", price: "2.41", change: "+5.12%", up: true, vol: "720M", sparkline: generateSparkline("up") },
  { pair: "DOGE/USDT", price: "0.342", change: "+8.45%", up: true, vol: "560M", sparkline: generateSparkline("up") },
  { pair: "ADA/USDT", price: "0.982", change: "-1.23%", up: false, vol: "410M", sparkline: generateSparkline("volatile") },
];

const topGainers = [
  { pair: "PEPE/USDT", change: "+24.5%", price: "0.0000142" },
  { pair: "WIF/USDT", change: "+18.3%", price: "3.42" },
  { pair: "BONK/USDT", change: "+15.7%", price: "0.0000234" },
  { pair: "INJ/USDT", change: "+12.1%", price: "38.92" },
];

const topLosers = [
  { pair: "APE/USDT", change: "-8.2%", price: "1.84" },
  { pair: "SAND/USDT", change: "-6.7%", price: "0.612" },
  { pair: "MANA/USDT", change: "-5.4%", price: "0.534" },
  { pair: "AXS/USDT", change: "-4.9%", price: "8.12" },
];

const newListings = [
  { pair: "PYTH/USDT", price: "0.412", date: "2 hours ago", hot: true },
  { pair: "JUP/USDT", price: "1.24", date: "5 hours ago", hot: true },
  { pair: "W/USDT", price: "0.682", date: "1 day ago", hot: false },
];

const announcements = [
  { title: "NexTrade Launchpool: Farm PYTH with BTC & USDT", tag: "New", time: "2h ago" },
  { title: "Zero-Fee Trading Event for SOL/USDT Pair", tag: "Promo", time: "4h ago" },
  { title: "System Upgrade: Matching Engine v3.2", tag: "System", time: "8h ago" },
  { title: "New Margin Pairs Added: 15 New Trading Pairs", tag: "Update", time: "1d ago" },
];

const stats = [
  { label: "24h Volume", value: "$2.4B+" },
  { label: "Supported Assets", value: "350+" },
  { label: "Users Worldwide", value: "10M+" },
  { label: "Countries", value: "180+" },
  { label: "Trades/Second", value: "100K+" },
  { label: "Uptime", value: "99.99%" },
];

const features = [
  { icon: Zap, title: "Lightning Fast", desc: "Execute trades in milliseconds with our high-performance matching engine." },
  { icon: Shield, title: "Bank-Grade Security", desc: "Multi-layer security with cold storage, 2FA, and real-time monitoring." },
  { icon: TrendingUp, title: "Advanced Trading", desc: "Spot, margin, and futures trading with professional charting tools." },
  { icon: Lock, title: "Regulated", desc: "Fully compliant with global regulations and licensed in 30+ jurisdictions." },
  { icon: Globe, title: "Global Access", desc: "Trade from anywhere, 24/7 with multi-language and multi-currency support." },
  { icon: BarChart3, title: "Deep Liquidity", desc: "Access deep order books and tight spreads across all trading pairs." },
];

const volumeData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  volume: 1.2 + Math.random() * 2.5 + (i > 20 ? 1 : 0),
  users: 80000 + Math.floor(Math.random() * 40000) + i * 1000,
}));

function TickerTape() {
  return (
    <div className="border-b bg-card overflow-hidden">
      <div className="flex animate-[scroll_30s_linear_infinite] whitespace-nowrap py-2">
        {[...tickerData, ...tickerData].map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-4 text-sm border-r border-border/50">
            <span className="font-semibold">{t.symbol}</span>
            <span className="font-mono">${t.price}</span>
            <span className={`font-mono text-xs font-medium ${t.up ? "text-buy" : "text-sell"}`}>
              {t.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniSparkline({ data, up }: { data: { v: number }[]; up: boolean }) {
  return (
    <div className="w-24 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={up ? "sparkUp" : "sparkDown"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={up ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"} stopOpacity={0.3} />
              <stop offset="100%" stopColor={up ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={up ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"}
            fill={`url(#${up ? "sparkUp" : "sparkDown"})`}
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Index() {
  const [btcPrice, setBtcPrice] = useState(97245.30);

  useEffect(() => {
    const interval = setInterval(() => {
      setBtcPrice(prev => prev + (Math.random() - 0.48) * 50);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Ticker Tape */}
      <TickerTape />

      {/* Hero + Side Widgets */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--muted))_0%,transparent_70%)]" />
        <div className="container relative py-12 md:py-20">
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Hero Left */}
            <div className="lg:col-span-3 pt-8">
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-6">
                <span className="h-2 w-2 rounded-full bg-buy animate-pulse" />
                Markets are live — 350+ pairs trading
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
                Trade Crypto with
                <br />
                <span className="text-muted-foreground">Confidence</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mb-8">
                The most trusted cryptocurrency exchange. Buy, sell, and trade 350+ digital assets with industry-leading security.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link to="/register">
                  <Button size="lg" className="text-base px-8 gap-2">
                    Get Started Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/trade">
                  <Button size="lg" variant="outline" className="text-base px-8">
                    View Markets
                  </Button>
                </Link>
              </div>
              {/* Quick buy widget */}
              <div className="rounded-lg border bg-card p-4 max-w-sm">
                <p className="text-xs text-muted-foreground mb-2">Quick Buy</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded border bg-background px-3 py-2 text-sm font-mono">100.00 USD</div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 rounded border bg-background px-3 py-2 text-sm font-mono">0.00103 BTC</div>
                </div>
                <Link to="/trade">
                  <Button className="w-full mt-3" size="sm">Buy BTC</Button>
                </Link>
              </div>
            </div>

            {/* Right Side Widgets */}
            <div className="lg:col-span-2 space-y-4">
              {/* BTC Price Card */}
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-warning flex items-center justify-center text-xs font-bold text-warning-foreground">₿</div>
                    <div>
                      <p className="font-semibold text-sm">Bitcoin</p>
                      <p className="text-xs text-muted-foreground">BTC/USDT</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">${btcPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-xs text-buy font-mono">+2.34%</p>
                  </div>
                </div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateSparkline("up")}>
                      <defs>
                        <linearGradient id="btcGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(142,71%,45%)" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="hsl(142,71%,45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke="hsl(142,71%,45%)" fill="url(#btcGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Announcements */}
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <p className="font-semibold text-sm">Announcements</p>
                  </div>
                  <span className="text-xs text-muted-foreground cursor-pointer hover:underline">View All</span>
                </div>
                <div className="space-y-2.5">
                  {announcements.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs group cursor-pointer">
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        a.tag === "New" ? "bg-buy/10 text-buy" :
                        a.tag === "Promo" ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>{a.tag}</span>
                      <span className="group-hover:underline line-clamp-1 flex-1">{a.title}</span>
                      <span className="text-muted-foreground shrink-0">{a.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Listings */}
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="h-4 w-4 text-sell" />
                  <p className="font-semibold text-sm">New Listings</p>
                </div>
                <div className="space-y-2">
                  {newListings.map((n, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{n.pair}</span>
                        {n.hot && <Flame className="h-3 w-3 text-sell" />}
                      </div>
                      <div className="text-right">
                        <span className="font-mono">${n.price}</span>
                        <span className="text-xs text-muted-foreground ml-2">{n.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y bg-card">
        <div className="container grid grid-cols-3 md:grid-cols-6 divide-x">
          {stats.map((stat) => (
            <div key={stat.label} className="py-6 text-center">
              <p className="text-lg md:text-2xl font-bold font-mono">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hot Markets with Sparklines + Gainers/Losers */}
      <section className="container py-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Hot Markets Table */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-sell" />
                <h2 className="text-xl font-bold">Hot Markets</h2>
              </div>
              <Link to="/trade" className="text-sm text-muted-foreground hover:underline flex items-center gap-1">
                View All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Pair</th>
                    <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground">Price</th>
                    <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground">24h</th>
                    <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Volume</th>
                    <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Chart</th>
                    <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell"></th>
                  </tr>
                </thead>
                <tbody>
                  {hotPairs.map((m) => (
                    <tr key={m.pair} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{m.pair}</span>
                          {m.up && <Star className="h-3 w-3 text-warning fill-warning" />}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm">${m.price}</td>
                      <td className={`py-3 px-4 text-right font-mono text-sm font-medium ${m.up ? "text-buy" : "text-sell"}`}>
                        <span className="inline-flex items-center gap-0.5">
                          {m.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {m.change}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">${m.vol}</td>
                      <td className="py-3 px-4 text-right hidden md:table-cell">
                        <MiniSparkline data={m.sparkline} up={m.up} />
                      </td>
                      <td className="py-3 px-4 text-right hidden sm:table-cell">
                        <Link to="/trade"><Button size="sm" variant="outline" className="text-xs h-7">Trade</Button></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gainers & Losers */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight className="h-4 w-4 text-buy" />
                <h3 className="font-semibold text-sm">Top Gainers</h3>
              </div>
              <div className="space-y-2.5">
                {topGainers.map((g, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                      <span className="font-medium">{g.pair}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs">${g.price}</span>
                      <span className="font-mono text-xs text-buy font-medium w-16 text-right">{g.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownRight className="h-4 w-4 text-sell" />
                <h3 className="font-semibold text-sm">Top Losers</h3>
              </div>
              <div className="space-y-2.5">
                {topLosers.map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                      <span className="font-medium">{l.pair}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs">${l.price}</span>
                      <span className="font-mono text-xs text-sell font-medium w-16 text-right">{l.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 24h Volume Chart Mini */}
            <div className="rounded-lg border bg-card p-4">
              <p className="font-semibold text-sm mb-1">30-Day Volume</p>
              <p className="text-2xl font-bold font-mono mb-2">$2.4B</p>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={volumeData}>
                    <defs>
                      <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(0,0%,50%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(0,0%,50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="volume" stroke="hsl(0,0%,40%)" fill="url(#volGrad)" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services / Products Grid */}
      <section className="border-y bg-card">
        <div className="container py-12">
          <h2 className="text-2xl font-bold mb-6">Explore Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: BarChart3, title: "Spot Trading", desc: "Buy & sell 350+ coins", color: "text-foreground" },
              { icon: TrendingUp, title: "Futures", desc: "Up to 125x leverage", color: "text-foreground" },
              { icon: Wallet, title: "Earn", desc: "Up to 12% APY", color: "text-buy" },
              { icon: CreditCard, title: "Buy Crypto", desc: "Visa, Mastercard, Apple Pay", color: "text-foreground" },
              { icon: Gift, title: "Launchpad", desc: "New token offerings", color: "text-warning" },
              { icon: Building2, title: "OTC Desk", desc: "Large volume trades", color: "text-foreground" },
              { icon: BookOpen, title: "Academy", desc: "Learn crypto trading", color: "text-foreground" },
              { icon: Award, title: "VIP Program", desc: "Reduced fees & perks", color: "text-foreground" },
            ].map((p, i) => (
              <div key={i} className="p-4 rounded-lg border bg-background hover:shadow-md transition-all cursor-pointer group">
                <p.icon className={`h-6 w-6 mb-2 ${p.color} group-hover:scale-110 transition-transform`} />
                <p className="font-semibold text-sm">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Volume Chart + How it Works */}
      <section className="container py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Trading Volume */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-bold mb-1">Trading Volume</h3>
            <p className="text-sm text-muted-foreground mb-4">Daily volume over the last 30 days (in billions)</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="volGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(0,0%,0%)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(0,0%,0%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="volume" stroke="hsl(0,0%,20%)" fill="url(#volGrad2)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* How it Works */}
          <div>
            <h3 className="text-lg font-bold mb-6">Start Trading in 3 Steps</h3>
            <div className="space-y-6">
              {[
                { step: "01", title: "Create Account", desc: "Sign up with email in under 60 seconds. No minimums required.", icon: Users },
                { step: "02", title: "Verify Identity", desc: "Complete KYC verification to unlock full trading features.", icon: Shield },
                { step: "03", title: "Start Trading", desc: "Deposit funds and trade 350+ crypto assets instantly.", icon: TrendingUp },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-foreground text-background flex items-center justify-center text-sm font-bold font-mono shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
              <Link to="/register">
                <Button className="gap-2">
                  Register Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-card border-y">
        <div className="container py-12">
          <h2 className="text-2xl font-bold mb-2 text-center">Why NexTrade?</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">Built for traders, by traders</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="p-5 rounded-lg border bg-background hover:shadow-md transition-shadow">
                <f.icon className="h-7 w-7 mb-3" />
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Download + Trust */}
      <section className="container py-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Trade Anywhere, Anytime</h2>
            <p className="text-muted-foreground mb-6">
              Download the NexTrade app and never miss a trading opportunity. Available on iOS, Android, and Desktop.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              <Button variant="outline" className="gap-2"><Apple className="h-4 w-4" /> App Store</Button>
              <Button variant="outline" className="gap-2"><Smartphone className="h-4 w-4" /> Google Play</Button>
              <Button variant="outline" className="gap-2"><Monitor className="h-4 w-4" /> Desktop</Button>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1"><Star className="h-4 w-4 text-warning fill-warning" /> 4.8 on App Store</div>
              <div className="flex items-center gap-1"><Users className="h-4 w-4" /> 2M+ Downloads</div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "SOF Reserves", value: "$4.2B", icon: Shield },
                { label: "Insurance Fund", value: "$350M", icon: Lock },
                { label: "Avg Response", value: "<30s", icon: Headphones },
                { label: "Uptime", value: "99.99%", icon: Clock },
              ].map((t, i) => (
                <div key={i} className="p-3 rounded border bg-background">
                  <t.icon className="h-4 w-4 text-muted-foreground mb-1" />
                  <p className="text-lg font-bold font-mono">{t.value}</p>
                  <p className="text-xs text-muted-foreground">{t.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-foreground text-background">
        <div className="container py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Ready to Start Trading?</h2>
          <p className="text-background/60 mb-8 max-w-lg mx-auto">
            Join 10M+ traders worldwide. Create your account in minutes and get $100 in trading bonus.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="px-10 gap-2">
                Create Free Account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/trade">
              <Button size="lg" variant="outline" className="px-10 border-background/20 text-background hover:bg-background/10">
                Explore Markets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 font-bold mb-3">
                <BarChart3 className="h-5 w-5" />
                NexTrade
              </div>
              <p className="text-xs text-muted-foreground">The world's leading cryptocurrency exchange platform.</p>
            </div>
            {[
              { title: "Products", links: ["Spot Trading", "Futures", "Earn", "Launchpad", "OTC"] },
              { title: "Services", links: ["Buy Crypto", "P2P Trading", "API", "VIP Program"] },
              { title: "Support", links: ["Help Center", "Fees", "Status", "Contact Us"] },
              { title: "Legal", links: ["Terms", "Privacy", "Compliance", "Cookies"] },
            ].map((col) => (
              <div key={col.title}>
                <p className="font-semibold text-sm mb-3">{col.title}</p>
                <div className="space-y-2">
                  {col.links.map((link) => (
                    <p key={link} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{link}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">© 2026 NexTrade. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>English</span>
              <span>USD</span>
              <span>Theme: System</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
