import { useEffect, useRef } from "react";

interface BinanceTickerProps {
  theme?: "dark" | "light";
  transparent?: boolean;
}

declare global {
  interface Window {
    BinanceWidget?: { init: () => void };
  }
}

export function BinanceTicker({ theme = "dark", transparent = false }: BinanceTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous widget content
    containerRef.current.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "binance-widget-marquee";
    widgetDiv.setAttribute("data-cmc-ids", "1,1027,52,3408,5426,74,2010,5994,20947,35336,24478,13502");
    widgetDiv.setAttribute("data-theme", theme);
    widgetDiv.setAttribute("data-transparent", String(transparent));
    widgetDiv.setAttribute("data-locale", "en");
    widgetDiv.setAttribute("data-fiat", "USD");
    widgetDiv.setAttribute("data-layout", "banner");
    widgetDiv.setAttribute("data-powered-by", "Powered by");
    widgetDiv.setAttribute("data-disclaimer", "Disclaimer");

    containerRef.current.appendChild(widgetDiv);

    // Re-trigger the widget script
    if (window.BinanceWidget) {
      try {
        window.BinanceWidget.init();
      } catch {
        // Widget may self-init
      }
    }
  }, [theme, transparent]);

  return <div ref={containerRef} className="w-full overflow-hidden" />;
}
