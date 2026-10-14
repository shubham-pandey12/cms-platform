/**
 * Abstraction for auth token storage so ApiClient can be used safely on the server
 * and token access can be mocked in tests.
 */

const AUTH_TOKEN_KEY = 'auth_token';

export interface TokenStorage {
  getToken(): string | null;
  setToken(value: string | null): void;
}

/** Browser implementation using localStorage; safe when window is undefined (returns null, setToken no-op). */
export const browserTokenStorage: TokenStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  setToken(value: string | null): void {
    if (typeof window === 'undefined') return;
    if (value !== null) {
      localStorage.setItem(AUTH_TOKEN_KEY, value);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  },
};

/** No-op storage for server or tests: always returns null, setToken does nothing. */
export const noopTokenStorage: TokenStorage = {
  getToken(): string | null {
    return null;
  },
  setToken(): void {
    // no-op
  },
};
