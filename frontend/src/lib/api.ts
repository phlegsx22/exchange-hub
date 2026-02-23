function defaultApiBase(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "annex-ebank.com" || host.endsWith(".netlify.app")) {
      return "https://api.annex-ebank.com";
    }
  }
  return "http://localhost:3000";
}

export const API_BASE =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL).replace(/\/+$/, "")
    : defaultApiBase();

const NETWORK_ERROR_MESSAGE = "Network error. Please try again.";

const AUTH_KEY = "exchange_auth";

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

export type SupportedAssetNetwork = {
  id: string;
  assetSymbol: string;
  chainSlug: string;
  chainName: string;
  contractAddress: string | null;
  isDepositEnabled: boolean;
  isWithdrawEnabled: boolean;
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

  async uploadKycMedia(file: File, kind: "document" | "selfie") {
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
    documentType: "passport" | "national_id" | "drivers_license";
    documentUrl?: string;
    selfieUrl?: string;
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
};
