import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, Eye, EyeOff, ArrowUpRight, ArrowDownRight, TrendingUp,
  Wallet, Send, ArrowLeftRight, PieChart, ShieldCheck, Clock, Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

const assets = [
  { symbol: "BTC", name: "Bitcoin", balance: "0.4521", available: "0.4021", inOrder: "0.0500", value: "43,963.12", change: "+2.34%", up: true },
  { symbol: "ETH", name: "Ethereum", balance: "5.230", available: "5.230", inOrder: "0.000", value: "17,845.72", change: "+1.87%", up: true },
  { symbol: "SOL", name: "Solana", balance: "120.00", available: "100.00", inOrder: "20.00", value: "23,814.00", change: "-0.52%", up: false },
  { symbol: "USDT", name: "Tether", balance: "10,500.00", available: "8,500.00", inOrder: "2,000.00", value: "10,500.00", change: "0.00%", up: true },
  { symbol: "XRP", name: "Ripple", balance: "5,000.00", available: "5,000.00", inOrder: "0.00", value: "12,050.00", change: "+5.12%", up: true },
  { symbol: "ADA", name: "Cardano", balance: "8,200.00", available: "8,200.00", inOrder: "0.00", value: "8,052.40", change: "-1.23%", up: false },
  { symbol: "DOGE", name: "Dogecoin", balance: "15,000.00", available: "15,000.00", inOrder: "0.00", value: "4,500.00", change: "+8.45%", up: true },
];

const portfolioChart = Array.from({ length: 30 }, (_, i) => ({
  day: i,
  value: 110000 + Math.sin(i * 0.3) * 5000 + i * 350 + Math.random() * 2000,
}));

export default function Assets() {
  const [search, setSearch] = useState("");
  const [hideSmall, setHideSmall] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [totalValue, setTotalValue] = useState(120725.24);

  useEffect(() => {
    const interval = setInterval(() => {
      setTotalValue(prev => prev + (Math.random() - 0.48) * 80);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = assets.filter((a) =>
    a.symbol.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="text-muted-foreground text-sm">Manage your cryptocurrency portfolio</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/withdraw"><Button variant="outline" size="sm" className="gap-1.5"><Send className="h-3.5 w-3.5" /> Withdraw</Button></Link>
          <Link to="/transfer"><Button variant="outline" size="sm" className="gap-1.5"><ArrowLeftRight className="h-3.5 w-3.5" /> Transfer</Button></Link>
        </div>
      </div>

      {/* Balance + Chart */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-6 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-muted-foreground">Estimated Balance</p>
            <button onClick={() => setShowBalances(!showBalances)}>
              {showBalances ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
          <p className="text-3xl font-bold font-mono">
            {showBalances ? `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "****"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground font-mono">{showBalances ? "≈ 1.2412 BTC" : "****"}</p>
            <span className="text-xs text-buy font-mono flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" />+2.49%</span>
          </div>
          <div className="h-24 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioChart}>
                <defs>
                  <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142,71%,45%)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(142,71%,45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="hsl(142,71%,45%)" fill="url(#assetGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick actions + allocation */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Wallet, label: "Deposit", path: "/assets" },
              { icon: Send, label: "Withdraw", path: "/withdraw" },
              { icon: ArrowLeftRight, label: "Transfer", path: "/transfer" },
              { icon: TrendingUp, label: "Trade", path: "/trade" },
            ].map((a) => (
              <Link key={a.label} to={a.path}>
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg border hover:bg-muted/50 hover:-translate-y-0.5 transition-all cursor-pointer group">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
                    <a.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium">{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <PieChart className="h-4 w-4" />
              <span className="text-xs font-semibold">Top Allocation</span>
            </div>
            <div className="space-y-2">
              {assets.slice(0, 4).map((a) => (
                <div key={a.symbol} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{a.symbol}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-foreground" style={{ width: `${(parseFloat(a.value.replace(/,/g, '')) / totalValue * 100)}%` }} />
                    </div>
                    <span className="text-muted-foreground font-mono w-8 text-right">{(parseFloat(a.value.replace(/,/g, '')) / totalValue * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant={hideSmall ? "default" : "outline"} size="sm" onClick={() => setHideSmall(!hideSmall)}>
          Hide small balances
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Asset</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Total</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Available</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">In Order</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Value</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">24h</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.symbol} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {a.symbol.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{a.symbol}</p>
                      <p className="text-xs text-muted-foreground">{a.name}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right font-mono text-sm hidden md:table-cell">{showBalances ? a.balance : "****"}</td>
                <td className="py-4 px-4 text-right font-mono text-sm hidden sm:table-cell">{showBalances ? a.available : "****"}</td>
                <td className="py-4 px-4 text-right font-mono text-sm hidden lg:table-cell">{showBalances ? a.inOrder : "****"}</td>
                <td className="py-4 px-4 text-right font-mono text-sm font-medium">{showBalances ? `$${a.value}` : "****"}</td>
                <td className={`py-4 px-4 text-right font-mono text-sm font-medium ${a.up ? "text-buy" : "text-sell"}`}>
                  <span className="inline-flex items-center gap-0.5">
                    {a.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {a.change}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom status */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground rounded-lg border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-buy opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-buy" />
            </span>
            Prices updating live
          </div>
          <div className="hidden sm:flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-buy" /> Funds are SAFU</div>
        </div>
        <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> Updated just now</div>
      </div>
    </div>
  );
}
