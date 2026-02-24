import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight, ArrowDownRight, Wallet, Send, ArrowLeftRight, TrendingUp,
  Eye, EyeOff, PieChart, Bell, Shield, ShieldCheck, Clock, Activity,
  Zap, ChevronRight, Flame, Star, BarChart3, Copy
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { DEFAULT_WATCHLIST, TOKENS } from "@/lib/tokens";
import { TokenIcon } from "@/components/TokenIcon";
import { useBinanceTickers } from "@/hooks/useBinanceTickers";
import { useUserBalances } from "@/hooks/useUserBalances";
import { useRecentActivity } from "@/hooks/useRecentActivity";

const portfolioChart = Array.from({ length: 30 }, (_, i) => ({
  day: i,
  value: 88000 + Math.sin(i * 0.3) * 3000 + i * 250 + Math.random() * 1500,
}));

const notifications = [
  { text: "BTC up 2.34% in the last 24h", time: "5m ago", type: "price" },
  { text: "Your limit order for ETH was filled", time: "2h ago", type: "order" },
  { text: "Security: New login from Chrome on Mac", time: "1d ago", type: "security" },
];

export default function Dashboard() {
  const [showBalances, setShowBalances] = useState(true);
  const { balances } = useUserBalances(DEFAULT_WATCHLIST);
  const tickers = useBinanceTickers(DEFAULT_WATCHLIST);
  const recent = useRecentActivity(10);

  function formatRelative(iso: string): string {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    if (!Number.isFinite(diffMs)) return "—";
    const s = Math.floor(diffMs / 1000);
    if (s < 10) return "just now";
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    return `${days}d ago`;
  }

  const activityRows = useMemo(() => {
    const items = recent.data ?? [];
    return items.map((it) => {
      const amountNum = Math.abs(Number.parseFloat(it.amount));
      const price =
        tickers[it.assetSymbol]?.priceUsd ?? TOKENS[it.assetSymbol as keyof typeof TOKENS]?.fixedUsdPrice ?? 0;
      const valueUsd = price > 0 && Number.isFinite(amountNum) ? amountNum * price : null;

      const label =
        it.type === "deposit"
          ? "Deposit"
          : it.type === "withdrawal"
            ? "Withdraw"
            : it.type === "trade"
              ? "Trade"
              : it.type === "transfer"
                ? "Transfer"
                : it.type === "fee"
                  ? "Fee"
                  : "Adjustment";

      return {
        id: it.id,
        label,
        type: it.type,
        direction: it.direction,
        asset: it.assetSymbol,
        chain: it.chainName,
        time: formatRelative(it.createdAt),
        amountText: `${amountNum.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${it.assetSymbol}`,
        valueText: valueUsd === null ? "—" : `$${valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      };
    });
  }, [recent.data, tickers]);
  const holdings = useMemo(() => {
    const rows = DEFAULT_WATCHLIST.map((symbol) => {
      const meta = TOKENS[symbol];
      const bal = balances[symbol] ?? 0;
      const price = tickers[symbol]?.priceUsd ?? meta.fixedUsdPrice ?? 0;
      const changePct = tickers[symbol]?.change24hPct ?? 0;
      const value = bal * price;
      return { symbol, name: meta.name, balance: bal, price, value, changePct };
    });
    const total = rows.reduce((sum, r) => sum + r.value, 0);
    return {
      totalValue: total,
      rows: rows.map((r) => ({
        ...r,
        allocation: total > 0 ? (r.value / total) * 100 : 0,
        up: r.changePct >= 0,
      })),
    };
  }, [balances, tickers]);

  const totalValue = holdings.totalValue;
  const [onlineCount, setOnlineCount] = useState(48293);

  useEffect(() => {
    const t2 = setInterval(() => setOnlineCount(prev => prev + Math.floor((Math.random() - 0.45) * 30)), 5000);
    return () => { clearInterval(t2); };
  }, []);

  return (
    <div className="container py-8 space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
            <button onClick={() => setShowBalances(!showBalances)}>
              {showBalances ? <Eye className="h-3.5 w-3.5 text-muted-foreground" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-mono">
            {showBalances ? `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "****"}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-buy text-sm font-medium font-mono flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5" /> {totalValue === 0 ? "$0.00 (0.00%) today" : "—"}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-buy opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-buy" />
              </span>
              {onlineCount.toLocaleString()} traders online
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Link to="/settings">
            <Button variant="outline" size="sm" className="gap-1.5">Settings</Button>
          </Link>
          <Link to="/security">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" /> 2FA
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-1.5"><Bell className="h-3.5 w-3.5" /> Alerts</Button>
        </div>
      </div>

      {/* Portfolio Chart + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Portfolio Performance (30d)</h3>
            <div className="flex items-center gap-1 text-xs text-buy">
              <TrendingUp className="h-3 w-3" /> +8.2%
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioChart}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142,71%,45%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(142,71%,45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="hsl(142,71%,45%)" fill="url(#portfolioGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Deposit", icon: Wallet, path: "/deposit", color: "text-buy" },
              { label: "Withdraw", icon: Send, path: "/withdraw", color: "text-sell" },
              { label: "Transfer", icon: ArrowLeftRight, path: "/transfer", color: "text-foreground" },
              { label: "Trade", icon: TrendingUp, path: "/trade", color: "text-foreground" },
            ].map((action) => (
              <Link key={action.label} to={action.path}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 hover:-translate-y-0.5 transition-all cursor-pointer group">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
          {/* Notifications */}
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Bell className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Notifications</span>
              <span className="ml-auto h-4 w-4 rounded-full bg-sell text-background text-[10px] font-bold flex items-center justify-center">3</span>
            </div>
            <div className="space-y-2">
              {notifications.map((n, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${
                    n.type === "price" ? "bg-buy" : n.type === "order" ? "bg-warning" : "bg-sell"
                  }`} />
                  <div className="min-w-0">
                    <p className="line-clamp-1">{n.text}</p>
                    <p className="text-muted-foreground">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Holdings</h2>
          </div>
          <Link to="/assets"><Button variant="outline" size="sm" className="gap-1 text-xs">View All <ChevronRight className="h-3 w-3" /></Button></Link>
        </div>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Asset</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Balance</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Value</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">24h</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {holdings.rows.map((asset) => (
                <tr key={asset.symbol} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={asset.symbol} size={32} />
                      <div>
                        <p className="font-semibold text-sm">{asset.symbol}</p>
                        <p className="text-xs text-muted-foreground">{asset.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-sm hidden sm:table-cell">
                    {showBalances ? asset.balance.toFixed(asset.symbol === "BTC" ? 6 : 4) : "****"}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-sm font-medium">
                    {showBalances ? `$${asset.value.toFixed(2)}` : "****"}
                  </td>
                  <td className={`py-4 px-4 text-right font-mono text-sm font-medium ${asset.up ? "text-buy" : "text-sell"}`}>
                    <span className="inline-flex items-center gap-0.5">
                      {asset.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {asset.changePct >= 0 ? "+" : ""}{asset.changePct.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right hidden md:table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-foreground" style={{ width: `${asset.allocation}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono w-10">{asset.allocation.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
        </div>
        {recent.isLoading ? (
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm font-medium">Loading activity…</p>
            <p className="mt-1 text-xs text-muted-foreground">Fetching your latest account events.</p>
          </div>
        ) : activityRows.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-sm font-medium">No activity yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Deposits, trades, transfers, and withdrawals will appear here.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
              <Link to="/deposit">
                <Button size="sm" className="gap-1.5">
                  <Wallet className="h-3.5 w-3.5" /> Make a deposit
                </Button>
              </Link>
              <Link to="/trade">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Start trading
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {activityRows.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                    a.type === "deposit" ? "bg-buy/10" : a.type === "withdrawal" ? "bg-sell/10" : "bg-muted"
                  }`}>
                    {a.type === "deposit" ? <ArrowDownRight className="h-4 w-4 text-buy" /> :
                     a.type === "withdrawal" ? <ArrowUpRight className="h-4 w-4 text-sell" /> :
                     a.type === "transfer" ? <ArrowLeftRight className="h-4 w-4" /> :
                     a.type === "trade" ? <TrendingUp className="h-4 w-4" /> :
                     <Send className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{a.label} {a.asset}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-medium">{a.valueText}</p>
                  <p className="text-xs text-muted-foreground font-mono">{a.amountText}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="rounded-lg border bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-buy opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-buy" />
            </span>
            Markets live
          </div>
          <div className="hidden sm:flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-buy" /> All systems operational</div>
          <div className="hidden sm:flex items-center gap-1"><Clock className="h-3 w-3" /> Last updated: just now</div>
        </div>
        <Link to="/trade">
          <Button size="sm" className="gap-1 text-xs">
            <Zap className="h-3 w-3" /> Quick Trade
          </Button>
        </Link>
      </div>
    </div>
  );
}
