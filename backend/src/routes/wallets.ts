import { Router, Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import {
  authMiddleware,
  requireAccountActive,
  requireCanWithdraw,
  requireKycApproved,
  requireVerified,
} from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";
import { assetNetworks, assets, chains, db, depositAddresses, ledgerEntries, withdrawals } from "../db/index.js";
import { randomUUID } from "node:crypto";
import { sendAdminNotificationEmail } from "../lib/email.js";
import { getPriceUsd } from "../services/priceFeed.js";

const router = Router();

function makeReceiptNo(prefix: "WDL"): string {
  const raw = randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
  return `${prefix}-${raw}`;
}

function getWithdrawalFeeUsd(chainSlug: string): number {
  return chainSlug === "ethereum" ? 2 : 1;
}

function getPriceForFee(symbol: string): number | null {
  if (symbol === "USDT" || symbol === "USDC") return 1;
  return getPriceUsd(symbol)?.priceUsd ?? null;
}

router.get("/supported", authMiddleware, requireVerified, requireAccountActive, async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await db
      .select({
        id: assetNetworks.id,
        assetSymbol: assets.symbol,
        chainSlug: chains.slug,
        chainName: chains.name,
        contractAddress: assetNetworks.contractAddress,
        isDepositEnabled: assetNetworks.isDepositEnabled,
        isWithdrawEnabled: assetNetworks.isWithdrawEnabled,
      })
      .from(assetNetworks)
      .innerJoin(assets, eq(assetNetworks.assetId, assets.id))
      .innerJoin(chains, eq(assetNetworks.chainId, chains.id));

    res.json({ ok: true, assetNetworks: rows });
  } catch (err) {
    console.error("Supported networks failed:", err);
    res.status(500).json({ error: "Failed to load supported networks", code: "SERVER_ERROR" });
  }
});

router.get(
  "/deposit-addresses",
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
      const rows = await db
        .select({
          assetNetworkId: assetNetworks.id,
          assetSymbol: assets.symbol,
          chainSlug: chains.slug,
          chainName: chains.name,
          contractAddress: assetNetworks.contractAddress,
          isDepositEnabled: assetNetworks.isDepositEnabled,
          address: depositAddresses.address,
          memo: depositAddresses.memo,
        })
        .from(assetNetworks)
        .innerJoin(assets, eq(assetNetworks.assetId, assets.id))
        .innerJoin(chains, eq(assetNetworks.chainId, chains.id))
        .leftJoin(
          depositAddresses,
          and(eq(depositAddresses.userId, req.user.id), eq(depositAddresses.assetNetworkId, assetNetworks.id))
        )
        .where(eq(assetNetworks.isDepositEnabled, true));

      res.json({
        ok: true,
        addresses: rows
          .filter((r) => !!r.address)
          .map((r) => ({
            assetNetworkId: r.assetNetworkId,
            assetSymbol: r.assetSymbol,
            chainSlug: r.chainSlug,
            chainName: r.chainName,
            contractAddress: r.contractAddress,
            address: r.address!,
            memo: r.memo ?? null,
          })),
      });
    } catch (err) {
      console.error("Deposit addresses failed:", err);
      res.status(500).json({ error: "Failed to load deposit addresses", code: "SERVER_ERROR" });
    }
  }
);

router.post(
  "/deposit-address",
  authMiddleware,
  requireVerified,
  requireAccountActive,
  requireKycApproved,
  async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
    return;
  }
  const assetNetworkId = (req.body?.assetNetworkId as string | undefined) ?? "";
  if (!assetNetworkId) {
    res.status(400).json({ error: "assetNetworkId is required", code: "VALIDATION_FAILED" });
    return;
  }

  try {
    const [an] = await db
      .select({
        id: assetNetworks.id,
        assetSymbol: assets.symbol,
        chainSlug: chains.slug,
        isDepositEnabled: assetNetworks.isDepositEnabled,
      })
      .from(assetNetworks)
      .innerJoin(assets, eq(assetNetworks.assetId, assets.id))
      .innerJoin(chains, eq(assetNetworks.chainId, chains.id))
      .where(eq(assetNetworks.id, assetNetworkId))
      .limit(1);

    if (!an) {
      res.status(404).json({ error: "Unsupported asset network", code: "NOT_FOUND" });
      return;
    }
    if (!an.isDepositEnabled) {
      res.status(403).json({ error: "Deposits disabled for this network", code: "DEPOSIT_DISABLED" });
      return;
    }

    const existing = await db
      .select({ address: depositAddresses.address, memo: depositAddresses.memo })
      .from(depositAddresses)
      .where(and(eq(depositAddresses.userId, req.user.id), eq(depositAddresses.assetNetworkId, assetNetworkId)))
      .limit(1)
      .then((r) => r[0]);

    if (existing) {
      res.json({ ok: true, address: existing.address, memo: existing.memo ?? null, isPlaceholder: false });
      return;
    }

    await sendAdminNotificationEmail({
      subject: "Deposit address missing for user",
      title: "User attempted deposit without assigned address",
      lines: [
        `User ID: ${req.user.id}`,
        `Email: ${req.user.email}`,
        `Asset: ${an.assetSymbol}`,
        `Network: ${an.chainSlug}`,
      ],
    });

    res.status(404).json({
      error: "Deposit address not assigned yet. Please contact support.",
      code: "ADDRESS_NOT_SEEDED",
    });
  } catch (err) {
    console.error("Deposit address failed:", err);
    res.status(500).json({ error: "Failed to create deposit address", code: "SERVER_ERROR" });
  }
  }
);

router.post(
  "/withdrawals/request",
  authMiddleware,
  requireVerified,
  requireAccountActive,
  requireKycApproved,
  requireCanWithdraw,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
      return;
    }

    const assetNetworkId = (req.body?.assetNetworkId as string | undefined) ?? "";
    const toAddress = (req.body?.toAddress as string | undefined)?.trim() ?? "";
    const amountRaw = (req.body?.amount as string | number | undefined) ?? "";
    const amount = typeof amountRaw === "number" ? amountRaw : Number(amountRaw);

    if (!assetNetworkId || !toAddress || !Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: "Invalid withdrawal request payload", code: "VALIDATION_FAILED" });
      return;
    }

    try {
      const [an] = await db
        .select({
          id: assetNetworks.id,
          assetSymbol: assets.symbol,
          chainSlug: chains.slug,
          chainName: chains.name,
          isWithdrawEnabled: assetNetworks.isWithdrawEnabled,
        })
        .from(assetNetworks)
        .innerJoin(assets, eq(assetNetworks.assetId, assets.id))
        .innerJoin(chains, eq(assetNetworks.chainId, chains.id))
        .where(eq(assetNetworks.id, assetNetworkId))
        .limit(1);

      if (!an) {
        res.status(404).json({ error: "Unsupported asset network", code: "NOT_FOUND" });
        return;
      }
      if (!an.isWithdrawEnabled) {
        res.status(403).json({ error: "Withdrawals disabled for this network", code: "WITHDRAW_DISABLED" });
        return;
      }

      const feeUsd = getWithdrawalFeeUsd(an.chainSlug);
      const assetPriceUsd = getPriceForFee(an.assetSymbol);
      if (assetPriceUsd == null || assetPriceUsd <= 0) {
        res.status(503).json({
          error: `Price unavailable for ${an.assetSymbol}. Please try again shortly.`,
          code: "PRICE_UNAVAILABLE",
        });
        return;
      }
      const feeAmount = feeUsd / assetPriceUsd;
      const debitTotal = amount + feeAmount;

      const [ledgerRow] = await db
        .select({
          total: sql<string | null>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
        })
        .from(ledgerEntries)
        .where(and(eq(ledgerEntries.userId, req.user.id), eq(ledgerEntries.assetNetworkId, assetNetworkId)));
      const [pendingRow] = await db
        .select({
          total: sql<string | null>`COALESCE(SUM(${withdrawals.amount} + ${withdrawals.fee}), 0)`,
        })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.userId, req.user.id),
            eq(withdrawals.assetNetworkId, assetNetworkId),
            sql`${withdrawals.status} IN ('pending', 'processing')`
          )
        );
      const ledgerBal = Number(ledgerRow?.total ?? 0);
      const pendingHeld = Number(pendingRow?.total ?? 0);
      const spendable = ledgerBal - pendingHeld;
      if (!Number.isFinite(spendable) || spendable < debitTotal) {
        res.status(400).json({
          error: `Insufficient balance. Available ${Math.max(spendable, 0).toFixed(8)} ${an.assetSymbol}, required ${debitTotal.toFixed(8)} ${an.assetSymbol} (amount + fee).`,
          code: "INSUFFICIENT_BALANCE",
        });
        return;
      }

      const idempotencyKey = randomUUID();
      const [row] = await db
        .insert(withdrawals)
        .values({
          userId: req.user.id,
          assetNetworkId,
          amount: String(amount),
          fee: String(feeAmount),
          toAddress,
          status: "pending",
          idempotencyKey,
          receiptNo: makeReceiptNo("WDL"),
        })
        .returning({
          id: withdrawals.id,
          receiptNo: withdrawals.receiptNo,
          status: withdrawals.status,
          createdAt: withdrawals.createdAt,
        });

      await sendAdminNotificationEmail({
        subject: "New withdrawal request",
        title: "User requested withdrawal",
        lines: [
          `User ID: ${req.user.id}`,
          `Email: ${req.user.email}`,
          `Asset: ${an.assetSymbol}`,
          `Network: ${an.chainName} (${an.chainSlug})`,
          `Amount: ${amount}`,
          `Fee: ${feeAmount.toFixed(8)} ${an.assetSymbol} (~$${feeUsd.toFixed(2)})`,
          `Total debit: ${debitTotal.toFixed(8)} ${an.assetSymbol}`,
          `To address: ${toAddress}`,
          `Receipt No: ${row?.receiptNo ?? "—"}`,
          `Withdrawal ID: ${row?.id ?? "—"}`,
        ],
      });

      res.status(201).json({
        ok: true,
        withdrawal: {
          id: row?.id,
          receiptNo: row?.receiptNo,
          status: row?.status ?? "pending",
          feeUsd,
          feeAmount,
          totalDebitAmount: debitTotal,
          assetSymbol: an.assetSymbol,
          chainSlug: an.chainSlug,
          createdAt: row?.createdAt ?? new Date(),
        },
      });
    } catch (err) {
      console.error("Withdrawal request failed:", err);
      res.status(500).json({ error: "Failed to create withdrawal request", code: "SERVER_ERROR" });
    }
  }
);

export default router;

