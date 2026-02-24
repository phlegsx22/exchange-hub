import { Router, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { authMiddleware, requireAccountActive, requireVerified } from "../middleware/auth.js";
import { db, ledgerEntries, assetNetworks, assets, chains } from "../db/index.js";
import { desc, eq } from "drizzle-orm";

const router = Router();

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

/**
 * GET /activity/recent?limit=10
 * Returns the user's most recent ledger entries (deposits/withdrawals/trades/etc).
 */
router.get(
  "/recent",
  authMiddleware,
  requireVerified,
  requireAccountActive,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
      return;
    }

    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query", code: "VALIDATION_FAILED" });
      return;
    }
    const { limit } = parsed.data;

    try {
      const rows = await db
        .select({
          id: ledgerEntries.id,
          type: ledgerEntries.type,
          amount: ledgerEntries.amount,
          description: ledgerEntries.description,
          createdAt: ledgerEntries.createdAt,
          assetSymbol: assets.symbol,
          chainSlug: chains.slug,
          chainName: chains.name,
        })
        .from(ledgerEntries)
        .innerJoin(assetNetworks, eq(ledgerEntries.assetNetworkId, assetNetworks.id))
        .innerJoin(assets, eq(assetNetworks.assetId, assets.id))
        .innerJoin(chains, eq(assetNetworks.chainId, chains.id))
        .where(eq(ledgerEntries.userId, req.user.id))
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(limit);

      res.json({
        ok: true,
        activity: rows.map((r) => {
          const amountStr = String(r.amount);
          const direction = amountStr.trim().startsWith("-") ? "out" : "in";
          const createdAt =
            r.createdAt instanceof Date ? r.createdAt.toISOString() : new Date(r.createdAt).toISOString();

          return {
            id: r.id,
            type: r.type,
            direction,
            amount: amountStr,
            assetSymbol: r.assetSymbol,
            chainSlug: r.chainSlug,
            chainName: r.chainName,
            description: r.description,
            createdAt,
          };
        }),
      });
    } catch (err) {
      console.error("Recent activity failed:", err);
      res.status(500).json({ error: "Failed to load activity", code: "SERVER_ERROR" });
    }
  }
);

export default router;

