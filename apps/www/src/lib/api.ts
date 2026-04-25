import { clearAuthSession, getStoredAccessToken, storeAccessToken } from "./auth";

declare global {
  interface Window {
    __APP_CONFIG__?: {
      VITE_API_URL?: string;
    };
  }
}

let refreshPromise: Promise<string | null> | null = null;

function getConfiguredApiBaseUrl() {
  const runtimeValue =
    typeof window !== "undefined"
      ? window.__APP_CONFIG__?.VITE_API_URL
      : undefined;
  const buildValue = import.meta.env.VITE_API_URL;
  const resolvedValue = runtimeValue || buildValue;

  return resolvedValue?.replace(/\/$/, "");
}

function isLoopbackOrPrivateHost(hostname: string) {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  ) {
    return true;
  }

  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) {
    return true;
  }

  const match = hostname.match(/^172\.(\d{1,3})\./);

  if (!match) {
    return false;
  }

  const secondOctet = Number(match[1]);

  return secondOctet >= 16 && secondOctet <= 31;
}

function isLocalDevelopmentHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getApiBaseUrl() {
  const configuredApiBaseUrl = getConfiguredApiBaseUrl();

  if (typeof window === "undefined") {
    return configuredApiBaseUrl ?? "";
  }

  if (!configuredApiBaseUrl) {
    if (isLocalDevelopmentHost(window.location.hostname)) {
      return "http://localhost:3000";
    }

    throw new Error("VITE_API_URL não foi configurada para este ambiente.");
  }

  if (/^\//.test(configuredApiBaseUrl)) {
    return configuredApiBaseUrl;
  }

  const apiUrl = new URL(configuredApiBaseUrl);

  if (
    !isLocalDevelopmentHost(window.location.hostname) &&
    isLoopbackOrPrivateHost(apiUrl.hostname)
  ) {
    throw new Error(
      "VITE_API_URL aponta para localhost ou rede privada. Use o domínio público da API.",
    );
  }

  return configuredApiBaseUrl;
}

export async function parseJsonResponse<T>(response: Response) {
  const text = await response.text();

  if (!text.trim()) {
    return null as T | null;
  }

  return JSON.parse(text) as T;
}

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        clearAuthSession();
        return null;
      }

      const data = await parseJsonResponse<{ accessToken?: string }>(response);

      if (!data?.accessToken) {
        clearAuthSession();
        return null;
      }

      storeAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      clearAuthSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>(path: string, init?: RequestInit) {
  const apiBaseUrl = getApiBaseUrl();
  let accessToken = getStoredAccessToken();

  if (!accessToken) {
    accessToken = await refreshAccessToken();
  }

  if (!accessToken) {
    throw new Error("Faça login para continuar.");
  }

  const executeRequest = async (token: string) =>
    fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });

  let response = await executeRequest(accessToken);

  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();

    if (!refreshedToken) {
      throw new Error("Faça login para continuar.");
    }

    response = await executeRequest(refreshedToken);
  }

  if (!response.ok) {
    const data = await parseJsonResponse<{ message?: string | string[] }>(
      response,
    ).catch(() => null);
    const message =
      typeof data?.message === "string"
        ? data.message
        : Array.isArray(data?.message)
          ? data.message.join(", ")
          : "Não foi possível concluir a requisição.";
    throw new Error(message);
  }

  return parseJsonResponse<T>(response) as Promise<T>;
}

export async function logout() {
  try {
    await fetch(`${getApiBaseUrl()}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearAuthSession();
  }
}

export function formatCurrency(value?: number | string | null) {
  const numericValue = typeof value === "string" ? Number(value) : value;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(numericValue) ? Number(numericValue) : 0);
}

export function formatDate(value?: string | Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
