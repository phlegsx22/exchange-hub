import { useState, useEffect, useRef, useCallback } from "react";

interface OrderBookEntry {
  price: string;
  amount: string;
  total: string;
}

interface OrderBookData {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
}

const formatPrice = (p: string) => parseFloat(p).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatAmount = (a: string) => parseFloat(a).toFixed(4);

function toBinancePair(symbol: string): string | null {
  // Accept:
  // - "BINANCE:BTCUSDT" -> "btcusdt"
  // - "BTCUSDT" -> "btcusdt"
  // - "btcusdt" -> "btcusdt"
  const s = symbol.includes(":") ? symbol.split(":")[1] ?? "" : symbol;
  const pair = s.trim().toLowerCase();
  if (!pair) return null;
  // This hook is currently built around USDT quoted spot markets.
  if (!pair.endsWith("usdt")) return null;
  return pair;
}

export function useBinanceOrderBook(symbol: string, depth = 7) {
  const [orderBook, setOrderBook] = useState<OrderBookData>({ asks: [], bids: [] });
  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<{ asks: Map<string, string>; bids: Map<string, string> }>({ asks: new Map(), bids: new Map() });
  const snapshotLoaded = useRef(false);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processBuffer = useCallback(() => {
    const { asks, bids } = bufferRef.current;

    const sortedAsks = [...asks.entries()]
      .filter(([, qty]) => parseFloat(qty) > 0)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .slice(0, depth);

    const sortedBids = [...bids.entries()]
      .filter(([, qty]) => parseFloat(qty) > 0)
      .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
      .slice(0, depth);

    const toEntry = ([price, amount]: [string, string]): OrderBookEntry => ({
      price: formatPrice(price),
      amount: formatAmount(amount),
      total: (parseFloat(price) * parseFloat(amount)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });

    setOrderBook({ asks: sortedAsks.map(toEntry), bids: sortedBids.map(toEntry) });
  }, [depth]);

  useEffect(() => {
    const pair = toBinancePair(symbol);
    // Clear UI immediately on symbol change to avoid showing stale BTC book.
    setOrderBook({ asks: [], bids: [] });
    if (!pair) return;

    snapshotLoaded.current = false;
    bufferRef.current = { asks: new Map(), bids: new Map() };

    // Fetch initial snapshot via REST (limit 20 to stay light)
    fetch(`https://api.binance.com/api/v3/depth?symbol=${pair.toUpperCase()}&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        const asks = new Map<string, string>();
        const bids = new Map<string, string>();
        for (const [p, q] of data.asks) asks.set(p, q);
        for (const [p, q] of data.bids) bids.set(p, q);
        bufferRef.current = { asks, bids };
        snapshotLoaded.current = true;
        processBuffer();
      })
      .catch(console.error);

    // Connect WebSocket with 100ms updates
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${pair}@depth@100ms`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      if (!snapshotLoaded.current) return;
      const data = JSON.parse(event.data);
      const { asks, bids } = bufferRef.current;

      for (const [p, q] of data.a) {
        if (parseFloat(q) === 0) asks.delete(p);
        else asks.set(p, q);
      }
      for (const [p, q] of data.b) {
        if (parseFloat(q) === 0) bids.delete(p);
        else bids.set(p, q);
      }

      // Throttle UI updates to ~250ms to avoid excessive re-renders
      if (!throttleRef.current) {
        throttleRef.current = setTimeout(() => {
          processBuffer();
          throttleRef.current = null;
        }, 250);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      if (throttleRef.current) clearTimeout(throttleRef.current);
    };
  }, [symbol, processBuffer]);

  return orderBook;
}
