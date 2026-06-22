import "dotenv/config";
import express from "express";
import cors from "cors";
import type { Server } from "node:http";
import authRoutes from "./routes/auth.js";
import kycRoutes from "./routes/kyc.js";
import adminRoutes from "./routes/admin.js";
import balancesRoutes from "./routes/balances.js";
import walletsRoutes from "./routes/wallets.js";
import activityRoutes from "./routes/activity.js";
import tradeRoutes from "./routes/trade.js";
import { startPriceFeed } from "./services/priceFeed.js";

const app = express();
const PORT = process.env.PORT ?? process.env.API_PORT ?? process.env.SERVER_PORT ?? 3000;

const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  throw new Error("FRONTEND_URL is required (e.g. https://annex-ebank.com)");
}

function normalizeOrigin(o: string): string {
  const trimmed = o.endsWith("/") ? o.slice(0, -1) : o;
  try {
    // If a full URL is provided, normalize to its origin.
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
}

const allowedOrigin = normalizeOrigin(frontendUrl);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser tools (curl, server-to-server)
      if (!origin) return cb(null, true);

      const normalized = normalizeOrigin(origin);
      if (normalized === allowedOrigin) return cb(null, true);

      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/kyc", kycRoutes);
app.use("/admin", adminRoutes);
app.use("/balances", balancesRoutes);
app.use("/wallets", walletsRoutes);
app.use("/activity", activityRoutes);
app.use("/trade", tradeRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "exchange-hub-api" });
});

let stopPriceFeed: (() => void) | null = null;
let server: Server | null = null;
let shuttingDown = false;

function shutdown(): void {
  if (shuttingDown) return;
  shuttingDown = true;
  stopPriceFeed?.();
  stopPriceFeed = null;

  const forceExitMs = Number(process.env.SHUTDOWN_FORCE_EXIT_MS ?? 8000);
  const timeoutMs = Number.isFinite(forceExitMs) && forceExitMs > 0 ? forceExitMs : 8000;
  const forceTimer = setTimeout(() => {
    console.error(`[shutdown] forcing process exit after ${timeoutMs}ms`);
    process.exit(0);
  }, timeoutMs);

  if (!server) {
    clearTimeout(forceTimer);
    process.exit(0);
    return;
  }

  server.close(() => {
    clearTimeout(forceTimer);
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start background services asynchronously after HTTP server is up.
  setTimeout(() => {
    try {
      stopPriceFeed = startPriceFeed();
      console.log("[balances] admin-managed ledger mode enabled");
    } catch (err) {
      console.error("Background service bootstrap failed:", err);
    }
  }, 0);
});
