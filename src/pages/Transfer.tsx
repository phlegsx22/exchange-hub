import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, Zap, ShieldCheck, Clock, Info, ArrowRight } from "lucide-react";

const recentTransfers = [
  { from: "Spot", to: "Margin", coin: "USDT", amount: "2,000.00", time: "2h ago" },
  { from: "Funding", to: "Spot", coin: "BTC", amount: "0.15", time: "1d ago" },
  { from: "Spot", to: "Funding", coin: "ETH", amount: "3.0", time: "3d ago" },
];

export default function Transfer() {
  const [coin, setCoin] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <div className="container py-8 max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ArrowLeftRight className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Transfer</h1>
        </div>
        <p className="text-muted-foreground text-sm">Move funds between your accounts instantly</p>
      </div>

      <div className="grid lg:grid-cols-[1fr,280px] gap-6">
        {/* Transfer form */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <Label>Coin</Label>
            <Select value={coin} onValueChange={setCoin}>
              <SelectTrigger><SelectValue placeholder="Select coin" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="btc">BTC - Bitcoin</SelectItem>
                <SelectItem value="eth">ETH - Ethereum</SelectItem>
                <SelectItem value="usdt">USDT - Tether</SelectItem>
                <SelectItem value="sol">SOL - Solana</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-end">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="spot">Spot</SelectItem>
                  <SelectItem value="funding">Funding</SelectItem>
                  <SelectItem value="margin">Margin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" className="mb-0.5 hover:bg-foreground hover:text-background transition-colors" onClick={() => { setFrom(to); setTo(from); }}>
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="spot">Spot</SelectItem>
                  <SelectItem value="funding">Funding</SelectItem>
                  <SelectItem value="margin">Margin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Amount</Label>
              <span className="text-xs text-muted-foreground">Available: 0.4021 BTC</span>
            </div>
            <div className="relative">
              <Input placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="pr-16 font-mono" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-foreground hover:opacity-70">MAX</button>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2">
            <Zap className="h-4 w-4 text-buy mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">Internal transfers are <span className="font-medium text-foreground">instant</span> and <span className="font-medium text-foreground">free</span>. No fees or confirmation time required.</p>
          </div>

          <Button className="w-full gap-2" size="lg">Transfer <ArrowRight className="h-4 w-4" /></Button>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recent transfers */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Recent</h3>
            <div className="space-y-3">
              {recentTransfers.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium">{t.from} → {t.to}</p>
                    <p className="text-muted-foreground">{t.time}</p>
                  </div>
                  <span className="font-mono">{t.amount} {t.coin}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Account Types</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div><span className="font-medium text-foreground">Spot:</span> For buying & selling crypto</div>
              <div><span className="font-medium text-foreground">Funding:</span> For deposits & withdrawals</div>
              <div><span className="font-medium text-foreground">Margin:</span> For leveraged trading</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-buy" /> Secured with 256-bit encryption
          </div>
        </div>
      </div>
    </div>
  );
}
