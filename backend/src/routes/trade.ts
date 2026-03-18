import { Router, Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  assets,
  assetNetworks,
  db,
  demoTrades,
  demoTradingBalances,
  demoTransfers,
  ledgerEntries,
} from "../db/index.js";
import {
  authMiddleware,
  requireAccountActive,
  requireCanTrade,
  requireCanTransfer,
  requireKycApproved,
  requireVerified,
} from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";
import { getPriceUsd } from "../services/priceFeed.js";

const router = Router();
const MIN_TRADE_NOTIONAL_USD = 10;

function toNum(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function priceUsdForSymbol(symbol: string): number | null {
  const upper = symbol.trim().toUpperCase();
  if (upper === "USDT" || upper === "USDC") return 1;
  const p = getPriceUsd(upper)?.priceUsd ?? null;
  if (typeof p !== "number" || !Number.isFinite(p) || p <= 0) return null;
  return p;
}

async function getFundingBalanceBySymbol(userId: string, symbol: string): Promise<number> {
  const [row] = await db
    .select({
      total: sql<string | null>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .innerJoin(assetNetworks, eq(ledgerEntries.assetNetworkId, assetNetworks.id))
    .innerJoin(assets, eq(assetNetworks.assetId, assets.id))
    .where(and(eq(ledgerEntries.userId, userId), eq(assets.symbol, symbol)));
  return toNum(row?.total);
}

async function getDemoBalance(userId: string, symbol: string): Promise<number> {
  const [row] = await db
    .select({ balance: demoTradingBalances.balance })
    .from(demoTradingBalances)
    .where(and(eq(demoTradingBalances.userId, userId), eq(demoTradingBalances.assetSymbol, symbol)))
    .limit(1);
  return toNum(row?.balance);
}

router.get(
  "/portfolio",
  authMiddleware,
  requireVerified,
  requireAccountActive,
  requireKycApproved,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
      return;
    }
    try {
      const [balanceRows, tradeRows, transferRows] = await Promise.all([
        db
          .select({
            assetSymbol: demoTradingBalances.assetSymbol,
            balance: demoTradingBalances.balance,
          })
          .from(demoTradingBalances)
          .where(eq(demoTradingBalances.userId, req.user.id))
          .orderBy(desc(demoTradingBalances.updatedAt)),
        db
          .select({
            id: demoTrades.id,
            baseSymbol: demoTrades.baseSymbol,
            quoteSymbol: demoTrades.quoteSymbol,
            side: demoTrades.side,
            baseAmount: demoTrades.baseAmount,
            quoteAmount: demoTrades.quoteAmount,
            priceUsd: demoTrades.priceUsd,
            notionalUsd: demoTrades.notionalUsd,
            createdAt: demoTrades.createdAt,
          })
          .from(demoTrades)
          .where(eq(demoTrades.userId, req.user.id))
          .orderBy(desc(demoTrades.createdAt))
          .limit(50),
        db
          .select({
            id: demoTransfers.id,
            assetSymbol: demoTransfers.assetSymbol,
            amount: demoTransfers.amount,
            direction: demoTransfers.direction,
            createdAt: demoTransfers.createdAt,
          })
          .from(demoTransfers)
          .where(eq(demoTransfers.userId, req.user.id))
          .orderBy(desc(demoTransfers.createdAt))
          .limit(50),
      ]);

      const balances = balanceRows.reduce<Record<string, number>>((acc, r) => {
        acc[r.assetSymbol] = toNum(r.balance);
        return acc;
      }, {});

      res.json({
        ok: true,
        minTradeNotionalUsd: MIN_TRADE_NOTIONAL_USD,
        balances,
        trades: tradeRows.map((r) => ({
          id: r.id,
          baseSymbol: r.baseSymbol,
          quoteSymbol: r.quoteSymbol,
          side: r.side,
          baseAmount: toNum(r.baseAmount),
          quoteAmount: toNum(r.quoteAmount),
          priceUsd: toNum(r.priceUsd),
          notionalUsd: toNum(r.notionalUsd),
          createdAt: r.createdAt.toISOString(),
        })),
        transfers: transferRows.map((r) => ({
          id: r.id,
          assetSymbol: r.assetSymbol,
          amount: toNum(r.amount),
          direction: r.direction,
          createdAt: r.createdAt.toISOString(),
        })),
      });
    } catch (err) {
      console.error("Trade portfolio failed:", err);
      res.status(500).json({ error: "Failed to load trade portfolio", code: "SERVER_ERROR" });
    }
  }
);

router.post(
  "/transfer",
  authMiddleware,
  requireVerified,
  requireAccountActive,
  requireKycApproved,
  requireCanTransfer,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
      return;
    }
    const assetSymbol = String(req.body?.assetSymbol ?? "").trim().toUpperCase();
    const amount = toNum(req.body?.amount);
    const direction = String(req.body?.direction ?? "").trim().toLowerCase();
    if (!assetSymbol || !Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: "Invalid transfer payload", code: "VALIDATION_FAILED" });
      return;
    }
    if (direction !== "funding_to_trading" && direction !== "trading_to_funding") {
      res.status(400).json({ error: "Invalid transfer direction", code: "VALIDATION_FAILED" });
      return;
    }

    try {
      const [assetExists] = await db.select({ id: assets.id }).from(assets).where(eq(assets.symbol, assetSymbol)).limit(1);
      if (!assetExists) {
        res.status(404).json({ error: "Asset not supported", code: "NOT_FOUND" });
        return;
      }

      const [fundingBalance, tradingBalance] = await Promise.all([
        getFundingBalanceBySymbol(req.user.id, assetSymbol),
        getDemoBalance(req.user.id, assetSymbol),
      ]);

      if (direction === "funding_to_trading") {
        if (tradingBalance + amount > fundingBalance) {
          res.status(400).json({
            error: `Insufficient funding balance for transfer. Funding ${fundingBalance.toFixed(8)} ${assetSymbol}, trading already allocated ${tradingBalance.toFixed(8)} ${assetSymbol}.`,
            code: "INSUFFICIENT_BALANCE",
          });
          return;
        }
      } else if (tradingBalance < amount) {
        res.status(400).json({
          error: `Insufficient trading balance. Available ${tradingBalance.toFixed(8)} ${assetSymbol}.`,
          code: "INSUFFICIENT_BALANCE",
        });
        return;
      }

      const nextTradingBal = direction === "funding_to_trading" ? tradingBalance + amount : tradingBalance - amount;
      await db.transaction(async (tx) => {
        await tx
          .insert(demoTradingBalances)
          .values({
            userId: req.user!.id,
            assetSymbol,
            balance: String(nextTradingBal),
          })
          .onConflictDoUpdate({
            target: [demoTradingBalances.userId, demoTradingBalances.assetSymbol],
            set: { balance: String(nextTradingBal), updatedAt: new Date() },
          });

        await tx.insert(demoTransfers).values({
          userId: req.user!.id,
          assetSymbol,
          amount: String(amount),
          direction: direction as "funding_to_trading" | "trading_to_funding",
        });
      });

      res.status(201).json({
        ok: true,
        transfer: {
          assetSymbol,
          amount,
          direction,
          fundingBalance,
          tradingBalance: nextTradingBal,
        },
      });
    } catch (err) {
      console.error("Trade transfer failed:", err);
      res.status(500).json({ error: "Failed to transfer funds", code: "SERVER_ERROR" });
    }
  }
);

router.post(
  "/orders/market",
  authMiddleware,
  requireVerified,
  requireAccountActive,
  requireKycApproved,
  requireCanTrade,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
      return;
    }
    const side = String(req.body?.side ?? "").trim().toLowerCase();
    const baseSymbol = String(req.body?.baseSymbol ?? "").trim().toUpperCase();
    const quoteSymbol = String(req.body?.quoteSymbol ?? "USDT").trim().toUpperCase();
    const baseAmount = toNum(req.body?.baseAmount);
    if (!["buy", "sell"].includes(side) || !baseSymbol || !quoteSymbol || !Number.isFinite(baseAmount) || baseAmount <= 0) {
      res.status(400).json({ error: "Invalid order payload", code: "VALIDATION_FAILED" });
      return;
    }
    if (baseSymbol === quoteSymbol) {
      res.status(400).json({ error: "Invalid market pair", code: "VALIDATION_FAILED" });
      return;
    }

    const basePriceUsd = priceUsdForSymbol(baseSymbol);
    const quotePriceUsd = priceUsdForSymbol(quoteSymbol);
    if (!basePriceUsd || !quotePriceUsd) {
      res.status(503).json({ error: "Price feed unavailable for selected pair", code: "PRICE_UNAVAILABLE" });
      return;
    }

    const notionalUsd = baseAmount * basePriceUsd;
    if (notionalUsd < MIN_TRADE_NOTIONAL_USD) {
      res.status(400).json({
        error: `Minimum trade size is $${MIN_TRADE_NOTIONAL_USD.toFixed(2)} notional.`,
        code: "MIN_TRADE_NOTIONAL",
      });
      return;
    }
    const quoteAmount = notionalUsd / quotePriceUsd;

    try {
      const [baseBal, quoteBal] = await Promise.all([
        getDemoBalance(req.user.id, baseSymbol),
        getDemoBalance(req.user.id, quoteSymbol),
      ]);

      let nextBaseBal = baseBal;
      let nextQuoteBal = quoteBal;
      if (side === "buy") {
        if (quoteBal < quoteAmount) {
          res.status(400).json({
            error: `Insufficient ${quoteSymbol} in trading wallet. Available ${quoteBal.toFixed(8)} ${quoteSymbol}.`,
            code: "INSUFFICIENT_BALANCE",
          });
          return;
        }
        nextQuoteBal -= quoteAmount;
        nextBaseBal += baseAmount;
      } else {
        if (baseBal < baseAmount) {
          res.status(400).json({
            error: `Insufficient ${baseSymbol} in trading wallet. Available ${baseBal.toFixed(8)} ${baseSymbol}.`,
            code: "INSUFFICIENT_BALANCE",
          });
          return;
        }
        nextBaseBal -= baseAmount;
        nextQuoteBal += quoteAmount;
      }

      const [trade] = await db.transaction(async (tx) => {
        await tx
          .insert(demoTradingBalances)
          .values({
            userId: req.user!.id,
            assetSymbol: baseSymbol,
            balance: String(nextBaseBal),
          })
          .onConflictDoUpdate({
            target: [demoTradingBalances.userId, demoTradingBalances.assetSymbol],
            set: { balance: String(nextBaseBal), updatedAt: new Date() },
          });
        await tx
          .insert(demoTradingBalances)
          .values({
            userId: req.user!.id,
            assetSymbol: quoteSymbol,
            balance: String(nextQuoteBal),
          })
          .onConflictDoUpdate({
            target: [demoTradingBalances.userId, demoTradingBalances.assetSymbol],
            set: { balance: String(nextQuoteBal), updatedAt: new Date() },
          });

        return tx
          .insert(demoTrades)
          .values({
            userId: req.user!.id,
            baseSymbol,
            quoteSymbol,
            side: side as "buy" | "sell",
            baseAmount: String(baseAmount),
            quoteAmount: String(quoteAmount),
            priceUsd: String(basePriceUsd),
            quotePriceUsd: String(quotePriceUsd),
            notionalUsd: String(notionalUsd),
          })
          .returning({
            id: demoTrades.id,
            createdAt: demoTrades.createdAt,
          });
      });

      res.status(201).json({
        ok: true,
        trade: {
          id: trade?.id,
          side,
          baseSymbol,
          quoteSymbol,
          baseAmount,
          quoteAmount,
          priceUsd: basePriceUsd,
          notionalUsd,
          createdAt: trade?.createdAt?.toISOString() ?? new Date().toISOString(),
        },
        balances: {
          [baseSymbol]: nextBaseBal,
          [quoteSymbol]: nextQuoteBal,
        },
      });
    } catch (err) {
      console.error("Demo market order failed:", err);
      res.status(500).json({ error: "Failed to place demo order", code: "SERVER_ERROR" });
    }
  }
);

export default router;
