import { useEffect, useMemo, useRef, useState } from "react";
import { TOKENS, type TokenSymbol } from "@/lib/tokens";

export interface MarketTrade {
  price: number;
  qty: number;
  time: number; // ms
  isBuyerMaker: boolean;
}

function fmtPairFromTradingViewSymbol(tradingViewSymbol: string): string | null {
  // "BINANCE:BTCUSDT" -> "btcusdt"
  const s = tradingViewSymbol.replace("BINANCE:", "");
  if (!s.endsWith("USDT")) return null;
  return s.toLowerCase();
}

export function useBinanceRecentTrades(tradingViewSymbol: string, limit = 30) {
  const [trades, setTrades] = useState<MarketTrade[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const pair = useMemo(() => fmtPairFromTradingViewSymbol(tradingViewSymbol), [tradingViewSymbol]);

  useEffect(() => {
    if (!pair) return;

    const url = `wss://stream.binance.com:9443/ws/${pair}@trade`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    setTrades([]);

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data as string) as {
          p?: string;
          q?: string;
          T?: number;
          m?: boolean;
        };
        const price = Number(msg.p);
        const qty = Number(msg.q);
        const time = typeof msg.T === "number" ? msg.T : Date.now();
        const isBuyerMaker = !!msg.m;
        if (!Number.isFinite(price) || !Number.isFinite(qty)) return;

        setTrades((prev) => {
          const next = [{ price, qty, time, isBuyerMaker }, ...prev];
          return next.slice(0, limit);
        });
      } catch {
        // ignore
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [pair, limit]);

  return trades;
}

