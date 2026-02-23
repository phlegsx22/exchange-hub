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

type SeedChain = {
  slug: string;
  name: string;
  chainId: number | null;
  nativeSymbol: string;
  isEvm: boolean;
};

type SeedAsset = {
  symbol: string;
  name: string;
  decimals: number;
  isNative: boolean;
};

type SeedAssetNetwork = {
  assetSymbol: string;
  chainSlug: string;
  contractAddress?: string | null;
};

const SEED_CHAINS: SeedChain[] = [
  { slug: "bitcoin", name: "Bitcoin", chainId: null, nativeSymbol: "BTC", isEvm: false },
  { slug: "ethereum", name: "Ethereum", chainId: 1, nativeSymbol: "ETH", isEvm: true },
  { slug: "tron", name: "Tron", chainId: null, nativeSymbol: "TRX", isEvm: false },
  { slug: "bsc", name: "BNB Smart Chain", chainId: 56, nativeSymbol: "BNB", isEvm: true },
  { slug: "base", name: "Base", chainId: 8453, nativeSymbol: "ETH", isEvm: true },
  { slug: "arbitrum", name: "Arbitrum One", chainId: 42161, nativeSymbol: "ETH", isEvm: true },
];

const SEED_ASSETS: SeedAsset[] = [
  { symbol: "BTC", name: "Bitcoin", decimals: 8, isNative: true },
  { symbol: "ETH", name: "Ethereum", decimals: 18, isNative: true },
  { symbol: "BNB", name: "BNB", decimals: 18, isNative: true },
  { symbol: "USDT", name: "Tether USD", decimals: 6, isNative: false },
  { symbol: "USDC", name: "USD Coin", decimals: 6, isNative: false },
  { symbol: "ARB", name: "Arbitrum", decimals: 18, isNative: false },
];

// NOTE: Contract addresses are commonly-known defaults; verify before production.
const SEED_ASSET_NETWORKS: SeedAssetNetwork[] = [
  { assetSymbol: "BTC", chainSlug: "bitcoin", contractAddress: null },
  // Ethereum native + stables
  { assetSymbol: "ETH", chainSlug: "ethereum", contractAddress: null },
  { assetSymbol: "USDT", chainSlug: "ethereum", contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7" }, // ERC20
  { assetSymbol: "USDC", chainSlug: "ethereum", contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },

  // Tron
  { assetSymbol: "USDT", chainSlug: "tron", contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" }, // TRC20

  // BSC native + stables
  { assetSymbol: "BNB", chainSlug: "bsc", contractAddress: null },
  { assetSymbol: "USDT", chainSlug: "bsc", contractAddress: "0x55d398326f99059ff775485246999027b3197955" }, // BEP20
  { assetSymbol: "USDC", chainSlug: "bsc", contractAddress: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d" }, // USDC on BSC

  // Base (ETH native + USDC)
  { assetSymbol: "ETH", chainSlug: "base", contractAddress: null },
  { assetSymbol: "USDC", chainSlug: "base", contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },

  // Arbitrum (ETH native + USDT/USDC/ARB)
  { assetSymbol: "ETH", chainSlug: "arbitrum", contractAddress: null },
  { assetSymbol: "USDT", chainSlug: "arbitrum", contractAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" },
  { assetSymbol: "USDC", chainSlug: "arbitrum", contractAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" }, // USDC (native) on Arbitrum
  { assetSymbol: "ARB", chainSlug: "arbitrum", contractAddress: "0x912CE59144191C1204E64559FE8253a0e49E6548" },
];

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

/**
 * POST /admin/bootstrap/asset-networks
 * Seed chains + assets + asset_networks for initial supported networks.
 */
router.post(
  "/bootstrap/asset-networks",
  authMiddleware,
  requireAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      // chains
      for (const c of SEED_CHAINS) {
        const existing = await db
          .select({ id: chains.id })
          .from(chains)
          .where(eq(chains.slug, c.slug))
          .limit(1)
          .then((r) => r[0]);
        if (!existing) {
          await db.insert(chains).values({
            slug: c.slug,
            name: c.name,
            chainId: c.chainId,
            nativeSymbol: c.nativeSymbol,
            isEvm: c.isEvm,
            isMainnet: true,
          });
        }
      }

      // assets
      for (const a of SEED_ASSETS) {
        const existing = await db
          .select({ id: assets.id })
          .from(assets)
          .where(eq(assets.symbol, a.symbol))
          .limit(1)
          .then((r) => r[0]);
        if (!existing) {
          await db.insert(assets).values({
            symbol: a.symbol,
            name: a.name,
            decimals: a.decimals,
            isNative: a.isNative,
          });
        }
      }

      // asset_networks
      for (const an of SEED_ASSET_NETWORKS) {
        const chain = await db
          .select({ id: chains.id })
          .from(chains)
          .where(eq(chains.slug, an.chainSlug))
          .limit(1)
          .then((r) => r[0]);
        const asset = await db
          .select({ id: assets.id })
          .from(assets)
          .where(eq(assets.symbol, an.assetSymbol))
          .limit(1)
          .then((r) => r[0]);

        if (!chain || !asset) continue;

        const existing = await db
          .select({ id: assetNetworks.id })
          .from(assetNetworks)
          .where(and(eq(assetNetworks.assetId, asset.id), eq(assetNetworks.chainId, chain.id)))
          .limit(1)
          .then((r) => r[0]);
        if (!existing) {
          await db.insert(assetNetworks).values({
            assetId: asset.id,
            chainId: chain.id,
            contractAddress: an.contractAddress ?? null,
          });
        } else if (an.contractAddress) {
          // if row exists but contract is missing, backfill it
          await db
            .update(assetNetworks)
            .set({ contractAddress: an.contractAddress })
            .where(eq(assetNetworks.id, existing.id));
        }
      }

      const count = await db
        .select({ count: sql<number>`count(*)` })
        .from(assetNetworks)
        .then((r) => (r as unknown as { count: number }[])[0]?.count ?? 0);

      res.json({ ok: true, assetNetworks: Number(count) });
    } catch (err) {
      console.error("Bootstrap asset networks failed:", err);
      res.status(500).json({ error: "Failed to bootstrap asset networks", code: "SERVER_ERROR" });
    }
  }
);

/**
 * GET /admin/asset-networks
 * List all asset networks for admin UI selection.
 */
router.get(
  "/asset-networks",
  authMiddleware,
  requireAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const rows = await db
        .select({
          id: assetNetworks.id,
          assetSymbol: assets.symbol,
          assetName: assets.name,
          chainSlug: chains.slug,
          chainName: chains.name,
          contractAddress: assetNetworks.contractAddress,
          isDepositEnabled: assetNetworks.isDepositEnabled,
          isWithdrawEnabled: assetNetworks.isWithdrawEnabled,
        })
        .from(assetNetworks)
        .innerJoin(assets, eq(assetNetworks.assetId, assets.id))
        .innerJoin(chains, eq(assetNetworks.chainId, chains.id))
        .orderBy(assets.symbol, chains.slug);

      res.json({ ok: true, assetNetworks: rows });
    } catch (err) {
      console.error("Admin list asset networks failed:", err);
      res.status(500).json({ error: "Failed to load asset networks", code: "SERVER_ERROR" });
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
    const assetNetworkId = (req.body?.assetNetworkId as string | undefined) ?? "";
    const coin = ((req.body?.coin as string | undefined) ?? "").toUpperCase();
    if (!userId) {
      res.status(400).json({ error: "Invalid userId", code: "VALIDATION_FAILED" });
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

      let selectedAssetNetworkId = assetNetworkId;
      if (selectedAssetNetworkId) {
        const exists = await db
          .select({ id: assetNetworks.id })
          .from(assetNetworks)
          .where(eq(assetNetworks.id, selectedAssetNetworkId))
          .limit(1)
          .then((r) => r[0]);
        if (!exists) selectedAssetNetworkId = "";
      }

      if (!selectedAssetNetworkId) {
        // Backward-compatible: allow coin-only (defaults to ethereum/bitcoin etc).
        const meta = DEFAULT_CHAIN_BY_SYMBOL[coin];
        if (!meta) {
          res.status(400).json({ error: "Invalid assetNetworkId or coin", code: "VALIDATION_FAILED" });
          return;
        }

        const chain = await db
          .select({ id: chains.id })
          .from(chains)
          .where(eq(chains.slug, meta.chainSlug))
          .limit(1)
          .then((r) => r[0]);
        const asset = await db
          .select({ id: assets.id })
          .from(assets)
          .where(eq(assets.symbol, coin))
          .limit(1)
          .then((r) => r[0]);

        if (!chain || !asset) {
          res.status(400).json({ error: "Asset network not found; seed it first", code: "VALIDATION_FAILED" });
          return;
        }

        const created = await db
          .select({ id: assetNetworks.id })
          .from(assetNetworks)
          .where(and(eq(assetNetworks.assetId, asset.id), eq(assetNetworks.chainId, chain.id)))
          .limit(1)
          .then((r) => r[0]);

        if (!created) {
          res.status(400).json({ error: "Asset network not found; seed it first", code: "VALIDATION_FAILED" });
          return;
        }
        selectedAssetNetworkId = created.id;
      }

      const existing = await db
        .select({ id: walletAccounts.id })
        .from(walletAccounts)
        .where(and(eq(walletAccounts.userId, userId), eq(walletAccounts.assetNetworkId, selectedAssetNetworkId)))
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
          assetNetworkId: selectedAssetNetworkId,
          status: "pending",
        })
        .returning({
          id: walletAccounts.id,
          status: walletAccounts.status,
          frozen: walletAccounts.frozen,
          createdAt: walletAccounts.createdAt,
        });

      const metaRow = await db
        .select({ chainSlug: chains.slug, coin: assets.symbol })
        .from(assetNetworks)
        .innerJoin(chains, eq(assetNetworks.chainId, chains.id))
        .innerJoin(assets, eq(assetNetworks.assetId, assets.id))
        .where(eq(assetNetworks.id, selectedAssetNetworkId))
        .limit(1)
        .then((r) => r[0]);

      // Placeholder deposit address for MVP (real address generation comes later).
      const addr = `pending:${metaRow?.chainSlug ?? "chain"}:${metaRow?.coin ?? "asset"}:${wallet.id.slice(0, 8)}`;
      await db.insert(depositAddresses).values({
        userId,
        assetNetworkId: selectedAssetNetworkId,
        address: addr,
      });

      res.status(201).json({
        ok: true,
        wallet: {
          id: wallet.id,
          userId,
          userName: u.name,
          coin: metaRow?.coin ?? coin,
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

