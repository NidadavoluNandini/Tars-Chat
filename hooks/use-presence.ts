"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function usePresence(enabled: boolean) {
  const setOnlineStatus = useMutation(api.presence.setOnlineStatus);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const publishOnline = async (isOnline: boolean) => {
      if (cancelled) {
        return;
      }

      try {
        await setOnlineStatus({ isOnline });
      } catch {
        // Ignore transient network errors. Next heartbeat updates status again.
      }
    };

    const onVisibilityChange = () => {
      void publishOnline(!document.hidden);
    };

    const onBeforeUnload = () => {
      void publishOnline(false);
    };

    const heartbeat = window.setInterval(() => {
      void publishOnline(!document.hidden);
    }, 30_000);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);

    void publishOnline(true);

    return () => {
      cancelled = true;
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
      void publishOnline(false);
    };
  }, [enabled, setOnlineStatus]);
}
