import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight } from "lucide-react";

export default function Transfer() {
  const [coin, setCoin] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <div className="container py-8 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transfer</h1>
        <p className="text-muted-foreground">Move funds between your accounts</p>
      </div>

      <div className="space-y-4">
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
          <Button variant="outline" size="icon" className="mb-0.5" onClick={() => { setFrom(to); setTo(from); }}>
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
            <Input placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="pr-16" />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-foreground hover:opacity-70">MAX</button>
          </div>
        </div>

        <Button className="w-full" size="lg">Transfer</Button>
      </div>
    </div>
  );
}
