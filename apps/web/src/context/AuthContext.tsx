import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";

import type {
  ReactNode
} from "react";

import {
  apiRequest
} from "../services/api";

import type {
  LoginCredentials,
  User
} from "../types/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (
    credentials: LoginCredentials
  ) => Promise<void>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );

export function AuthProvider({
  children
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const refreshUser = useCallback(
    async () => {
      try {
        const response =
          await apiRequest<{
            ok: boolean;
            user: User;
          }>("/api/auth/me");

        setUser(response.user);

      } catch {
        setUser(null);

      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  async function login(
    credentials: LoginCredentials
  ) {
    const response =
      await apiRequest<{
        ok: boolean;
        message: string;
        user: User;
      }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(
            credentials
          )
        }
      );

    setUser(response.user);
  }

  async function logout() {
    try {
      await apiRequest(
        "/api/auth/logout",
        {
          method: "POST"
        }
      );
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated:
          Boolean(user),
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe estar dentro de AuthProvider"
    );
  }

  return context;
}