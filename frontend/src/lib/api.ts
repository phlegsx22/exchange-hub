function defaultApiBase(): string {
  return "https://api.annex-ebank.com";
}

export const API_BASE =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL).replace(/\/+$/, "")
    : defaultApiBase();

const NETWORK_ERROR_MESSAGE = "Network error. Please try again.";

const AUTH_KEY = "exchange_auths";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
  kycStatus?: string;
  role?: string;
}

export interface AuthState {
  user: AuthUser;
  accessToken: string;
  expiresIn?: string;
}

export interface RegisterResponse {
  ok: true;
  message: string;
  user: AuthUser;
}

export type AdminRegisterResponse = AuthState;

export type SupportedAssetNetwork = {
  id: string;
  assetSymbol: string;
  chainSlug: string;
  chainName: string;
  contractAddress: string | null;
  isDepositEnabled: boolean;
  isWithdrawEnabled: boolean;
};

export type UserDepositAddress = {
  assetNetworkId: string;
  assetSymbol: string;
  chainSlug: string;
  chainName: string;
  contractAddress: string | null;
  address: string;
  memo: string | null;
};

export type RecentActivityItem = {
  id: string;
  type: "deposit" | "withdrawal" | "trade" | "transfer" | "fee";
  direction: "in" | "out";
  amount: string;
  assetSymbol: string;
  chainSlug: string;
  chainName: string;
  receiptNo?: string | null;
  description: string | null;
  createdAt: string; // ISO string
};

export type AdminAuditLog = {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  severity: "info" | "warning" | "critical";
  ip: string;
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  status: "active" | "suspended" | "pending" | "blacklisted";
  kycStatus: "verified" | "pending" | "rejected" | "not_started" | string;
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
};

export function getStoredAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function setStoredAuth(data: AuthState): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function getAuthHeaders(): HeadersInit {
  const auth = getStoredAuth();
  return {
    "Content-Type": "application/json",
    ...(auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
  };
}

function getAuthHeaderOnly(): HeadersInit {
  const auth = getStoredAuth();
  return auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as { error?: string }).error ?? res.statusText);
    (err as Error & { code?: string; issues?: unknown }).code = (data as { code?: string }).code;
    (err as Error & { issues?: unknown }).issues = (data as { issues?: unknown }).issues;
    throw err;
  }
  return data as T;
}

export const api = {
  async register(body: { email: string; password: string; name: string; confirmPassword: string }) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<RegisterResponse>(res);
  },

  async login(body: { email: string; password: string }) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<AuthState>(res);
  },

  async adminLogin(body: { email: string; password: string }) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<AuthState>(res);
  },

  async adminRegister(body: { name: string; email: string; password: string; bootstrapSecret: string }) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<AdminRegisterResponse>(res);
  },

  async logout() {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    await res.json().catch(() => ({}));
    clearStoredAuth();
  },

  /**
   * Validate current session and get fresh user data from server.
   * This is the source of truth - never trust localStorage alone.
   */
  async me(): Promise<{ user: AuthUser }> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/me`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{ user: AuthUser }>(res);
  },

  async resendVerification(email: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{ ok: true; message: string }>(res);
  },

  async kycStatus() {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/kyc/status`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{
      kycStatus: string;
      kycSubmittedAt: string | null;
      latestSubmission: null | {
        id: string;
        status: string;
        rejectionReason: string | null;
        submittedAt: string;
      };
    }>(res);
  },

  async uploadKycMedia(
    file: File,
    kind: "document" | "selfie" | "document_back" | "proof_of_address"
  ) {
    let sigRes: Response;
    try {
      sigRes = await fetch(`${API_BASE}/kyc/upload-signature`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ kind }),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    const sig = await handleResponse<{
      ok: true;
      cloudName: string;
      apiKey: string;
      timestamp: number;
      folder: string;
      publicId: string;
      signature: string;
      uploadUrl: string;
    }>(sigRes);

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);
    form.append("public_id", sig.publicId);

    let upRes: Response;
    try {
      upRes = await fetch(sig.uploadUrl, {
        method: "POST",
        body: form,
      });
    } catch {
      throw new Error("Failed to upload to Cloudinary");
    }
    const up = await upRes.json().catch(() => ({}));
    if (!upRes.ok) {
      const msg = (up as { error?: { message?: string } })?.error?.message ?? upRes.statusText;
      throw new Error(msg || "Cloudinary upload failed");
    }
    const secureUrl = (up as { secure_url?: string }).secure_url;
    if (!secureUrl) throw new Error("Cloudinary did not return a secure_url");
    return { ok: true as const, url: secureUrl };
  },

  async kycSubmit(body: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    countryOfResidence: string;
    address: string;
    phoneNumber?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    documentType: "passport" | "national_id" | "drivers_license";
    documentNumber?: string;
    documentUrl?: string;
    documentBackUrl?: string;
    proofOfAddressUrl?: string;
    selfieUrl?: string;
    ocrConfidence?: number;
    faceMatchScore?: number;
    livenessScore?: number;
    ocrExtractedText?: string;
  }) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/kyc/submit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{ submissionId?: string; status: string; message: string }>(res);
  },

  async supportedNetworks() {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/wallets/supported`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{ ok: true; assetNetworks: SupportedAssetNetwork[] }>(res);
  },

  async depositAddress(assetNetworkId: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/wallets/deposit-address`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ assetNetworkId }),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{ ok: true; address: string; memo: string | null; isPlaceholder: boolean }>(res);
  },

  async userDepositAddresses() {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/wallets/deposit-addresses`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{ ok: true; addresses: UserDepositAddress[] }>(res);
  },

  async withdrawRequest(body: { assetNetworkId: string; toAddress: string; amount: string | number }) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/wallets/withdrawals/request`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{
      ok: true;
      withdrawal: {
        id?: string;
        receiptNo?: string;
        status: string;
        createdAt: string | Date;
        feeUsd?: number;
        feeAmount?: number;
        totalDebitAmount?: number;
        assetSymbol?: string;
        chainSlug?: string;
      };
    }>(res);
  },

  async recentActivity(params?: { limit?: number }) {
    const limit = params?.limit ?? 10;
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/activity/recent?limit=${encodeURIComponent(String(limit))}`, {
        headers: getAuthHeaders(),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{ ok: true; activity: RecentActivityItem[] }>(res);
  },

  async adminOverview() {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/overview`, { headers: getAuthHeaders() });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{
      ok: true;
      totalUsers: number;
      activeWallets: number;
      pendingKyc: number;
      blacklisted: number;
      suspended: number;
    }>(res);
  },

  async adminUsers(params?: { q?: string; status?: string; limit?: number; offset?: number }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.status) qs.set("status", params.status);
    if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
    if (typeof params?.offset === "number") qs.set("offset", String(params.offset));
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/users?${qs.toString()}`, { headers: getAuthHeaders() });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{ ok: true; users: AdminUserRow[]; total: number; limit: number; offset: number }>(res);
  },

  async adminSetUserStatus(userId: string, status: "active" | "suspended" | "pending" | "blacklisted") {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(userId)}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{ ok: true; user: AdminUserRow }>(res);
  },

  async adminDeleteUser(userId: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{ ok: true; id: string; email: string }>(res);
  },

  async adminSetUserFeatures(
    userId: string,
    features: Partial<{
      trading: boolean;
      withdrawal: boolean;
      transfer: boolean;
      margin: boolean;
      futures: boolean;
      staking: boolean;
    }>
  ) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(userId)}/features`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ features }),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{ ok: true; user: AdminUserRow }>(res);
  },

  async adminKycSubmissions(params?: {
    status?: "pending" | "under_review" | "approved" | "rejected";
    q?: string;
    limit?: number;
    offset?: number;
  }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.q) qs.set("q", params.q);
    if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
    if (typeof params?.offset === "number") qs.set("offset", String(params.offset));

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/kyc/submissions?${qs.toString()}`, { headers: getAuthHeaders() });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{
      ok: true;
      submissions: Array<{
        id: string;
        userId: string;
        userEmail: string;
        userName: string;
        status: string;
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        countryOfResidence: string;
        address: string;
        phoneNumber: string | null;
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
        documentType: string;
        documentNumber: string | null;
        documentUrl: string | null;
        documentBackUrl: string | null;
        proofOfAddressUrl: string | null;
        selfieUrl: string | null;
        ocrConfidence: number | null;
        faceMatchScore: number | null;
        livenessScore: number | null;
        rejectionReason: string | null;
        reviewNotes: string | null;
        reviewedAt: string | null;
        submittedAt: string;
      }>;
      total: number;
      limit: number;
      offset: number;
    }>(res);
  },

  async adminReviewKycSubmission(
    submissionId: string,
    body: {
      decision: "under_review" | "approved" | "rejected";
      rejectionReason?: string;
      reviewNotes?: string;
    }
  ) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/kyc/submissions/${encodeURIComponent(submissionId)}/review`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{
      ok: true;
      submission: {
        id: string;
        userId: string;
        status: string;
        rejectionReason: string | null;
        reviewNotes: string | null;
        reviewedAt: string | null;
      };
    }>(res);
  },

  async adminSeedUserDepositAddresses(
    userId: string,
    payload: {
      entries?: Array<{ assetNetworkId: string; address: string; memo?: string | null }>;
      networkEntries?: Array<{ chainSlug: string; address: string; memo?: string | null }>;
    }
  ) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(userId)}/seed-deposit-addresses`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{
      ok: true;
      userId: string;
      userName: string;
      createdWallets: number;
      createdAddresses: number;
      updatedAddresses: number;
      skipped: number;
    }>(res);
  },

  async adminUserDepositAddresses(userId: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(userId)}/deposit-addresses`, {
        headers: getAuthHeaders(),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{
      ok: true;
      addresses: Array<{
        assetNetworkId: string;
        assetSymbol: string;
        chainSlug: string;
        chainName: string;
        address: string | null;
        memo: string | null;
      }>;
      networks: Array<{
        chainSlug: string;
        chainName: string;
        address: string | null;
        memo: string | null;
      }>;
    }>(res);
  },

  async adminAssetNetworks() {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/asset-networks`, { headers: getAuthHeaders() });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{
      ok: true;
      assetNetworks: Array<{
        id: string;
        assetSymbol: string;
        assetName: string;
        chainSlug: string;
        chainName: string;
        contractAddress: string | null;
        isDepositEnabled: boolean;
        isWithdrawEnabled: boolean;
      }>;
    }>(res);
  },

  async adminWithdrawals(params?: {
    q?: string;
    status?: "all" | "pending" | "processing" | "sent" | "failed" | "cancelled";
    limit?: number;
    offset?: number;
  }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.status) qs.set("status", params.status);
    if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
    if (typeof params?.offset === "number") qs.set("offset", String(params.offset));
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/withdrawals?${qs.toString()}`, { headers: getAuthHeaders() });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{
      ok: true;
      withdrawals: Array<{
        id: string;
        userId: string;
        userName: string;
        userEmail: string;
        assetSymbol: string;
        chainSlug: string;
        chainName: string;
        amount: string;
        fee: string;
        toAddress: string;
        txHash: string | null;
        receiptNo: string;
        status: "pending" | "processing" | "sent" | "failed" | "cancelled";
        createdAt: string;
        updatedAt: string;
      }>;
      limit: number;
      offset: number;
    }>(res);
  },

  async adminSetWithdrawalStatus(
    withdrawalId: string,
    status: "pending" | "processing" | "sent" | "failed" | "cancelled",
    txHash?: string
  ) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/withdrawals/${encodeURIComponent(withdrawalId)}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, txHash: txHash ?? "" }),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{
      ok: true;
      withdrawal: {
        id: string;
        userId: string;
        status: "pending" | "processing" | "sent" | "failed" | "cancelled";
        receiptNo: string;
        txHash: string | null;
        updatedAt: string;
      };
    }>(res);
  },

  async adminSeedOptions() {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/seed-options`, { headers: getAuthHeaders() });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{
      ok: true;
      options: Array<{
        assetSymbol: string;
        assetName: string;
        chainSlug: string;
        chainName: string;
        contractAddress: string | null;
      }>;
    }>(res);
  },

  async adminBootstrapAssetNetworks(items: Array<{ assetSymbol: string; chainSlug: string; contractAddress?: string | null }>) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/bootstrap/asset-networks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ items }),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{ ok: true; added: number; skipped: number }>(res);
  },

  async adminDeleteAssetNetwork(id: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/asset-networks/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{ ok: true; id: string }>(res);
  },

  async adminLogs(params?: { q?: string; severity?: "all" | "info" | "warning" | "critical"; limit?: number; offset?: number }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.severity) qs.set("severity", params.severity);
    if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
    if (typeof params?.offset === "number") qs.set("offset", String(params.offset));
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/admin/logs?${qs.toString()}`, { headers: getAuthHeaders() });
    } catch {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    return handleResponse<{
      ok: true;
      logs: AdminAuditLog[];
      total: number;
      limit: number;
      offset: number;
      stats: { critical: number; warning: number; today: number };
    }>(res);
  },
};
