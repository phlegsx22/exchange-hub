import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Globe, User, Search, ShieldAlert,
  Zap, ArrowLeftRight, TrendingUp, Landmark, Gift, Lock, Loader2
} from "lucide-react";
import { api, type AdminUserRow } from "@/lib/api";

interface GlobalFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: React.ElementType;
  category: "trading" | "security" | "platform";
}

const initialGlobals: GlobalFeature[] = [
  { id: "spot_trading", name: "Spot Trading", description: "Enable/disable spot trading platform-wide", enabled: true, icon: TrendingUp, category: "trading" },
  { id: "margin_trading", name: "Margin Trading", description: "Allow users to trade with leverage", enabled: true, icon: Zap, category: "trading" },
  { id: "futures", name: "Futures Trading", description: "Enable perpetual and dated futures", enabled: false, icon: ArrowLeftRight, category: "trading" },
  { id: "staking", name: "Staking / Earn", description: "Allow users to stake and earn yield", enabled: true, icon: Landmark, category: "trading" },
  { id: "withdrawals", name: "Withdrawals", description: "Global withdrawal toggle for emergencies", enabled: true, icon: Lock, category: "security" },
  { id: "new_registrations", name: "New Registrations", description: "Allow new user sign-ups", enabled: true, icon: User, category: "platform" },
  { id: "referral_program", name: "Referral Program", description: "Enable referral commission system", enabled: true, icon: Gift, category: "platform" },
  { id: "kyc_required", name: "Mandatory KYC", description: "Require KYC for all trading activity", enabled: true, icon: ShieldAlert, category: "security" },
];

export default function AdminFeatures() {
  const [globals, setGlobals] = useState(initialGlobals);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [updatingFeature, setUpdatingFeature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setUsersLoading(true);
    api
      .adminUsers({ limit: 500 })
      .then((res) => {
        if (!cancelled) setUsers(res.users ?? []);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load users");
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleGlobal = (id: string) => {
    setGlobals(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const selectedUser = users.find(u => u.id === selectedUserId) ?? null;

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const categories = ["trading", "security", "platform"] as const;

  async function toggleUserFeature(featureId: keyof AdminUserRow["features"], value: boolean) {
    if (!selectedUser) return;
    setUpdatingFeature(featureId);
    setError(null);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? { ...u, features: { ...u.features, [featureId]: value } }
          : u
      )
    );

    try {
      await api.adminSetUserFeatures(selectedUser.id, { [featureId]: value });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update feature");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, features: { ...u.features, [featureId]: !value } }
            : u
        )
      );
    } finally {
      setUpdatingFeature(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Feature Toggles</h1>
        <p className="text-sm text-muted-foreground">Control platform features globally or per-user</p>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="p-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Global Features */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4" /> Global Features
        </h2>
        {categories.map(cat => (
          <div key={cat} className="mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{cat}</p>
            <div className="grid gap-3">
              {globals.filter(f => f.category === cat).map(feature => (
                <Card key={feature.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${feature.enabled ? "bg-buy/10" : "bg-muted"}`}>
                        <feature.icon className={`h-4 w-4 ${feature.enabled ? "text-buy" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{feature.name}</p>
                          <Badge variant="outline" className={feature.enabled ? "bg-buy/10 text-buy border-buy/20" : "bg-muted text-muted-foreground"}>
                            {feature.enabled ? "ON" : "OFF"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                    <Switch checked={feature.enabled} onCheckedChange={() => toggleGlobal(feature.id)} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Per-User Overrides */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <User className="h-4 w-4" /> Per-User Overrides
        </h2>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-9" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue placeholder={usersLoading ? "Loading users..." : "Select user..."} />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUser ? (
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium text-sm">{selectedUser.name}</p>
                  <Badge variant="outline" className="text-xs">{selectedUser.status}</Badge>
                </div>
                <div className="grid gap-2">
                  {(Object.keys(selectedUser.features) as Array<keyof AdminUserRow["features"]>).map((featureId) => {
                    const value = selectedUser.features[featureId];
                    const label = featureId.charAt(0).toUpperCase() + featureId.slice(1);
                    const busy = updatingFeature === featureId;
                    return (
                      <div key={featureId} className="flex items-center justify-between py-1.5">
                        <span className="text-sm">{label}</span>
                        <div className="flex items-center gap-2">
                          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                          <Switch
                            checked={value}
                            disabled={busy}
                            onCheckedChange={(v) => void toggleUserFeature(featureId, v)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Select a user to manage their feature overrides</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


