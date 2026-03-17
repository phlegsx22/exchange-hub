import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserBalances } from "@/hooks/useUserBalances";
import { TokenIcon } from "@/components/TokenIcon";
import { TOKENS } from "@/lib/tokens";

export default function AssetDetails() {
  const params = useParams<{ symbol: string }>();
  const symbol = (params.symbol ?? "").toUpperCase();
  const { balances, portfolio } = useUserBalances(symbol ? [symbol] : []);

  const item = useMemo(
    () => (portfolio?.items ?? []).find((x) => x.symbol.toUpperCase() === symbol) ?? null,
    [portfolio, symbol]
  );

  const balance = balances[symbol] ?? 0;
  const valueUsd = item?.valueUsd ?? null;

  return (
    <div className="container py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TokenIcon symbol={symbol as keyof typeof TOKENS} size={36} />
          <div>
            <h1 className="text-2xl font-bold">{symbol} Asset</h1>
            <p className="text-sm text-muted-foreground">{TOKENS[symbol as keyof typeof TOKENS]?.name ?? symbol}</p>
          </div>
        </div>
        <Link to="/assets">
          <Button variant="outline" size="sm">Back to Assets</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-mono text-xl">{balance.toFixed(8)} {symbol}</p>
          <p className="text-sm text-muted-foreground">
            {valueUsd == null ? "Value unavailable" : `≈ $${valueUsd.toFixed(2)}`}
          </p>
          <div className="flex gap-2 pt-2">
            <Link to="/deposit"><Button size="sm">Deposit</Button></Link>
            <Link to="/withdraw"><Button size="sm" variant="outline">Withdraw</Button></Link>
            <Link to="/transfer"><Button size="sm" variant="outline">Transfer</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
