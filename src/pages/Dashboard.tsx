import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight, ArrowDownRight, Wallet, Send, ArrowLeftRight, TrendingUp,
  Eye, EyeOff, PieChart, Bell, Shield, ShieldCheck, Clock, Activity,
  Zap, ChevronRight, Flame, Star, BarChart3
} from "lucide-react";
import { useState, useEffect } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

const portfolio = [
  { symbol: "BTC", name: "Bitcoin", balance: "0.4521", value: "43,963.12", change: "+2.34%", up: true, allocation: 45.7 },
  { symbol: "ETH", name: "Ethereum", balance: "5.230", value: "17,845.72", change: "+1.87%", up: true, allocation: 18.6 },
  { symbol: "SOL", name: "Solana", balance: "120.00", value: "23,814.00", change: "-0.52%", up: false, allocation: 24.8 },
  { symbol: "USDT", name: "Tether", balance: "10,500.00", value: "10,500.00", change: "0.00%", up: true, allocation: 10.9 },
];

const activity = [
  { type: "Buy", asset: "BTC", amount: "0.05 BTC", time: "2 hours ago", value: "$4,862.27" },
  { type: "Sell", asset: "ETH", amount: "2.0 ETH", time: "5 hours ago", value: "$6,824.36" },
  { type: "Transfer", asset: "USDT", amount: "1,000 USDT", time: "1 day ago", value: "$1,000.00" },
  { type: "Withdraw", asset: "SOL", amount: "10 SOL", time: "2 days ago", value: "$1,984.50" },
  { type: "Buy", asset: "DOGE", amount: "5,000 DOGE", time: "3 days ago", value: "$1,710.00" },
];

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
  const [totalValue, setTotalValue] = useState(96122.84);
  const [onlineCount, setOnlineCount] = useState(48293);

  useEffect(() => {
    const t1 = setInterval(() => {
      setTotalValue(prev => prev + (Math.random() - 0.48) * 100);
    }, 3000);
    const t2 = setInterval(() => setOnlineCount(prev => prev + Math.floor((Math.random() - 0.45) * 30)), 5000);
    return () => { clearInterval(t1); clearInterval(t2); };
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
              <ArrowUpRight className="h-3.5 w-3.5" /> +$2,341.56 (2.49%) today
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
          <Button variant="outline" size="sm" className="gap-1.5"><Bell className="h-3.5 w-3.5" /> Alerts</Button>
          <Button variant="outline" size="sm" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Security</Button>
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
              { label: "Deposit", icon: Wallet, path: "/assets", color: "text-buy" },
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
              {portfolio.map((asset) => (
                <tr key={asset.symbol} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {asset.symbol.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{asset.symbol}</p>
                        <p className="text-xs text-muted-foreground">{asset.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-sm hidden sm:table-cell">{showBalances ? asset.balance : "****"}</td>
                  <td className="py-4 px-4 text-right font-mono text-sm font-medium">{showBalances ? `$${asset.value}` : "****"}</td>
                  <td className={`py-4 px-4 text-right font-mono text-sm font-medium ${asset.up ? "text-buy" : "text-sell"}`}>
                    <span className="inline-flex items-center gap-0.5">
                      {asset.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {asset.change}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right hidden md:table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-foreground" style={{ width: `${asset.allocation}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono w-10">{asset.allocation}%</span>
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
        <div className="space-y-2">
          {activity.map((a, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                  a.type === "Buy" ? "bg-buy/10" : a.type === "Sell" ? "bg-sell/10" : "bg-muted"
                }`}>
                  {a.type === "Buy" ? <ArrowDownRight className="h-4 w-4 text-buy" /> :
                   a.type === "Sell" ? <ArrowUpRight className="h-4 w-4 text-sell" /> :
                   a.type === "Transfer" ? <ArrowLeftRight className="h-4 w-4" /> :
                   <Send className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-medium text-sm">{a.type} {a.asset}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-medium">{a.value}</p>
                <p className="text-xs text-muted-foreground font-mono">{a.amount}</p>
              </div>
            </div>
          ))}
        </div>
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
