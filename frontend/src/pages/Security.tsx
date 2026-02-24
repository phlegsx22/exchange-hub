import { Link } from "react-router-dom";
import { getStoredAuth } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Security() {
  const auth = getStoredAuth();
  const user = auth?.user;

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security</h1>
        <p className="text-sm text-muted-foreground">Protect your account and configure 2FA.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Two-factor authentication (2FA)</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Use an authenticator app (TOTP) to secure withdrawals and logins.
          </p>

          <div className="mt-4 flex items-center justify-between rounded-md border bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-muted-foreground">Not enabled</p>
            </div>
            <Button disabled>Enable (coming soon)</Button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label>Step 1 — Scan QR code</Label>
              <div className="h-40 w-full rounded-md border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                QR code will appear here
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Step 2 — Enter 6-digit code</Label>
              <Input id="code" placeholder="123456" inputMode="numeric" pattern="[0-9]*" disabled />
            </div>

            <p className="text-xs text-muted-foreground">
              We’ll wire this up to the backend next (secret generation, verification, backup codes).
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Account</h2>
          <p className="text-xs text-muted-foreground mt-1">Your security-relevant identifiers.</p>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium truncate">{user?.email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">UID</span>
              <span className="font-mono text-xs truncate">{user?.id ?? "—"}</span>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Link to="/settings">
              <Button variant="outline">Back to settings</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

