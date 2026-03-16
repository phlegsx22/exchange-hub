import WebSocket from "ws";
import type { RawData } from "ws";

type PriceRow = {
  priceUsd: number;
  updatedAt: number;
};

const prices = new Map<string, PriceRow>();
let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

const BINANCE_WS_URL = "wss://stream.binance.com:9443/ws/!miniTicker@arr";
const RECONNECT_MS = 5000;

function setStableFallbacks(now: number): void {
  // For portfolio valuation fallback when stream is temporarily unavailable.
  for (const stable of ["USDT", "USDC"]) {
    if (!prices.has(stable)) prices.set(stable, { priceUsd: 1, updatedAt: now });
  }
}

function connect(): void {
  ws = new WebSocket(BINANCE_WS_URL);

  ws.on("open", () => {
    setStableFallbacks(Date.now());
    console.log("[price-feed] Binance miniTicker connected");
  });

  ws.on("message", (raw: RawData) => {
    try {
      const payload = JSON.parse(String(raw)) as Array<{ s: string; c: string }>;
      if (!Array.isArray(payload)) return;
      const now = Date.now();
      setStableFallbacks(now);
      for (const row of payload) {
        if (!row?.s || !row?.c) continue;
        if (!row.s.endsWith("USDT")) continue;
        const symbol = row.s.slice(0, -4);
        const p = Number(row.c);
        if (!Number.isFinite(p) || p <= 0) continue;
        prices.set(symbol, { priceUsd: p, updatedAt: now });
      }
    } catch {
      // ignore malformed frames
    }
  });

  ws.on("error", (err: Error) => {
    console.error("[price-feed] websocket error:", err);
  });

  ws.on("close", () => {
    console.warn("[price-feed] disconnected, reconnecting...");
    ws = null;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, RECONNECT_MS);
  });
}

export function startPriceFeed(): () => void {
  connect();
  return () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    ws?.close();
    ws = null;
  };
}

export function getPriceUsd(symbol: string): PriceRow | null {
  return prices.get(symbol.toUpperCase()) ?? null;
}

export function getPriceAgeMs(symbol: string): number | null {
  const row = getPriceUsd(symbol);
  if (!row) return null;
  return Date.now() - row.updatedAt;
}
