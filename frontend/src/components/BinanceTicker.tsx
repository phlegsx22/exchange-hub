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

const BINANCE_WIDGET_SRC =
  "https://public.bnbstatic.com/unpkg/growth-widget/cryptoCurrencyWidget@0.0.24.min.js";
let widgetScriptPromise: Promise<void> | null = null;

function ensureWidgetScript(): Promise<void> {
  if (window.BinanceWidget) return Promise.resolve();
  if (widgetScriptPromise) return widgetScriptPromise;

  widgetScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${BINANCE_WIDGET_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Binance widget")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = BINANCE_WIDGET_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Binance widget"));
    document.body.appendChild(script);
  });

  return widgetScriptPromise;
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

    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const initWidget = () => {
      ensureWidgetScript()
        .then(() => {
          if (cancelled) return;
          if (window.BinanceWidget) {
            try {
              window.BinanceWidget.init();
            } catch {
              // Widget may self-init.
            }
          }
        })
        .catch(() => {
          // Ignore third-party widget load errors to avoid breaking homepage render.
        });
    };

    // Delay third-party widget work until browser is idle.
    if (window.requestIdleCallback) {
      idleId = window.requestIdleCallback(initWidget);
    } else {
      timeoutId = window.setTimeout(initWidget, 200);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [theme, transparent]);

  return <div ref={containerRef} className="w-full overflow-hidden" />;
}
