import { Router, Response } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { requireAdmin, authMiddleware } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  db,
  users,
  assets,
  chains,
  assetNetworks,
  depositAddresses,
  ledgerEntries,
  walletAccounts,
} from "../db/index.js";

const router = Router();

const DEFAULT_CHAIN_BY_SYMBOL: Record<string, { chainSlug: string; chainName: string; nativeSymbol: string; isEvm: boolean; chainId?: number; contractAddress?: string | null }> = {
  BTC: { chainSlug: "bitcoin", chainName: "Bitcoin", nativeSymbol: "BTC", isEvm: false },
  ETH: { chainSlug: "ethereum", chainName: "Ethereum", nativeSymbol: "ETH", isEvm: true, chainId: 1 },
  USDT: {
    chainSlug: "ethereum",
    chainName: "Ethereum",
    nativeSymbol: "ETH",
    isEvm: true,
    chainId: 1,
    contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
  SOL: { chainSlug: "solana", chainName: "Solana", nativeSymbol: "SOL", isEvm: false },
  XRP: { chainSlug: "ripple", chainName: "XRP Ledger", nativeSymbol: "XRP", isEvm: false },
  BNB: { chainSlug: "bsc", chainName: "BNB Smart Chain", nativeSymbol: "BNB", isEvm: true, chainId: 56 },
  ADA: { chainSlug: "cardano", chainName: "Cardano", nativeSymbol: "ADA", isEvm: false },
  DOGE: { chainSlug: "dogecoin", chainName: "Dogecoin", nativeSymbol: "DOGE", isEvm: false },
};

function toAdminUserRow(u: {
  id: string;
  email: string;
  name: string;
  accountStatus: "active" | "suspended" | "pending" | "blacklisted";
  kycStatus: "none" | "pending" | "under_review" | "approved" | "rejected";
  createdAt: Date;
  lastLoginAt: Date | null;
  canTrade: boolean;
  canWithdraw: boolean;
  canTransfer: boolean;
  canMargin: boolean;
  canFutures: boolean;
  canStaking: boolean;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    status: u.accountStatus,
    kycStatus:
      u.kycStatus === "approved"
        ? "verified"
        : u.kycStatus === "none"
          ? "not_started"
          : u.kycStatus,
    joinDate: u.createdAt.toISOString().slice(0, 10),
    lastLogin: u.lastLoginAt ? `${u.lastLoginAt.toISOString()}` : "—",
    totalBalance: 0,
    tradeCount: 0,
    country: "—",
    riskScore: 0,
    features: {
      trading: u.canTrade,
      withdrawal: u.canWithdraw,
      transfer: u.canTransfer,
      margin: u.canMargin,
      futures: u.canFutures,
      staking: u.canStaking,
    },
  };
}

router.get(
  "/users",
  authMiddleware,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
    const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
    const offsetRaw = typeof req.query.offset === "string" ? Number(req.query.offset) : 0;
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    try {
      const whereParts = [];

      if (q) {
        const like = `%${q}%`;
        whereParts.push(or(ilike(users.email, like), ilike(users.name, like), ilike(users.id, like)));
      }

      if (status && ["active", "suspended", "pending", "blacklisted"].includes(status)) {
        whereParts.push(eq(users.accountStatus, status as typeof users.accountStatus.enumValues[number]));
      }

      const where =
        whereParts.length === 0
          ? undefined
          : whereParts.length === 1
            ? whereParts[0]
            : and(...whereParts);

      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          accountStatus: users.accountStatus,
          kycStatus: users.kycStatus,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
          canTrade: users.canTrade,
          canWithdraw: users.canWithdraw,
          canTransfer: users.canTransfer,
          canMargin: users.canMargin,
          canFutures: users.canFutures,
          canStaking: users.canStaking,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(where)
        .then((r) => r as unknown as { count: number }[]);

      res.json({
        ok: true,
        users: rows.map((u) => toAdminUserRow(u)),
        total: Number(count ?? 0),
        limit,
        offset,
      });
    } catch (err) {
      console.error("Admin list users failed:", err);
      res.status(500).json({ error: "Failed to load users", code: "SERVER_ERROR" });
    }
  }
);

router.patch(
  "/users/:id/status",
  authMiddleware,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id;
    const status = (req.body?.status as string | undefined) ?? "";
    if (!["active", "suspended", "pending", "blacklisted"].includes(status)) {
      res.status(400).json({ error: "Invalid status", code: "VALIDATION_FAILED" });
      return;
    }

    try {
      const [u] = await db
        .update(users)
        .set({ accountStatus: status as typeof users.accountStatus.enumValues[number], updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          accountStatus: users.accountStatus,
          kycStatus: users.kycStatus,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
          canTrade: users.canTrade,
          canWithdraw: users.canWithdraw,
          canTransfer: users.canTransfer,
          canMargin: users.canMargin,
          canFutures: users.canFutures,
          canStaking: users.canStaking,
        });

      if (!u) {
        res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
        return;
      }

      res.json({ ok: true, user: toAdminUserRow(u) });
    } catch (err) {
      console.error("Admin update status failed:", err);
      res.status(500).json({ error: "Failed to update status", code: "SERVER_ERROR" });
    }
  }
);

router.patch(
  "/users/:id/features",
  authMiddleware,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id;
    const features = (req.body?.features as Partial<{
      trading: boolean;
      withdrawal: boolean;
      transfer: boolean;
      margin: boolean;
      futures: boolean;
      staking: boolean;
    }> | undefined) ?? {};

    const patch: Partial<{
      canTrade: boolean;
      canWithdraw: boolean;
      canTransfer: boolean;
      canMargin: boolean;
      canFutures: boolean;
      canStaking: boolean;
    }> = {};

    if (typeof features.trading === "boolean") patch.canTrade = features.trading;
    if (typeof features.withdrawal === "boolean") patch.canWithdraw = features.withdrawal;
    if (typeof features.transfer === "boolean") patch.canTransfer = features.transfer;
    if (typeof features.margin === "boolean") patch.canMargin = features.margin;
    if (typeof features.futures === "boolean") patch.canFutures = features.futures;
    if (typeof features.staking === "boolean") patch.canStaking = features.staking;

    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "No features provided", code: "VALIDATION_FAILED" });
      return;
    }

    try {
      const [u] = await db
        .update(users)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          accountStatus: users.accountStatus,
          kycStatus: users.kycStatus,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
          canTrade: users.canTrade,
          canWithdraw: users.canWithdraw,
          canTransfer: users.canTransfer,
          canMargin: users.canMargin,
          canFutures: users.canFutures,
          canStaking: users.canStaking,
        });

      if (!u) {
        res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
        return;
      }

      res.json({ ok: true, user: toAdminUserRow(u) });
    } catch (err) {
      console.error("Admin update features failed:", err);
      res.status(500).json({ error: "Failed to update features", code: "SERVER_ERROR" });
    }
  }
);

// --- Admin Wallets (MVP) ---

router.get(
  "/wallets",
  authMiddleware,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const coin = typeof req.query.coin === "string" ? req.query.coin.trim().toUpperCase() : "";
    const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 100;
    const offsetRaw = typeof req.query.offset === "string" ? Number(req.query.offset) : 0;
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 100;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    try {
      const whereParts = [];
      if (q) {
        const like = `%${q}%`;
        whereParts.push(or(ilike(users.name, like), ilike(users.email, like), ilike(users.id, like), ilike(depositAddresses.address, like)));
      }
      if (coin) {
        whereParts.push(eq(assets.symbol, coin));
      }
      const where =
        whereParts.length === 0
          ? undefined
          : whereParts.length === 1
            ? whereParts[0]
            : and(...whereParts);

      const rows = await db
        .select({
          walletId: walletAccounts.id,
          status: walletAccounts.status,
          frozen: walletAccounts.frozen,
          userId: users.id,
          userName: users.name,
          coin: assets.symbol,
          address: depositAddresses.address,
          createdAt: walletAccounts.createdAt,
          balance: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
        })
        .from(walletAccounts)
        .innerJoin(users, eq(walletAccounts.userId, users.id))
        .innerJoin(assetNetworks, eq(walletAccounts.assetNetworkId, assetNetworks.id))
        .innerJoin(assets, eq(assetNetworks.assetId, assets.id))
        .leftJoin(
          depositAddresses,
          and(
            eq(depositAddresses.userId, walletAccounts.userId),
            eq(depositAddresses.assetNetworkId, walletAccounts.assetNetworkId)
          )
        )
        .leftJoin(
          ledgerEntries,
          and(eq(ledgerEntries.userId, walletAccounts.userId), eq(ledgerEntries.assetNetworkId, walletAccounts.assetNetworkId))
        )
        .where(where)
        .groupBy(
          walletAccounts.id,
          walletAccounts.status,
          walletAccounts.frozen,
          users.id,
          users.name,
          assets.symbol,
          depositAddresses.address,
          walletAccounts.createdAt
        )
        .orderBy(desc(walletAccounts.createdAt))
        .limit(limit)
        .offset(offset);

      const wallets = rows.map((r) => {
        const bal = Number(r.balance ?? 0);
        const frz = Number(r.frozen ?? 0);
        return {
          id: r.walletId,
          userId: r.userId,
          userName: r.userName,
          coin: r.coin,
          balance: Number.isFinite(bal) ? bal : 0,
          frozen: Number.isFinite(frz) ? frz : 0,
          address: r.address ?? "—",
          status: r.status,
          createdAt: r.createdAt.toISOString().slice(0, 10),
        };
      });

      res.json({ ok: true, wallets, limit, offset });
    } catch (err) {
      console.error("Admin list wallets failed:", err);
      res.status(500).json({ error: "Failed to load wallets", code: "SERVER_ERROR" });
    }
  }
);

router.post(
  "/wallets",
  authMiddleware,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const userId = (req.body?.userId as string | undefined) ?? "";
    const coin = ((req.body?.coin as string | undefined) ?? "").toUpperCase();
    const meta = DEFAULT_CHAIN_BY_SYMBOL[coin];
    if (!userId || !meta) {
      res.status(400).json({ error: "Invalid userId or coin", code: "VALIDATION_FAILED" });
      return;
    }

    try {
      const [u] = await db.select({ id: users.id, name: users.name, accountStatus: users.accountStatus }).from(users).where(eq(users.id, userId)).limit(1);
      if (!u) {
        res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
        return;
      }
      if (u.accountStatus === "blacklisted") {
        res.status(400).json({ error: "Cannot create wallet for blacklisted user", code: "VALIDATION_FAILED" });
        return;
      }

      let chain = await db
        .select({ id: chains.id })
        .from(chains)
        .where(eq(chains.slug, meta.chainSlug))
        .limit(1)
        .then((r) => r[0]);
      if (!chain) {
        chain = await db
          .insert(chains)
          .values({
            slug: meta.chainSlug,
            name: meta.chainName,
            chainId: meta.chainId ?? null,
            nativeSymbol: meta.nativeSymbol,
            isEvm: meta.isEvm,
            isMainnet: true,
          })
          .returning({ id: chains.id })
          .then((r) => r[0]);
      }

      let asset = await db
        .select({ id: assets.id })
        .from(assets)
        .where(eq(assets.symbol, coin))
        .limit(1)
        .then((r) => r[0]);
      if (!asset) {
        asset = await db
          .insert(assets)
          .values({
            symbol: coin,
            name: coin,
            decimals: coin === "BTC" ? 8 : coin === "USDT" ? 6 : 18,
            isNative: coin !== "USDT",
          })
          .returning({ id: assets.id })
          .then((r) => r[0]);
      }

      let an = await db
        .select({ id: assetNetworks.id })
        .from(assetNetworks)
        .where(and(eq(assetNetworks.assetId, asset.id), eq(assetNetworks.chainId, chain.id)))
        .limit(1)
        .then((r) => r[0]);
      if (!an) {
        an = await db
          .insert(assetNetworks)
          .values({
            assetId: asset.id,
            chainId: chain.id,
            contractAddress: meta.contractAddress ?? null,
          })
          .returning({ id: assetNetworks.id })
          .then((r) => r[0]);
      }

      const existing = await db
        .select({ id: walletAccounts.id })
        .from(walletAccounts)
        .where(and(eq(walletAccounts.userId, userId), eq(walletAccounts.assetNetworkId, an.id)))
        .limit(1)
        .then((r) => r[0]);
      if (existing) {
        res.status(409).json({ error: "Wallet already exists", code: "ALREADY_EXISTS" });
        return;
      }

      const [wallet] = await db
        .insert(walletAccounts)
        .values({
          userId,
          assetNetworkId: an.id,
          status: "pending",
        })
        .returning({
          id: walletAccounts.id,
          status: walletAccounts.status,
          frozen: walletAccounts.frozen,
          createdAt: walletAccounts.createdAt,
        });

      // Placeholder deposit address for MVP (real address generation comes later).
      const addr = `pending:${meta.chainSlug}:${coin}:${wallet.id.slice(0, 8)}`;
      await db.insert(depositAddresses).values({
        userId,
        assetNetworkId: an.id,
        address: addr,
      });

      res.status(201).json({
        ok: true,
        wallet: {
          id: wallet.id,
          userId,
          userName: u.name,
          coin,
          balance: 0,
          frozen: 0,
          address: addr,
          status: wallet.status,
          createdAt: wallet.createdAt.toISOString().slice(0, 10),
        },
      });
    } catch (err) {
      console.error("Admin create wallet failed:", err);
      res.status(500).json({ error: "Failed to create wallet", code: "SERVER_ERROR" });
    }
  }
);

router.patch(
  "/wallets/:id/status",
  authMiddleware,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id;
    const status = (req.body?.status as string | undefined) ?? "";
    if (!["active", "frozen", "pending"].includes(status)) {
      res.status(400).json({ error: "Invalid status", code: "VALIDATION_FAILED" });
      return;
    }

    try {
      const [w] = await db
        .update(walletAccounts)
        .set({ status: status as typeof walletAccounts.status.enumValues[number], updatedAt: new Date() })
        .where(eq(walletAccounts.id, id))
        .returning({
          id: walletAccounts.id,
          userId: walletAccounts.userId,
          assetNetworkId: walletAccounts.assetNetworkId,
          status: walletAccounts.status,
          frozen: walletAccounts.frozen,
          createdAt: walletAccounts.createdAt,
        });

      if (!w) {
        res.status(404).json({ error: "Wallet not found", code: "NOT_FOUND" });
        return;
      }

      // Rehydrate a UI-friendly wallet row
      const row = await db
        .select({
          userName: users.name,
          coin: assets.symbol,
          address: depositAddresses.address,
          balance: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
        })
        .from(users)
        .innerJoin(walletAccounts, eq(walletAccounts.userId, users.id))
        .innerJoin(assetNetworks, eq(walletAccounts.assetNetworkId, assetNetworks.id))
        .innerJoin(assets, eq(assetNetworks.assetId, assets.id))
        .leftJoin(
          depositAddresses,
          and(eq(depositAddresses.userId, walletAccounts.userId), eq(depositAddresses.assetNetworkId, walletAccounts.assetNetworkId))
        )
        .leftJoin(
          ledgerEntries,
          and(eq(ledgerEntries.userId, walletAccounts.userId), eq(ledgerEntries.assetNetworkId, walletAccounts.assetNetworkId))
        )
        .where(eq(walletAccounts.id, id))
        .groupBy(users.name, assets.symbol, depositAddresses.address)
        .limit(1)
        .then((r) => r[0]);

      res.json({
        ok: true,
        wallet: {
          id: w.id,
          userId: w.userId,
          userName: row?.userName ?? "—",
          coin: row?.coin ?? "—",
          balance: Number(row?.balance ?? 0) || 0,
          frozen: Number(w.frozen ?? 0) || 0,
          address: row?.address ?? "—",
          status: w.status,
          createdAt: w.createdAt.toISOString().slice(0, 10),
        },
      });
    } catch (err) {
      console.error("Admin update wallet status failed:", err);
      res.status(500).json({ error: "Failed to update wallet", code: "SERVER_ERROR" });
    }
  }
);

export default router;

