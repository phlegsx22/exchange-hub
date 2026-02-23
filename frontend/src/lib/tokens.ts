export type TokenSymbol =
  | "BTC"
  | "ETH"
  | "SOL"
  | "USDT"
  | "XRP"
  | "ADA"
  | "DOGE"
  | "BNB"
  | "AVAX"
  | "LINK"
  | "DOT"
  | "MATIC"
  | "UNI";

export interface TokenMeta {
  symbol: TokenSymbol;
  name: string;
  /** Binance spot symbol for USDT quote (lowercase for streams) */
  binanceUsdtPair?: string;
  /** A stable USD price (e.g. USDT) */
  fixedUsdPrice?: number;
  iconUrl: string;
}

// Token icons from the Trust Wallet assets repo (widely used, high quality).
// Note: Some assets are tokens on multiple chains (e.g. USDT). We use the most common reference.
export const TOKENS: Record<TokenSymbol, TokenMeta> = {
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    binanceUsdtPair: "btcusdt",
    iconUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    binanceUsdtPair: "ethusdt",
    iconUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    binanceUsdtPair: "solusdt",
    iconUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether",
    fixedUsdPrice: 1,
    // Ethereum USDT contract logo (most recognizable)
    iconUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  },
  XRP: {
    symbol: "XRP",
    name: "XRP",
    binanceUsdtPair: "xrpusdt",
    iconUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png",
  },
  ADA: {
    symbol: "ADA",
    name: "Cardano",
    binanceUsdtPair: "adausdt",
    iconUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png",
  },
  DOGE: {
    symbol: "DOGE",
    name: "Dogecoin",
    binanceUsdtPair: "dogeusdt",
    iconUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/dogecoin/info/logo.png",
  },
  BNB: {
    symbol: "BNB",
    name: "BNB",
    binanceUsdtPair: "bnbusdt",
    iconUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  },
  AVAX: {
    symbol: "AVAX",
    name: "Avalanche",
    binanceUsdtPair: "avaxusdt",
    iconUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
  },
  LINK: {
    symbol: "LINK",
    name: "Chainlink",
    binanceUsdtPair: "linkusdt",
    iconUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png",
  },
  DOT: {
    symbol: "DOT",
    name: "Polkadot",
    binanceUsdtPair: "dotusdt",
    iconUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polkadot/info/logo.png",
  },
  MATIC: {
    symbol: "MATIC",
    name: "Polygon",
    binanceUsdtPair: "maticusdt",
    iconUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  },
  UNI: {
    symbol: "UNI",
    name: "Uniswap",
    binanceUsdtPair: "uniusdt",
    iconUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png",
  },
};

export const DEFAULT_WATCHLIST: TokenSymbol[] = [
  "BTC",
  "ETH",
  "SOL",
  "USDT",
  "XRP",
  "ADA",
  "DOGE",
];

