import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BinanceTicker } from "@/components/BinanceTicker";
import {
  ArrowRight, Shield, Zap, TrendingUp, BarChart3, Lock, Globe,
  ArrowUpRight, ArrowDownRight, Smartphone, Apple, Monitor,
  Users, Award, Clock, Flame, Star, ChevronRight, Bell,
  Wallet, CreditCard, Building2, Gift, BookOpen, Headphones,
  Activity, CircleDollarSign, Layers, Eye, ShieldCheck, FileCheck,
  Sparkles, Radio, BadgeCheck, Trophy, Target, Cpu, Banknote,
  PieChart, Landmark, Megaphone, Newspaper, TrendingDown,
  ArrowLeftRight, Timer, Fingerprint, ScanLine
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Bar, BarChart } from "recharts";
import { useEffect, useState, useCallback, useRef } from "react";

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
  { title: "NexTrade Launchpool: Farm PYTH with BTC & USDT", tag: "New", time: "2h ago", icon: Sparkles },
  { title: "Zero-Fee Trading Event for SOL/USDT Pair", tag: "Promo", time: "4h ago", icon: Gift },
  { title: "System Upgrade: Matching Engine v3.2", tag: "System", time: "8h ago", icon: Cpu },
  { title: "New Margin Pairs Added: 15 New Trading Pairs", tag: "Update", time: "1d ago", icon: Layers },
  { title: "Refer & Earn: Up to 40% Commission", tag: "Promo", time: "2d ago", icon: Megaphone },
];

const features = [
  { icon: Zap, title: "Lightning Fast", desc: "Execute trades in milliseconds with our high-performance matching engine.", stat: "100K TPS" },
  { icon: Shield, title: "Bank-Grade Security", desc: "Multi-layer security with cold storage, 2FA, and real-time monitoring.", stat: "$350M insured" },
  { icon: TrendingUp, title: "Advanced Trading", desc: "Spot, margin, and futures trading with professional charting tools.", stat: "125x leverage" },
  { icon: Lock, title: "Regulated", desc: "Fully compliant with global regulations and licensed in 30+ jurisdictions.", stat: "30+ licenses" },
  { icon: Globe, title: "Global Access", desc: "Trade from anywhere, 24/7 with multi-language and multi-currency support.", stat: "180+ countries" },
  { icon: BarChart3, title: "Deep Liquidity", desc: "Access deep order books and tight spreads across all trading pairs.", stat: "$2.4B daily" },
];

const volumeData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  volume: 1.2 + Math.random() * 2.5 + (i > 20 ? 1 : 0),
  users: 80000 + Math.floor(Math.random() * 40000) + i * 1000,
}));

const barVolumeData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  buy: Math.floor(Math.random() * 500 + 300),
  sell: Math.floor(Math.random() * 400 + 200),
}));

// Simulated live trade feed
const tradeSymbols = ["BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "AVAX", "LINK", "DOT", "MATIC", "BNB", "UNI"];
const generateTrade = () => {
  const symbol = tradeSymbols[Math.floor(Math.random() * tradeSymbols.length)];
  const isBuy = Math.random() > 0.45;
  const amounts = { BTC: [0.01, 2], ETH: [0.1, 15], SOL: [1, 100], XRP: [100, 50000], DOGE: [1000, 500000], ADA: [100, 50000], AVAX: [1, 200], LINK: [10, 2000], DOT: [10, 3000], MATIC: [100, 50000], BNB: [0.1, 20], UNI: [10, 2000] };
  const [min, max] = amounts[symbol as keyof typeof amounts] || [1, 100];
  const amount = (min + Math.random() * (max - min)).toFixed(symbol === "BTC" ? 4 : symbol === "ETH" ? 3 : 2);
  const prices: Record<string, number> = { BTC: 97245, ETH: 3412, SOL: 198, XRP: 2.41, DOGE: 0.342, ADA: 0.982, AVAX: 42, LINK: 18.3, DOT: 8.94, MATIC: 1.24, BNB: 612, UNI: 12.87 };
  const price = (prices[symbol]! * (1 + (Math.random() - 0.5) * 0.002)).toFixed(2);
  const value = (parseFloat(amount) * parseFloat(price));
  return { symbol, side: isBuy ? "BUY" : "SELL", amount, price, value, time: new Date() };
};

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 2000, prefix = "", suffix = "") {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const inc = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += inc;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { ref, display: `${prefix}${count.toLocaleString()}${suffix}` };
}

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

// Live trade feed component
function LiveTradeFeed() {
  const [trades, setTrades] = useState(() => Array.from({ length: 8 }, generateTrade));

  useEffect(() => {
    const interval = setInterval(() => {
      setTrades(prev => [generateTrade(), ...prev.slice(0, 7)]);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-1">
      {trades.map((t, i) => (
        <div
          key={`${t.time.getTime()}-${i}`}
          className={`flex items-center justify-between text-xs px-3 py-1.5 rounded transition-all ${
            i === 0 ? "bg-muted/60 animate-[fade-in_0.3s_ease-out]" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${t.side === "BUY" ? "bg-buy" : "bg-sell"}`} />
            <span className={`font-semibold ${t.side === "BUY" ? "text-buy" : "text-sell"}`}>{t.side}</span>
            <span className="font-medium">{t.symbol}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-muted-foreground">{t.amount}</span>
            <span className="font-mono">${t.value >= 1000 ? `${(t.value / 1000).toFixed(1)}K` : t.value.toFixed(0)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Live activity pulse
function ActivityPulse() {
  const [activeUsers, setActiveUsers] = useState(48293);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor((Math.random() - 0.45) * 50));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-buy opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-buy" />
      </span>
      <span className="font-mono">{activeUsers.toLocaleString()}</span> traders online
    </div>
  );
}

// Fear & Greed gauge
function FearGreedGauge() {
  const value = 72; // "Greed"
  const label = value > 75 ? "Extreme Greed" : value > 55 ? "Greed" : value > 45 ? "Neutral" : value > 25 ? "Fear" : "Extreme Fear";
  const color = value > 55 ? "text-buy" : value > 45 ? "text-warning" : "text-sell";
  
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4" />
        <p className="font-semibold text-sm">Fear & Greed Index</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16">
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--buy))" strokeWidth="3" strokeDasharray={`${value}, 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold font-mono">{value}</span>
          </div>
        </div>
        <div>
          <p className={`font-semibold ${color}`}>{label}</p>
          <p className="text-xs text-muted-foreground">Market sentiment indicator</p>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [btcPrice, setBtcPrice] = useState(97245.30);
  const [tradeCount, setTradeCount] = useState(1284523);

  useEffect(() => {
    const interval = setInterval(() => {
      setBtcPrice(prev => prev + (Math.random() - 0.48) * 50);
      setTradeCount(prev => prev + Math.floor(Math.random() * 15 + 5));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const vol = useAnimatedCounter(24, 2000, "$", "B+");
  const assets = useAnimatedCounter(350, 1500, "", "+");
  const userCount = useAnimatedCounter(10, 2000, "", "M+");
  const countries = useAnimatedCounter(180, 1800, "", "+");
  const tps = useAnimatedCounter(100, 1500, "", "K+");
  const uptime = useAnimatedCounter(99, 1000, "", ".99%");

  return (
    <div className="min-h-screen">
      {/* Ticker Tape */}
      <BinanceTicker theme="dark" transparent={false} />

      {/* Live Activity Bar */}
      <div className="border-b bg-muted/30">
        <div className="container flex items-center justify-between py-1.5 text-xs">
          <div className="flex items-center gap-4">
            <ActivityPulse />
            <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
              <Radio className="h-3 w-3 text-sell animate-pulse" />
              <span className="font-mono">{tradeCount.toLocaleString()}</span> trades today
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-buy" />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero + Side Widgets */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--muted))_0%,transparent_70%)]" />
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        <div className="container relative py-12 md:py-20">
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Hero Left */}
            <div className="lg:col-span-3 pt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-buy opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-buy" />
                  </span>
                  Markets are live — 350+ pairs trading
                </div>
                <div className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/5 px-3 py-1.5 text-xs text-warning">
                  <Trophy className="h-3 w-3" />
                  #1 Exchange by Volume
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
                Trade Crypto with
                <br />
                <span className="text-muted-foreground">Confidence</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mb-8">
                The most trusted cryptocurrency exchange. Buy, sell, and trade 350+ digital assets with industry-leading security and <span className="text-foreground font-medium">zero hidden fees</span>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link to="/register">
                  <Button size="lg" className="text-base px-8 gap-2">
                    Get Started Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/trade">
                  <Button size="lg" variant="outline" className="text-base px-8 gap-2">
                    <Eye className="h-4 w-4" /> View Markets
                  </Button>
                </Link>
              </div>
              {/* Quick buy widget */}
              <div className="rounded-lg border bg-card p-4 max-w-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Quick Buy</p>
                  <div className="flex items-center gap-1 text-[10px] text-buy">
                    <Zap className="h-3 w-3" /> Instant
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded border bg-background px-3 py-2 text-sm font-mono">100.00 USD</div>
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0" />
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

              {/* Live Trade Feed */}
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-buy opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-buy" />
                    </span>
                    <p className="font-semibold text-sm">Live Trades</p>
                  </div>
                  <Link to="/trade" className="text-xs text-muted-foreground hover:underline">Open Terminal</Link>
                </div>
                <LiveTradeFeed />
              </div>

              {/* New Listings */}
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="h-4 w-4 text-sell" />
                  <p className="font-semibold text-sm">New Listings</p>
                  <span className="ml-auto px-1.5 py-0.5 rounded-full bg-sell/10 text-sell text-[10px] font-bold">HOT</span>
                </div>
                <div className="space-y-2">
                  {newListings.map((n, i) => (
                    <div key={i} className="flex items-center justify-between text-sm group cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded transition-colors">
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

      {/* Stats Bar - Animated Counters */}
      <section className="border-y bg-card">
        <div className="container grid grid-cols-3 md:grid-cols-6 divide-x">
          {[
            { ...vol, label: "24h Volume", icon: CircleDollarSign },
            { ...assets, label: "Supported Assets", icon: Layers },
            { ...userCount, label: "Users Worldwide", icon: Users },
            { ...countries, label: "Countries", icon: Globe },
            { ...tps, label: "Trades/Second", icon: Zap },
            { ...uptime, label: "Uptime", icon: ShieldCheck },
          ].map((stat) => (
            <div key={stat.label} ref={stat.ref} className="py-6 text-center group">
              <stat.icon className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <p className="text-lg md:text-2xl font-bold font-mono">{stat.display}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Announcements Banner */}
      <section className="border-b bg-muted/20">
        <div className="container py-6">
          <div className="flex items-center gap-3 mb-4">
            <Megaphone className="h-5 w-5" />
            <h2 className="text-lg font-bold">Latest Announcements</h2>
            <span className="ml-auto text-xs text-muted-foreground cursor-pointer hover:underline flex items-center gap-1">View All <ChevronRight className="h-3 w-3" /></span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {announcements.slice(0, 3).map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer group">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  a.tag === "New" ? "bg-buy/10 text-buy" :
                  a.tag === "Promo" ? "bg-warning/10 text-warning" :
                  "bg-muted text-muted-foreground"
                }`}>
                  <a.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium group-hover:underline line-clamp-2">{a.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      a.tag === "New" ? "bg-buy/10 text-buy" :
                      a.tag === "Promo" ? "bg-warning/10 text-warning" :
                      "bg-muted text-muted-foreground"
                    }`}>{a.tag}</span>
                    <span className="text-xs text-muted-foreground">{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hot Markets with Sparklines + Gainers/Losers + Fear & Greed */}
      <section className="container py-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Hot Markets Table */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-sell" />
                <h2 className="text-xl font-bold">Hot Markets</h2>
                <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Updated live</span>
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

          {/* Gainers, Losers, Fear & Greed */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight className="h-4 w-4 text-buy" />
                <h3 className="font-semibold text-sm">Top Gainers</h3>
              </div>
              <div className="space-y-2.5">
                {topGainers.map((g, i) => (
                  <div key={i} className="flex items-center justify-between text-sm hover:bg-muted/30 -mx-2 px-2 py-0.5 rounded cursor-pointer transition-colors">
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
                  <div key={i} className="flex items-center justify-between text-sm hover:bg-muted/30 -mx-2 px-2 py-0.5 rounded cursor-pointer transition-colors">
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

            {/* Fear & Greed Index */}
            <FearGreedGauge />
          </div>
        </div>
      </section>

      {/* Buy/Sell Volume Chart */}
      <section className="border-y bg-card">
        <div className="container py-12">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* 24h Buy/Sell Volume */}
            <div className="rounded-lg border bg-background p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">24h Trading Activity</h3>
                  <p className="text-sm text-muted-foreground">Buy vs Sell volume by hour</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-buy" /> Buys</div>
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sell" /> Sells</div>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barVolumeData}>
                    <Bar dataKey="buy" fill="hsl(142,71%,45%)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="sell" fill="hsl(0,72%,51%)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Market Overview */}
            <div className="rounded-lg border bg-background p-6">
              <h3 className="text-lg font-bold mb-1">30-Day Volume Trend</h3>
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
          </div>
        </div>
      </section>

      {/* Services / Products Grid */}
      <section className="bg-background">
        <div className="container py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Explore Products</h2>
            <p className="text-muted-foreground text-sm">Everything you need to trade, earn, and grow your portfolio</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: BarChart3, title: "Spot Trading", desc: "Buy & sell 350+ coins", badge: "Popular" },
              { icon: TrendingUp, title: "Futures", desc: "Up to 125x leverage", badge: "Pro" },
              { icon: Wallet, title: "Earn", desc: "Up to 12% APY", badge: "Earn" },
              { icon: CreditCard, title: "Buy Crypto", desc: "Visa, Mastercard, Apple Pay", badge: null },
              { icon: Gift, title: "Launchpad", desc: "New token offerings", badge: "New" },
              { icon: Building2, title: "OTC Desk", desc: "Large volume trades", badge: null },
              { icon: BookOpen, title: "Academy", desc: "Learn crypto trading", badge: "Free" },
              { icon: Award, title: "VIP Program", desc: "Reduced fees & perks", badge: null },
            ].map((p, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group relative">
                {p.badge && (
                  <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    p.badge === "New" ? "bg-sell/10 text-sell" :
                    p.badge === "Popular" ? "bg-buy/10 text-buy" :
                    p.badge === "Pro" ? "bg-foreground/10 text-foreground" :
                    p.badge === "Earn" ? "bg-buy/10 text-buy" :
                    "bg-muted text-muted-foreground"
                  }`}>{p.badge}</span>
                )}
                <p.icon className="h-6 w-6 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-sm">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="border-y bg-card">
        <div className="container py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Security First</h2>
            <p className="text-muted-foreground text-sm">Your assets are protected by industry-leading security measures</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Cold Storage", desc: "95% of assets stored offline in air-gapped cold wallets", stat: "95%" },
              { icon: Fingerprint, title: "Biometric Auth", desc: "Face ID, Touch ID, and hardware security key support", stat: "2FA" },
              { icon: ScanLine, title: "Real-time Monitoring", desc: "24/7 AI-powered threat detection and anomaly monitoring", stat: "24/7" },
              { icon: FileCheck, title: "Proof of Reserves", desc: "Verifiable on-chain proof of reserves, audited monthly", stat: "1:1" },
            ].map((s, i) => (
              <div key={i} className="text-center p-4 rounded-lg border bg-background">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <s.icon className="h-6 w-6" />
                </div>
                <p className="text-xl font-bold font-mono mb-1">{s.stat}</p>
                <p className="font-semibold text-sm mb-1">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t">
            {[
              { icon: BadgeCheck, label: "SOC 2 Certified" },
              { icon: ShieldCheck, label: "ISO 27001" },
              { icon: Lock, label: "PCI DSS" },
              { icon: FileCheck, label: "GDPR Compliant" },
              { icon: Landmark, label: "Licensed in 30+" },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <c.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works + Announcements */}
      <section className="container py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* How it Works */}
          <div>
            <h3 className="text-lg font-bold mb-6">Start Trading in 3 Steps</h3>
            <div className="space-y-6">
              {[
                { step: "01", title: "Create Account", desc: "Sign up with email in under 60 seconds. No minimums required.", icon: Users },
                { step: "02", title: "Verify Identity", desc: "Complete KYC verification to unlock full trading features.", icon: Shield },
                { step: "03", title: "Start Trading", desc: "Deposit funds and trade 350+ crypto assets instantly.", icon: TrendingUp },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-4 group">
                  <div className="h-10 w-10 rounded-lg bg-foreground text-background flex items-center justify-center text-sm font-bold font-mono shrink-0 group-hover:scale-110 transition-transform">
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

          {/* More Announcements */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                <h3 className="text-lg font-bold">News & Updates</h3>
              </div>
            </div>
            <div className="space-y-3">
              {announcements.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-all cursor-pointer group">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    a.tag === "New" ? "bg-buy/10 text-buy" :
                    a.tag === "Promo" ? "bg-warning/10 text-warning" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    <a.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium group-hover:underline line-clamp-1">{a.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        a.tag === "New" ? "bg-buy/10 text-buy" :
                        a.tag === "Promo" ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>{a.tag}</span>
                      <span className="text-xs text-muted-foreground">{a.time}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
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
              <div key={f.title} className="p-5 rounded-lg border bg-background hover:shadow-md hover:-translate-y-0.5 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{f.stat}</span>
                </div>
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
            <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground mb-4">
              <Smartphone className="h-3 w-3" /> Available on all platforms
            </div>
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
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Trust Indicators</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "SOF Reserves", value: "$4.2B", icon: Shield },
                { label: "Insurance Fund", value: "$350M", icon: Lock },
                { label: "Avg Response", value: "<30s", icon: Headphones },
                { label: "Uptime", value: "99.99%", icon: Clock },
              ].map((t, i) => (
                <div key={i} className="p-3 rounded border bg-background hover:shadow-sm transition-shadow">
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
        <div className="container py-16 text-center relative overflow-hidden">
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-background/20 px-4 py-1.5 text-sm text-background/60 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Limited time: $100 bonus for new users
            </div>
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
              <p className="text-xs text-muted-foreground mb-3">The world's leading cryptocurrency exchange platform.</p>
              <ActivityPulse />
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
