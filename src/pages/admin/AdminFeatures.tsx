import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ToggleLeft, Globe, User, Search, ShieldAlert,
  Zap, ArrowLeftRight, TrendingUp, Landmark, Gift, Lock
} from "lucide-react";
import { mockUsers } from "@/lib/admin-mock-data";

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
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userFeatures, setUserFeatures] = useState<Record<string, Record<string, boolean>>>({});

  const toggleGlobal = (id: string) => {
    setGlobals(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const selectedUser = mockUsers.find(u => u.id === selectedUserId);
  const userOverrides = selectedUserId ? userFeatures[selectedUserId] || {} : {};

  const setUserOverride = (featureId: string, value: boolean) => {
    setUserFeatures(prev => ({
      ...prev,
      [selectedUserId]: { ...prev[selectedUserId], [featureId]: value },
    }));
  };

  const filteredUsers = mockUsers.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const categories = ["trading", "security", "platform"] as const;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feature Toggles</h1>
        <p className="text-sm text-muted-foreground">Control platform features globally or per-user</p>
      </div>

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
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-9" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-52"><SelectValue placeholder="Select user..." /></SelectTrigger>
                <SelectContent>
                  {filteredUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
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
                  {globals.map(feature => {
                    const value = feature.id in userOverrides ? userOverrides[feature.id] : feature.enabled;
                    return (
                      <div key={feature.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <feature.icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{feature.name}</span>
                          {feature.id in userOverrides && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">override</Badge>
                          )}
                        </div>
                        <Switch checked={value} onCheckedChange={(v) => setUserOverride(feature.id, v)} />
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


