import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBinanceOrderBook } from "@/hooks/useBinanceOrderBook";
import { TOKENS, type TokenSymbol } from "@/lib/tokens";
import { useBinanceRecentTrades } from "@/hooks/useBinanceRecentTrades";
import { api } from "@/lib/api";

// Static order book removed — now using live Binance WebSocket data via useBinanceOrderBook hook

const highlightPairs: { pair: string; symbol: string }[] = [
  { pair: "BTC/USDT", symbol: "BINANCE:BTCUSDT" },
  { pair: "ETH/USDT", symbol: "BINANCE:ETHUSDT" },
  { pair: "SOL/USDT", symbol: "BINANCE:SOLUSDT" },
  { pair: "XRP/USDT", symbol: "BINANCE:XRPUSDT" },
];

const allPairs: { pair: string; symbol: string; token: TokenSymbol }[] = (
  Object.keys(TOKENS) as TokenSymbol[]
)
  .filter((s) => TOKENS[s].binanceUsdtPair || TOKENS[s].fixedUsdPrice != null)
  .map((s) => ({ token: s, pair: `${s}/USDT`, symbol: `BINANCE:${s}USDT` }))
  .sort((a, b) => a.pair.localeCompare(b.pair));

const TradingViewTicker = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-tickers.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: highlightPairs.map((p) => ({
        proName: p.symbol,
        title: p.pair,
      })),
      isTransparent: true,
      showSymbolLogo: true,
      colorTheme: "light",
      locale: "en",
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget" />
    </div>
  );
};

const TradingViewChart = ({ symbol = "BINANCE:BTCUSDT" }: { symbol?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "15",
      timezone: "Etc/UTC",
      theme: "light",
      style: "1",
      locale: "en",
      hide_side_toolbar: false,
      allow_symbol_change: true,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container h-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full" />
    </div>
  );
};

export default function Trade() {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [selectedPair, setSelectedPair] = useState("BINANCE:BTCUSDT");
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [minTradeUsd, setMinTradeUsd] = useState(10);
  const [demoBalances, setDemoBalances] = useState<Record<string, number>>({});
  const [myTrades, setMyTrades] = useState<Array<{ id: string; side: "buy" | "sell"; price: number; qty: number; time: string }>>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const orderBook = useBinanceOrderBook(selectedPair);
  const marketTrades = useBinanceRecentTrades(selectedPair, 30);

  const baseAsset = selectedPair.replace("BINANCE:", "").replace("USDT", "");
  const quoteAsset = "USDT";
  const availableQuote = demoBalances[quoteAsset] ?? 0;
  const availableBase = demoBalances[baseAsset] ?? 0;
  const lastPx = marketTrades[0]?.price ?? 0;

  async function refreshPortfolio(): Promise<void> {
    setLoadingPortfolio(true);
    try {
      const r = await api.demoTradePortfolio();
      setDemoBalances(r.balances ?? {});
      setMinTradeUsd(r.minTradeNotionalUsd ?? 10);
      setMyTrades(
        (r.trades ?? []).map((t) => ({
          id: t.id,
          side: t.side,
          price: t.priceUsd,
          qty: t.baseAmount,
          time: t.createdAt,
        }))
      );
    } catch {
      // keep current state; submit errors are shown on action
    } finally {
      setLoadingPortfolio(false);
    }
  }

  useEffect(() => {
    void refreshPortfolio();
  }, []);

  const handlePlaceOrder = async () => {
    setSubmitError(null);
    const px = Number.isFinite(lastPx) && lastPx > 0 ? lastPx : 0;
    const qty = Number(amount);
    if (!Number.isFinite(px) || !Number.isFinite(qty) || qty <= 0) {
      setSubmitError("Enter a valid amount.");
      return;
    }
    if (qty * px < minTradeUsd) {
      setSubmitError(`Minimum trade size is $${minTradeUsd.toFixed(2)}.`);
      return;
    }
    setSubmitting(true);
    try {
      await api.demoMarketOrder({
        side,
        baseSymbol: baseAsset,
        quoteSymbol: quoteAsset,
        baseAmount: qty,
      });
      setAmount("");
      await refreshPortfolio();
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Order failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4 space-y-4">
      {/* Live TradingView Ticker */}
      <div className="pb-2 border-b overflow-x-auto">
        <TradingViewTicker />
      </div>

      {/* Pair selector */}
      <div className="flex flex-col gap-3">
        {/* Highlight pairs */}
        <div className="flex items-center gap-2 flex-wrap">
          {highlightPairs.map((p) => (
            <button
              key={p.symbol}
              onClick={() => setSelectedPair(p.symbol)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedPair === p.symbol ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.pair}
            </button>
          ))}
        </div>

        {/* Full pair list dropdown */}
        <div className="max-w-xs">
          <Select value={selectedPair} onValueChange={setSelectedPair}>
            <SelectTrigger>
              <SelectValue placeholder="Select market" />
            </SelectTrigger>
            <SelectContent>
              {allPairs.map((p) => (
                <SelectItem key={p.symbol} value={p.symbol}>
                  {p.pair}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TradingView Chart */}
      <div className="rounded-lg border overflow-hidden h-[300px] sm:h-[400px] lg:h-[500px]">
        <TradingViewChart symbol={selectedPair} />
      </div>

      {/* Order Form first on mobile for usability */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr,300px,300px] gap-4">
        {/* Order Form - shown first on mobile via order */}
        <div className="rounded-lg border p-4 space-y-4 order-first lg:order-none">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setSide("buy")}
              className={`py-2 rounded-md text-sm font-medium transition-colors ${
                side === "buy" ? "bg-buy text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide("sell")}
              className={`py-2 rounded-md text-sm font-medium transition-colors ${
                side === "sell" ? "bg-sell text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sell
            </button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Market Price ({quoteAsset})</Label>
              <Input value={lastPx > 0 ? lastPx.toLocaleString() : "—"} readOnly className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount ({baseAsset})</Label>
              <Input placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="font-mono" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {["25%", "50%", "75%", "100%"].map((pct) => (
                <Button
                  key={pct}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const p = Number(pct.replace("%", "")) / 100;
                    const px = Number.isFinite(lastPx) && lastPx > 0 ? lastPx : 0;
                    if (!Number.isFinite(px) || px <= 0) return;
                    if (side === "buy") {
                      const baseQty = (availableQuote * p) / px;
                      setAmount(baseQty > 0 ? baseQty.toFixed(8).replace(/\.?0+$/, "") : "0");
                    } else {
                      const baseQty = availableBase * p;
                      setAmount(baseQty > 0 ? baseQty.toFixed(8).replace(/\.?0+$/, "") : "0");
                    }
                  }}
                >
                  {pct}
                </Button>
              ))}
            </div>
            <div className="rounded-md bg-muted p-3 space-y-1 text-xs">
              {submitError ? <p className="text-sell text-[11px]">{submitError}</p> : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available</span>
                <span className="font-mono">
                  {side === "buy"
                    ? `${availableQuote.toFixed(2)} ${quoteAsset}`
                    : `${availableBase.toFixed(baseAsset === "BTC" ? 6 : 4)} ${baseAsset}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Total</span>
                <span className="font-mono">{amount && lastPx > 0 ? `${(parseFloat(amount) * lastPx).toFixed(2)} USDT` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min Notional</span>
                <span className="font-mono">${minTradeUsd.toFixed(2)}</span>
              </div>
            </div>
            <Button
              className={`w-full ${side === "buy" ? "bg-buy hover:bg-buy/90" : "bg-sell hover:bg-sell/90"}`}
              size="lg"
              onClick={() => void handlePlaceOrder()}
              disabled={submitting || loadingPortfolio}
            >
              {submitting ? "Placing..." : side === "buy" ? "Buy" : "Sell"} {baseAsset}
            </Button>
          </div>
        </div>

        {/* Order Book */}
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <h3 className="text-sm font-semibold">Order Book</h3>
          </div>
          <div className="grid grid-cols-2 divide-x text-xs">
            {/* Asks */}
            <div>
              <div className="grid grid-cols-3 px-2 sm:px-3 py-2 text-muted-foreground border-b">
                <span>Price</span>
                <span className="text-right">Amt</span>
                <span className="text-right">Total</span>
              </div>
              {orderBook.asks.map((a, i) => (
                <div key={i} className="grid grid-cols-3 px-2 sm:px-3 py-1.5 hover:bg-muted/30 font-mono text-[10px] sm:text-xs">
                  <span className="text-sell truncate">{a.price}</span>
                  <span className="text-right truncate">{a.amount}</span>
                  <span className="text-right text-muted-foreground truncate">{a.total}</span>
                </div>
              ))}
            </div>
            {/* Bids */}
            <div>
              <div className="grid grid-cols-3 px-2 sm:px-3 py-2 text-muted-foreground border-b">
                <span>Price</span>
                <span className="text-right">Amt</span>
                <span className="text-right">Total</span>
              </div>
              {orderBook.bids.map((b, i) => (
                <div key={i} className="grid grid-cols-3 px-2 sm:px-3 py-1.5 hover:bg-muted/30 font-mono text-[10px] sm:text-xs">
                  <span className="text-buy truncate">{b.price}</span>
                  <span className="text-right truncate">{b.amount}</span>
                  <span className="text-right text-muted-foreground truncate">{b.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Trades (live from Binance) */}
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <h3 className="text-sm font-semibold">Market Trades (Live)</h3>
          </div>
          <div className="text-xs">
            <div className="grid grid-cols-3 px-3 py-2 text-muted-foreground border-b">
              <span>Price</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Time</span>
            </div>
            {marketTrades.map((t, i) => (
              <div key={i} className="grid grid-cols-3 px-3 py-1.5 hover:bg-muted/30 font-mono">
                <span className={t.isBuyerMaker ? "text-sell" : "text-buy"}>{t.price.toLocaleString()}</span>
                <span className="text-right">{t.qty.toFixed(baseAsset === "BTC" ? 6 : 4)}</span>
                <span className="text-right text-muted-foreground">
                  {new Date(t.time).toLocaleTimeString([], { hour12: false })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Your Trades */}
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <h3 className="text-sm font-semibold">Your Trades</h3>
          </div>
          <div className="text-xs">
            <div className="grid grid-cols-4 px-3 py-2 text-muted-foreground border-b">
              <span>Side</span>
              <span className="text-right">Price</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Time</span>
            </div>
            {myTrades.length === 0 ? (
              <div className="px-3 py-3 text-muted-foreground">No trades yet.</div>
            ) : (
              myTrades.map((t, i) => (
                <div key={t.id || i} className="grid grid-cols-4 px-3 py-1.5 hover:bg-muted/30 font-mono">
                  <span className={t.side === "buy" ? "text-buy" : "text-sell"}>{t.side.toUpperCase()}</span>
                  <span className="text-right">{t.price.toLocaleString()}</span>
                  <span className="text-right">{t.qty.toFixed(baseAsset === "BTC" ? 6 : 4)}</span>
                  <span className="text-right text-muted-foreground">
                    {new Date(t.time).toLocaleTimeString([], { hour12: false })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
