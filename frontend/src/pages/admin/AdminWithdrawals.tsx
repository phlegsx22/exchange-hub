import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";

type WithdrawalRow = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  assetSymbol: string;
  chainSlug: string;
  chainName: string;
  amount: string;
  fee: string;
  toAddress: string;
  txHash: string | null;
  receiptNo: string;
  status: "pending" | "processing" | "sent" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

const statusColors: Record<WithdrawalRow["status"], string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  processing: "bg-muted text-muted-foreground border-border",
  sent: "bg-buy/10 text-buy border-buy/20",
  failed: "bg-sell/10 text-sell border-sell/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function AdminWithdrawals() {
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "processing" | "sent" | "failed" | "cancelled">("all");
  const [txHashDraft, setTxHashDraft] = useState<Record<string, string>>({});

  async function loadData(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const r = await api.adminWithdrawals({ q: search.trim() || undefined, status, limit: 200, offset: 0 });
      setRows(r.withdrawals ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const pendingCount = useMemo(() => rows.filter((r) => r.status === "pending" || r.status === "processing").length, [rows]);

  async function markSent(row: WithdrawalRow): Promise<void> {
    setError(null);
    try {
      await api.adminSetWithdrawalStatus(row.id, "sent", txHashDraft[row.id] ?? "");
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update withdrawal");
    }
  }

  async function markProcessing(row: WithdrawalRow): Promise<void> {
    setError(null);
    try {
      await api.adminSetWithdrawalStatus(row.id, "processing");
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update withdrawal");
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Withdrawal Requests</h1>
          <p className="text-sm text-muted-foreground">{pendingCount} pending/processing</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void loadData()}>
          Refresh
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by user, receipt, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void loadData();
            }}
          />
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => void loadData()}>
            Search
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading withdrawal requests...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead className="hidden md:table-cell">Amount / Fee</TableHead>
                    <TableHead className="hidden lg:table-cell">To Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[260px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{r.userName}</p>
                        <p className="text-xs text-muted-foreground">{r.userEmail}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{r.receiptNo}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{r.assetSymbol}</p>
                        <p className="text-xs text-muted-foreground">{r.chainName}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="font-mono text-sm">{Number(r.amount).toFixed(8)}</p>
                        <p className="font-mono text-xs text-muted-foreground">fee {Number(r.fee).toFixed(8)}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="font-mono text-xs max-w-[220px] truncate">{r.toAddress}</p>
                        {r.txHash ? <p className="font-mono text-[10px] text-muted-foreground truncate">{r.txHash}</p> : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[r.status]}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Input
                            placeholder="Tx hash (optional when marking sent)"
                            value={txHashDraft[r.id] ?? ""}
                            onChange={(e) => setTxHashDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                            className="h-8 text-xs"
                            disabled={r.status === "sent" || r.status === "failed" || r.status === "cancelled"}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={r.status !== "pending"}
                              onClick={() => void markProcessing(r)}
                            >
                              Mark Processing
                            </Button>
                            <Button
                              size="sm"
                              disabled={r.status === "sent" || r.status === "failed" || r.status === "cancelled"}
                              onClick={() => void markSent(r)}
                            >
                              Mark Sent
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                        No withdrawal requests found.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
