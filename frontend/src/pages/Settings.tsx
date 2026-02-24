import { useMemo, useState } from "react";
import { getStoredAuth, setStoredAuth } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function Settings() {
  const auth = useMemo(() => getStoredAuth(), []);
  const user = auth?.user;
  const initialName = user?.name ?? "";
  const [displayName, setDisplayName] = useState(initialName);

  const initials = (displayName || user?.email || "U")
    .toString()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  function saveProfile() {
    const current = getStoredAuth();
    if (!current) return;
    setStoredAuth({
      ...current,
      user: {
        ...current.user,
        name: displayName.trim() || current.user.name,
      },
    });
    toast({ title: "Saved", description: "Your profile settings were updated." });
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Profile</h2>
          <p className="text-xs text-muted-foreground mt-1">Your public display info.</p>

          <div className="mt-4 flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="font-semibold">{initials || "U"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{displayName || user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">UID: {user?.id ?? "—"}</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Silverfang"
              autoComplete="name"
            />
            <p className="text-xs text-muted-foreground">
              This updates what we show in the UI. (Backend profile sync can be added next.)
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={saveProfile}>Save</Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Preferences</h2>
          <p className="text-xs text-muted-foreground mt-1">Exchange defaults.</p>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label>Base currency</Label>
              <Input value="USD" disabled />
            </div>
            <div className="space-y-2">
              <Label>Notifications</Label>
              <Input value="In-app (coming soon)" disabled />
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Input value="System (coming soon)" disabled />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

