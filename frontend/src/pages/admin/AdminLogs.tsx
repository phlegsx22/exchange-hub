import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Filter, AlertTriangle, Info, Shield, Loader2 } from "lucide-react";
import { api, type AdminAuditLog } from "@/lib/api";

const severityColors: Record<string, string> = {
  info: "bg-muted text-muted-foreground",
  warning: "bg-warning/10 text-warning border-warning/20",
  critical: "bg-sell/10 text-sell border-sell/20",
};

const severityIcons: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  critical: Shield,
};

export default function AdminLogs() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "info" | "warning" | "critical">("all");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ today: 0, warning: 0, critical: 0 });
  const perPage = 20;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const t = setTimeout(() => {
      api
        .adminLogs({
          q: search.trim() || undefined,
          severity: severityFilter,
          limit: perPage,
          offset: page * perPage,
        })
        .then((res) => {
          if (cancelled) return;
          setLogs(res.logs ?? []);
          setTotal(res.total ?? 0);
          setStats({
            today: res.stats?.today ?? 0,
            warning: res.stats?.warning ?? 0,
            critical: res.stats?.critical ?? 0,
          });
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : "Failed to load logs");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, severityFilter, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [total]);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">{total} events tracked</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 self-start" disabled>
          <Download className="h-3.5 w-3.5" /> Export Logs
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="p-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold font-mono">{stats.today}</p>
          <p className="text-xs text-muted-foreground">Today's Events</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold font-mono text-warning">{stats.warning}</p>
          <p className="text-xs text-muted-foreground">Warnings</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold font-mono text-sell">{stats.critical}</p>
          <p className="text-xs text-muted-foreground">Critical</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search actions, actors or targets..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
          </div>
          <Select value={severityFilter} onValueChange={v => { setSeverityFilter(v as typeof severityFilter); setPage(0); }}>
            <SelectTrigger className="w-36"><Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">No log events found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead className="hidden md:table-cell">Target</TableHead>
                    <TableHead className="hidden lg:table-cell">IP</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => {
                    const Icon = severityIcons[log.severity];
                    return (
                      <TableRow key={log.id}>
                        <TableCell><Icon className={`h-3.5 w-3.5 ${log.severity === "critical" ? "text-sell" : log.severity === "warning" ? "text-warning" : "text-muted-foreground"}`} /></TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{log.action}</TableCell>
                        <TableCell className="text-sm">{log.actor}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{log.target}</TableCell>
                        <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={severityColors[log.severity]}>{log.severity}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {total === 0 ? "Showing 0-0 of 0" : `Showing ${page * perPage + 1}-${Math.min((page + 1) * perPage, total)} of ${total}`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
