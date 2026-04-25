const authTokenKeys = ["accessToken", "token", "fluxcred.accessToken"];
let accessTokenMemory: string | null = null;

export function getStoredAccessToken() {
  return accessTokenMemory;
}

export function storeAccessToken(accessToken: string) {
  accessTokenMemory = accessToken;
}

export function clearAuthSession() {
  accessTokenMemory = null;

  if (typeof window === "undefined") {
    return;
  }

  for (const key of authTokenKeys) {
    window.localStorage.removeItem(key);
  }
}
