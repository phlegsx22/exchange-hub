import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

export default function Withdraw() {
  const [coin, setCoin] = useState("");
  const [network, setNetwork] = useState("");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <div className="container py-8 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Withdraw</h1>
        <p className="text-muted-foreground">Send crypto to an external wallet</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Select Coin</Label>
          <Select value={coin} onValueChange={setCoin}>
            <SelectTrigger><SelectValue placeholder="Choose asset" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="btc">BTC - Bitcoin</SelectItem>
              <SelectItem value="eth">ETH - Ethereum</SelectItem>
              <SelectItem value="usdt">USDT - Tether</SelectItem>
              <SelectItem value="sol">SOL - Solana</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Network</Label>
          <Select value={network} onValueChange={setNetwork}>
            <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="erc20">ERC-20 (Ethereum)</SelectItem>
              <SelectItem value="trc20">TRC-20 (Tron)</SelectItem>
              <SelectItem value="bep20">BEP-20 (BSC)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Wallet Address</Label>
          <Input placeholder="Enter withdrawal address" value={address} onChange={(e) => setAddress(e.target.value)} />
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

        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network Fee</span>
            <span className="font-mono">0.0005 BTC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Minimum Withdrawal</span>
            <span className="font-mono">0.001 BTC</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>You'll Receive</span>
            <span className="font-mono">{amount ? (parseFloat(amount) - 0.0005).toFixed(4) : "0.0000"} BTC</span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Please double-check the address and network. Withdrawals to incorrect addresses cannot be recovered.
          </p>
        </div>

        <Button className="w-full" size="lg">Withdraw</Button>
      </div>
    </div>
  );
}
