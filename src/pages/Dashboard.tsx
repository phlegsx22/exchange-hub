import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Wallet, Send, ArrowLeftRight, TrendingUp } from "lucide-react";

const portfolio = [
  { symbol: "BTC", name: "Bitcoin", balance: "0.4521", value: "43,963.12", change: "+2.34%", up: true },
  { symbol: "ETH", name: "Ethereum", balance: "5.230", value: "17,845.72", change: "+1.87%", up: true },
  { symbol: "SOL", name: "Solana", balance: "120.00", value: "23,814.00", change: "-0.52%", up: false },
  { symbol: "USDT", name: "Tether", balance: "10,500.00", value: "10,500.00", change: "0.00%", up: true },
];

const activity = [
  { type: "Buy", asset: "BTC", amount: "0.05 BTC", time: "2 hours ago", value: "$4,862.27" },
  { type: "Sell", asset: "ETH", amount: "2.0 ETH", time: "5 hours ago", value: "$6,824.36" },
  { type: "Transfer", asset: "USDT", amount: "1,000 USDT", time: "1 day ago", value: "$1,000.00" },
  { type: "Withdraw", asset: "SOL", amount: "10 SOL", time: "2 days ago", value: "$1,984.50" },
];

export default function Dashboard() {
  const totalValue = "96,122.84";

  return (
    <div className="container py-8 space-y-8">
      {/* Portfolio Overview */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
        <h1 className="text-4xl font-bold font-mono">${totalValue}</h1>
        <p className="text-buy text-sm font-medium font-mono mt-1">+$2,341.56 (2.49%) today</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Deposit", icon: Wallet, path: "/assets" },
          { label: "Withdraw", icon: Send, path: "/withdraw" },
          { label: "Transfer", icon: ArrowLeftRight, path: "/transfer" },
          { label: "Trade", icon: TrendingUp, path: "/trade" },
        ].map((action) => (
          <Link key={action.label} to={action.path}>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
              <action.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Holdings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Holdings</h2>
          <Link to="/assets"><Button variant="outline" size="sm">View All</Button></Link>
        </div>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Asset</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Balance</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Value</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">24h</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((asset) => (
                <tr key={asset.symbol} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4">
                    <p className="font-semibold">{asset.symbol}</p>
                    <p className="text-xs text-muted-foreground">{asset.name}</p>
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-sm hidden sm:table-cell">{asset.balance}</td>
                  <td className="py-4 px-4 text-right font-mono text-sm">${asset.value}</td>
                  <td className={`py-4 px-4 text-right font-mono text-sm font-medium ${asset.up ? "text-buy" : "text-sell"}`}>
                    {asset.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {activity.map((a, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  a.type === "Buy" ? "bg-buy/10" : a.type === "Sell" ? "bg-sell/10" : "bg-muted"
                }`}>
                  {a.type === "Buy" ? <ArrowDownRight className="h-4 w-4 text-buy" /> : <ArrowUpRight className="h-4 w-4 text-sell" />}
                </div>
                <div>
                  <p className="font-medium text-sm">{a.type} {a.asset}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">{a.value}</p>
                <p className="text-xs text-muted-foreground">{a.amount}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
