import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Ban, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { api, type AdminUserRow } from "@/lib/api";

export default function AdminBlacklist() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .adminUsers({ status: "blacklisted", limit: 500 })
      .then((res) => {
        if (!cancelled) setUsers(res.users ?? []);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load blacklisted users");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const blacklisted = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

  async function removeFromBlacklist(id: string) {
    setUpdatingId(id);
    setError(null);
    try {
      await api.adminSetUserStatus(id, "active");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to remove from blacklist");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Ban className="h-6 w-6 text-sell shrink-0" /> Blacklisted Users
        </h1>
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${blacklisted.length} users currently blacklisted`}
        </p>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="p-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search blacklisted users..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : blacklisted.length === 0 ? (
            <div className="p-8 text-center">
              <ShieldCheck className="h-8 w-8 mx-auto text-buy mb-2" />
              <p className="font-medium">No blacklisted users</p>
              <p className="text-sm text-muted-foreground">All users are in good standing</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead className="hidden md:table-cell">Country</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blacklisted.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-sell" />
                        <span className="font-mono text-sm">{user.riskScore}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.country}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{user.joinDate}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => void removeFromBlacklist(user.id)}
                        disabled={updatingId === user.id}
                      >
                        {updatingId === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
