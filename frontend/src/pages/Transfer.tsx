import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, Zap, ShieldCheck, Clock, Info, ArrowRight } from "lucide-react";
import { DEFAULT_WATCHLIST } from "@/lib/tokens";
import { useUserBalances } from "@/hooks/useUserBalances";
import { api, type DemoTradeTransferDirection } from "@/lib/api";

export default function Transfer() {
  const [coin, setCoin] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tradingBalances, setTradingBalances] = useState<Record<string, number>>({});
  const [recentTransfers, setRecentTransfers] = useState<
    Array<{ id: string; direction: DemoTradeTransferDirection; assetSymbol: string; amount: number; createdAt: string }>
  >([]);
  const { balances } = useUserBalances(DEFAULT_WATCHLIST);

  const symbols = useMemo(() => {
    return Object.keys(balances).filter((s) => (balances[s] ?? 0) > 0 || (tradingBalances[s] ?? 0) > 0).sort();
  }, [balances, tradingBalances]);
  const selectedSymbol = coin.toUpperCase();

  const availableFunding = coin ? (balances[selectedSymbol] ?? 0) : 0;
  const availableTrading = coin ? (tradingBalances[selectedSymbol] ?? 0) : 0;
  const available = from === "funding" ? availableFunding : from === "spot" ? availableTrading : 0;

  async function refreshDemoPortfolio(): Promise<void> {
    try {
      const r = await api.demoTradePortfolio();
      setTradingBalances(r.balances ?? {});
      setRecentTransfers((r.transfers ?? []).slice(0, 8));
    } catch {
      // keep quiet; transfer action will surface specific error
    }
  }

  useEffect(() => {
    void refreshDemoPortfolio();
  }, []);

  useEffect(() => {
    if (!coin && symbols.length > 0) setCoin(symbols[0].toLowerCase());
  }, [coin, symbols]);

  function handleMax(): void {
    setAmount(available > 0 ? available.toFixed(8).replace(/\.?0+$/, "") : "0");
  }

  async function submitTransfer(): Promise<void> {
    setError(null);
    setSuccess(null);
    const n = Number(amount);
    if (!coin) {
      setError("Select coin.");
      return;
    }
    if (!from || !to || from === to) {
      setError("Select valid from/to accounts.");
      return;
    }
    if (!(from === "funding" || from === "spot") || !(to === "funding" || to === "spot")) {
      setError("Only Funding and Spot (Trading) are supported.");
      return;
    }
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter valid amount.");
      return;
    }
    if (n > available) {
      setError(`Insufficient balance. Available ${available.toFixed(8)} ${selectedSymbol}.`);
      return;
    }
    const direction: DemoTradeTransferDirection = from === "funding" ? "funding_to_trading" : "trading_to_funding";
    setSubmitting(true);
    try {
      const r = await api.demoTradeTransfer({
        assetSymbol: selectedSymbol,
        amount: n,
        direction,
      });
      setSuccess(
        `Transferred ${n.toFixed(8)} ${selectedSymbol} ${direction === "funding_to_trading" ? "to Trading" : "to Funding"}. Trading balance is now ${r.transfer.tradingBalance.toFixed(8)} ${selectedSymbol}.`
      );
      setAmount("");
      await refreshDemoPortfolio();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  }

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
          {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}
          {success ? <div className="rounded-lg border border-buy/30 bg-buy/5 p-3 text-sm text-buy">{success}</div> : null}
          <div className="space-y-2">
            <Label>Coin</Label>
            <Select value={coin} onValueChange={setCoin}>
              <SelectTrigger><SelectValue placeholder="Select coin" /></SelectTrigger>
              <SelectContent>
                {symbols.map((s) => (
                  <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                ))}
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
                </SelectContent>
              </Select>
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
              >
                MAX
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2">
            <Zap className="h-4 w-4 text-buy mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">Internal transfers are <span className="font-medium text-foreground">instant</span> and <span className="font-medium text-foreground">free</span>. No fees or confirmation time required.</p>
          </div>

          <Button className="w-full gap-2" size="lg" onClick={() => void submitTransfer()} disabled={submitting}>
            {submitting ? "Transferring..." : "Transfer"} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recent transfers */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Recent</h3>
            <div className="space-y-3">
              {recentTransfers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No transfer activity yet.</p>
              ) : recentTransfers.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium">
                      {t.direction === "funding_to_trading" ? "Funding → Spot" : "Spot → Funding"}
                    </p>
                    <p className="text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="font-mono">{t.amount.toFixed(8)} {t.assetSymbol}</span>
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
