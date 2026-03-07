import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Wallet, TrendingUp, AlertTriangle, ShieldCheck, Activity, Ban, Clock, UserCheck } from "lucide-react";
import { api } from "@/lib/api";

type OverviewStats = {
  totalUsers: number;
  activeWallets: number;
  pendingKyc: number;
  blacklisted: number;
  suspended: number;
};

export default function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .adminOverview()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load overview");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">Platform health and key metrics</p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-4 w-4 text-foreground" />
            </div>
            <p className="text-2xl font-bold font-mono">{loading ? "…" : (stats?.totalUsers ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="h-4 w-4 text-buy" />
            </div>
            <p className="text-2xl font-bold font-mono">{loading ? "…" : (stats?.activeWallets ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Active Wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-4 w-4 text-foreground" />
            </div>
            <p className="text-2xl font-bold font-mono">—</p>
            <p className="text-xs text-muted-foreground">24h Volume</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-4 w-4 text-sell" />
            </div>
            <p className="text-2xl font-bold font-mono">{loading ? "…" : String(stats?.blacklisted ?? 0)}</p>
            <p className="text-xs text-muted-foreground">Risk Alerts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">User counts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total regular users currently in database:{" "}
              <strong className="text-foreground">{loading ? "…" : (stats?.totalUsers ?? 0).toLocaleString()}</strong>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trading Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Real 24h volume is not wired yet. This card will show live values when trade aggregation is available.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Platform Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-muted-foreground" /> Pending KYC</div>
              <Badge variant="secondary">{loading ? "…" : stats?.pendingKyc ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><Ban className="h-4 w-4 text-sell" /> Blacklisted</div>
              <Badge variant="destructive">{loading ? "…" : stats?.blacklisted ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Suspended</div>
              <Badge variant="outline">{loading ? "…" : stats?.suspended ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-buy" /> System Health</div>
              <Badge className="bg-buy/10 text-buy border-buy/20">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" /> API</div>
              <span className="font-mono text-xs">—</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-sm text-muted-foreground">
              No audit events are wired yet.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
