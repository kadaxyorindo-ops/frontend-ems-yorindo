const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export const AUTH_TOKEN_STORAGE_KEY = "ems_auth_token";
export const AUTH_USER_STORAGE_KEY = "ems_auth_user";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
}

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  message: string;
  status: number;
}

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function persistAuthToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearPersistedAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  try {
    const token = getStoredToken();
    const headers = new Headers(init.headers);

    headers.set("Accept", "application/json");

    if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });

    const payload =
      response.status === 204
        ? null
        : ((await response.json()) as ApiEnvelope<T> | null);

    if (!response.ok) {
      return {
        data: null,
        error: payload?.message ?? "Request gagal diproses.",
        message: payload?.message ?? "Request gagal diproses.",
        status: response.status,
      };
    }

    return {
      data: payload?.data ?? null,
      error: null,
      message: payload?.message ?? "OK",
      status: response.status,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tidak dapat terhubung ke server.";

    return {
      data: null,
      error: message,
      message,
      status: 0,
    };
  }
}

export const api = {
  get<T>(path: string) {
    return request<T>(path, { method: "GET" });
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
};
