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
import {
  Search, Filter, MoreHorizontal, Eye, Ban, ShieldCheck,
  UserCheck, AlertTriangle, Download, Mail, CheckCircle2, XCircle, Wallet, Loader2
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

  async function quickReviewKyc(user: AdminUser, decision: "approved" | "rejected") {
    setError(null);
    setProcessingKycUserId(user.id);
    try {
      const latest = await getLatestKycSubmissionForUser(user.id);
      if (!latest) {
        throw new Error("No KYC submission found for this user.");
      }

      let rejectionReason: string | undefined;
      if (decision === "rejected") {
        const reason = window.prompt("Enter rejection reason for this KYC decision:");
        if (!reason || !reason.trim()) {
          throw new Error("Rejection reason is required.");
        }
        rejectionReason = reason.trim();
      }

      await api.adminReviewKycSubmission(latest.id, {
        decision,
        rejectionReason,
        reviewNotes: "Reviewed from Admin Users quick actions.",
      });

      await loadUsers();

      if (decision === "approved") {
        const shouldSeed = window.confirm(
          `KYC approved for ${user.name}. Seed deposit addresses now?`
        );
        if (shouldSeed) {
          setSeedingUserId(user.id);
          try {
            await api.adminSeedUserDepositAddresses(user.id);
            await loadUsers();
          } finally {
            setSeedingUserId(null);
          }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to review KYC");
    } finally {
      setProcessingKycUserId(null);
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
                              void quickReviewKyc(user, "rejected");
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
                              setSeedingUserId(user.id);
                              void api
                                .adminSeedUserDepositAddresses(user.id)
                                .then(() => loadUsers())
                                .catch((err: unknown) =>
                                  setError(err instanceof Error ? err.message : "Failed to seed addresses")
                                )
                                .finally(() => setSeedingUserId(null));
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedUser.name}</DialogTitle>
              <DialogDescription>{selectedUser.email} · {selectedUser.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Status</p><Badge variant="outline" className={statusColors[selectedUser.status]}>{selectedUser.status}</Badge></div>
                <div><p className="text-muted-foreground text-xs">KYC</p><Badge variant="outline" className={kycColors[selectedUser.kycStatus]}>{selectedUser.kycStatus}</Badge></div>
                <div><p className="text-muted-foreground text-xs">Balance</p><p className="font-mono font-medium">${selectedUser.totalBalance.toLocaleString()}</p></div>
                <div><p className="text-muted-foreground text-xs">Country</p><p className="font-medium">{selectedUser.country}</p></div>
                <div><p className="text-muted-foreground text-xs">Joined</p><p>{selectedUser.joinDate}</p></div>
                <div><p className="text-muted-foreground text-xs">Risk Score</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${selectedUser.riskScore > 70 ? "bg-sell" : selectedUser.riskScore > 40 ? "bg-warning" : "bg-buy"}`} />
                    <span className="font-mono">{selectedUser.riskScore}/100</span>
                  </div>
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs font-medium mb-3">Feature Access</p>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(selectedUser.features) as (keyof AdminUser["features"])[]).map(feat => (
                    <div key={feat} className="flex items-center justify-between">
                      <Label className="text-sm capitalize">{feat}</Label>
                      <Switch
                        checked={users.find(u => u.id === selectedUser.id)?.features[feat]}
                        onCheckedChange={() => toggleFeature(selectedUser.id, feat)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              {selectedUser.kycStatus !== "verified" && (
                <Button
                  variant="outline"
                  size="sm"
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
                  onClick={() => {
                    setSeedingUserId(selectedUser.id);
                    void api
                      .adminSeedUserDepositAddresses(selectedUser.id)
                      .then(() => loadUsers())
                      .catch((err: unknown) =>
                        setError(err instanceof Error ? err.message : "Failed to seed addresses")
                      )
                      .finally(() => setSeedingUserId(null));
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
              {selectedUser.status !== "blacklisted" ? (
                <Button variant="destructive" size="sm" onClick={() => { changeStatus(selectedUser.id, "blacklisted"); setSelectedUser(null); }}>
                  <Ban className="h-3.5 w-3.5 mr-1.5" /> Blacklist User
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => { changeStatus(selectedUser.id, "active"); setSelectedUser(null); }}>
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Remove from Blacklist
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
