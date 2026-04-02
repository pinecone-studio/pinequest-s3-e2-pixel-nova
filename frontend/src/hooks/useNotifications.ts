import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  openNotificationsLiveStream,
} from "@/api/notifications";
import type { NotificationItem } from "@/lib/notifications";

type UseNotificationsParams = {
  role: "teacher" | "student";
  userId?: string | null;
  enableLive?: boolean;
  onIncoming?: (notification: NotificationItem) => void;
  onToast?: (message: string) => void;
};

export const useNotifications = ({
  role,
  userId,
  enableLive = true,
  onIncoming,
  onToast,
}: UseNotificationsParams) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const liveEnabledRef = useRef(enableLive);

  useEffect(() => {
    liveEnabledRef.current = enableLive;
  }, [enableLive]);

  const mergeIncomingNotification = useCallback(
    (item: NotificationItem, shouldToast = true) => {
      let added = false;

      setNotifications((prev) => {
        const existingIndex = prev.findIndex(
          (candidate) => candidate.id === item.id,
        );
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = item;
          return next;
        }

        added = true;
        return [item, ...prev];
      });

      if (!seenIdsRef.current.has(item.id)) {
        seenIdsRef.current.add(item.id);
        if (item.status === "unread") {
          setUnreadCount((prev) => prev + 1);
        }
      }

      if (added) {
        onIncoming?.(item);
        if (shouldToast && onToast) {
          onToast(item.message);
        }
      }
    },
    [onIncoming, onToast],
  );

  const sync = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const payload = await fetchNotifications(role, userId);
      setNotifications(payload.items);
      setUnreadCount(payload.unreadCount);

      if (!initializedRef.current) {
        payload.items.forEach((item) => seenIdsRef.current.add(item.id));
        initializedRef.current = true;
        setLoading(false);
        return;
      }

      const newItems = payload.items.filter(
        (item) => !seenIdsRef.current.has(item.id),
      );
      newItems.forEach((item) => seenIdsRef.current.add(item.id));
      newItems
        .slice()
        .reverse()
        .forEach((item) => onIncoming?.(item));
      if (newItems.length > 0 && onToast && !liveEnabledRef.current) {
        onToast(newItems[0].message);
      }
    } catch {
      setLoading(false);
    }
    setLoading(false);
  }, [onIncoming, onToast, role, userId]);

  useEffect(() => {
    initializedRef.current = false;
    seenIdsRef.current = new Set();
    void sync();
  }, [sync]);

  useEffect(() => {
    if (!userId) return;

    let active = true;
    let timer: number | undefined;
    const visibleInterval = role === "teacher" ? 5_000 : 15_000;
    const hiddenInterval = role === "teacher" ? 15_000 : 30_000;

    const tick = async () => {
      try {
        await sync();
      } finally {
        if (!active) return;
        const interval = document.hidden ? hiddenInterval : visibleInterval;
        timer = window.setTimeout(() => {
          void tick();
        }, interval);
      }
    };

    timer = window.setTimeout(() => {
      void tick();
    }, visibleInterval);

    const handleVisibilityChange = () => {
      if (document.hidden) return;
      if (timer) window.clearTimeout(timer);
      void tick();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    let stopStream: (() => void) | null = null;
    let streamFailed = !enableLive;

    const startPolling = () => {
      if (!active) return;

      const tick = async () => {
        try {
          await sync();
        } finally {
          if (!active) return;
          const interval = document.hidden ? 30_000 : 15_000;
          timer = window.setTimeout(() => {
            void tick();
          }, interval);
        }
      };

      timer = window.setTimeout(() => {
        void tick();
      }, 15_000);
    };

    if (enableLive) {
      stopStream = openNotificationsLiveStream(
        role,
        {
          onMessage: (item) => {
            if (!active) return;
            setLoading(false);
            mergeIncomingNotification(item);
          },
          onError: () => {
            if (!active || streamFailed) return;
            streamFailed = true;
            void sync();
            startPolling();
          },
        },
        userId,
      );
    } else {
      streamFailed = true;
    }

    if (streamFailed) {
      startPolling();
    }

    return () => {
      active = false;
      stopStream?.();
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enableLive, mergeIncomingNotification, role, sync, userId]);

  const handleMarkRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId
            ? { ...item, status: "read", readAt: new Date().toISOString() }
            : item,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        const response = await markNotificationRead(
          notificationId,
          role,
          userId,
        );
        setUnreadCount(response.unreadCount);
      } catch {
        await sync();
      }
    },
    [role, sync, userId],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        status: "read",
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
    try {
      await markAllNotificationsRead(role, userId);
    } catch {
      await sync();
    }
  }, [role, sync, userId]);

  return useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refreshNotifications: sync,
      markNotificationRead: handleMarkRead,
      markAllNotificationsRead: handleMarkAllRead,
    }),
    [
      handleMarkAllRead,
      handleMarkRead,
      loading,
      notifications,
      sync,
      unreadCount,
    ],
  );
};
