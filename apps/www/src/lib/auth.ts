const authTokenKeys = ["accessToken", "token", "fluxcred.accessToken"];

export function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return authTokenKeys
    .map((key) => window.localStorage.getItem(key))
    .find(Boolean) ?? null;
}

export function storeAccessToken(accessToken: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("accessToken", accessToken);
  window.localStorage.setItem("fluxcred.accessToken", accessToken);
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of authTokenKeys) {
    window.localStorage.removeItem(key);
  }
}
