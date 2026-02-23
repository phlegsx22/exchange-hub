import { useEffect, useMemo, useState } from "react";
import { API_BASE, getAuthHeaders, getStoredAuth } from "@/lib/api";
import { DEFAULT_WATCHLIST, type TokenSymbol } from "@/lib/tokens";

export type Balances = Record<TokenSymbol, number>;

function zeroBalances(symbols: TokenSymbol[]): Balances {
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
export function useUserBalances(symbols: TokenSymbol[] = DEFAULT_WATCHLIST) {
  const auth = getStoredAuth();
  const userId = auth?.user?.id;

  const [remote, setRemote] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRemote(null);
    if (!auth?.accessToken) return;

    fetch(`${API_BASE}/balances`, { headers: getAuthHeaders() })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
        return data as { balances?: Record<string, number> };
      })
      .then((data) => {
        if (cancelled) return;
        setRemote(data.balances ?? {});
      })
      .catch(() => {
        if (cancelled) return;
        setRemote({});
      });

    return () => {
      cancelled = true;
    };
  }, [auth?.accessToken, userId]);

  const balances = useMemo(() => {
    const base = zeroBalances(symbols);
    if (!remote) return base;
    for (const s of symbols) {
      const v = remote[s];
      if (typeof v === "number" && Number.isFinite(v)) base[s] = v;
    }
    return base;
  }, [symbols, remote]);

  return { balances };
}

