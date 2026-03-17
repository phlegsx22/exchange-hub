import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { api, type UserDepositAddress } from "@/lib/api";
import { Copy } from "lucide-react";

export default function Deposit() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<UserDepositAddress[]>([]);

  const [asset, setAsset] = useState<string>("");
  const [assetNetworkId, setAssetNetworkId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.userDepositAddresses()
      .then((d) => {
        if (cancelled) return;
        setAddresses(d.addresses ?? []);
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
      new Set(addresses.map((a) => a.assetSymbol))
    ).sort();
  }, [addresses]);

  useEffect(() => {
    if (!asset && assets.length) setAsset(assets[0]);
  }, [asset, assets]);

  const assetNetworks = useMemo(() => {
    return addresses.filter((a) => a.assetSymbol === asset);
  }, [addresses, asset]);

  useEffect(() => {
    // pick first network when asset changes
    const first = assetNetworks[0];
    setAssetNetworkId(first?.assetNetworkId ?? "");
  }, [asset, assetNetworks]);

  const selected = assetNetworks.find((n) => n.assetNetworkId === assetNetworkId) ?? null;
  const selectedAddress = addresses.find((a) => a.assetNetworkId === assetNetworkId) ?? null;

  return (
    <div className="container py-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Deposit</h1>
        <p className="text-sm text-muted-foreground">Only admin-seeded token networks are shown here.</p>
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
                    <SelectItem key={n.assetNetworkId} value={n.assetNetworkId}>
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

          {selectedAddress ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Address</p>
              <div className="flex gap-2">
                <Input readOnly value={selectedAddress.address} className="font-mono" />
                <Button
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(selectedAddress.address);
                  }}
                  title="Copy"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {selectedAddress.memo && <p className="text-xs text-muted-foreground">Memo: {selectedAddress.memo}</p>}
            </div>
          ) : (
            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              Deposit address has not been assigned for this network yet. Please contact support/admin.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

