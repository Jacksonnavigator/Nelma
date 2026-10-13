import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SESSION_EXPIRED_EVENT } from "@/services/api";
import { authService } from "@/services";
import { can, type Permission } from "@/lib/permissions";
import type { DashboardUser } from "@/types";

/**
 * Dashboard auth state (UX layer only).
 * The FastAPI backend is the authoritative authentication/authorization layer;
 * these guards exist to avoid rendering actions the role may not perform.
 */
interface AuthContextValue {
  user: DashboardUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signIn: (identifier: string, password: string) => Promise<DashboardUser>;
  signOut: () => Promise<void>;
  setUser: (user: DashboardUser) => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUserState] = useState<DashboardUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    let active = true;
    authService
      .currentUser()
      .then((current) => {
        if (!active) return;
        setUserState(current);
        setStatus(current ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (active) setStatus("unauthenticated");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const expire = () => {
      queryClient.clear();
      setUserState(null);
      setStatus("unauthenticated");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, expire);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expire);
  }, [queryClient]);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const session = await authService.login(identifier, password);
      queryClient.clear();
      setUserState(session.user);
      setStatus("authenticated");
      return session.user;
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      queryClient.clear();
      setUserState(null);
      setStatus("unauthenticated");
    }
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      signIn,
      signOut,
      setUser: setUserState,
      can: (permission: Permission) => can(user?.role, permission),
    }),
    [user, status, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
