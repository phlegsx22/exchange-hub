import { Router, Response } from "express";
import { and, eq } from "drizzle-orm";
import {
  authMiddleware,
  requireAccountActive,
  requireCanWithdraw,
  requireKycApproved,
  requireVerified,
} from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";
import { assetNetworks, assets, chains, db, depositAddresses, withdrawals } from "../db/index.js";
import { randomUUID } from "node:crypto";
import { sendAdminNotificationEmail } from "../lib/email.js";

const router = Router();

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
      res.json({ ok: true, address: existing.address, memo: existing.memo ?? null, isPlaceholder: existing.address.startsWith("pending:") });
      return;
    }

    // Placeholder until we integrate a real address provider / custody system.
    const addr = `pending:${an.chainSlug}:${an.assetSymbol}:${req.user.id.slice(0, 8)}`;
    await db.insert(depositAddresses).values({
      userId: req.user.id,
      assetNetworkId,
      address: addr,
    });

    await sendAdminNotificationEmail({
      subject: "Deposit address generated",
      title: "User requested a deposit address",
      lines: [
        `User ID: ${req.user.id}`,
        `Email: ${req.user.email}`,
        `Asset: ${an.assetSymbol}`,
        `Network: ${an.chainSlug}`,
        `Address: ${addr}`,
      ],
    });

    res.status(201).json({ ok: true, address: addr, memo: null, isPlaceholder: true });
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

      const idempotencyKey = randomUUID();
      const [row] = await db
        .insert(withdrawals)
        .values({
          userId: req.user.id,
          assetNetworkId,
          amount: String(amount),
          fee: "0",
          toAddress,
          status: "pending",
          idempotencyKey,
        })
        .returning({
          id: withdrawals.id,
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
          `Network: ${an.chainSlug}`,
          `Amount: ${amount}`,
          `To address: ${toAddress}`,
          `Withdrawal ID: ${row?.id ?? "—"}`,
        ],
      });

      res.status(201).json({
        ok: true,
        withdrawal: {
          id: row?.id,
          status: row?.status ?? "pending",
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

