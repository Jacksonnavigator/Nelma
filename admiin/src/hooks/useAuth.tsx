import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DATA_MODE,
  getAuthToken,
  clearSession,
  purgeLegacyCredentials,
  SESSION_EXPIRED_EVENT,
  SESSION_LOGOUT_CHANNEL,
} from "@/services/api";
import { authService } from "@/services";
import { can, type Permission } from "@/lib/permissions";
import { unlinkPushFromThisBrowser } from "@/lib/web-push";
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
  const generation = useRef(0);
  const lastActivity = useRef(Date.now());
  const [user, setUserState] = useState<DashboardUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    purgeLegacyCredentials();
    let active = true;
    const expected = generation.current;
    authService
      .currentUser()
      .then((current) => {
        if (!active || generation.current !== expected) return;
        setUserState(current);
        setStatus(current ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (active && generation.current === expected) setStatus("unauthenticated");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const expire = () => {
      generation.current++;
      void queryClient.cancelQueries();
      queryClient.clear();
      setUserState(null);
      setStatus("unauthenticated");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, expire);
    let channel: BroadcastChannel | undefined;
    if (DATA_MODE === "api" && typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel(SESSION_LOGOUT_CHANNEL);
        channel.onmessage = (event: MessageEvent<unknown>) => {
          if (event.data === "logout") clearSession(false);
        };
      } catch {
        /* local logout remains available */
      }
    }
    // API sessions expire locally after 15 minutes without interaction.
    // Server-side idle/absolute expiry is still required and cannot be replaced here.
    const activity = () => {
      lastActivity.current = Date.now();
    };
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    for (const event of events) window.addEventListener(event, activity, { passive: true });
    const idle =
      DATA_MODE === "api"
        ? setInterval(() => {
            if (getAuthToken() && Date.now() - lastActivity.current >= 15 * 60 * 1000)
              clearSession();
          }, 30_000)
        : undefined;
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, expire);
      for (const event of events) window.removeEventListener(event, activity);
      if (idle) clearInterval(idle);
      channel?.close();
    };
  }, [queryClient]);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const expected = ++generation.current;
      const session = await authService.login(identifier, password);
      if (generation.current !== expected)
        throw { status: 409, message: "Your session changed. Please sign in again." };
      await queryClient.cancelQueries();
      queryClient.clear();
      lastActivity.current = Date.now();
      setUserState(session.user);
      setStatus("authenticated");
      return session.user;
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    // Start unlinking this browser's order alerts first, while the sign-in is still valid. Not awaited: sign-out stays instant.
    void unlinkPushFromThisBrowser();
    generation.current++;
    const request = authService.logout();
    void queryClient.cancelQueries();
    queryClient.clear();
    setUserState(null);
    setStatus("unauthenticated");
    await request;
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      signIn,
      signOut,
      setUser: (next) => {
        if (next.status !== "active") {
          clearSession();
          return;
        }
        setUserState(next);
      },
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
