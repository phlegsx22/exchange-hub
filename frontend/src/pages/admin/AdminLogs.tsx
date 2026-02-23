import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Filter, Clock, AlertTriangle, Info, Shield } from "lucide-react";
import { mockAuditLogs, type AuditLog } from "@/lib/admin-mock-data";

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
  const [severityFilter, setSeverityFilter] = useState("all");
  const [page, setPage] = useState(0);
  const perPage = 20;

  const filtered = mockAuditLogs.filter(log => {
    const matchSearch = log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === "all" || log.severity === severityFilter;
    return matchSearch && matchSeverity;
  });

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const criticalCount = mockAuditLogs.filter(l => l.severity === "critical").length;
  const warningCount = mockAuditLogs.filter(l => l.severity === "warning").length;
  const todayCount = mockAuditLogs.filter(l => {
    const logDate = new Date(l.timestamp);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} events tracked</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 self-start">
          <Download className="h-3.5 w-3.5" /> Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold font-mono">{todayCount}</p>
          <p className="text-xs text-muted-foreground">Today's Events</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold font-mono text-warning">{warningCount}</p>
          <p className="text-xs text-muted-foreground">Warnings</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold font-mono text-sell">{criticalCount}</p>
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
          <Select value={severityFilter} onValueChange={v => { setSeverityFilter(v); setPage(0); }}>
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

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
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
              {paged.map(log => {
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
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {page * perPage + 1}-{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
