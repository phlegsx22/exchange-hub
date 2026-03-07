import { Outlet, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Bell, LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

export function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full min-w-0">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur h-12 sm:h-14 flex items-center justify-between gap-2 px-3 sm:px-4 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <SidebarTrigger className="shrink-0" />
              <div className="flex items-center gap-2 text-sm font-medium truncate">
                <img src={logo} alt="Annex-Ebank" className="h-5 w-5 shrink-0" />
                <span className="hidden sm:inline truncate">Annex-Ebank Admin</span>
                <span className="sm:hidden truncate">Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive text-[8px] text-destructive-foreground flex items-center justify-center">3</span>
              </Button>
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs sm:text-sm h-8 sm:h-9">
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Exit Admin</span>
                  <span className="sm:hidden">Exit</span>
                </Button>
              </Link>
            </div>
          </header>
          <main className="flex-1 overflow-auto min-h-0 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
