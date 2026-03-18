import { Router, Response } from "express";
import { authMiddleware, requireAccountActive, requireVerified } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";
import { db, assets, assetNetworks, depositAddresses, ledgerEntries } from "../db/index.js";
import { and, eq, sql } from "drizzle-orm";
import { getPriceAgeMs, getPriceUsd } from "../services/priceFeed.js";

const router = Router();

/**
 * GET /balances
 * Return user's balances + live valuation using cached Binance prices.
 */
router.get("/", authMiddleware, requireVerified, requireAccountActive, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
    return;
  }

  try {
    const rows = await db
      .select({
        symbol: assets.symbol,
        balance: sql<string | null>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
      })
      .from(ledgerEntries)
      .innerJoin(assetNetworks, eq(ledgerEntries.assetNetworkId, assetNetworks.id))
      .innerJoin(assets, eq(assetNetworks.assetId, assets.id))
      .innerJoin(
        depositAddresses,
        and(
          eq(depositAddresses.userId, ledgerEntries.userId),
          eq(depositAddresses.assetNetworkId, ledgerEntries.assetNetworkId)
        )
      )
      .where(eq(ledgerEntries.userId, req.user.id))
      .groupBy(assets.symbol);

    const balances: Record<string, number> = {};
    const items: Array<{
      symbol: string;
      balance: number;
      priceUsd: number | null;
      valueUsd: number | null;
      priceUpdatedAt: string | null;
      priceStale: boolean;
    }> = [];

    let totalValueUsd = 0;
    for (const r of rows) {
      const n = Number(r.balance ?? 0);
      const balance = Number.isFinite(n) ? n : 0;
      balances[r.symbol] = balance;

      const p = getPriceUsd(r.symbol);
      const age = getPriceAgeMs(r.symbol);
      const stale = age == null ? true : age > 15_000;
      const priceUsd = p?.priceUsd ?? null;
      const valueUsd = priceUsd == null ? null : balance * priceUsd;
      if (valueUsd != null && Number.isFinite(valueUsd)) totalValueUsd += valueUsd;

      items.push({
        symbol: r.symbol,
        balance,
        priceUsd,
        valueUsd,
        priceUpdatedAt: p ? new Date(p.updatedAt).toISOString() : null,
        priceStale: stale,
      });
    }

    res.json({
      ok: true,
      balances, // keep backward compatibility for existing frontend hooks
      portfolio: {
        totalValueUsd,
        items,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Balances failed:", err);
    res.status(500).json({ error: "Failed to load balances", code: "SERVER_ERROR" });
  }
});

export default router;

