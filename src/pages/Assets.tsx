import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const assets = [
  { symbol: "BTC", name: "Bitcoin", balance: "0.4521", available: "0.4021", inOrder: "0.0500", value: "43,963.12" },
  { symbol: "ETH", name: "Ethereum", balance: "5.230", available: "5.230", inOrder: "0.000", value: "17,845.72" },
  { symbol: "SOL", name: "Solana", balance: "120.00", available: "100.00", inOrder: "20.00", value: "23,814.00" },
  { symbol: "USDT", name: "Tether", balance: "10,500.00", available: "8,500.00", inOrder: "2,000.00", value: "10,500.00" },
  { symbol: "XRP", name: "Ripple", balance: "5,000.00", available: "5,000.00", inOrder: "0.00", value: "12,050.00" },
  { symbol: "ADA", name: "Cardano", balance: "8,200.00", available: "8,200.00", inOrder: "0.00", value: "8,052.40" },
  { symbol: "DOGE", name: "Dogecoin", balance: "15,000.00", available: "15,000.00", inOrder: "0.00", value: "4,500.00" },
];

export default function Assets() {
  const [search, setSearch] = useState("");
  const [hideSmall, setHideSmall] = useState(false);
  const [showBalances, setShowBalances] = useState(true);

  const filtered = assets.filter((a) =>
    a.symbol.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assets</h1>
        <p className="text-muted-foreground">Manage your cryptocurrency portfolio</p>
      </div>

      {/* Estimated Balance */}
      <div className="p-6 rounded-lg border bg-card">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm text-muted-foreground">Estimated Balance</p>
          <button onClick={() => setShowBalances(!showBalances)}>
            {showBalances ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>
        <p className="text-3xl font-bold font-mono">{showBalances ? "$120,725.24" : "****"}</p>
        <p className="text-sm text-muted-foreground font-mono mt-1">{showBalances ? "≈ 1.2412 BTC" : "****"}</p>
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
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Asset</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Total</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Available</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">In Order</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Value</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.symbol} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4">
                  <p className="font-semibold">{a.symbol}</p>
                  <p className="text-xs text-muted-foreground">{a.name}</p>
                </td>
                <td className="py-4 px-4 text-right font-mono text-sm hidden md:table-cell">{showBalances ? a.balance : "****"}</td>
                <td className="py-4 px-4 text-right font-mono text-sm hidden sm:table-cell">{showBalances ? a.available : "****"}</td>
                <td className="py-4 px-4 text-right font-mono text-sm hidden lg:table-cell">{showBalances ? a.inOrder : "****"}</td>
                <td className="py-4 px-4 text-right font-mono text-sm font-medium">{showBalances ? `$${a.value}` : "****"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
