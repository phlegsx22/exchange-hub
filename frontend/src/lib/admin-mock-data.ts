// Shared mock data for admin pages

export interface MockUser {
  id: string;
  name: string;
  email: string;
  status: "active" | "suspended" | "pending" | "blacklisted";
  kycStatus: "verified" | "pending" | "rejected" | "not_started";
  joinDate: string;
  lastLogin: string;
  totalBalance: number;
  tradeCount: number;
  country: string;
  riskScore: number;
  features: {
    trading: boolean;
    withdrawal: boolean;
    transfer: boolean;
    margin: boolean;
    futures: boolean;
    staking: boolean;
  };
}

export interface MockWallet {
  id: string;
  userId: string;
  userName: string;
  coin: string;
  balance: number;
  frozen: number;
  address: string;
  status: "active" | "frozen" | "pending";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  severity: "info" | "warning" | "critical";
  ip: string;
}

const names = ["Alice Wang", "Bob Martinez", "Charlie Kim", "Diana Okafor", "Erik Johansson", "Fatima Al-Rashid", "George Papadopoulos", "Hannah Mueller", "Ivan Petrov", "Julia Santos", "Kevin O'Brien", "Laura Chen", "Mohamed Hassan", "Nina Volkov", "Oscar Delgado", "Priya Sharma"];
const countries = ["US", "UK", "DE", "JP", "KR", "BR", "NG", "IN", "AU", "CA", "SG", "AE", "FR", "SE", "RU", "MX"];
const coins = ["BTC", "ETH", "USDT", "SOL", "XRP", "BNB", "ADA", "DOGE", "AVAX", "LINK"];

export const mockUsers: MockUser[] = names.map((name, i) => ({
  id: `USR-${(1000 + i).toString()}`,
  name,
  email: `${name.toLowerCase().replace(/ /g, ".")}@email.com`,
  status: (["active", "active", "active", "suspended", "pending", "active", "blacklisted", "active", "active", "active", "pending", "active", "active", "suspended", "active", "active"] as MockUser["status"][])[i],
  kycStatus: (["verified", "verified", "pending", "verified", "not_started", "verified", "rejected", "verified", "verified", "pending", "not_started", "verified", "verified", "verified", "pending", "verified"] as MockUser["kycStatus"][])[i],
  joinDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split("T")[0],
  lastLogin: `${Math.floor(Math.random() * 48) + 1}h ago`,
  totalBalance: Math.floor(Math.random() * 500000 + 1000),
  tradeCount: Math.floor(Math.random() * 5000 + 10),
  country: countries[i],
  riskScore: Math.floor(Math.random() * 100),
  features: {
    trading: i !== 3 && i !== 6,
    withdrawal: i !== 3 && i !== 6 && i !== 4,
    transfer: i !== 6,
    margin: i < 8,
    futures: i < 5,
    staking: true,
  },
}));

export const mockWallets: MockWallet[] = mockUsers.flatMap((user, ui) =>
  coins.slice(0, 3 + Math.floor(Math.random() * 4)).map((coin, ci) => ({
    id: `WLT-${ui * 10 + ci + 1000}`,
    userId: user.id,
    userName: user.name,
    coin,
    balance: coin === "BTC" ? Math.random() * 5 : coin === "ETH" ? Math.random() * 30 : Math.floor(Math.random() * 50000),
    frozen: Math.random() > 0.85 ? Math.random() * 1000 : 0,
    address: `0x${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}...${Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
    status: (Math.random() > 0.9 ? "frozen" : Math.random() > 0.95 ? "pending" : "active") as MockWallet["status"],
    createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split("T")[0],
  }))
);

const auditActions = [
  "User Login", "Password Changed", "KYC Approved", "KYC Rejected", "Withdrawal Initiated",
  "User Blacklisted", "Feature Disabled", "Wallet Frozen", "Admin Login", "Role Changed",
  "Wallet Created", "Transfer Approved", "Suspicious Activity Flagged", "API Key Generated",
  "2FA Enabled", "Account Suspended", "Limit Changed", "Settings Updated"
];

export const mockAuditLogs: AuditLog[] = Array.from({ length: 100 }, (_, i) => {
  const action = auditActions[Math.floor(Math.random() * auditActions.length)];
  const severity: AuditLog["severity"] = action.includes("Blacklist") || action.includes("Suspicious") || action.includes("Frozen")
    ? "critical"
    : action.includes("Rejected") || action.includes("Suspended") || action.includes("Disabled")
      ? "warning"
      : "info";
  return {
    id: `LOG-${(10000 + i).toString()}`,
    timestamp: new Date(Date.now() - i * 1000 * 60 * (Math.floor(Math.random() * 30) + 5)).toISOString(),
    action,
    actor: Math.random() > 0.3 ? "Admin" : names[Math.floor(Math.random() * names.length)],
    target: names[Math.floor(Math.random() * names.length)],
    details: `${action} performed successfully`,
    severity,
    ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  };
});
