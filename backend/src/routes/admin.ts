import { Router, Response } from "express";
import { z } from "zod";
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
  kycSubmissions,
  deposits,
  withdrawals,
} from "../db/index.js";

const router = Router();

const kycReviewSchema = z.object({
  decision: z.enum(["under_review", "approved", "rejected"]),
  rejectionReason: z.string().max(2000).optional(),
  reviewNotes: z.string().max(4000).optional(),
});

const seedUserAddressesSchema = z.object({
  assetNetworkIds: z.array(z.string().uuid()).optional(),
});

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

const regularUsersWhere = eq(users.role, "user");

router.get(
  "/overview",
  authMiddleware,
  requireAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const [{ totalUsers }] = await db
        .select({ totalUsers: sql<number>`count(*)::int` })
        .from(users)
        .where(regularUsersWhere)
        .then((r) => r as unknown as { totalUsers: number }[]);

      const [{ activeWallets }] = await db
        .select({ activeWallets: sql<number>`count(*)::int` })
        .from(walletAccounts)
        .where(eq(walletAccounts.status, "active"))
        .then((r) => r as unknown as { activeWallets: number }[]);

      const [{ pendingKyc }] = await db
        .select({ pendingKyc: sql<number>`count(*)::int` })
        .from(users)
        .where(
          and(
            regularUsersWhere,
            or(eq(users.kycStatus, "pending"), eq(users.kycStatus, "under_review"))
          )
        )
        .then((r) => r as unknown as { pendingKyc: number }[]);

      const [{ blacklisted }] = await db
        .select({ blacklisted: sql<number>`count(*)::int` })
        .from(users)
        .where(and(regularUsersWhere, eq(users.accountStatus, "blacklisted")))
        .then((r) => r as unknown as { blacklisted: number }[]);

      const [{ suspended }] = await db
        .select({ suspended: sql<number>`count(*)::int` })
        .from(users)
        .where(and(regularUsersWhere, eq(users.accountStatus, "suspended")))
        .then((r) => r as unknown as { suspended: number }[]);

      res.json({
        ok: true,
        totalUsers: Number(totalUsers ?? 0),
        activeWallets: Number(activeWallets ?? 0),
        pendingKyc: Number(pendingKyc ?? 0),
        blacklisted: Number(blacklisted ?? 0),
        suspended: Number(suspended ?? 0),
      });
    } catch (err) {
      console.error("Admin overview failed:", err);
      res.status(500).json({ error: "Failed to load overview", code: "SERVER_ERROR" });
    }
  }
);

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
      const whereParts = [regularUsersWhere];

      if (q) {
        const like = `%${q}%`;
        const searchWhere = or(ilike(users.email, like), ilike(users.name, like), ilike(users.id, like));
        if (searchWhere) whereParts.push(searchWhere);
      }

      if (status && ["active", "suspended", "pending", "blacklisted"].includes(status)) {
        whereParts.push(eq(users.accountStatus, status as typeof users.accountStatus.enumValues[number]));
      }

      const where = and(...whereParts);

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

router.get(
  "/seed-options",
  authMiddleware,
  requireAdmin,
  async (_req: AuthRequest, res: Response) => {
    const options = SEED_ASSET_NETWORKS.map((an) => {
      const chain = SEED_CHAINS.find((c) => c.slug === an.chainSlug);
      const asset = SEED_ASSETS.find((a) => a.symbol === an.assetSymbol);
      return {
        assetSymbol: an.assetSymbol,
        assetName: asset?.name ?? an.assetSymbol,
        chainSlug: an.chainSlug,
        chainName: chain?.name ?? an.chainSlug,
        contractAddress: an.contractAddress ?? null,
      };
    });
    res.json({ ok: true, options });
  }
);

const seedSelectionSchema = z.object({
  items: z
    .array(
      z.object({
        assetSymbol: z.string().min(1).max(20),
        chainSlug: z.string().min(1).max(64),
        contractAddress: z.string().max(66).nullable().optional(),
      })
    )
    .min(1),
});

/**
 * POST /admin/bootstrap/asset-networks
 * Add only selected asset+network rows from admin UI.
 */
router.post(
  "/bootstrap/asset-networks",
  authMiddleware,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const parsed = seedSelectionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten(), code: "VALIDATION_FAILED" });
      return;
    }
    const selected = parsed.data.items;

    try {
      const chainSlugs = new Set(selected.map((s) => s.chainSlug));
      const assetSymbols = new Set(selected.map((s) => s.assetSymbol));

      for (const c of SEED_CHAINS.filter((x) => chainSlugs.has(x.slug))) {
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

      for (const a of SEED_ASSETS.filter((x) => assetSymbols.has(x.symbol))) {
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

      let added = 0;
      let skipped = 0;
      for (const row of selected) {
        const preset = SEED_ASSET_NETWORKS.find(
          (x) => x.assetSymbol === row.assetSymbol && x.chainSlug === row.chainSlug
        );
        const contractAddress = preset?.contractAddress ?? row.contractAddress ?? null;

        const chain = await db
          .select({ id: chains.id })
          .from(chains)
          .where(eq(chains.slug, row.chainSlug))
          .limit(1)
          .then((r) => r[0]);
        const asset = await db
          .select({ id: assets.id })
          .from(assets)
          .where(eq(assets.symbol, row.assetSymbol))
          .limit(1)
          .then((r) => r[0]);

        if (!chain || !asset) {
          skipped++;
          continue;
        }

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
            contractAddress,
          });
          added++;
        } else if (contractAddress) {
          await db
            .update(assetNetworks)
            .set({ contractAddress })
            .where(eq(assetNetworks.id, existing.id));
          skipped++;
        } else {
          skipped++;
        }
      }
      res.json({ ok: true, added, skipped });
    } catch (err) {
      console.error("Bootstrap asset networks failed:", err);
      res.status(500).json({ error: "Failed to add selected asset networks", code: "SERVER_ERROR" });
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

router.get(
  "/logs",
  authMiddleware,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
    const severity = typeof req.query.severity === "string" ? req.query.severity.trim().toLowerCase() : "all";
    const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
    const offsetRaw = typeof req.query.offset === "string" ? Number(req.query.offset) : 0;
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    try {
      const userEvents = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.role, "user"))
        .orderBy(desc(users.createdAt))
        .limit(120);

      const kycEvents = await db
        .select({
          id: kycSubmissions.id,
          status: kycSubmissions.status,
          submittedAt: kycSubmissions.submittedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(kycSubmissions)
        .innerJoin(users, eq(kycSubmissions.userId, users.id))
        .orderBy(desc(kycSubmissions.submittedAt))
        .limit(120);

      const depositEvents = await db
        .select({
          id: deposits.id,
          status: deposits.status,
          amount: deposits.amount,
          createdAt: deposits.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(deposits)
        .innerJoin(users, eq(deposits.userId, users.id))
        .orderBy(desc(deposits.createdAt))
        .limit(120);

      const withdrawalEvents = await db
        .select({
          id: withdrawals.id,
          status: withdrawals.status,
          amount: withdrawals.amount,
          createdAt: withdrawals.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(withdrawals)
        .innerJoin(users, eq(withdrawals.userId, users.id))
        .orderBy(desc(withdrawals.createdAt))
        .limit(120);

      const logs = [
        ...userEvents.map((e) => ({
          id: `usr-${e.id}`,
          timestamp: e.createdAt.toISOString(),
          action: "User registered",
          actor: "system",
          target: `${e.name} (${e.email})`,
          details: "New user account created",
          severity: "info" as const,
          ip: "—",
        })),
        ...kycEvents.map((e) => ({
          id: `kyc-${e.id}`,
          timestamp: e.submittedAt.toISOString(),
          action: `KYC ${e.status}`,
          actor: "user",
          target: `${e.userName} (${e.userEmail})`,
          details: `KYC submission status: ${e.status}`,
          severity: e.status === "rejected" ? ("warning" as const) : ("info" as const),
          ip: "—",
        })),
        ...depositEvents.map((e) => ({
          id: `dep-${e.id}`,
          timestamp: e.createdAt.toISOString(),
          action: `Deposit ${e.status}`,
          actor: "system",
          target: `${e.userName} (${e.userEmail})`,
          details: `Amount: ${String(e.amount)}`,
          severity:
            e.status === "failed" ? ("critical" as const) : e.status === "pending" ? ("warning" as const) : ("info" as const),
          ip: "—",
        })),
        ...withdrawalEvents.map((e) => ({
          id: `wd-${e.id}`,
          timestamp: e.createdAt.toISOString(),
          action: `Withdrawal ${e.status}`,
          actor: "system",
          target: `${e.userName} (${e.userEmail})`,
          details: `Amount: ${String(e.amount)}`,
          severity:
            e.status === "failed" ? ("critical" as const) : e.status === "pending" || e.status === "processing" ? ("warning" as const) : ("info" as const),
          ip: "—",
        })),
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .filter((l) => (severity === "all" ? true : l.severity === severity))
        .filter((l) =>
          q
            ? `${l.action} ${l.actor} ${l.target} ${l.details}`.toLowerCase().includes(q)
            : true
        );

      const paged = logs.slice(offset, offset + limit);
      const total = logs.length;
      const criticalCount = logs.filter((l) => l.severity === "critical").length;
      const warningCount = logs.filter((l) => l.severity === "warning").length;
      const todayCount = logs.filter(
        (l) => new Date(l.timestamp).toDateString() === new Date().toDateString()
      ).length;

      res.json({
        ok: true,
        logs: paged,
        total,
        limit,
        offset,
        stats: {
          critical: criticalCount,
          warning: warningCount,
          today: todayCount,
        },
      });
    } catch (err) {
      console.error("Admin logs failed:", err);
      res.status(500).json({ error: "Failed to load logs", code: "SERVER_ERROR" });
    }
  }
);

router.delete(
  "/asset-networks/:id",
  authMiddleware,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id;
    try {
      const [deleted] = await db
        .delete(assetNetworks)
        .where(eq(assetNetworks.id, id))
        .returning({ id: assetNetworks.id });

      if (!deleted) {
        res.status(404).json({ error: "Asset network not found", code: "NOT_FOUND" });
        return;
      }

      res.json({ ok: true, id: deleted.id });
    } catch (err) {
      console.error("Delete asset network failed:", err);
      res.status(500).json({ error: "Failed to delete asset network", code: "SERVER_ERROR" });
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

// --- Admin KYC review + post-approval seeding ---

router.get(
  "/kyc/submissions",
  authMiddleware,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
    const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
    const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
    const offsetRaw = typeof req.query.offset === "string" ? Number(req.query.offset) : 0;
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    try {
      const whereParts: Array<ReturnType<typeof eq>> = [];
      if (status && ["pending", "under_review", "approved", "rejected"].includes(status)) {
        whereParts.push(eq(kycSubmissions.status, status as typeof kycSubmissions.status.enumValues[number]));
      }

      const where =
        whereParts.length === 0
          ? undefined
          : whereParts.length === 1
            ? whereParts[0]
            : and(...whereParts);

      const rows = await db
        .select({
          id: kycSubmissions.id,
          userId: users.id,
          userEmail: users.email,
          userName: users.name,
          status: kycSubmissions.status,
          firstName: kycSubmissions.firstName,
          lastName: kycSubmissions.lastName,
          dateOfBirth: kycSubmissions.dateOfBirth,
          countryOfResidence: kycSubmissions.countryOfResidence,
          address: kycSubmissions.address,
          phoneNumber: kycSubmissions.phoneNumber,
          emergencyContactName: kycSubmissions.emergencyContactName,
          emergencyContactPhone: kycSubmissions.emergencyContactPhone,
          documentType: kycSubmissions.documentType,
          documentNumber: kycSubmissions.documentNumber,
          documentUrl: kycSubmissions.documentUrl,
          documentBackUrl: kycSubmissions.documentBackUrl,
          proofOfAddressUrl: kycSubmissions.proofOfAddressUrl,
          selfieUrl: kycSubmissions.selfieUrl,
          ocrConfidence: kycSubmissions.ocrConfidence,
          faceMatchScore: kycSubmissions.faceMatchScore,
          livenessScore: kycSubmissions.livenessScore,
          rejectionReason: kycSubmissions.rejectionReason,
          reviewNotes: kycSubmissions.reviewNotes,
          reviewedAt: kycSubmissions.reviewedAt,
          submittedAt: kycSubmissions.submittedAt,
        })
        .from(kycSubmissions)
        .innerJoin(users, eq(kycSubmissions.userId, users.id))
        .where(where)
        .orderBy(desc(kycSubmissions.submittedAt))
        .limit(limit)
        .offset(offset);

      const filtered = q
        ? rows.filter((r) =>
            `${r.userName} ${r.userEmail} ${r.firstName} ${r.lastName} ${r.documentNumber ?? ""}`
              .toLowerCase()
              .includes(q)
          )
        : rows;

      res.json({
        ok: true,
        submissions: filtered.map((r) => ({
          ...r,
          ocrConfidence: r.ocrConfidence == null ? null : Number(r.ocrConfidence),
          faceMatchScore: r.faceMatchScore == null ? null : Number(r.faceMatchScore),
          livenessScore: r.livenessScore == null ? null : Number(r.livenessScore),
        })),
        total: filtered.length,
        limit,
        offset,
      });
    } catch (err) {
      console.error("Admin list KYC submissions failed:", err);
      res.status(500).json({ error: "Failed to load KYC submissions", code: "SERVER_ERROR" });
    }
  }
);

router.patch(
  "/kyc/submissions/:id/review",
  authMiddleware,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
      return;
    }
    const parsed = kycReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
      return;
    }
    const { decision, rejectionReason, reviewNotes } = parsed.data;
    const submissionId = req.params.id;

    if (decision === "rejected" && !rejectionReason?.trim()) {
      res.status(400).json({ error: "Rejection reason is required", code: "VALIDATION_FAILED" });
      return;
    }

    try {
      const [existing] = await db
        .select({ id: kycSubmissions.id, userId: kycSubmissions.userId })
        .from(kycSubmissions)
        .where(eq(kycSubmissions.id, submissionId))
        .limit(1);
      if (!existing) {
        res.status(404).json({ error: "KYC submission not found", code: "NOT_FOUND" });
        return;
      }

      const [updated] = await db
        .update(kycSubmissions)
        .set({
          status: decision,
          rejectionReason: decision === "rejected" ? rejectionReason?.trim() ?? null : null,
          reviewNotes: reviewNotes?.trim() || null,
          reviewedAt: new Date(),
          reviewedBy: req.user.id,
          updatedAt: new Date(),
        })
        .where(eq(kycSubmissions.id, submissionId))
        .returning({
          id: kycSubmissions.id,
          userId: kycSubmissions.userId,
          status: kycSubmissions.status,
          rejectionReason: kycSubmissions.rejectionReason,
          reviewNotes: kycSubmissions.reviewNotes,
          reviewedAt: kycSubmissions.reviewedAt,
        });

      await db
        .update(users)
        .set({
          kycStatus: decision,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.userId));

      res.json({ ok: true, submission: updated });
    } catch (err) {
      console.error("Admin review KYC submission failed:", err);
      res.status(500).json({ error: "Failed to review KYC submission", code: "SERVER_ERROR" });
    }
  }
);

router.post(
  "/users/:id/seed-deposit-addresses",
  authMiddleware,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const userId = req.params.id;
    const parsed = seedUserAddressesSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
      return;
    }

    try {
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          role: users.role,
          kycStatus: users.kycStatus,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!user || user.role !== "user") {
        res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
        return;
      }
      if (user.kycStatus !== "approved") {
        res.status(403).json({
          error: "KYC must be approved before seeding deposit addresses",
          code: "KYC_NOT_APPROVED",
        });
        return;
      }

      const selectedIds = parsed.data.assetNetworkIds ?? [];
      const selectedSet = new Set(selectedIds);
      const options = await db
        .select({
          id: assetNetworks.id,
          coin: assets.symbol,
          chainSlug: chains.slug,
          isDepositEnabled: assetNetworks.isDepositEnabled,
        })
        .from(assetNetworks)
        .innerJoin(assets, eq(assetNetworks.assetId, assets.id))
        .innerJoin(chains, eq(assetNetworks.chainId, chains.id));

      const targets = options.filter(
        (o) =>
          o.isDepositEnabled &&
          (selectedSet.size === 0 || selectedSet.has(o.id))
      );
      if (targets.length === 0) {
        res.status(400).json({ error: "No eligible asset networks selected", code: "VALIDATION_FAILED" });
        return;
      }

      let createdWallets = 0;
      let createdAddresses = 0;
      let skipped = 0;

      for (const t of targets) {
        const [existingWallet] = await db
          .select({ id: walletAccounts.id })
          .from(walletAccounts)
          .where(and(eq(walletAccounts.userId, userId), eq(walletAccounts.assetNetworkId, t.id)))
          .limit(1);
        if (!existingWallet) {
          await db.insert(walletAccounts).values({
            userId,
            assetNetworkId: t.id,
            status: "active",
          });
          createdWallets += 1;
        }

        const [existingAddress] = await db
          .select({ id: depositAddresses.id })
          .from(depositAddresses)
          .where(and(eq(depositAddresses.userId, userId), eq(depositAddresses.assetNetworkId, t.id)))
          .limit(1);
        if (existingAddress) {
          skipped += 1;
          continue;
        }

        const address = `seed:${t.chainSlug}:${t.coin}:${userId.slice(0, 8)}:${t.id.slice(0, 8)}`;
        await db.insert(depositAddresses).values({
          userId,
          assetNetworkId: t.id,
          address,
        });
        createdAddresses += 1;
      }

      res.status(201).json({
        ok: true,
        userId,
        userName: user.name,
        createdWallets,
        createdAddresses,
        skipped,
      });
    } catch (err) {
      console.error("Seed deposit addresses failed:", err);
      res.status(500).json({ error: "Failed to seed deposit addresses", code: "SERVER_ERROR" });
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

