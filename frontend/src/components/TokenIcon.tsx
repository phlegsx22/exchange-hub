import { useMemo, useState } from "react";
import { TOKENS, type TokenSymbol } from "@/lib/tokens";

export function TokenIcon({
  symbol,
  size = 32,
  className = "",
}: {
  symbol: TokenSymbol;
  size?: number;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const meta = TOKENS[symbol];

  const fallbackText = useMemo(() => symbol.slice(0, 1), [symbol]);

  if (!meta || errored) {
    return (
      <div
        className={`rounded-full bg-muted flex items-center justify-center text-xs font-bold ${className}`}
        style={{ width: size, height: size }}
        aria-label={`${symbol} icon`}
      >
        {fallbackText}
      </div>
    );
  }

  return (
    <img
      src={meta.iconUrl}
      alt={`${meta.name} logo`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={`rounded-full ${className}`}
      onError={() => setErrored(true)}
      referrerPolicy="no-referrer"
    />
  );
}

