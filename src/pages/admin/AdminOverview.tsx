import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Wallet, TrendingUp, AlertTriangle, ShieldCheck, Activity,
  ArrowUpRight, ArrowDownRight, Ban, Clock, UserCheck, Eye
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { mockUsers, mockWallets, mockAuditLogs } from "@/lib/admin-mock-data";
import { useEffect, useState } from "react";

const userGrowth = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  users: 8000 + i * 280 + Math.floor(Math.random() * 500),
}));

const volumeData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  volume: Math.floor(Math.random() * 800 + 200),
}));

const stats = [
  { label: "Total Users", value: mockUsers.length.toLocaleString(), change: "+12.4%", up: true, icon: Users, color: "text-foreground" },
  { label: "Active Wallets", value: mockWallets.filter(w => w.status === "active").length.toLocaleString(), change: "+8.2%", up: true, icon: Wallet, color: "text-buy" },
  { label: "24h Volume", value: "$2.4B", change: "+3.1%", up: true, icon: TrendingUp, color: "text-foreground" },
  { label: "Risk Alerts", value: "7", change: "+2", up: true, icon: AlertTriangle, color: "text-sell" },
];

export default function AdminOverview() {
  const [onlineUsers, setOnlineUsers] = useState(1284);

  useEffect(() => {
    const t = setInterval(() => setOnlineUsers(p => p + Math.floor((Math.random() - 0.45) * 20)), 3000);
    return () => clearInterval(t);
  }, []);

  const recentLogs = mockAuditLogs.slice(0, 8);
  const pendingKyc = mockUsers.filter(u => u.kycStatus === "pending").length;
  const blacklisted = mockUsers.filter(u => u.status === "blacklisted").length;
  const suspended = mockUsers.filter(u => u.status === "suspended").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">Platform health and key metrics at a glance</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-buy opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-buy" />
            </span>
            <span className="font-mono">{onlineUsers.toLocaleString()}</span> online
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <div className={`flex items-center gap-0.5 text-xs font-mono ${s.up ? "text-buy" : "text-sell"}`}>
                  {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {s.change}
                </div>
              </div>
              <p className="text-2xl font-bold font-mono">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">User Growth (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowth}>
                  <defs>
                    <linearGradient id="adminGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Area type="monotone" dataKey="users" stroke="hsl(var(--foreground))" fill="url(#adminGrowth)" strokeWidth={2} dot={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">24h Trading Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                  <Bar dataKey="volume" fill="hsl(var(--muted-foreground))" radius={[2, 2, 0, 0]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Quick Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Platform Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-muted-foreground" /> Pending KYC</div>
              <Badge variant="secondary">{pendingKyc}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><Ban className="h-4 w-4 text-sell" /> Blacklisted</div>
              <Badge variant="destructive">{blacklisted}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Suspended</div>
              <Badge variant="outline">{suspended}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-buy" /> System Health</div>
              <Badge className="bg-buy/10 text-buy border-buy/20">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" /> API Latency</div>
              <span className="font-mono text-xs">12ms</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      log.severity === "critical" ? "bg-sell" : log.severity === "warning" ? "bg-warning" : "bg-muted-foreground"
                    }`} />
                    <span className="font-medium">{log.action}</span>
                    <span className="text-muted-foreground">→ {log.target}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{log.actor}</span>
                    <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
