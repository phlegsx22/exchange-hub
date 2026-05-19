import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUserBalances } from "@/hooks/useUserBalances";
import { ArrowDownRight, ArrowUpRight, Gem, History, ShieldCheck, Wallet } from "lucide-react";

const PAXG_SYMBOL = "PAXG";

export default function PaxGoldDashboard() {
  const { balances } = useUserBalances([PAXG_SYMBOL]);
  const balance = balances[PAXG_SYMBOL] ?? 0;

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-amber-200 bg-amber-500/10 text-amber-700">
            <Gem className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold">PAX Gold</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Deposit, withdraw, and track your PAXG balance. Balances update after admin review and crediting.
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline">All services</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 md:col-span-2">
          <p className="text-sm text-muted-foreground">Available PAXG Balance</p>
          <p className="mt-2 font-mono text-4xl font-bold">{balance.toLocaleString(undefined, { maximumFractionDigits: 8 })}</p>
          <p className="mt-2 text-xs text-muted-foreground">PAXG deposits are credited from the admin dashboard after confirmation.</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-buy" /> Review workflow
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Send PAXG to your assigned address, then wait for admin confirmation before the balance appears here.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/deposit?asset=PAXG">
          <Button className="h-24 w-full flex-col gap-2">
            <ArrowDownRight className="h-5 w-5" /> Deposit PAXG
          </Button>
        </Link>
        <Link to="/withdraw?asset=PAXG">
          <Button variant="outline" className="h-24 w-full flex-col gap-2">
            <ArrowUpRight className="h-5 w-5" /> Withdraw PAXG
          </Button>
        </Link>
        <Button variant="outline" className="h-24 w-full flex-col gap-2" disabled>
          <History className="h-5 w-5" /> History
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Wallet className="h-4 w-4" /> Deposit instructions
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the PAXG deposit screen to view your assigned network address. Deposits do not auto-credit from on-chain polling in this flow.
        </p>
      </div>
    </div>
  );
}
