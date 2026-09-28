import { createContext, PropsWithChildren, useCallback, useMemo, useState } from "react";
import { useRequiredContext } from "../hooks/use-required-context";
import { repositories } from "../repositories";
import type { Notification } from "../types/notification";

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  loadNotifications(): Promise<void>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider = ({ children }: PropsWithChildren) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNotifications(await repositories.notifications.list());
    } catch {
      setError("Unable to load notifications right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    const updated = await repositories.notifications.markRead(id);
    setNotifications((current) => current.map((notification) => notification.id === id ? updated : notification));
  }, []);

  const markAllRead = useCallback(async () => {
    await repositories.notifications.readAll();
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }, []);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markRead,
    markAllRead
  }), [notifications, unreadCount, loading, error, loadNotifications, markRead, markAllRead]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = (): NotificationContextValue => useRequiredContext(NotificationContext, "useNotifications");