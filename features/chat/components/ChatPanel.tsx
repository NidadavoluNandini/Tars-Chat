"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, CornerDownLeft, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatChatTimestamp } from "@/lib/date";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { ConversationId, MessageWithSender } from "@/types/chat";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";

type ChatPanelProps = {
  conversationId: ConversationId;
  currentUserId: Id<"users">;
  onBack?: () => void;
  isMobile?: boolean;
};

export function ChatPanel({
  conversationId,
  currentUserId,
  onBack,
  isMobile = false,
}: ChatPanelProps) {
  const conversation = useQuery(api.conversations.getConversation, { conversationId });
  const messages = useQuery(api.messages.listMessages, { conversationId });
  const typingUsers = useQuery(api.typing.getTypingUsers, { conversationId });

  const sendMessage = useMutation(api.messages.sendMessage);
  const markConversationRead = useMutation(api.messages.markConversationRead);
  const setTyping = useMutation(api.typing.setTyping);
  const softDeleteMessage = useMutation(api.messages.softDeleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [failedDraft, setFailedDraft] = useState<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingActiveRef = useRef(false);
  const supportedReactions = ["👍", "❤️", "😂", "😮", "😢"];

  const safeMessages = (messages ?? []) as MessageWithSender[];
  const { containerRef, onScroll, showNewMessagesButton, scrollToBottom } =
    useChatScroll(safeMessages.length);

  useEffect(() => {
    if (!safeMessages.length) {
      return;
    }
    void markConversationRead({ conversationId });
  }, [conversationId, markConversationRead, safeMessages.length]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingActiveRef.current) {
        void setTyping({ conversationId, isTyping: false });
        isTypingActiveRef.current = false;
      }
    };
  }, [conversationId, setTyping]);

  const handleTyping = (value: string) => {
    setDraft(value);

    if (!value.trim()) {
      if (isTypingActiveRef.current) {
        void setTyping({ conversationId, isTyping: false });
        isTypingActiveRef.current = false;
      }
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      return;
    }

    void setTyping({ conversationId, isTyping: true });
    isTypingActiveRef.current = true;

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      if (isTypingActiveRef.current) {
        void setTyping({ conversationId, isTyping: false });
        isTypingActiveRef.current = false;
      }
    }, 2000);
  };

  const handleSend = async () => {
    if (!draft.trim()) {
      return;
    }

    const body = draft;
    setDraft("");

    try {
      await sendMessage({ conversationId, body });
      if (isTypingActiveRef.current) {
        await setTyping({ conversationId, isTyping: false });
        isTypingActiveRef.current = false;
      }
      setSendError(null);
      setFailedDraft(null);
      scrollToBottom();
    } catch {
      setDraft(body);
      setSendError("Message failed to send. Check your connection and retry.");
      setFailedDraft(body);
    }
  };

  if (conversation === undefined) {
    return (
      <section className="flex h-full flex-1 flex-col gap-3 p-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-3/4" />
        <Skeleton className="h-20 w-2/3 self-end" />
        <Skeleton className="h-20 w-3/4" />
      </section>
    );
  }

  if (conversation === null) {
    return (
      <section className="flex h-full flex-1 items-center justify-center p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Conversation is unavailable. Please select another one.
        </p>
      </section>
    );
  }

  const title = conversation.isGroup
    ? conversation.title ?? "Group"
    : (conversation.otherMember?.name ?? "Conversation");

  return (
    <section className="relative flex h-full flex-1 flex-col bg-muted/20">
      <header className="flex items-center gap-2 border-b bg-card/95 p-3 backdrop-blur">
        {isMobile ? (
          <Button size="icon" variant="ghost" onClick={onBack} aria-label="Back to conversations">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : null}

        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarImage src={conversation.otherMember?.image} alt={title} />
            <AvatarFallback>{title.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!conversation.isGroup && conversation.otherMember?.isOnline ? (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-background bg-emerald-500" />
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">
            {conversation.isGroup
              ? `${conversation.groupOnlineCount}/${conversation.groupMembers.length} online`
              : (conversation.otherMember?.isOnline ? "Online" : "Offline")}
          </p>
        </div>
      </header>

      <div
        ref={containerRef}
        onScroll={onScroll}
        className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_center,hsl(var(--muted))_0%,transparent_68%)] p-3 lg:p-4"
      >
        {messages === undefined ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-2/3" />
            <Skeleton className="h-16 w-1/2 ml-auto" />
            <Skeleton className="h-16 w-3/5" />
          </div>
        ) : safeMessages.length ? (
          safeMessages.map((message) => {
            const isMine = message.senderId === currentUserId;
            const senderName = message.sender?.name ?? "User";

            return (
              <article
                key={message._id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm shadow-sm transition-all duration-200 hover:shadow lg:max-w-[72%] ${
                    isMine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border bg-card"
                  }`}
                >
                  {!isMine ? <p className="mb-1 text-xs font-semibold">{senderName}</p> : null}
                  {message.deletedAt ? (
                    <p className="italic opacity-70">Message deleted</p>
                  ) : (
                      <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>
                  )}
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <span className="text-[10px] opacity-70">
                      {formatChatTimestamp(message.createdAt)}
                    </span>
                    {isMine && !message.deletedAt ? (
                      <button
                        type="button"
                        onClick={() => void softDeleteMessage({ messageId: message._id })}
                        className="rounded p-0.5 opacity-70 transition hover:opacity-100"
                        aria-label="Delete message"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>

                  {!message.deletedAt ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {supportedReactions.map((emoji) => (
                        <button
                          key={`${message._id}-${emoji}-picker`}
                          type="button"
                          onClick={() => void toggleReaction({ messageId: message._id, emoji })}
                          className="rounded-full border px-1.5 py-0.5 text-xs opacity-60 transition hover:opacity-100"
                          aria-label={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}

                      {message.reactions?.map((reaction) => (
                        <button
                          key={`${message._id}-${reaction.emoji}-count`}
                          type="button"
                          onClick={() =>
                            void toggleReaction({
                              messageId: message._id,
                              emoji: reaction.emoji,
                            })
                          }
                          className={`rounded-full border px-2 py-0.5 text-xs transition ${
                            reaction.reactedByMe
                              ? "border-primary bg-primary/10"
                              : "bg-background/50"
                          }`}
                          aria-label={`Toggle ${reaction.emoji} reaction`}
                        >
                          {reaction.emoji} {reaction.count}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hello 👋
          </div>
        )}
      </div>

      {showNewMessagesButton ? (
        <div className="pointer-events-none absolute bottom-28 left-0 right-0 flex justify-center">
          <Button
            className="pointer-events-auto shadow-sm"
            size="sm"
            onClick={() => scrollToBottom()}
          >
            New messages
          </Button>
        </div>
      ) : null}

      <footer className="border-t bg-card/95 p-3 backdrop-blur">
        {sendError ? (
          <div className="mb-2 flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1 text-xs text-destructive">
            <span>{sendError}</span>
            {failedDraft ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(failedDraft);
                  setSendError(null);
                }}
              >
                Retry
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="mb-2 h-4">
          {typingUsers?.length ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>
                {typingUsers.length > 1
                  ? `${typingUsers[0]} and ${typingUsers.length - 1} others`
                  : typingUsers[0]}
              </span>
              <span>typing</span>
              <span className="inline-flex gap-0.5" aria-hidden>
                <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" />
              </span>
            </p>
          ) : null}
        </div>

        <div className="flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm">
          <Textarea
            value={draft}
            onChange={(event) => handleTyping(event.target.value)}
            placeholder="Type a message..."
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            className="max-h-36 min-h-11 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button
            onClick={() => void handleSend()}
            aria-label="Send message"
            className="h-10 rounded-full px-3"
          >
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </section>
  );
}
