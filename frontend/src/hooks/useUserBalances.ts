import { useEffect, useMemo, useState } from "react";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_WATCHLIST } from "@/lib/tokens";

export type Balances = Record<string, number>;
export type PortfolioItem = {
  symbol: string;
  balance: number;
  priceUsd: number | null;
  valueUsd: number | null;
  priceUpdatedAt: string | null;
  priceStale: boolean;
};

export type PortfolioSummary = {
  totalValueUsd: number;
  items: PortfolioItem[];
  updatedAt: string;
};

function zeroBalances(symbols: string[]): Balances {
  return symbols.reduce((acc, s) => {
    acc[s] = 0;
    return acc;
  }, {} as Balances);
}

/**
 * Placeholder balances store.
 * New users logically start at $0 until they deposit.
 *
 * Later: replace this with a backend endpoint (e.g. GET /wallets) and keep this hook as the UI adapter.
 */
export function useUserBalances(symbols: string[] = DEFAULT_WATCHLIST) {
  const { user, accessToken } = useAuth();
  const userId = user?.id;

  const [remote, setRemote] = useState<Record<string, number> | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRemote(null);
    setPortfolio(null);
    if (!accessToken) return;

    fetch(`${API_BASE}/balances`, { headers: getAuthHeaders() })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
        return data as { balances?: Record<string, number>; portfolio?: PortfolioSummary };
      })
      .then((data) => {
        if (cancelled) return;
        setRemote(data.balances ?? {});
        setPortfolio(data.portfolio ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setRemote({});
        setPortfolio(null);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, userId]);

  const balances = useMemo(() => {
    const base = zeroBalances(symbols);
    if (!remote) return base;
    for (const s of symbols) {
      const v = remote[s];
      if (typeof v === "number" && Number.isFinite(v)) base[s] = v;
    }
    return base;
  }, [symbols, remote]);

  return { balances, portfolio };
}
