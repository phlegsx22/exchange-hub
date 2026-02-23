import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, TrendingUp, Search } from "lucide-react";
import logo from "@/assets/logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-6xl font-bold font-mono mb-2">404</h1>
        <p className="text-xl font-semibold mb-2">Page not found</p>
        <p className="text-muted-foreground text-sm mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Home className="h-4 w-4" /> Go Home
            </Button>
          </Link>
          <Link to="/trade">
            <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
              <TrendingUp className="h-4 w-4" /> Start Trading
            </Button>
          </Link>
        </div>
        <div className="mt-8 pt-6 border-t flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <img src={logo} alt="Annex-Ebank" className="h-4 w-4" />
          <span>Annex-Ebank — Markets are always open</span>
          <span className="relative flex h-1.5 w-1.5 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-buy opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-buy" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
