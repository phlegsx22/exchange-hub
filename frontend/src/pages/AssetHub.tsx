import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gem, Landmark, Smartphone, WalletCards } from "lucide-react";

const sections = [
  {
    title: "PAX Gold",
    description: "Manage tokenized gold deposits, withdrawals, and account balance.",
    path: "/pax-gold",
    icon: Gem,
    accent: "bg-amber-500/10 text-amber-700 border-amber-200",
  },
  {
    title: "Crypto assets",
    description: "Open your crypto portfolio, funding actions, trading, and activity.",
    path: "/crypto-assets",
    icon: WalletCards,
    accent: "bg-sky-500/10 text-sky-700 border-sky-200",
  },
  {
    title: "Mobile Transfers",
    description: "Send value through mobile transfer rails and review transfer history.",
    path: "/mobile-transfers",
    icon: Smartphone,
    accent: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  },
];

export default function AssetHub() {
  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-card">
            <Landmark className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold">Choose a service</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Select the account area you want to manage.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.title} to={section.path} className="group block">
            <div className="flex h-full min-h-56 flex-col justify-between rounded-lg border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="space-y-4">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border ${section.accent}`}>
                  <section.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.description}</p>
                </div>
              </div>
              <Button variant="outline" className="mt-6 w-full justify-between">
                Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
