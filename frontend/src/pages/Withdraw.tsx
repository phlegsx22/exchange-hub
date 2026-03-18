import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertCircle, Send, Shield, Clock, ShieldCheck, ArrowRight,
  CheckCircle, Copy
} from "lucide-react";
import { DEFAULT_WATCHLIST } from "@/lib/tokens";
import { useUserBalances } from "@/hooks/useUserBalances";
import { api, type SupportedAssetNetwork } from "@/lib/api";
import { useRecentActivity } from "@/hooks/useRecentActivity";

export default function Withdraw() {
  const [coin, setCoin] = useState("");
  const [assetNetworkId, setAssetNetworkId] = useState("");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [networks, setNetworks] = useState<SupportedAssetNetwork[]>([]);
  const watchSymbols = useMemo(() => {
    const symbols = Array.from(new Set(networks.map((n) => n.assetSymbol)));
    return symbols.length > 0 ? symbols : DEFAULT_WATCHLIST;
  }, [networks]);
  const { balances, portfolio } = useUserBalances(watchSymbols);
  const recent = useRecentActivity(20);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .supportedNetworks()
      .then((r) => {
        if (cancelled) return;
        setNetworks((r.assetNetworks ?? []).filter((n) => n.isWithdrawEnabled));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load withdrawal networks");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const assets = useMemo(() => {
    return Array.from(new Set(networks.map((n) => n.assetSymbol))).sort();
  }, [networks]);

  const assetNetworks = useMemo(() => {
    const symbol = coin.toUpperCase();
    return networks.filter((n) => n.assetSymbol === symbol);
  }, [networks, coin]);

  useEffect(() => {
    // If user changes coin and current network does not match, clear it.
    if (!assetNetworkId) return;
    if (!assetNetworks.some((n) => n.id === assetNetworkId)) {
      setAssetNetworkId("");
    }
  }, [assetNetworks, assetNetworkId]);

  const selectedSymbol = coin.toUpperCase();
  const available = coin ? (balances[selectedSymbol] ?? 0) : 0;
  const selectedNetwork = useMemo(
    () => networks.find((n) => n.id === assetNetworkId) ?? null,
    [networks, assetNetworkId]
  );
  const feeUsd = selectedNetwork?.chainSlug === "ethereum" ? 2 : 1;
  const priceBySymbol = useMemo(
    () => new Map((portfolio?.items ?? []).map((item) => [item.symbol, item.priceUsd ?? null])),
    [portfolio]
  );
  const selectedPriceUsd = useMemo(() => {
    if (!coin) return null;
    if (selectedSymbol === "USDT" || selectedSymbol === "USDC") return 1;
    const p = priceBySymbol.get(selectedSymbol);
    return typeof p === "number" && Number.isFinite(p) && p > 0 ? p : null;
  }, [coin, selectedSymbol, priceBySymbol]);

  const feeAmountPreview = useMemo(() => {
    if (!coin || !assetNetworkId) return 0;
    if (selectedPriceUsd == null || selectedPriceUsd <= 0) return 0;
    return feeUsd / selectedPriceUsd;
  }, [coin, assetNetworkId, feeUsd, selectedPriceUsd]);
  const maxReceivable = Math.max(available - feeAmountPreview, 0);
  const enteredAmount = Number(amount);
  const receiveAmount = Number.isFinite(enteredAmount) && enteredAmount > 0 ? enteredAmount : 0;
  const totalDebit = receiveAmount + feeAmountPreview;

  const recentWithdrawals = useMemo(() => {
    const items = (recent.data ?? []).filter((it) => it.type === "withdrawal");
    return items.slice(0, 8).map((it) => {
      const absAmount = Math.abs(Number.parseFloat(it.amount || "0"));
      const createdMs = Date.now() - new Date(it.createdAt).getTime();
      const minutes = Math.floor(createdMs / 60000);
      let rel = "just now";
      if (minutes >= 60 * 24) rel = `${Math.floor(minutes / (60 * 24))}d ago`;
      else if (minutes >= 60) rel = `${Math.floor(minutes / 60)}h ago`;
      else if (minutes >= 1) rel = `${minutes}m ago`;
      return {
        id: it.id,
        amount: absAmount,
        asset: it.assetSymbol,
        network: it.chainName,
        receiptNo: it.receiptNo ?? null,
        time: rel,
      };
    });
  }, [recent.data]);

  function handleMax(): void {
    setAmount(maxReceivable > 0 ? maxReceivable.toFixed(8).replace(/\.?0+$/, "") : "0");
  }

  async function handleWithdrawRequest(): Promise<void> {
    setError(null);
    setSuccess(null);
    if (!assetNetworkId) {
      setError("Select a network.");
      return;
    }
    if (!address.trim()) {
      setError("Enter destination wallet address.");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setSubmitting(true);
    try {
      const r = await api.withdrawRequest({
        assetNetworkId,
        toAddress: address.trim(),
        amount: amt,
      });
      setSuccess(
        `Withdrawal request submitted (receipt: ${r.withdrawal.receiptNo ?? "pending"}). Admin will review and send funds.`
      );
      setAmount("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit withdrawal request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-8 max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Send className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Withdraw</h1>
        </div>
        <p className="text-muted-foreground text-sm">Send crypto to an external wallet</p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr),320px] gap-6">
        {/* Withdraw form */}
        <div className="rounded-lg border bg-card p-7 space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-buy/30 bg-buy/5 p-3 text-sm text-buy">
              {success}
            </div>
          )}
          <div className="space-y-2">
            <Label>Select Coin</Label>
            <Select
              value={coin}
              onValueChange={(v) => {
                setCoin(v);
                setAssetNetworkId("");
                setAmount("");
              }}
              disabled={loading || assets.length === 0}
            >
              <SelectTrigger><SelectValue placeholder="Choose asset" /></SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem key={a} value={a.toLowerCase()}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Network</Label>
            <Select
              value={assetNetworkId}
              onValueChange={(v) => {
                setAssetNetworkId(v);
                setAmount("");
              }}
              disabled={loading || !coin || assetNetworks.length === 0}
            >
              <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
              <SelectContent>
                {assetNetworks.map((n) => (
                  <SelectItem key={n.id} value={n.id}>{n.chainName} ({n.chainSlug})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Wallet Address</Label>
            <div className="relative">
              <Input placeholder="Enter withdrawal address" value={address} onChange={(e) => setAddress(e.target.value)} className="pr-10 font-mono text-sm" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2">
                <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Amount</Label>
              <span className="text-xs text-muted-foreground">
                Available: {coin ? `${available.toFixed(selectedSymbol === "BTC" ? 6 : 4)} ${selectedSymbol}` : "—"}
              </span>
            </div>
            <div className="relative">
              <Input placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="pr-16 font-mono" />
              <button
                type="button"
                onClick={handleMax}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-foreground hover:opacity-70"
                disabled={!coin || !assetNetworkId}
              >
                MAX
              </button>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network Fee</span>
              <span className="font-mono">
                {coin ? `~$${feeUsd.toFixed(2)}` : "—"}
                {coin && selectedPriceUsd != null && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({feeAmountPreview.toFixed(8)} {coin.toUpperCase()})
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimum Withdrawal</span>
              <span className="font-mono">0.00</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Total Received</span>
              <span className="font-mono">
                {coin
                  ? `${receiveAmount.toFixed(8)} ${selectedSymbol}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Debit (Received + Fee)</span>
              <span className="font-mono">
                {coin ? `${totalDebit.toFixed(8)} ${selectedSymbol}` : "—"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-sell/5 border border-sell/20 p-3">
            <AlertCircle className="h-4 w-4 text-sell mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Please double-check the address and network. Withdrawals to incorrect addresses <span className="font-medium text-foreground">cannot be recovered</span>.
            </p>
          </div>

          <Button
            className="w-full gap-2"
            size="lg"
            onClick={() => void handleWithdrawRequest()}
            disabled={submitting || loading || !coin || !assetNetworkId}
          >
            {submitting ? "Submitting..." : "Withdraw"} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recent withdrawals */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Recent</h3>
            <div className="space-y-3">
              {recent.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading recent withdrawals...</p>
              ) : recentWithdrawals.length === 0 ? (
                <p className="text-xs text-muted-foreground">No withdrawal activity yet.</p>
              ) : (
                recentWithdrawals.map((w) => (
                <div key={w.id} className="text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium">{w.amount.toFixed(8)} {w.asset}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-buy/10 text-buy">Sent</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-mono">{w.receiptNo ?? "—"}</span>
                    <span>{w.time}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{w.network}</p>
                </div>
              )))}
            </div>
          </div>

          {/* Security info */}
          <div className="rounded-lg border bg-card p-4 space-y-2.5">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Security</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-buy mt-0.5 shrink-0" />
                <span>Withdrawal whitelist enabled</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-buy mt-0.5 shrink-0" />
                <span>2FA required for withdrawals</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-buy mt-0.5 shrink-0" />
                <span>24h security hold for new addresses</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-buy" /> Protected by multi-sig wallets
          </div>
        </div>
      </div>
    </div>
  );
}
