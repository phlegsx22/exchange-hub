import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUserBalances } from "@/hooks/useUserBalances";
import { useBinanceTickers } from "@/hooks/useBinanceTickers";
import { ArrowDownRight, ArrowUpRight, Gem, History, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const PAXG_SYMBOL = "PAXG";
type ChartPoint = { time: string; price: number };

export default function PaxGoldDashboard() {
  const { balances } = useUserBalances([PAXG_SYMBOL]);
  const tickers = useBinanceTickers([PAXG_SYMBOL]);
  const balance = balances[PAXG_SYMBOL] ?? 0;
  const ticker = tickers[PAXG_SYMBOL];
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const valueUsd = ticker ? balance * ticker.priceUsd : null;

  useEffect(() => {
    if (!ticker?.priceUsd) return;
    setChart((prev) => {
      const next = [
        ...prev,
        {
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          price: ticker.priceUsd,
        },
      ];
      return next.slice(-40);
    });
  }, [ticker?.priceUsd]);

  const priceDomain = useMemo<[number | "auto", number | "auto"]>(() => {
    if (chart.length < 2) return ["auto", "auto"];
    const prices = chart.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = Math.max((max - min) * 0.25, max * 0.001);
    return [Math.max(0, min - pad), max + pad];
  }, [chart]);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-amber-200 bg-amber-500/10 text-amber-700">
            <Gem className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold">PAX Gold</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Deposit, withdraw, and track your PAXG balance. Balances update after admin review and crediting.
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline">All services</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 md:col-span-2">
          <p className="text-sm text-muted-foreground">Available PAXG Balance</p>
          <p className="mt-2 font-mono text-4xl font-bold">{balance.toLocaleString(undefined, { maximumFractionDigits: 8 })}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {valueUsd == null
              ? "Waiting for live PAXG pricing."
              : `Estimated value: $${valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-buy" /> Review workflow
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Send PAXG to your assigned address, then wait for admin confirmation before the balance appears here.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4" /> PAXG Live Monitor
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Streaming PAXG/USDT market price for account monitoring.</p>
          </div>
          <div className="font-mono text-sm">
            {ticker ? `$${ticker.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "Connecting..."}
            {ticker && (
              <span className={ticker.change24hPct >= 0 ? "ml-2 text-buy" : "ml-2 text-sell"}>
                {ticker.change24hPct >= 0 ? "+" : ""}{ticker.change24hPct.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
        <div className="h-56">
          {chart.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border bg-background text-sm text-muted-foreground">
              Waiting for live PAXG ticks.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="paxgPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={priceDomain} hide />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "PAXG"]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Area type="monotone" dataKey="price" stroke="hsl(38, 92%, 50%)" fill="url(#paxgPrice)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/deposit?asset=PAXG">
          <Button className="h-24 w-full flex-col gap-2">
            <ArrowDownRight className="h-5 w-5" /> Deposit PAXG
          </Button>
        </Link>
        <Link to="/withdraw?asset=PAXG">
          <Button variant="outline" className="h-24 w-full flex-col gap-2">
            <ArrowUpRight className="h-5 w-5" /> Withdraw PAXG
          </Button>
        </Link>
        <Button variant="outline" className="h-24 w-full flex-col gap-2" disabled>
          <History className="h-5 w-5" /> History
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Wallet className="h-4 w-4" /> Deposit instructions
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the PAXG deposit screen to view your assigned network address. Deposits do not auto-credit from on-chain polling in this flow.
        </p>
      </div>
    </div>
  );
}
