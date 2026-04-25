export const apiBaseUrl =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.localStorage.getItem("accessToken") ??
    window.localStorage.getItem("token") ??
    window.localStorage.getItem("fluxcred.accessToken")
  );
}

export async function apiRequest<T>(path: string, init?: RequestInit) {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("Faca login para continuar.");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message =
      typeof data?.message === "string"
        ? data.message
        : "Nao foi possivel concluir a requisicao.";
    throw new Error(message);
  }

  return response.json() as Promise<T>;
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
