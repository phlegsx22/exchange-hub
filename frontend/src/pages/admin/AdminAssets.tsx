import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, Plus, Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

type AssetNetworkRow = {
  id: string;
  assetSymbol: string;
  assetName: string;
  chainSlug: string;
  chainName: string;
  contractAddress: string | null;
  isDepositEnabled: boolean;
  isWithdrawEnabled: boolean;
};

type SeedOption = {
  assetSymbol: string;
  assetName: string;
  chainSlug: string;
  chainName: string;
  contractAddress: string | null;
};

function optionKey(assetSymbol: string, chainSlug: string) {
  return `${assetSymbol}:${chainSlug}`;
}

export default function AdminAssets() {
  const [list, setList] = useState<AssetNetworkRow[]>([]);
  const [options, setOptions] = useState<SeedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const existingKeys = useMemo(
    () => new Set(list.map((row) => optionKey(row.assetSymbol, row.chainSlug))),
    [list]
  );

  const addableOptions = useMemo(
    () => options.filter((o) => !existingKeys.has(optionKey(o.assetSymbol, o.chainSlug))),
    [options, existingKeys]
  );

  const selectedItems = useMemo(
    () =>
      addableOptions
        .filter((o) => selected.has(optionKey(o.assetSymbol, o.chainSlug)))
        .map((o) => ({
          assetSymbol: o.assetSymbol,
          chainSlug: o.chainSlug,
          contractAddress: o.contractAddress,
        })),
    [addableOptions, selected]
  );

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.adminAssetNetworks();
      setList(data.assetNetworks ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load asset networks");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOptions() {
    setOptionsLoading(true);
    setOptionsError(null);
    try {
      const data = await api.adminSeedOptions();
      setOptions(data.options ?? []);
    } catch (e: unknown) {
      setOptions([]);
      setOptionsError(e instanceof Error ? e.message : "Failed to load options");
    } finally {
      setOptionsLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  function openAddModal() {
    setAddModalOpen(true);
    setSuccess(null);
    setError(null);
    setSelected(new Set());
    fetchOptions();
  }

  function toggleSelected(assetSymbol: string, chainSlug: string) {
    const key = optionKey(assetSymbol, chainSlug);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(addableOptions.map((o) => optionKey(o.assetSymbol, o.chainSlug))));
  }

  function clearSelected() {
    setSelected(new Set());
  }

  async function addSelected() {
    if (selectedItems.length === 0) return;
    setAdding(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await api.adminBootstrapAssetNetworks(selectedItems);
      setSuccess(`Added ${data.added} item(s). ${data.skipped > 0 ? `${data.skipped} skipped.` : ""}`);
      setAddModalOpen(false);
      setSelected(new Set());
      await fetchList();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add selected asset networks");
    } finally {
      setAdding(false);
    }
  }

  async function delistAssetNetwork(id: string) {
    setDeletingId(id);
    setError(null);
    setSuccess(null);
    try {
      await api.adminDeleteAssetNetwork(id);
      setSuccess("Asset network removed.");
      await fetchList();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to remove asset network");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Assets & Networks</h1>
          <p className="text-sm text-muted-foreground">
            Fine control: add selected pairs and delist existing ones.
          </p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add assets & networks
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Configured asset networks
          </CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${list.length} configured item(s).`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : list.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              No asset networks yet. Click “Add assets & networks” to choose what to seed.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead className="hidden md:table-cell">Contract</TableHead>
                    <TableHead className="text-center">Deposit</TableHead>
                    <TableHead className="text-center">Withdraw</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-medium">{row.assetSymbol}</span>
                        <span className="hidden sm:inline text-muted-foreground ml-1 text-xs">{row.assetName}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-medium">{row.chainName}</span>
                        <span className="text-muted-foreground ml-1 text-xs">({row.chainSlug})</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs max-w-[180px] truncate">
                        {row.contractAddress || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={row.isDepositEnabled ? "default" : "secondary"}>
                          {row.isDepositEnabled ? "On" : "Off"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={row.isWithdrawEnabled ? "default" : "secondary"}>
                          {row.isWithdrawEnabled ? "On" : "Off"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => delistAssetNetwork(row.id)}
                          disabled={deletingId === row.id}
                        >
                          {deletingId === row.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delist
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

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select assets & networks</DialogTitle>
            <DialogDescription>
              Choose only the pairs you want to add now. You can add more later anytime.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-3">
            {optionsLoading ? (
              <div className="py-8 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading options...
              </div>
            ) : optionsError ? (
              <div className="space-y-3">
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {optionsError}
                </p>
                <Button size="sm" variant="outline" onClick={fetchOptions}>Retry</Button>
              </div>
            ) : addableOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No addable options right now.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={selectAll}>
                    Select all ({addableOptions.length})
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearSelected}>
                    Clear
                  </Button>
                  <Button size="sm" className="gap-2" onClick={addSelected} disabled={adding || selectedItems.length === 0}>
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add selected ({selectedItems.length})
                  </Button>
                </div>
                <div className="border rounded-md divide-y overflow-y-auto max-h-[360px]">
                  {addableOptions.map((o) => {
                    const k = optionKey(o.assetSymbol, o.chainSlug);
                    const checked = selected.has(k);
                    return (
                      <label key={k} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer">
                        <Checkbox checked={checked} onCheckedChange={() => toggleSelected(o.assetSymbol, o.chainSlug)} />
                        <span className="font-medium">{o.assetSymbol}</span>
                        <span className="text-muted-foreground text-sm">{o.assetName}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{o.chainName}</span>
                        <span className="text-muted-foreground text-xs">({o.chainSlug})</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

