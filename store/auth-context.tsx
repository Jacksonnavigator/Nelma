import { createContext, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "../services/api";
import { analytics } from "../services/analytics";
import { secureTokenStorage } from "../storage/secure-token-storage";
import type { ChangePasswordInput, ForgotPasswordInput, ForgotPasswordResult, LoginInput, RegisterInput, ResetPasswordInput } from "../types/auth";
import type { UpdateUserInput, User } from "../types/user";
import { useRequiredContext } from "../hooks/use-required-context";
import { repositories } from "../repositories";
import { isMobileRole } from "../utils/role-routing";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  error: string | null;
  login(input: LoginInput): Promise<User>;
  register(input: RegisterInput): Promise<User>;
  forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResult>;
  resetPassword(input: ResetPasswordInput): Promise<void>;
  updateProfile(input: UpdateUserInput): Promise<void>;
  changePassword(input: ChangePasswordInput): Promise<void>;
  logout(): Promise<void>;
  refreshUser(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const toMessage = (error: unknown): string => {
  return typeof (error as { message?: unknown }).message === "string" ? String((error as { message: string }).message) : "Something went wrong. Please try again.";
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionVersion = useRef(0);

  const clearSession = useCallback(async () => {
    sessionVersion.current += 1;
    apiClient.invalidateSession();
    setUser(null);
    setError(null);
    setStatus("unauthenticated");
    await secureTokenStorage.clear();
  }, []);

  useEffect(() => {
    apiClient.setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  useEffect(() => {
    let mounted = true;
    const version = sessionVersion.current;
    const isCurrent = () => mounted && version === sessionVersion.current;
    const hydrate = async () => {
      try {
        const tokens = await secureTokenStorage.get();
        if (!isCurrent()) return;
        if (!tokens || tokens.audience !== "mobile") {
          await secureTokenStorage.clear();
          if (isCurrent()) {
            setStatus("unauthenticated");
          }
          return;
        }
        const nextUser = await repositories.auth.getCurrentUser();
        if (!isCurrent()) return;
        if (!isMobileRole(nextUser.role)) {
          await secureTokenStorage.clear();
          if (isCurrent()) {
            setUser(null);
            setStatus("unauthenticated");
          }
          return;
        }
        if (isCurrent()) {
          setUser(nextUser);
          setStatus("authenticated");
        }
      } catch {
        if (!isCurrent()) return;
        await secureTokenStorage.clear();
        if (isCurrent()) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    };
    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput): Promise<User> => {
    const version = ++sessionVersion.current;
    apiClient.invalidateSession();
    setError(null);
    try {
      const session = await repositories.auth.login(input);
      if (session.tokens.audience !== "mobile" || !isMobileRole(session.user.role)) {
        throw new Error("This account cannot sign in to the mobile app.");
      }
      if (version !== sessionVersion.current) throw new Error("Your session changed. Please try again.");
      await secureTokenStorage.save(session.tokens);
      if (version !== sessionVersion.current) throw new Error("Your session changed. Please try again.");
      setUser(session.user);
      setStatus("authenticated");
      analytics.track("login_success");
      return session.user;
    } catch (err) {
      if (version === sessionVersion.current) setError(toMessage(err));
      throw err;
    }
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<User> => {
    const version = ++sessionVersion.current;
    apiClient.invalidateSession();
    setError(null);
    try {
      const session = await repositories.auth.register(input);
      if (session.tokens.audience !== "mobile" || !isMobileRole(session.user.role)) {
        throw new Error("This account cannot sign in to the mobile app.");
      }
      if (version !== sessionVersion.current) throw new Error("Your session changed. Please try again.");
      await secureTokenStorage.save(session.tokens);
      if (version !== sessionVersion.current) throw new Error("Your session changed. Please try again.");
      setUser(session.user);
      setStatus("authenticated");
      analytics.track("registration_completed");
      return session.user;
    } catch (err) {
      if (version === sessionVersion.current) setError(toMessage(err));
      throw err;
    }
  }, []);

  const forgotPassword = useCallback(async (input: ForgotPasswordInput) => {
    setError(null);
    return repositories.auth.forgotPassword(input);
  }, []);

  const resetPassword = useCallback(async (input: ResetPasswordInput) => {
    setError(null);
    await repositories.auth.resetPassword(input);
  }, []);

  const updateProfile = useCallback(async (input: UpdateUserInput) => {
    setError(null);
    const version = sessionVersion.current;
    const updated = await repositories.user.update(input);
    if (version === sessionVersion.current) setUser(updated);
  }, []);

  const changePassword = useCallback(async (input: ChangePasswordInput) => {
    setError(null);
    await repositories.user.changePassword(input);
  }, []);

  const refreshUser = useCallback(async () => {
    const version = sessionVersion.current;
    const nextUser = await repositories.user.getCurrentUser();
    if (version === sessionVersion.current) setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    const tokens = await secureTokenStorage.get();
    await clearSession();
    if (tokens?.refreshToken && tokens.audience === "mobile") {
      await repositories.auth.logout(tokens.refreshToken).catch(() => undefined);
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    error,
    login,
    register,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    logout,
    refreshUser
  }), [status, user, error, login, register, forgotPassword, resetPassword, updateProfile, changePassword, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => useRequiredContext(AuthContext, "useAuth");
