import { Contract, JsonRpcProvider, formatUnits, parseUnits } from "ethers";
import { and, eq, sql } from "drizzle-orm";
import {
  assetNetworks,
  assets,
  chains,
  db,
  depositAddresses,
  deposits,
  ledgerEntries,
} from "../db/index.js";
import { sendAdminNotificationEmail } from "../lib/email.js";

type AddressRow = {
  userId: string;
  assetNetworkId: string;
  address: string;
  assetSymbol: string;
  chainSlug: string;
  contractAddress: string | null;
  assetIsNative: boolean;
  decimals: number;
  isDepositEnabled: boolean;
};

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];
const DEFAULT_POLL_MS = Number(process.env.CHAIN_POLL_INTERVAL_MS ?? 60000);
const BTC_API_BASE = process.env.BTC_API_BASE ?? "https://blockstream.info/api";
const TRON_GRID_API_BASE = process.env.TRON_GRID_API_BASE ?? "https://api.trongrid.io";
const TRON_PRO_API_KEY = process.env.TRON_PRO_API_KEY ?? "";
const CONTRACT_FALLBACKS: Record<string, string> = {
  "USDT:ethereum": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  "USDC:ethereum": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "USDT:bsc": "0x55d398326f99059ff775485246999027b3197955",
  "USDC:bsc": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
  "USDT:base": "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  "USDC:base": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "USDT:arbitrum": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
  "USDC:arbitrum": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  "ARB:arbitrum": "0x912CE59144191C1204E64559FE8253a0e49E6548",
  "TRX:ethereum": "0x50327c6c5a14dcade707abad2e27eb517df87ab5",
  "USDT:tron": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  "USDC:tron": "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8",
};

const providers = new Map<string, JsonRpcProvider>();
const tokenDecimalsCache = new Map<string, number>();
let timer: NodeJS.Timeout | null = null;
let running = false;

function makeReceiptNo(prefix: "DPT"): string {
  return `${prefix}-${randomHex(16)}`;
}

function randomHex(len: number): string {
  const chars = "0123456789ABCDEF";
  let out = "";
  for (let i = 0; i < len; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function getRpcUrl(chainSlug: string): string | null {
  switch (chainSlug) {
    case "ethereum":
      return process.env.RPC_ETHEREUM_URL ?? null;
    case "bsc":
      return process.env.RPC_BSC_URL ?? null;
    case "base":
      return process.env.RPC_BASE_URL ?? null;
    case "arbitrum":
      return process.env.RPC_ARBITRUM_URL ?? null;
    default:
      return null;
  }
}

function getProvider(chainSlug: string): JsonRpcProvider | null {
  const url = getRpcUrl(chainSlug);
  if (!url) return null;
  const existing = providers.get(chainSlug);
  if (existing) return existing;
  const p = new JsonRpcProvider(url);
  providers.set(chainSlug, p);
  return p;
}

async function getBitcoinBalanceAtomic(address: string): Promise<bigint> {
  const res = await fetch(`${BTC_API_BASE}/address/${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error(`BTC API error: ${res.status}`);
  const data = (await res.json()) as {
    chain_stats?: { funded_txo_sum?: number; spent_txo_sum?: number };
    mempool_stats?: { funded_txo_sum?: number; spent_txo_sum?: number };
  };
  const funded =
    BigInt(Math.max(0, Number(data.chain_stats?.funded_txo_sum ?? 0))) +
    BigInt(Math.max(0, Number(data.mempool_stats?.funded_txo_sum ?? 0)));
  const spent =
    BigInt(Math.max(0, Number(data.chain_stats?.spent_txo_sum ?? 0))) +
    BigInt(Math.max(0, Number(data.mempool_stats?.spent_txo_sum ?? 0)));
  if (funded < spent) return 0n;
  return funded - spent; // satoshis
}

type TronAccountResponse = {
  data?: Array<{
    balance?: number;
    trc20?: Array<Record<string, string>>;
  }>;
};

async function getTronAccount(address: string): Promise<TronAccountResponse | null> {
  const headers: Record<string, string> = {};
  if (TRON_PRO_API_KEY) headers["TRON-PRO-API-KEY"] = TRON_PRO_API_KEY;
  const res = await fetch(`${TRON_GRID_API_BASE}/v1/accounts/${encodeURIComponent(address)}`, { headers });
  if (!res.ok) throw new Error(`TRON API error: ${res.status}`);
  return (await res.json()) as TronAccountResponse;
}

function normalizeHexAddress(address: string): string {
  return address.toLowerCase().trim();
}

async function getTronBalanceAtomic(row: AddressRow): Promise<bigint> {
  const account = await getTronAccount(row.address);
  const first = account?.data?.[0];
  if (!first) return 0n;

  // Native TRX is returned in SUN (1e6).
  if (!row.contractAddress) {
    const sun = BigInt(Math.max(0, Number(first.balance ?? 0)));
    return sun;
  }

  // TRC20 balances are returned as integer atomic strings keyed by contract address.
  const target = normalizeHexAddress(row.contractAddress);
  const trc20Rows = first.trc20 ?? [];
  for (const tokenMap of trc20Rows) {
    for (const [contract, bal] of Object.entries(tokenMap)) {
      if (normalizeHexAddress(contract) !== target) continue;
      try {
        return BigInt(bal);
      } catch {
        return 0n;
      }
    }
  }
  return 0n;
}

async function getTokenDecimals(row: AddressRow, provider: JsonRpcProvider): Promise<number> {
  if (!row.contractAddress) return row.decimals;
  const key = `${row.chainSlug}:${row.contractAddress.toLowerCase()}`;
  const cached = tokenDecimalsCache.get(key);
  if (typeof cached === "number" && Number.isFinite(cached)) return cached;
  try {
    const token = new Contract(row.contractAddress, ERC20_ABI, provider);
    const d = Number(await token.decimals());
    if (Number.isFinite(d) && d >= 0 && d <= 36) {
      tokenDecimalsCache.set(key, d);
      return d;
    }
  } catch {
    // fall back to configured asset decimals
  }
  tokenDecimalsCache.set(key, row.decimals);
  return row.decimals;
}

function resolveContractAddress(row: AddressRow): string | null {
  if (row.contractAddress) return row.contractAddress;
  const key = `${row.assetSymbol}:${row.chainSlug}`;
  return CONTRACT_FALLBACKS[key] ?? null;
}

async function getOnchainBalanceAtomic(row: AddressRow): Promise<{ balanceAtomic: bigint; decimals: number } | null> {
  const contractAddress = resolveContractAddress(row);
  // Safety: do NOT treat native chain balance as token balance.
  // If an asset is non-native, it must have a contract address for polling.
  if (!row.assetIsNative && !contractAddress) {
    return null;
  }

  if (row.chainSlug === "bitcoin") {
    const b = await getBitcoinBalanceAtomic(row.address);
    return { balanceAtomic: b, decimals: row.decimals };
  }
  if (row.chainSlug === "tron") {
    const b = await getTronBalanceAtomic(row);
    return { balanceAtomic: b, decimals: row.decimals };
  }

  // Free-RPC MVP currently supports EVM chains directly.
  const provider = getProvider(row.chainSlug);
  if (!provider) return null;

  if (!contractAddress) {
    const b = await provider.getBalance(row.address);
    return { balanceAtomic: b, decimals: row.decimals };
  }

  const token = new Contract(contractAddress, ERC20_ABI, provider);
  const bal = (await token.balanceOf(row.address)) as bigint;
  const decimals = await getTokenDecimals(
    {
      ...row,
      contractAddress,
    },
    provider
  );
  return { balanceAtomic: bal, decimals };
}

async function getLedgerBalanceAtomic(userId: string, assetNetworkId: string, decimals: number): Promise<bigint> {
  const [sumRow] = await db
    .select({
      total: sql<string | null>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .where(and(eq(ledgerEntries.userId, userId), eq(ledgerEntries.assetNetworkId, assetNetworkId)));
  const total = sumRow?.total ?? "0";
  try {
    return parseUnits(total, decimals);
  } catch {
    return 0n;
  }
}

async function creditDelta(row: AddressRow, deltaAtomic: bigint, onchainAtomic: bigint, decimals: number): Promise<void> {
  if (deltaAtomic <= 0n) return;
  const amount = formatUnits(deltaAtomic, decimals);
  const externalId = `poll:${row.address}:${onchainAtomic.toString()}`;
  const txHash = `poll_${row.chainSlug}_${row.address}_${onchainAtomic.toString()}`.slice(0, 128);

  // ledger balance after credit
  const ledgerAtomic = await getLedgerBalanceAtomic(row.userId, row.assetNetworkId, decimals);
  const balanceAfter = formatUnits(ledgerAtomic + deltaAtomic, decimals);

  try {
    const [dep] = await db
      .insert(deposits)
      .values({
        userId: row.userId,
        assetNetworkId: row.assetNetworkId,
        amount,
        txHash,
        fromAddress: row.address,
        confirmations: 1,
        status: "completed",
        externalId,
        receiptNo: makeReceiptNo("DPT"),
      })
      .returning({ id: deposits.id });

    if (!dep) return;

    await db.insert(ledgerEntries).values({
      userId: row.userId,
      assetNetworkId: row.assetNetworkId,
      amount,
      balanceAfter,
      type: "deposit",
      refType: "deposit",
      refId: dep.id,
      description: "Auto-detected on-chain deposit",
    });

    await sendAdminNotificationEmail({
      subject: "Deposit credited",
      title: "On-chain deposit credited",
      lines: [
        `User ID: ${row.userId}`,
        `Asset: ${row.assetSymbol}`,
        `Network: ${row.chainSlug}`,
        `Amount: ${amount}`,
        `Address: ${row.address}`,
      ],
    });
  } catch (err) {
    // duplicate unique keys are expected during race/retry; ignore
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("duplicate key") || msg.includes("unique")) return;
    console.error("[deposit-poller] credit failed:", err);
  }
}

async function debitToOnchain(row: AddressRow, deltaAtomic: bigint, decimals: number): Promise<void> {
  // deltaAtomic here is negative; convert to positive debit amount.
  const debitAtomic = -deltaAtomic;
  if (debitAtomic <= 0n) return;
  const amount = formatUnits(debitAtomic, decimals);
  const signedAmount = `-${amount}`;
  const ledgerAtomic = await getLedgerBalanceAtomic(row.userId, row.assetNetworkId, decimals);
  const nextAtomic = ledgerAtomic - debitAtomic;
  const balanceAfter = formatUnits(nextAtomic < 0n ? 0n : nextAtomic, decimals);

  await db.insert(ledgerEntries).values({
    userId: row.userId,
    assetNetworkId: row.assetNetworkId,
    amount: signedAmount,
    balanceAfter,
    type: "adjustment",
    refType: "onchain_reconcile",
    description: "On-chain balance decreased; synchronized ledger to current address balance",
  });
}

async function pollOnce(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const rows = await db
      .select({
        userId: depositAddresses.userId,
        assetNetworkId: depositAddresses.assetNetworkId,
        address: depositAddresses.address,
        assetSymbol: assets.symbol,
        chainSlug: chains.slug,
        contractAddress: assetNetworks.contractAddress,
        assetIsNative: assets.isNative,
        decimals: assets.decimals,
        isDepositEnabled: assetNetworks.isDepositEnabled,
      })
      .from(depositAddresses)
      .innerJoin(assetNetworks, eq(depositAddresses.assetNetworkId, assetNetworks.id))
      .innerJoin(assets, eq(assetNetworks.assetId, assets.id))
      .innerJoin(chains, eq(assetNetworks.chainId, chains.id));

    for (const row of rows) {
      try {
        const onchain = await getOnchainBalanceAtomic(row);
        if (onchain == null) continue; // unsupported chain in free-RPC MVP
        const ledgerAtomic = await getLedgerBalanceAtomic(row.userId, row.assetNetworkId, onchain.decimals);
        const delta = onchain.balanceAtomic - ledgerAtomic;
        if (delta > 0n) {
          await creditDelta(row, delta, onchain.balanceAtomic, onchain.decimals);
        } else if (delta < 0n) {
          await debitToOnchain(row, delta, onchain.decimals);
        }
      } catch (err) {
        console.error(
          `[deposit-poller] poll error user=${row.userId} chain=${row.chainSlug} asset=${row.assetSymbol}:`,
          err
        );
      }
    }
  } finally {
    running = false;
  }
}

export function startDepositPoller(): () => void {
  const interval = Number.isFinite(DEFAULT_POLL_MS) && DEFAULT_POLL_MS > 0 ? DEFAULT_POLL_MS : 60000;
  timer = setInterval(() => {
    void pollOnce();
  }, interval);
  console.log(`[deposit-poller] started (interval=${interval}ms)`);
  return () => {
    if (timer) clearInterval(timer);
    timer = null;
    providers.clear();
  };
}
