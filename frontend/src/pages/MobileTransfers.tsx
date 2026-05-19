import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Smartphone, Send, Users } from "lucide-react";

export default function MobileTransfers() {
  return (
    <div className="container py-8 space-y-6">
      <div>
        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg border bg-emerald-500/10 text-emerald-700">
          <Smartphone className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold">Mobile Transfers</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Mobile transfer tools will live here as their own account area.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <Send className="h-5 w-5" />
          <h2 className="mt-4 text-lg font-semibold">Send by mobile</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Prepare mobile recipient and transfer controls for the next implementation chunk.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <Users className="h-5 w-5" />
          <h2 className="mt-4 text-lg font-semibold">Recipients</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Saved recipients and transfer history can be added here without changing the crypto dashboard.
          </p>
        </div>
      </div>

      <Link to="/dashboard">
        <Button variant="outline">Back to services</Button>
      </Link>
    </div>
  );
}
