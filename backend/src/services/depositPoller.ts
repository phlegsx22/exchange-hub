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
  decimals: number;
  isDepositEnabled: boolean;
};

const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];
const DEFAULT_POLL_MS = Number(process.env.CHAIN_POLL_INTERVAL_MS ?? 60000);
const BTC_API_BASE = process.env.BTC_API_BASE ?? "https://blockstream.info/api";
const TRON_GRID_API_BASE = process.env.TRON_GRID_API_BASE ?? "https://api.trongrid.io";
const TRON_PRO_API_KEY = process.env.TRON_PRO_API_KEY ?? "";

const providers = new Map<string, JsonRpcProvider>();
let timer: NodeJS.Timeout | null = null;
let running = false;

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

async function getOnchainBalanceAtomic(row: AddressRow): Promise<bigint | null> {
  if (row.chainSlug === "bitcoin") {
    return getBitcoinBalanceAtomic(row.address);
  }
  if (row.chainSlug === "tron") {
    return getTronBalanceAtomic(row);
  }

  // Free-RPC MVP currently supports EVM chains directly.
  const provider = getProvider(row.chainSlug);
  if (!provider) return null;

  if (!row.contractAddress) {
    return provider.getBalance(row.address);
  }

  const token = new Contract(row.contractAddress, ERC20_ABI, provider);
  const bal = (await token.balanceOf(row.address)) as bigint;
  return bal;
}

async function getCreditedAtomic(userId: string, assetNetworkId: string, decimals: number): Promise<bigint> {
  const [sumRow] = await db
    .select({
      total: sql<string | null>`COALESCE(SUM(${deposits.amount}), 0)`,
    })
    .from(deposits)
    .where(and(eq(deposits.userId, userId), eq(deposits.assetNetworkId, assetNetworkId), eq(deposits.status, "completed")));

  const total = sumRow?.total ?? "0";
  try {
    return parseUnits(total, decimals);
  } catch {
    return 0n;
  }
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

async function creditDelta(row: AddressRow, deltaAtomic: bigint, onchainAtomic: bigint): Promise<void> {
  if (deltaAtomic <= 0n) return;
  const amount = formatUnits(deltaAtomic, row.decimals);
  const externalId = `poll:${row.address}:${onchainAtomic.toString()}`;
  const txHash = `poll_${row.chainSlug}_${row.address}_${onchainAtomic.toString()}`.slice(0, 128);

  // ledger balance after credit
  const ledgerAtomic = await getLedgerBalanceAtomic(row.userId, row.assetNetworkId, row.decimals);
  const balanceAfter = formatUnits(ledgerAtomic + deltaAtomic, row.decimals);

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
        decimals: assets.decimals,
        isDepositEnabled: assetNetworks.isDepositEnabled,
      })
      .from(depositAddresses)
      .innerJoin(assetNetworks, eq(depositAddresses.assetNetworkId, assetNetworks.id))
      .innerJoin(assets, eq(assetNetworks.assetId, assets.id))
      .innerJoin(chains, eq(assetNetworks.chainId, chains.id));

    for (const row of rows) {
      if (!row.isDepositEnabled) continue;
      try {
        const onchainAtomic = await getOnchainBalanceAtomic(row);
        if (onchainAtomic == null) continue; // unsupported chain in free-RPC MVP
        const creditedAtomic = await getCreditedAtomic(row.userId, row.assetNetworkId, row.decimals);
        const delta = onchainAtomic - creditedAtomic;
        if (delta > 0n) {
          await creditDelta(row, delta, onchainAtomic);
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
