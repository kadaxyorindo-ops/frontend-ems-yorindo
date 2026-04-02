import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  clearPersistedAuthToken,
  persistAuthToken,
} from "@/services/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationName: string | null;
  lastLoginAt: string | null;
}

interface RequestOtpResponse {
  email: string;
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
}

interface VerifyOtpResponse {
  token: string;
  expiresInSeconds: number;
  user: AuthUser;
}

interface AuthActionResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  requestOtp: (email: string) => Promise<AuthActionResult<RequestOtpResponse>>;
  verifyOtp: (email: string, code: string) => Promise<AuthActionResult>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

function readStoredUser() {
  try {
    const rawValue = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return rawValue ? (JSON.parse(rawValue) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser) {
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

function clearPersistedUser() {
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    const storedUser = readStoredUser();

    if (storedUser && token) {
      setUser(storedUser);
    }

    if (!token) {
      clearPersistedUser();
      setUser(null);
      setIsInitializing(false);
      return;
    }

    let isMounted = true;

    void api.get<AuthUser>("/api/v1/auth/me").then((result) => {
      if (!isMounted) {
        return;
      }

      if (result.data) {
        setUser(result.data);
        persistUser(result.data);
      } else {
        clearPersistedAuthToken();
        clearPersistedUser();
        setUser(null);
      }

      setIsInitializing(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const requestOtp = async (
    email: string,
  ): Promise<AuthActionResult<RequestOtpResponse>> => {
    const result = await api.post<RequestOtpResponse>("/api/v1/auth/request-otp", {
      email,
    });

    if (!result.data) {
      return {
        ok: false,
        message: result.error ?? result.message,
      };
    }

    return {
      ok: true,
      message: result.message,
      data: result.data,
    };
  };

  const verifyOtp = async (
    email: string,
    code: string,
  ): Promise<AuthActionResult> => {
    const result = await api.post<VerifyOtpResponse>("/api/v1/auth/verify-otp", {
      email,
      code,
    });

    if (!result.data) {
      return {
        ok: false,
        message: result.error ?? result.message,
      };
    }

    persistAuthToken(result.data.token);
    persistUser(result.data.user);
    setUser(result.data.user);

    return {
      ok: true,
      message: result.message,
    };
  };

  const logout = () => {
    clearPersistedAuthToken();
    clearPersistedUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isInitializing,
        requestOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
