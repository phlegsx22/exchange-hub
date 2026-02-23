import { useEffect, useMemo, useRef, useState } from "react";
import { TOKENS, type TokenSymbol } from "@/lib/tokens";

export interface Ticker {
  symbol: TokenSymbol;
  /** price in USD (USDT quote treated as USD for display) */
  priceUsd: number;
  /** 24h change percent, e.g. 2.34 */
  change24hPct: number;
}

type TickerMap = Partial<Record<TokenSymbol, Ticker>>;

function parseNumber(x: unknown): number | null {
  const n = typeof x === "string" ? Number(x) : typeof x === "number" ? x : NaN;
  return Number.isFinite(n) ? n : null;
}

export function useBinanceTickers(symbols: TokenSymbol[]) {
  const [tickers, setTickers] = useState<TickerMap>({});
  const wsRef = useRef<WebSocket | null>(null);
  const stoppedRef = useRef(false);
  const reconnectAttemptRef = useRef(0);

  const watched = useMemo(() => {
    // include fixed-price tokens immediately
    const fixed: TickerMap = {};
    for (const s of symbols) {
      const meta = TOKENS[s];
      if (meta?.fixedUsdPrice != null) {
        fixed[s] = { symbol: s, priceUsd: meta.fixedUsdPrice, change24hPct: 0 };
      }
    }
    return fixed;
  }, [symbols]);

  useEffect(() => {
    setTickers((prev) => ({ ...prev, ...watched }));
  }, [watched]);

  const streams = useMemo(() => {
    const list = symbols
      .map((s) => TOKENS[s]?.binanceUsdtPair)
      .filter(Boolean)
      .map((pair) => `${pair}@ticker`);
    // de-dupe
    return Array.from(new Set(list));
  }, [symbols]);

  useEffect(() => {
    if (streams.length === 0) return;

    stoppedRef.current = false;
    reconnectAttemptRef.current = 0;

    const connect = () => {
      const url = `wss://stream.binance.com:9443/stream?streams=${streams.join("/")}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data as string) as {
            stream?: string;
            data?: { s?: string; c?: string; P?: string };
          };
          const data = msg.data;
          if (!data?.s) return;

          const pair = data.s.toLowerCase(); // e.g. btcusdt
          const price = parseNumber(data.c);
          const changePct = parseNumber(data.P);
          if (price == null || changePct == null) return;

          const symbol = (Object.keys(TOKENS) as TokenSymbol[]).find((k) => TOKENS[k]?.binanceUsdtPair === pair);
          if (!symbol) return;

          setTickers((prev) => ({
            ...prev,
            [symbol]: { symbol, priceUsd: price, change24hPct: changePct },
          }));
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        if (stoppedRef.current) return;
        const attempt = ++reconnectAttemptRef.current;
        const backoffMs = Math.min(10_000, 500 * 2 ** Math.min(5, attempt));
        window.setTimeout(() => {
          if (!stoppedRef.current) connect();
        }, backoffMs);
      };

      ws.onerror = () => {
        // onclose will reconnect
      };
    };

    connect();

    return () => {
      stoppedRef.current = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [streams]);

  return tickers;
}

