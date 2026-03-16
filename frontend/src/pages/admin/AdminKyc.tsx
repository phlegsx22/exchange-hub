import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ShieldCheck, Loader2, CheckCircle2, XCircle, FileCheck2, Wallet } from "lucide-react";
import { api } from "@/lib/api";

type KycSubmission = Awaited<ReturnType<typeof api.adminKycSubmissions>>["submissions"][number];
type AssetNetwork = Awaited<ReturnType<typeof api.adminAssetNetworks>>["assetNetworks"][number];

const statusColor: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  under_review: "bg-muted text-muted-foreground",
  approved: "bg-buy/10 text-buy border-buy/20",
  rejected: "bg-sell/10 text-sell border-sell/20",
};

export default function AdminKyc() {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "under_review" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);

  const [selected, setSelected] = useState<KycSubmission | null>(null);
  const [decision, setDecision] = useState<"under_review" | "approved" | "rejected">("under_review");
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const [seedOpen, setSeedOpen] = useState(false);
  const [assetNetworks, setAssetNetworks] = useState<AssetNetwork[]>([]);
  const [selectedNetworks, setSelectedNetworks] = useState<Set<string>>(new Set());
  const [seedAddressInputs, setSeedAddressInputs] = useState<Record<string, { address: string; memo: string }>>({});
  const [loadingNetworks, setLoadingNetworks] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .adminKycSubmissions({
        status: statusFilter === "all" ? undefined : statusFilter,
        q: search.trim() || undefined,
        limit: 200,
        offset: 0,
      })
      .then((res) => {
        if (cancelled) return;
        setSubmissions(res.submissions ?? []);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load KYC submissions");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [statusFilter, search]);

  const stats = useMemo(() => {
    const pending = submissions.filter((s) => s.status === "pending").length;
    const underReview = submissions.filter((s) => s.status === "under_review").length;
    const approved = submissions.filter((s) => s.status === "approved").length;
    const rejected = submissions.filter((s) => s.status === "rejected").length;
    return { pending, underReview, approved, rejected };
  }, [submissions]);

  async function refreshList() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminKycSubmissions({
        status: statusFilter === "all" ? undefined : statusFilter,
        q: search.trim() || undefined,
        limit: 200,
      });
      setSubmissions(res.submissions ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load KYC submissions");
    } finally {
      setLoading(false);
    }
  }

  function openReview(item: KycSubmission) {
    setSelected(item);
    setDecision(item.status === "approved" || item.status === "rejected" ? item.status : "under_review");
    setReviewNotes(item.reviewNotes ?? "");
    setRejectionReason(item.rejectionReason ?? "");
  }

  async function submitReview() {
    if (!selected) return;
    if (decision === "rejected" && !rejectionReason.trim()) {
      setError("Rejection reason is required when rejecting KYC.");
      return;
    }
    setReviewing(true);
    setError(null);
    try {
      await api.adminReviewKycSubmission(selected.id, {
        decision,
        reviewNotes: reviewNotes.trim() || undefined,
        rejectionReason: decision === "rejected" ? rejectionReason.trim() : undefined,
      });
      setSelected(null);
      await refreshList();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setReviewing(false);
    }
  }

  async function openSeedDialog() {
    if (!selected) return;
    setSeedOpen(true);
    setLoadingNetworks(true);
    setSelectedNetworks(new Set());
    setSeedAddressInputs({});
    try {
      const [res, existing] = await Promise.all([
        api.adminAssetNetworks(),
        api.adminUserDepositAddresses(selected.userId),
      ]);
      const enabled = (res.assetNetworks ?? []).filter((n) => n.isDepositEnabled);
      setAssetNetworks(enabled);
      const byId = new Map(
        (existing.addresses ?? []).map((a) => [
          a.assetNetworkId,
          { address: a.address ?? "", memo: a.memo ?? "" },
        ])
      );
      const nextInputs: Record<string, { address: string; memo: string }> = {};
      for (const n of enabled) {
        nextInputs[n.id] = byId.get(n.id) ?? { address: "", memo: "" };
      }
      setSeedAddressInputs(nextInputs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load networks");
      setSeedOpen(false);
    } finally {
      setLoadingNetworks(false);
    }
  }

  function toggleNetwork(id: string) {
    setSelectedNetworks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function seedAddresses() {
    if (!selected) return;
    setSeeding(true);
    setError(null);
    try {
      const entries = Array.from(selectedNetworks)
        .map((id) => {
          const input = seedAddressInputs[id];
          return {
            assetNetworkId: id,
            address: input?.address?.trim() ?? "",
            memo: input?.memo?.trim() || null,
          };
        })
        .filter((e) => e.address.length > 0);

      if (entries.length === 0) {
        throw new Error("Enter at least one address before saving.");
      }

      await api.adminSeedUserDepositAddresses(
        selected.userId,
        entries
      );
      setSeedOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to seed deposit addresses");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FileCheck2 className="h-6 w-6" /> KYC Review
          </h1>
          <p className="text-sm text-muted-foreground">Manual review queue with free-stack assistive scores.</p>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-mono font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-mono font-bold">{stats.underReview}</p><p className="text-xs text-muted-foreground">Under Review</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-mono font-bold text-buy">{stats.approved}</p><p className="text-xs text-muted-foreground">Approved</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-mono font-bold text-sell">{stats.rejected}</p><p className="text-xs text-muted-foreground">Rejected</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by user name, email, document number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Submissions</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No submissions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Scores</TableHead>
                    <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{s.userName}</p>
                        <p className="text-xs text-muted-foreground">{s.userEmail}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{s.documentType.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.documentNumber ?? "—"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColor[s.status] ?? "bg-muted text-muted-foreground"}>
                          {s.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        OCR: {s.ocrConfidence == null ? "—" : `${Math.round(s.ocrConfidence * 100)}%`}{" · "}
                        Face: {s.faceMatchScore == null ? "—" : `${Math.round(s.faceMatchScore * 100)}%`}{" · "}
                        Live: {s.livenessScore == null ? "—" : `${Math.round(s.livenessScore * 100)}%`}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {new Date(s.submittedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openReview(s)}>Review</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.userName} KYC Review</DialogTitle>
                <DialogDescription>{selected.userEmail} · Submission {selected.id}</DialogDescription>
              </DialogHeader>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Full name</p><p>{selected.firstName} {selected.lastName}</p></div>
                <div><p className="text-xs text-muted-foreground">DOB</p><p>{selected.dateOfBirth}</p></div>
                <div><p className="text-xs text-muted-foreground">Country</p><p>{selected.countryOfResidence.toUpperCase()}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p>{selected.phoneNumber ?? "—"}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Address</p><p>{selected.address}</p></div>
                <div><p className="text-xs text-muted-foreground">Emergency Contact</p><p>{selected.emergencyContactName ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Emergency Phone</p><p>{selected.emergencyContactPhone ?? "—"}</p></div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                <a className="underline" href={selected.documentUrl ?? "#"} target="_blank" rel="noreferrer">Open document</a>
                <a className="underline" href={selected.selfieUrl ?? "#"} target="_blank" rel="noreferrer">Open selfie</a>
                <a className="underline" href={selected.documentBackUrl ?? "#"} target="_blank" rel="noreferrer">Open document back</a>
                <a className="underline" href={selected.proofOfAddressUrl ?? "#"} target="_blank" rel="noreferrer">Open proof of address</a>
              </div>

              <div className="grid sm:grid-cols-3 gap-2 text-xs">
                <Card><CardContent className="p-3">OCR: <span className="font-mono">{selected.ocrConfidence == null ? "—" : `${Math.round(selected.ocrConfidence * 100)}%`}</span></CardContent></Card>
                <Card><CardContent className="p-3">Face Match: <span className="font-mono">{selected.faceMatchScore == null ? "—" : `${Math.round(selected.faceMatchScore * 100)}%`}</span></CardContent></Card>
                <Card><CardContent className="p-3">Liveness: <span className="font-mono">{selected.livenessScore == null ? "—" : `${Math.round(selected.livenessScore * 100)}%`}</span></CardContent></Card>
              </div>

              <div className="space-y-2">
                <Label>Decision</Label>
                <Select value={decision} onValueChange={(v) => setDecision(v as typeof decision)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_review">Under review</SelectItem>
                    <SelectItem value="approved">Approve</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Review notes (internal)</Label>
                <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Add reviewer notes..." />
              </div>

              {decision === "rejected" && (
                <div className="space-y-2">
                  <Label>Rejection reason (required)</Label>
                  <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Explain what must be corrected..." />
                </div>
              )}

              <DialogFooter className="flex-wrap gap-2">
                {selected.status === "approved" && (
                  <Button variant="outline" className="gap-1.5" onClick={openSeedDialog}>
                    <Wallet className="h-4 w-4" /> Seed deposit addresses
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                <Button onClick={submitReview} disabled={reviewing} className="gap-1.5">
                  {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : decision === "approved" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  Save review
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={seedOpen} onOpenChange={setSeedOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Seed deposit addresses</DialogTitle>
            <DialogDescription>
              {selected ? `Enter manual deposit addresses for ${selected.userName}.` : "Select networks."}
            </DialogDescription>
          </DialogHeader>

          {loadingNetworks ? (
            <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading networks...
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto border rounded-md p-2">
              {assetNetworks.map((n) => (
                <div key={n.id} className="px-2 py-2 rounded hover:bg-muted/50">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox checked={selectedNetworks.has(n.id)} onCheckedChange={() => toggleNetwork(n.id)} />
                    <span className="font-medium">{n.assetSymbol}</span>
                    <span className="text-muted-foreground text-sm">{n.chainName}</span>
                  </label>
                  {selectedNetworks.has(n.id) && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-4">
                      <Input
                        className="sm:col-span-3"
                        placeholder="Paste deposit address"
                        value={seedAddressInputs[n.id]?.address ?? ""}
                        onChange={(e) =>
                          setSeedAddressInputs((prev) => ({
                            ...prev,
                            [n.id]: {
                              address: e.target.value,
                              memo: prev[n.id]?.memo ?? "",
                            },
                          }))
                        }
                      />
                      <Input
                        placeholder="Memo (optional)"
                        value={seedAddressInputs[n.id]?.memo ?? ""}
                        onChange={(e) =>
                          setSeedAddressInputs((prev) => ({
                            ...prev,
                            [n.id]: {
                              address: prev[n.id]?.address ?? "",
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
            <Button variant="outline" onClick={() => setSeedOpen(false)}>Cancel</Button>
            <Button onClick={seedAddresses} disabled={seeding || loadingNetworks} className="gap-1.5">
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Save addresses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

