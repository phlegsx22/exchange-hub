import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Shield, Clock, Eye } from "lucide-react";

interface RiskAlert {
  id: string;
  type: string;
  user: string;
  description: string;
  severity: "high" | "medium" | "low";
  time: string;
  resolved: boolean;
}

const initialAlerts: RiskAlert[] = [
  { id: "ALR-001", type: "Suspicious Login", user: "George Papadopoulos", description: "Login from unusual location (Lagos, NG) after 15 failed attempts", severity: "high", time: "12 min ago", resolved: false },
  { id: "ALR-002", type: "Large Withdrawal", user: "Alice Wang", description: "Withdrawal of 45 BTC ($4.3M) exceeds daily limit", severity: "high", time: "28 min ago", resolved: false },
  { id: "ALR-003", type: "Rapid Trading", user: "Ivan Petrov", description: "342 trades in 5 minutes detected — possible bot activity", severity: "medium", time: "1h ago", resolved: false },
  { id: "ALR-004", type: "KYC Document Mismatch", user: "Diana Okafor", description: "Submitted ID name doesn't match registered name", severity: "medium", time: "2h ago", resolved: false },
  { id: "ALR-005", type: "Multiple Account Detection", user: "Kevin O'Brien", description: "Same device fingerprint found on 3 different accounts", severity: "high", time: "3h ago", resolved: false },
  { id: "ALR-006", type: "Failed 2FA Attempts", user: "Mohamed Hassan", description: "8 consecutive failed 2FA attempts", severity: "low", time: "4h ago", resolved: true },
  { id: "ALR-007", type: "Unusual Transfer Pattern", user: "Laura Chen", description: "Circular transfer pattern detected between 4 accounts", severity: "high", time: "5h ago", resolved: false },
];

const severityColors: Record<string, string> = {
  high: "bg-sell/10 text-sell border-sell/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground",
};

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState(initialAlerts);

  const resolve = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  const unresolvedCount = alerts.filter(a => !a.resolved).length;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-warning shrink-0" /> Risk Alerts
          </h1>
          <p className="text-sm text-muted-foreground">{unresolvedCount} unresolved alerts</p>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map(alert => (
          <Card key={alert.id} className={alert.resolved ? "opacity-50" : ""}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    alert.severity === "high" ? "bg-sell/10" : alert.severity === "medium" ? "bg-warning/10" : "bg-muted"
                  }`}>
                    <Shield className={`h-4 w-4 ${
                      alert.severity === "high" ? "text-sell" : alert.severity === "medium" ? "text-warning" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{alert.type}</p>
                      <Badge variant="outline" className={severityColors[alert.severity]}>{alert.severity}</Badge>
                      {alert.resolved && <Badge variant="outline" className="bg-buy/10 text-buy border-buy/20">Resolved</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{alert.user}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{alert.time}</span>
                    </div>
                  </div>
                </div>
                {!alert.resolved && (
                  <div className="flex gap-2 shrink-0 ml-11 sm:ml-0">
                    <Button variant="outline" size="sm" className="gap-1"><Eye className="h-3.5 w-3.5" /> Review</Button>
                    <Button size="sm" className="gap-1" onClick={() => resolve(alert.id)}>
                      <CheckCircle className="h-3.5 w-3.5" /> Resolve
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
