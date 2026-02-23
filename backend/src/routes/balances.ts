import { Router, Response } from "express";
import { authMiddleware, requireAccountActive, requireVerified } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";
import { db, assets, assetNetworks, ledgerEntries } from "../db/index.js";
import { eq, sql } from "drizzle-orm";

const router = Router();

/**
 * GET /balances
 * Return user's balances aggregated by asset symbol (across networks).
 *
 * MVP: returns 0 until deposits/trading are implemented.
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
      .where(eq(ledgerEntries.userId, req.user.id))
      .groupBy(assets.symbol);

    const balances: Record<string, number> = {};
    for (const r of rows) {
      const n = Number(r.balance ?? 0);
      balances[r.symbol] = Number.isFinite(n) ? n : 0;
    }

    res.json({ ok: true, balances });
  } catch (err) {
    console.error("Balances failed:", err);
    res.status(500).json({ error: "Failed to load balances", code: "SERVER_ERROR" });
  }
});

export default router;

