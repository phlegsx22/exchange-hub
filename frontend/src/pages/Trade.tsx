import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBinanceOrderBook } from "@/hooks/useBinanceOrderBook";
import { useUserBalances } from "@/hooks/useUserBalances";
import { DEFAULT_WATCHLIST, TOKENS, type TokenSymbol } from "@/lib/tokens";
import { useBinanceRecentTrades } from "@/hooks/useBinanceRecentTrades";

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
  const [orderType, setOrderType] = useState("limit");
  const [price, setPrice] = useState("97,245.30");
  const [amount, setAmount] = useState("");
  const [selectedPair, setSelectedPair] = useState("BINANCE:BTCUSDT");
  const orderBook = useBinanceOrderBook(selectedPair);
  const { balances } = useUserBalances(DEFAULT_WATCHLIST);
  const marketTrades = useBinanceRecentTrades(selectedPair, 30);
  const [myTrades, setMyTrades] = useState<{ side: "buy" | "sell"; price: number; qty: number; time: number }[]>([]);

  const baseAsset = selectedPair.replace("BINANCE:", "").replace("USDT", "");
  const quoteAsset = "USDT";
  const availableQuote = balances.USDT ?? 0;
  const availableBase = (balances as Record<string, number>)[baseAsset] ?? 0;

  const handlePlaceOrder = () => {
    const px = Number(price.replace(/,/g, ""));
    const qty = Number(amount);
    if (!Number.isFinite(px) || !Number.isFinite(qty) || qty <= 0) return;
    setMyTrades((prev) => [{ side, price: px, qty, time: Date.now() }, ...prev].slice(0, 30));
    setAmount("");
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

          <Tabs value={orderType} onValueChange={setOrderType}>
            <TabsList className="w-full">
              <TabsTrigger value="limit" className="flex-1">Limit</TabsTrigger>
              <TabsTrigger value="market" className="flex-1">Market</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-3">
            {orderType === "limit" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Price (USDT)</Label>
                <Input value={price} onChange={(e) => setPrice(e.target.value)} className="font-mono" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Amount ({baseAsset})</Label>
              <Input placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="font-mono" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {["25%", "50%", "75%", "100%"].map((pct) => (
                <Button key={pct} variant="outline" size="sm" className="text-xs">{pct}</Button>
              ))}
            </div>
            <div className="rounded-md bg-muted p-3 space-y-1 text-xs">
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
                <span className="font-mono">{amount && price ? `${(parseFloat(amount) * parseFloat(price.replace(/,/g, ""))).toFixed(2)} USDT` : "—"}</span>
              </div>
            </div>
            <Button
              className={`w-full ${side === "buy" ? "bg-buy hover:bg-buy/90" : "bg-sell hover:bg-sell/90"}`}
              size="lg"
              onClick={handlePlaceOrder}
            >
              {side === "buy" ? "Buy" : "Sell"} {baseAsset}
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

        {/* Your Trades (local until trading backend exists) */}
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
                <div key={i} className="grid grid-cols-4 px-3 py-1.5 hover:bg-muted/30 font-mono">
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
