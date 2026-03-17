import WebSocket from "ws";
import type { RawData } from "ws";

type PriceRow = {
  priceUsd: number;
  updatedAt: number;
};

const prices = new Map<string, PriceRow>();
let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let stopped = false;

const DEFAULT_FEED_SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "ARBUSDT", "USDTUSDT", "USDCUSDT"];
const FEED_SYMBOLS = (process.env.PRICE_FEED_SYMBOLS ?? DEFAULT_FEED_SYMBOLS.join(","))
  .split(",")
  .map((s) => s.trim().toUpperCase())
  .filter((s) => /^[A-Z0-9]{5,20}$/.test(s));
const FEED_STREAMS = FEED_SYMBOLS.map((s) => `${s.toLowerCase()}@miniTicker`).join("/");
const BINANCE_WS_URL = `wss://stream.binance.com:9443/stream?streams=${FEED_STREAMS}`;
const RECONNECT_MS = Number(process.env.PRICE_FEED_RECONNECT_MS ?? 5000);

type StreamTicker = { s?: string; c?: string };
type StreamEnvelope = { stream?: string; data?: StreamTicker };

function handleTickerEvent(event: StreamTicker): void {
  if (!event?.s || !event?.c) return;
  if (!event.s.endsWith("USDT")) return;
  const symbol = event.s.slice(0, -4);
  const p = Number(event.c);
  if (!Number.isFinite(p) || p <= 0) return;
  prices.set(symbol, { priceUsd: p, updatedAt: Date.now() });
}

function setStableFallbacks(now: number): void {
  // For portfolio valuation fallback when stream is temporarily unavailable.
  for (const stable of ["USDT", "USDC"]) {
    if (!prices.has(stable)) prices.set(stable, { priceUsd: 1, updatedAt: now });
  }
}

function connect(): void {
  if (stopped) return;
  ws = new WebSocket(BINANCE_WS_URL);

  ws.on("open", () => {
    setStableFallbacks(Date.now());
    console.log(`[price-feed] Binance stream connected (${FEED_SYMBOLS.length} symbols)`);
  });

  ws.on("message", (raw: RawData) => {
    try {
      const payload = JSON.parse(String(raw)) as StreamEnvelope | StreamTicker | Array<StreamTicker>;
      setStableFallbacks(Date.now());

      if (Array.isArray(payload)) {
        for (const row of payload) handleTickerEvent(row);
        return;
      }

      if ("data" in payload && typeof payload === "object" && payload !== null && payload.data) {
        handleTickerEvent(payload.data);
        return;
      }

      handleTickerEvent(payload as StreamTicker);
    } catch {
      // ignore malformed frames
    }
  });

  ws.on("error", (err: Error) => {
    console.error("[price-feed] websocket error:", err);
  });

  ws.on("close", () => {
    if (stopped) return;
    console.warn("[price-feed] disconnected, reconnecting...");
    ws = null;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, Number.isFinite(RECONNECT_MS) && RECONNECT_MS > 0 ? RECONNECT_MS : 5000);
  });
}

export function startPriceFeed(): () => void {
  stopped = false;
  // Defer websocket bootstrap so API startup path stays fast/non-blocking.
  setTimeout(connect, 0);
  return () => {
    stopped = true;
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
