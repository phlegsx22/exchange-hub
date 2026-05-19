import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Filter, MoreHorizontal, Eye, Ban, ShieldCheck,
  UserCheck, AlertTriangle, Download, Mail, CheckCircle2, XCircle, Wallet, Loader2, Trash2
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { api, API_BASE, getAuthHeaders } from "@/lib/api";

const statusColors: Record<string, string> = {
  active: "bg-buy/10 text-buy border-buy/20",
  suspended: "bg-warning/10 text-warning border-warning/20",
  pending: "bg-muted text-muted-foreground",
  blacklisted: "bg-sell/10 text-sell border-sell/20",
};

const kycColors: Record<string, string> = {
  verified: "bg-buy/10 text-buy border-buy/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  rejected: "bg-sell/10 text-sell border-sell/20",
  not_started: "bg-muted text-muted-foreground",
};

const DEFAULT_BALANCE_NETWORK: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "ethereum",
  USDC: "ethereum",
  PAXG: "ethereum",
  SOL: "solana",
  BNB: "bsc",
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  status: "active" | "suspended" | "pending" | "blacklisted";
  kycStatus: "verified" | "pending" | "rejected" | "not_started" | string;
  joinDate: string;
  lastLogin: string;
  totalBalance: number;
  tradeCount: number;
  country: string;
  riskScore: number;
  features: {
    trading: boolean;
    withdrawal: boolean;
    transfer: boolean;
    margin: boolean;
    futures: boolean;
    staking: boolean;
  };
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingKycUserId, setProcessingKycUserId] = useState<string | null>(null);
  const [seedingUserId, setSeedingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [rejectKycUser, setRejectKycUser] = useState<AdminUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [seedPromptUser, setSeedPromptUser] = useState<AdminUser | null>(null);
  const [seedManualUser, setSeedManualUser] = useState<AdminUser | null>(null);
  const [seedNetworks, setSeedNetworks] = useState<Array<{ chainSlug: string; chainName: string }>>([]);
  const [seedSelectedNetworks, setSeedSelectedNetworks] = useState<Set<string>>(new Set());
  const [seedAddressInputs, setSeedAddressInputs] = useState<Record<string, { address: string; memo: string }>>({});
  const [loadingSeedNetworks, setLoadingSeedNetworks] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(null);
  const [balanceUser, setBalanceUser] = useState<AdminUser | null>(null);
  const [balanceForm, setBalanceForm] = useState({
    assetSymbol: "PAXG",
    chainSlug: "ethereum",
    amount: "",
    note: "",
  });
  const [adjustingBalance, setAdjustingBalance] = useState(false);

  const totalUsers = users.length;

  const loadUsers = async (opts?: { search?: string; statusFilter?: string }) => {
    const nextSearch = opts?.search ?? search;
    const nextStatus = opts?.statusFilter ?? statusFilter;
    const qs = new URLSearchParams();
    if (nextSearch.trim()) qs.set("q", nextSearch.trim());
    if (nextStatus !== "all") qs.set("status", nextStatus);
    qs.set("limit", "200");

    const res = await fetch(`${API_BASE}/admin/users?${qs.toString()}`, { headers: getAuthHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
    setUsers(((data as { users?: AdminUser[] }).users ?? []));
  };

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      setLoading(true);
      setError(null);
      loadUsers({ search, statusFilter })
        .then(() => {
          if (cancelled) return;
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : "Failed to load users");
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });
    }, 250);

    setLoading(true);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, statusFilter]);

  async function getLatestKycSubmissionForUser(userId: string) {
    const res = await api.adminKycSubmissions({ q: userId, limit: 100 });
    return (res.submissions ?? []).find((s) => s.userId === userId) ?? null;
  }

  async function quickReviewKyc(
    user: AdminUser,
    decision: "approved" | "rejected",
    opts?: { rejectionReason?: string; skipSeedPrompt?: boolean }
  ) {
    setError(null);
    setProcessingKycUserId(user.id);
    try {
      const latest = await getLatestKycSubmissionForUser(user.id);
      if (!latest) {
        throw new Error("No KYC submission found for this user.");
      }

      const rejectionReason: string | undefined = opts?.rejectionReason;
      if (decision === "rejected" && !rejectionReason?.trim()) {
        throw new Error("Rejection reason is required.");
      }

      await api.adminReviewKycSubmission(latest.id, {
        decision,
        rejectionReason,
        reviewNotes: "Reviewed from Admin Users quick actions.",
      });

      await loadUsers();

      if (decision === "approved" && !opts?.skipSeedPrompt) {
        setSeedPromptUser(user);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to review KYC");
    } finally {
      setProcessingKycUserId(null);
    }
  }

  async function openManualSeedDialog(user: AdminUser) {
    setSeedManualUser(user);
    setLoadingSeedNetworks(true);
    setError(null);
    try {
      const [networks, existing] = await Promise.all([
        api.adminSeedOptions(),
        api.adminUserDepositAddresses(user.id),
      ]);
      const uniqueNetworks = Array.from(
        (networks.options ?? []).reduce((acc, n) => {
          acc.set(n.chainSlug.toLowerCase(), { chainSlug: n.chainSlug, chainName: n.chainName });
          return acc;
        }, new Map<string, { chainSlug: string; chainName: string }>())
      ).map(([, v]) => v);
      setSeedNetworks(uniqueNetworks);
      const byChain = new Map(
        (existing.networks ?? []).map((a) => [
          a.chainSlug.toLowerCase(),
          { address: a.address ?? "", memo: a.memo ?? "" },
        ])
      );
      const inputs: Record<string, { address: string; memo: string }> = {};
      for (const n of uniqueNetworks) {
        inputs[n.chainSlug.toLowerCase()] = byChain.get(n.chainSlug.toLowerCase()) ?? { address: "", memo: "" };
      }
      setSeedAddressInputs(inputs);
      setSeedSelectedNetworks(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load seed networks");
      setSeedManualUser(null);
    } finally {
      setLoadingSeedNetworks(false);
    }
  }

  async function saveManualSeedAddresses() {
    if (!seedManualUser) return;
    const entries = Array.from(seedSelectedNetworks)
      .map((chainSlug) => {
        const input = seedAddressInputs[chainSlug];
        return {
          chainSlug,
          address: input?.address?.trim() ?? "",
          memo: input?.memo?.trim() || null,
        };
      })
      .filter((e) => e.address.length > 0);

    if (entries.length === 0) {
      setError("Select at least one network and enter its address.");
      return;
    }

    setSeedingUserId(seedManualUser.id);
    setError(null);
    try {
      await api.adminSeedUserDepositAddresses(seedManualUser.id, { networkEntries: entries });
      setSeedManualUser(null);
      await loadUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save deposit addresses");
    } finally {
      setSeedingUserId(null);
    }
  }

  async function saveBalanceAdjustment() {
    if (!balanceUser) return;
    const amount = Number(balanceForm.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      setError("Enter a non-zero amount.");
      return;
    }

    setAdjustingBalance(true);
    setError(null);
    try {
      await api.adminAdjustUserBalance(balanceUser.id, {
        assetSymbol: balanceForm.assetSymbol,
        chainSlug: balanceForm.chainSlug || "ethereum",
        amount,
        note: balanceForm.note.trim() || undefined,
      });
      setBalanceUser(null);
      setBalanceForm({ assetSymbol: "PAXG", chainSlug: "ethereum", amount: "", note: "" });
      await loadUsers();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update balance");
    } finally {
      setAdjustingBalance(false);
    }
  }

  const toggleFeature = async (userId: string, feature: keyof AdminUser["features"]) => {
    const current = users.find((u) => u.id === userId);
    if (!current) return;
    const next = !current.features[feature];
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, features: { ...u.features, [feature]: next } } : u))
    );
    try {
      const res = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(userId)}/features`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ features: { [feature]: next } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      const updated = (data as { user?: AdminUser }).user;
      if (updated) setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, features: { ...u.features, [feature]: !next } } : u
        )
      );
      setError(e instanceof Error ? e.message : "Failed to update feature");
    }
  };

  const changeStatus = async (userId: string, status: AdminUser["status"]) => {
    const prevUser = users.find((u) => u.id === userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
    try {
      const res = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(userId)}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      const updated = (data as { user?: AdminUser }).user;
      if (updated) setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      if (prevUser) setUsers((prev) => prev.map((u) => (u.id === userId ? prevUser : u)));
      setError(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  async function deleteUser(user: AdminUser) {
    setDeletingUserId(user.id);
    setError(null);
    try {
      await api.adminDeleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (selectedUser?.id === user.id) setSelectedUser(null);
      setDeleteUserTarget(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">{users.length} users</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, email or ID..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="blacklisted">Blacklisted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading users…</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead className="hidden md:table-cell">Balance</TableHead>
                <TableHead className="hidden md:table-cell">Trades</TableHead>
                <TableHead className="hidden lg:table-cell">Risk</TableHead>
                <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedUser(user)}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[user.status]}>{user.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={kycColors[user.kycStatus]}>{user.kycStatus.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-sm">${user.totalBalance.toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-sm">{user.tradeCount.toLocaleString()}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${user.riskScore > 70 ? "bg-sell" : user.riskScore > 40 ? "bg-warning" : "bg-buy"}`} />
                      <span className="font-mono text-xs">{user.riskScore}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{user.lastLogin}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}>
                          <Eye className="h-3.5 w-3.5 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem><Mail className="h-3.5 w-3.5 mr-2" /> Send Email</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setBalanceUser(user);
                            setBalanceForm({ assetSymbol: "PAXG", chainSlug: "ethereum", amount: "", note: "" });
                          }}
                        >
                          <Wallet className="h-3.5 w-3.5 mr-2" /> Update balance
                        </DropdownMenuItem>
                        {user.kycStatus !== "verified" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              void quickReviewKyc(user, "approved");
                            }}
                            disabled={processingKycUserId === user.id || seedingUserId === user.id}
                          >
                            {processingKycUserId === user.id ? (
                              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                            )}
                            Approve KYC
                          </DropdownMenuItem>
                        )}
                        {user.kycStatus !== "rejected" && user.kycStatus !== "not_started" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setRejectKycUser(user);
                              setRejectReason("");
                            }}
                            disabled={processingKycUserId === user.id || seedingUserId === user.id}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-2" /> Reject KYC
                          </DropdownMenuItem>
                        )}
                        {user.kycStatus === "verified" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              void openManualSeedDialog(user);
                            }}
                            disabled={processingKycUserId === user.id || seedingUserId === user.id}
                          >
                            {seedingUserId === user.id ? (
                              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            ) : (
                              <Wallet className="h-3.5 w-3.5 mr-2" />
                            )}
                            Seed deposit addresses
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {user.status !== "suspended" && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); changeStatus(user.id, "suspended"); }}>
                            <AlertTriangle className="h-3.5 w-3.5 mr-2" /> Suspend
                          </DropdownMenuItem>
                        )}
                        {user.status === "suspended" && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); changeStatus(user.id, "active"); }}>
                            <UserCheck className="h-3.5 w-3.5 mr-2" /> Reactivate
                          </DropdownMenuItem>
                        )}
                        {user.status !== "blacklisted" && (
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); changeStatus(user.id, "blacklisted"); }}>
                            <Ban className="h-3.5 w-3.5 mr-2" /> Blacklist
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteUserTarget(user);
                          }}
                          disabled={deletingUserId === user.id}
                        >
                          {deletingUserId === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                          )}
                          Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="break-words pr-6">{selectedUser.name}</DialogTitle>
              <DialogDescription className="break-all">
                {selectedUser.email} · {selectedUser.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="min-w-0 rounded-md border bg-background p-3">
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Badge variant="outline" className={statusColors[selectedUser.status]}>{selectedUser.status}</Badge>
                </div>
                <div className="min-w-0 rounded-md border bg-background p-3">
                  <p className="text-muted-foreground text-xs">KYC</p>
                  <Badge variant="outline" className={kycColors[selectedUser.kycStatus]}>{selectedUser.kycStatus}</Badge>
                </div>
                <div className="min-w-0 rounded-md border bg-background p-3">
                  <p className="text-muted-foreground text-xs">Balance</p>
                  <p className="break-words font-mono font-medium">${selectedUser.totalBalance.toLocaleString()}</p>
                </div>
                <div className="min-w-0 rounded-md border bg-background p-3">
                  <p className="text-muted-foreground text-xs">Country</p>
                  <p className="break-words font-medium">{selectedUser.country}</p>
                </div>
                <div className="min-w-0 rounded-md border bg-background p-3">
                  <p className="text-muted-foreground text-xs">Joined</p>
                  <p className="break-words">{selectedUser.joinDate}</p>
                </div>
                <div className="min-w-0 rounded-md border bg-background p-3"><p className="text-muted-foreground text-xs">Risk Score</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${selectedUser.riskScore > 70 ? "bg-sell" : selectedUser.riskScore > 40 ? "bg-warning" : "bg-buy"}`} />
                    <span className="font-mono">{selectedUser.riskScore}/100</span>
                  </div>
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs font-medium mb-3">Feature Access</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(Object.keys(selectedUser.features) as (keyof AdminUser["features"])[]).map(feat => (
                    <div key={feat} className="flex min-w-0 items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
                      <Label className="min-w-0 truncate text-sm capitalize">{feat}</Label>
                      <Switch
                        className="shrink-0"
                        checked={users.find(u => u.id === selectedUser.id)?.features[feat]}
                        onCheckedChange={() => toggleFeature(selectedUser.id, feat)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {selectedUser.kycStatus !== "verified" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => void quickReviewKyc(selectedUser, "approved")}
                  disabled={processingKycUserId === selectedUser.id || seedingUserId === selectedUser.id}
                >
                  {processingKycUserId === selectedUser.id ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Approve KYC
                </Button>
              )}
              {selectedUser.kycStatus === "verified" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => {
                    void openManualSeedDialog(selectedUser);
                  }}
                  disabled={processingKycUserId === selectedUser.id || seedingUserId === selectedUser.id}
                >
                  {seedingUserId === selectedUser.id ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Wallet className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Seed Addresses
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  setBalanceUser(selectedUser);
                  setBalanceForm({ assetSymbol: "PAXG", chainSlug: "ethereum", amount: "", note: "" });
                  setSelectedUser(null);
                }}
              >
                <Wallet className="h-3.5 w-3.5 mr-1.5" />
                Update Balance
              </Button>
              {selectedUser.status !== "blacklisted" ? (
                <Button className="w-full justify-center" variant="destructive" size="sm" onClick={() => { changeStatus(selectedUser.id, "blacklisted"); setSelectedUser(null); }}>
                  <Ban className="h-3.5 w-3.5 mr-1.5" /> Blacklist User
                </Button>
              ) : (
                <Button className="w-full justify-center" variant="outline" size="sm" onClick={() => { changeStatus(selectedUser.id, "active"); setSelectedUser(null); }}>
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Remove from Blacklist
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="w-full justify-center"
                onClick={() => setDeleteUserTarget(selectedUser)}
                disabled={deletingUserId === selectedUser.id}
              >
                {deletingUserId === selectedUser.id ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject KYC Dialog */}
      <Dialog open={!!rejectKycUser} onOpenChange={(open) => !open && setRejectKycUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription>
              {rejectKycUser ? `Provide a rejection reason for ${rejectKycUser.name}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Rejection reason</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain what the user needs to correct..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectKycUser(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!rejectKycUser) return;
                void quickReviewKyc(rejectKycUser, "rejected", { rejectionReason: rejectReason });
                setRejectKycUser(null);
              }}
              disabled={!rejectReason.trim() || (rejectKycUser != null && processingKycUserId === rejectKycUser.id)}
            >
              Reject KYC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seed prompt after approval */}
      <Dialog open={!!seedPromptUser} onOpenChange={(open) => !open && setSeedPromptUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>KYC Approved</DialogTitle>
            <DialogDescription>
              {seedPromptUser
                ? `KYC approved for ${seedPromptUser.name}. Seed deposit addresses now?`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeedPromptUser(null)}>Later</Button>
            <Button
              onClick={() => {
                if (!seedPromptUser) return;
                void openManualSeedDialog(seedPromptUser);
                setSeedPromptUser(null);
              }}
              disabled={seedPromptUser != null && seedingUserId === seedPromptUser.id}
            >
              Seed now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual seed address dialog */}
      <Dialog open={!!seedManualUser} onOpenChange={(open) => !open && setSeedManualUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Deposit Addresses</DialogTitle>
            <DialogDescription>
              {seedManualUser
                ? `Enter addresses for ${seedManualUser.name}. Selected networks will be saved/updated.`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {loadingSeedNetworks ? (
            <div className="p-4 text-sm text-muted-foreground">Loading networks...</div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto space-y-2 border rounded-md p-2">
              {seedNetworks.map((n) => (
                <div key={n.chainSlug} className="px-2 py-2 rounded hover:bg-muted/50">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seedSelectedNetworks.has(n.chainSlug.toLowerCase())}
                      onChange={(e) =>
                        setSeedSelectedNetworks((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(n.chainSlug.toLowerCase());
                          else next.delete(n.chainSlug.toLowerCase());
                          return next;
                        })
                      }
                    />
                    <span className="font-medium">{n.chainName}</span>
                    <span className="text-sm text-muted-foreground">({n.chainSlug})</span>
                  </label>
                  {seedSelectedNetworks.has(n.chainSlug.toLowerCase()) && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-4">
                      <Input
                        className="sm:col-span-3"
                        placeholder="Paste deposit address"
                        value={seedAddressInputs[n.chainSlug.toLowerCase()]?.address ?? ""}
                        onChange={(e) =>
                          setSeedAddressInputs((prev) => ({
                            ...prev,
                            [n.chainSlug.toLowerCase()]: {
                              address: e.target.value,
                              memo: prev[n.chainSlug.toLowerCase()]?.memo ?? "",
                            },
                          }))
                        }
                      />
                      <Input
                        placeholder="Memo (optional)"
                        value={seedAddressInputs[n.chainSlug.toLowerCase()]?.memo ?? ""}
                        onChange={(e) =>
                          setSeedAddressInputs((prev) => ({
                            ...prev,
                            [n.chainSlug.toLowerCase()]: {
                              address: prev[n.chainSlug.toLowerCase()]?.address ?? "",
                              memo: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSeedManualUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                void saveManualSeedAddresses();
              }}
              disabled={seedManualUser != null && seedingUserId === seedManualUser.id}
            >
              Save addresses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete user confirmation dialog */}
      <Dialog open={!!deleteUserTarget} onOpenChange={(open) => !open && setDeleteUserTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              {deleteUserTarget
                ? `Delete ${deleteUserTarget.name} (${deleteUserTarget.email})? This action cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteUserTarget) return;
                void deleteUser(deleteUserTarget);
              }}
              disabled={deleteUserTarget != null && deletingUserId === deleteUserTarget.id}
            >
              {deleteUserTarget != null && deletingUserId === deleteUserTarget.id ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Delete user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual balance adjustment dialog */}
      <Dialog open={!!balanceUser} onOpenChange={(open) => !open && setBalanceUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update User Balance</DialogTitle>
            <DialogDescription>
              {balanceUser ? `Credit or adjust balances for ${balanceUser.name}. Positive PAXG/crypto amounts appear as deposits.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Asset</Label>
                <Select
                  value={balanceForm.assetSymbol}
                  onValueChange={(assetSymbol) =>
                    setBalanceForm((prev) => ({
                      ...prev,
                      assetSymbol,
                      chainSlug: DEFAULT_BALANCE_NETWORK[assetSymbol] ?? prev.chainSlug,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["PAXG", "BTC", "ETH", "USDT", "USDC", "SOL", "BNB"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Network</Label>
                <Select
                  value={balanceForm.chainSlug}
                  onValueChange={(chainSlug) => setBalanceForm((prev) => ({ ...prev, chainSlug }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="bitcoin">Bitcoin</SelectItem>
                    <SelectItem value="solana">Solana</SelectItem>
                    <SelectItem value="bsc">BNB Smart Chain</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                    <SelectItem value="tron">Tron</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={balanceForm.amount}
                onChange={(e) => setBalanceForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                placeholder="Deposit confirmed by admin"
                value={balanceForm.note}
                onChange={(e) => setBalanceForm((prev) => ({ ...prev, note: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceUser(null)}>Cancel</Button>
            <Button onClick={() => void saveBalanceAdjustment()} disabled={adjustingBalance}>
              {adjustingBalance && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Update balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
