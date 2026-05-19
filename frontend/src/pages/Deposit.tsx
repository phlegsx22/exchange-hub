import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { api, type SupportedAssetNetwork, type UserDepositAddress } from "@/lib/api";
import { Copy } from "lucide-react";

const TOKEN_ICON_BY_SYMBOL: Record<string, string> = {
  BTC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
  ETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  SOL: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  BNB: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  USDT: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  USDC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  TRX: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png",
  ARB: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0x912CE59144191C1204E64559FE8253a0e49E6548/logo.png",
  PAXG: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x45804880De22913dAFE09f4980848ECE6EcbAf78/logo.png",
};

const NETWORK_ICON_BY_SLUG: Record<string, string> = {
  bitcoin: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
  ethereum: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  base: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  arbitrum: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  bsc: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png",
  solana: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  tron: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png",
};

function CircleIcon({ src, alt, fallback }: { src?: string; alt: string; fallback: string }) {
  if (!src) {
    return (
      <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
        {fallback}
      </div>
    );
  }
  return <img src={src} alt={alt} className="h-4 w-4 rounded-full" loading="lazy" decoding="async" referrerPolicy="no-referrer" />;
}

export default function Deposit() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<UserDepositAddress[]>([]);
  const [supported, setSupported] = useState<SupportedAssetNetwork[]>([]);

  const [asset, setAsset] = useState<string>("");
  const [assetNetworkId, setAssetNetworkId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([api.userDepositAddresses(), api.supportedNetworks()])
      .then(([d, s]) => {
        if (cancelled) return;
        setAddresses(d.addresses ?? []);
        setSupported((s.assetNetworks ?? []).filter((n) => n.isDepositEnabled));
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
      new Set(supported.map((a) => a.assetSymbol))
    ).sort();
  }, [supported]);

  useEffect(() => {
    if (asset || !assets.length) return;
    const requested = searchParams.get("asset")?.trim().toUpperCase();
    setAsset(requested && assets.includes(requested) ? requested : assets[0]);
  }, [asset, assets, searchParams]);

  const assetNetworks = useMemo(() => {
    return supported
      .filter((a) => a.assetSymbol === asset)
      .sort((a, b) => a.chainName.localeCompare(b.chainName));
  }, [supported, asset]);

  useEffect(() => {
    // Do not preselect a network: user must choose explicitly.
    setAssetNetworkId("");
  }, [asset]);

  const selected = assetNetworks.find((n) => n.id === assetNetworkId) ?? null;
  const selectedAddress = addresses.find((a) => a.assetNetworkId === assetNetworkId) ?? null;

  return (
    <div className="container py-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Deposit</h1>
        <p className="text-sm text-muted-foreground">Select an asset and then choose one of its supported networks.</p>
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
                      <span className="inline-flex items-center gap-2">
                        <CircleIcon
                          src={TOKEN_ICON_BY_SYMBOL[a]}
                          alt={`${a} icon`}
                          fallback={a.slice(0, 1)}
                        />
                        {a}
                      </span>
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
                      <span className="inline-flex items-center gap-2">
                        <CircleIcon
                          src={NETWORK_ICON_BY_SLUG[n.chainSlug.toLowerCase()]}
                          alt={`${n.chainName} icon`}
                          fallback={n.chainName.slice(0, 1)}
                        />
                        {n.chainName} ({n.chainSlug})
                      </span>
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

          {assetNetworkId && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <div className="mb-2 flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <CircleIcon src={TOKEN_ICON_BY_SYMBOL[asset]} alt={`${asset} icon`} fallback={asset.slice(0, 1)} />
                  <span className="font-semibold">{asset || "Asset"}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CircleIcon
                    src={NETWORK_ICON_BY_SLUG[selected?.chainSlug?.toLowerCase() ?? ""]}
                    alt={`${selected?.chainName ?? "Network"} icon`}
                    fallback={(selected?.chainName ?? "N").slice(0, 1)}
                  />
                  <span className="font-semibold">{selected?.chainName ?? "Network"}</span>
                </span>
              </div>
              Only deposit <span className="font-semibold">{asset || "this asset"}</span> on{" "}
              <span className="font-semibold">{selected?.chainName ?? "the selected network"}</span> to this address.
              Depositing a different asset or using another network may result in permanent loss.
            </div>
          )}

          {!assetNetworkId ? (
            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              Choose a network to view its deposit address.
            </div>
          ) : selectedAddress ? (
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
