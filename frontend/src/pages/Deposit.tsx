import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { api, type SupportedAssetNetwork } from "@/lib/api";
import { Copy, Info } from "lucide-react";

export default function Deposit() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networks, setNetworks] = useState<SupportedAssetNetwork[]>([]);

  const [asset, setAsset] = useState<string>("");
  const [assetNetworkId, setAssetNetworkId] = useState<string>("");

  const [address, setAddress] = useState<string>("");
  const [memo, setMemo] = useState<string | null>(null);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .supportedNetworks()
      .then((r) => {
        if (cancelled) return;
        setNetworks(r.assetNetworks ?? []);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load networks");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const assets = useMemo(() => {
    return Array.from(
      new Set(networks.filter((n) => n.isDepositEnabled).map((n) => n.assetSymbol))
    ).sort();
  }, [networks]);

  useEffect(() => {
    if (!asset && assets.length) setAsset(assets[0]);
  }, [asset, assets]);

  const assetNetworks = useMemo(() => {
    return networks
      .filter((n) => n.assetSymbol === asset)
      .filter((n) => n.isDepositEnabled);
  }, [networks, asset]);

  useEffect(() => {
    // pick first network when asset changes
    const first = assetNetworks[0];
    setAssetNetworkId(first?.id ?? "");
    setAddress("");
    setMemo(null);
    setIsPlaceholder(false);
  }, [asset, assetNetworks]);

  async function getAddress(): Promise<void> {
    if (!assetNetworkId) return;
    setFetchingAddress(true);
    setError(null);
    try {
      const r = await api.depositAddress(assetNetworkId);
      setAddress(r.address);
      setMemo(r.memo);
      setIsPlaceholder(!!r.isPlaceholder);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to get address");
    } finally {
      setFetchingAddress(false);
    }
  }

  const selected = assetNetworks.find((n) => n.id === assetNetworkId) ?? null;

  return (
    <div className="container py-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Deposit</h1>
        <p className="text-sm text-muted-foreground">Select an asset and network to get a deposit address.</p>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Asset</p>
              <Select value={asset} onValueChange={setAsset} disabled={loading || assets.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading…" : "Select asset"} />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Network</p>
              <Select value={assetNetworkId} onValueChange={setAssetNetworkId} disabled={loading || assetNetworks.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading…" : "Select network"} />
                </SelectTrigger>
                <SelectContent>
                  {assetNetworks.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.chainName} ({n.chainSlug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selected?.contractAddress && (
                <p className="text-xs text-muted-foreground break-all">
                  Token contract: {selected.contractAddress}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={getAddress} disabled={!assetNetworkId || fetchingAddress || loading}>
              {fetchingAddress ? "Generating…" : "Get deposit address"}
            </Button>
          </div>

          {address && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Address</p>
              <div className="flex gap-2">
                <Input readOnly value={address} className="font-mono" />
                <Button
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(address);
                  }}
                  title="Copy"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {memo && <p className="text-xs text-muted-foreground">Memo: {memo}</p>}
              {isPlaceholder && (
                <div className="flex items-start gap-2 rounded-md border p-3 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    This is a placeholder address until we plug in a real wallet/address provider and chain indexer.
                    Deposits won’t credit balances yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

