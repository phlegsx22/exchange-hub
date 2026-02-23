import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, Eye, EyeOff, ArrowUpRight, ArrowDownRight, TrendingUp,
  Wallet, Send, ArrowLeftRight, PieChart, ShieldCheck, Clock, Zap
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { DEFAULT_WATCHLIST, TOKENS } from "@/lib/tokens";
import { useBinanceTickers } from "@/hooks/useBinanceTickers";
import { useUserBalances } from "@/hooks/useUserBalances";
import { TokenIcon } from "@/components/TokenIcon";

const portfolioChart = Array.from({ length: 30 }, (_, i) => ({
  day: i,
  value: 0,
}));

export default function Assets() {
  const [search, setSearch] = useState("");
  const [hideSmall, setHideSmall] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const { balances } = useUserBalances(DEFAULT_WATCHLIST);
  const tickers = useBinanceTickers(DEFAULT_WATCHLIST);

  const rows = useMemo(() => {
    const base = DEFAULT_WATCHLIST.map((symbol) => {
      const meta = TOKENS[symbol];
      const total = balances[symbol] ?? 0;
      const available = total; // until we have open orders
      const inOrder = 0;
      const price = tickers[symbol]?.priceUsd ?? meta.fixedUsdPrice ?? 0;
      const changePct = tickers[symbol]?.change24hPct ?? 0;
      const value = total * price;
      return {
        symbol,
        name: meta.name,
        total,
        available,
        inOrder,
        value,
        changePct,
        up: changePct >= 0,
      };
    });
    const totalValue = base.reduce((sum, r) => sum + r.value, 0);
    return { base, totalValue };
  }, [balances, tickers]);

  const totalValue = rows.totalValue;
  const btcPrice = tickers.BTC?.priceUsd ?? TOKENS.BTC.fixedUsdPrice ?? 0;
  const btcEquivalent = btcPrice > 0 ? totalValue / btcPrice : 0;

  const filtered = rows.base.filter((a) =>
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
            <p className="text-sm text-muted-foreground font-mono">
              {showBalances ? `≈ ${btcEquivalent.toFixed(6)} BTC` : "****"}
            </p>
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              {tickers.BTC ? `${tickers.BTC.change24hPct >= 0 ? "+" : ""}${tickers.BTC.change24hPct.toFixed(2)}%` : "—"}
            </span>
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
              {rows.base.slice(0, 4).map((a) => (
                <div key={a.symbol} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{a.symbol}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-foreground" style={{ width: `${totalValue > 0 ? (a.value / totalValue * 100) : 0}%` }} />
                    </div>
                    <span className="text-muted-foreground font-mono w-8 text-right">{totalValue > 0 ? (a.value / totalValue * 100).toFixed(0) : "0"}%</span>
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
                    <TokenIcon symbol={a.symbol} size={32} />
                    <div>
                      <p className="font-semibold text-sm">{a.symbol}</p>
                      <p className="text-xs text-muted-foreground">{a.name}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right font-mono text-sm hidden md:table-cell">{showBalances ? a.total.toFixed(a.symbol === "BTC" ? 6 : 4) : "****"}</td>
                <td className="py-4 px-4 text-right font-mono text-sm hidden sm:table-cell">{showBalances ? a.available.toFixed(a.symbol === "BTC" ? 6 : 4) : "****"}</td>
                <td className="py-4 px-4 text-right font-mono text-sm hidden lg:table-cell">{showBalances ? a.inOrder.toFixed(a.symbol === "BTC" ? 6 : 4) : "****"}</td>
                <td className="py-4 px-4 text-right font-mono text-sm font-medium">{showBalances ? `$${a.value.toFixed(2)}` : "****"}</td>
                <td className={`py-4 px-4 text-right font-mono text-sm font-medium ${a.up ? "text-buy" : "text-sell"}`}>
                  <span className="inline-flex items-center gap-0.5">
                    {a.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {a.changePct >= 0 ? "+" : ""}{a.changePct.toFixed(2)}%
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
