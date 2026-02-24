"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SCROLL_THRESHOLD = 80;

export function useChatScroll(messageCount: number) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);

  const isNearBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return true;
    }

    const remaining =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return remaining < SCROLL_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const shouldAutoScroll = isNearBottom();

      if (shouldAutoScroll) {
        scrollToBottom(messageCount <= 1 ? "auto" : "smooth");
        setShowNewMessagesButton(false);
        return;
      }

      setShowNewMessagesButton(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isNearBottom, messageCount, scrollToBottom]);

  const onScroll = useMemo(
    () => () => {
      if (isNearBottom()) {
        setShowNewMessagesButton(false);
      }
    },
    [isNearBottom],
  );

  return {
    containerRef,
    onScroll,
    showNewMessagesButton,
    scrollToBottom,
  };
}
