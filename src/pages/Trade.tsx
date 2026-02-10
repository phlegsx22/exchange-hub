import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const orderBook = {
  asks: [
    { price: "97,280.50", amount: "0.2341", total: "22,773.58" },
    { price: "97,275.30", amount: "0.5120", total: "49,804.95" },
    { price: "97,270.10", amount: "0.1890", total: "18,384.05" },
    { price: "97,265.00", amount: "0.8450", total: "82,188.93" },
    { price: "97,260.20", amount: "0.3210", total: "31,220.52" },
    { price: "97,255.80", amount: "0.1560", total: "15,171.90" },
    { price: "97,250.00", amount: "0.6780", total: "65,935.50" },
  ],
  bids: [
    { price: "97,245.30", amount: "0.4521", total: "43,964.04" },
    { price: "97,240.10", amount: "0.3890", total: "37,826.40" },
    { price: "97,235.50", amount: "0.7120", total: "69,231.68" },
    { price: "97,230.00", amount: "0.2340", total: "22,751.82" },
    { price: "97,225.80", amount: "0.5670", total: "55,127.02" },
    { price: "97,220.10", amount: "0.1230", total: "11,958.07" },
    { price: "97,215.00", amount: "0.8910", total: "86,618.57" },
  ],
};

const recentTrades = [
  { price: "97,245.30", amount: "0.0234", time: "14:32:01", up: true },
  { price: "97,244.80", amount: "0.1200", time: "14:31:58", up: false },
  { price: "97,246.10", amount: "0.0560", time: "14:31:55", up: true },
  { price: "97,243.90", amount: "0.0890", time: "14:31:52", up: false },
  { price: "97,245.00", amount: "0.2100", time: "14:31:49", up: true },
  { price: "97,244.50", amount: "0.0340", time: "14:31:46", up: false },
  { price: "97,246.80", amount: "0.0120", time: "14:31:43", up: true },
];

const pairSymbols = [
  { pair: "BTC/USDT", symbol: "BINANCE:BTCUSDT" },
  { pair: "ETH/USDT", symbol: "BINANCE:ETHUSDT" },
  { pair: "SOL/USDT", symbol: "BINANCE:SOLUSDT" },
  { pair: "XRP/USDT", symbol: "BINANCE:XRPUSDT" },
];

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
      symbols: pairSymbols.map((p) => ({
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

  return (
    <div className="container py-4">
      {/* Live TradingView Ticker */}
      <div className="mb-4 pb-2 border-b">
        <TradingViewTicker />
      </div>

      {/* Pair selector */}
      <div className="flex items-center gap-4 mb-4">
        {pairSymbols.map((p) => (
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

      {/* TradingView Chart */}
      <div className="rounded-lg border overflow-hidden mb-4 h-[500px]">
        <TradingViewChart symbol={selectedPair} />
      </div>

      <div className="grid lg:grid-cols-[1fr,300px,300px] gap-4">
        {/* Order Book */}
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <h3 className="text-sm font-semibold">Order Book</h3>
          </div>
          <div className="grid grid-cols-[1fr,1fr] divide-x text-xs">
            {/* Asks */}
            <div>
              <div className="grid grid-cols-3 px-3 py-2 text-muted-foreground border-b">
                <span>Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
              </div>
              {orderBook.asks.map((a, i) => (
                <div key={i} className="grid grid-cols-3 px-3 py-1.5 hover:bg-muted/30 font-mono">
                  <span className="text-sell">{a.price}</span>
                  <span className="text-right">{a.amount}</span>
                  <span className="text-right text-muted-foreground">{a.total}</span>
                </div>
              ))}
            </div>
            {/* Bids */}
            <div>
              <div className="grid grid-cols-3 px-3 py-2 text-muted-foreground border-b">
                <span>Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
              </div>
              {orderBook.bids.map((b, i) => (
                <div key={i} className="grid grid-cols-3 px-3 py-1.5 hover:bg-muted/30 font-mono">
                  <span className="text-buy">{b.price}</span>
                  <span className="text-right">{b.amount}</span>
                  <span className="text-right text-muted-foreground">{b.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Form */}
        <div className="rounded-lg border p-4 space-y-4">
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
              <Label className="text-xs">Amount (BTC)</Label>
              <Input placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="font-mono" />
            </div>
            {/* Percentage buttons */}
            <div className="grid grid-cols-4 gap-2">
              {["25%", "50%", "75%", "100%"].map((pct) => (
                <Button key={pct} variant="outline" size="sm" className="text-xs">{pct}</Button>
              ))}
            </div>
            <div className="rounded-md bg-muted p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available</span>
                <span className="font-mono">{side === "buy" ? "10,500.00 USDT" : "0.4521 BTC"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Total</span>
                <span className="font-mono">{amount && price ? `${(parseFloat(amount) * parseFloat(price.replace(/,/g, ""))).toFixed(2)} USDT` : "—"}</span>
              </div>
            </div>
            <Button className={`w-full ${side === "buy" ? "bg-buy hover:bg-buy/90" : "bg-sell hover:bg-sell/90"}`} size="lg">
              {side === "buy" ? "Buy" : "Sell"} BTC
            </Button>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <h3 className="text-sm font-semibold">Recent Trades</h3>
          </div>
          <div className="text-xs">
            <div className="grid grid-cols-3 px-3 py-2 text-muted-foreground border-b">
              <span>Price</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Time</span>
            </div>
            {recentTrades.map((t, i) => (
              <div key={i} className="grid grid-cols-3 px-3 py-1.5 hover:bg-muted/30 font-mono">
                <span className={t.up ? "text-buy" : "text-sell"}>{t.price}</span>
                <span className="text-right">{t.amount}</span>
                <span className="text-right text-muted-foreground">{t.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
