import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, Lock, Unlock, Wallet, Copy, ArrowUpRight } from "lucide-react";
import { API_BASE, getAuthHeaders } from "@/lib/api";

const walletStatusColors: Record<string, string> = {
  active: "bg-buy/10 text-buy border-buy/20",
  frozen: "bg-sell/10 text-sell border-sell/20",
  pending: "bg-warning/10 text-warning border-warning/20",
};

export default function AdminWallets() {
  const [search, setSearch] = useState("");
  const [coinFilter, setCoinFilter] = useState("all");
  const [wallets, setWallets] = useState<AdminWallet[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newWalletUser, setNewWalletUser] = useState("");
  const [newWalletCoin, setNewWalletCoin] = useState("BTC");

  const coins = useMemo(() => [...new Set(wallets.map(w => w.coin))], [wallets]);

  const filtered = useMemo(() => wallets.filter(w => {
    const matchSearch = w.userName.toLowerCase().includes(search.toLowerCase()) ||
      w.address.toLowerCase().includes(search.toLowerCase()) ||
      w.userId.toLowerCase().includes(search.toLowerCase());
    const matchCoin = coinFilter === "all" || w.coin === coinFilter;
    return matchSearch && matchCoin;
  }), [wallets, search, coinFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${API_BASE}/admin/wallets`, { headers: getAuthHeaders() }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
        return data as { wallets: AdminWallet[] };
      }),
      fetch(`${API_BASE}/admin/users?limit=200`, { headers: getAuthHeaders() }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
        return data as { users: { id: string; name: string; status: string }[] };
      }),
    ])
      .then(([w, u]) => {
        if (cancelled) return;
        setWallets(w.wallets ?? []);
        setUsers(u.users ?? []);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load wallets");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  type WalletStatus = "active" | "frozen" | "pending";
  type AdminWallet = {
    id: string;
    userId: string;
    userName: string;
    coin: string;
    balance: number;
    frozen: number;
    address: string;
    status: WalletStatus;
    createdAt: string;
  };

  const toggleFreeze = async (id: string) => {
    const w = wallets.find((x) => x.id === id);
    if (!w) return;
    const next: WalletStatus = w.status === "frozen" ? "active" : "frozen";
    setWallets((prev) => prev.map((x) => (x.id === id ? { ...x, status: next } : x)));
    try {
      const res = await fetch(`${API_BASE}/admin/wallets/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      const updated = (data as { wallet?: AdminWallet }).wallet;
      if (updated) setWallets((prev) => prev.map((x) => (x.id === id ? updated : x)));
    } catch (e: unknown) {
      setWallets((prev) => prev.map((x) => (x.id === id ? w : x)));
      setError(e instanceof Error ? e.message : "Failed to update wallet");
    }
  };

  const createWallet = async () => {
    if (!newWalletUser) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/wallets`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: newWalletUser, coin: newWalletCoin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      const wallet = (data as { wallet?: AdminWallet }).wallet;
      if (wallet) setWallets((prev) => [wallet, ...prev]);
      setCreateOpen(false);
      setNewWalletUser("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create wallet");
    }
  };

  const totalBalance = wallets.reduce((sum, w) => {
    const prices: Record<string, number> = { BTC: 97245, ETH: 3412, USDT: 1, SOL: 198, XRP: 2.41, BNB: 612, ADA: 0.98, DOGE: 0.34, AVAX: 42, LINK: 18.3 };
    return sum + w.balance * (prices[w.coin] || 1);
  }, 0);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Wallet Management</h1>
          <p className="text-sm text-muted-foreground">{wallets.length} wallets · ${(totalBalance / 1e6).toFixed(1)}M total value</p>
        </div>
        <Button size="sm" className="gap-1.5 self-start" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Create Wallet
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold font-mono">{wallets.filter(w => w.status === "active").length}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold font-mono text-sell">{wallets.filter(w => w.status === "frozen").length}</p>
          <p className="text-xs text-muted-foreground">Frozen</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold font-mono">{coins.length}</p>
          <p className="text-xs text-muted-foreground">Coins</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by user, address or ID..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={coinFilter} onValueChange={setCoinFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Coins</SelectItem>
              {coins.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading wallets…</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Coin</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="hidden md:table-cell">Frozen</TableHead>
                <TableHead className="hidden md:table-cell">Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 30).map(w => (
                <TableRow key={w.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{w.userName}</p>
                    <p className="text-xs text-muted-foreground">{w.userId}</p>
                  </TableCell>
                  <TableCell><Badge variant="outline">{w.coin}</Badge></TableCell>
                  <TableCell className="font-mono text-sm">{w.balance.toFixed(w.coin === "BTC" ? 4 : w.coin === "ETH" ? 3 : 2)}</TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-sm text-sell">{w.frozen > 0 ? w.frozen.toFixed(2) : "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-muted-foreground">{w.address}</span>
                      <Copy className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-foreground" />
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={walletStatusColors[w.status]}>{w.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleFreeze(w.id)} title={w.status === "frozen" ? "Unfreeze" : "Freeze"}>
                      {w.status === "frozen" ? <Unlock className="h-3.5 w-3.5 text-buy" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Wallet Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Wallet</DialogTitle>
            <DialogDescription>Assign a new wallet to an existing user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User</Label>
              <Select value={newWalletUser} onValueChange={setNewWalletUser}>
                <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.status !== "blacklisted").map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Coin</Label>
              <Select value={newWalletCoin} onValueChange={setNewWalletCoin}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["BTC", "ETH", "USDT", "SOL", "XRP", "BNB", "ADA", "DOGE"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createWallet} disabled={!newWalletUser}>
              <Wallet className="h-3.5 w-3.5 mr-1.5" /> Create Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
