"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Camera,
  CornerDownLeft,
  Paperclip,
  Plus,
  Smile,
  Trash2,
  X,
} from "lucide-react";
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
  const conversation = useQuery(api.conversations.getConversation, {
    conversationId,
  });
  const messages = useQuery(api.messages.listMessages, { conversationId });
  const typingUsers = useQuery(api.typing.getTypingUsers, { conversationId });

  const sendMessage = useMutation(api.messages.sendMessage);
  const sendFileMessage = useMutation(api.messages.sendFileMessage);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const markConversationRead = useMutation(api.messages.markConversationRead);
  const setTyping = useMutation(api.typing.setTyping);
  const softDeleteMessage = useMutation(api.messages.softDeleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [failedDraft, setFailedDraft] = useState<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingActiveRef = useRef(false);
  const supportedReactions = [
    "👍",
    "❤️",
    "😂",
    "😮",
    "😢",
    "👏",
    "🔥",
    "😡",
    "🙏",
    "🎉",
    "💯",
    "🤝",
  ];
  const quickReactions = supportedReactions.slice(0, 4);
  const overflowReactions = supportedReactions.slice(4);
  const [openReactionPickerId, setOpenReactionPickerId] =
    useState<string | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const composerEmojis = [
    "😀",
    "😁",
    "😂",
    "🤣",
    "😍",
    "😘",
    "😢",
    "😡",
    "👍",
    "🙏",
    "🔥",
    "🎉",
  ];

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

  const handleAddEmoji = (emoji: string) => {
    handleTyping(`${draft}${emoji}`);
    setIsEmojiPickerOpen(false);
    textareaRef.current?.focus();
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }
    setPendingFiles((current) => {
      const next = [...current];
      Array.from(files).forEach((file) => {
        if (
          !next.find(
            (existing) =>
              existing.name === file.name && existing.size === file.size,
          )
        ) {
          next.push(file);
        }
      });
      return next;
    });
    textareaRef.current?.focus();
  };

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCameraError(null);
    textareaRef.current?.focus();
  };

  const handleCameraClick = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      if (!imageInputRef.current) {
        return;
      }

      imageInputRef.current.value = "";
      imageInputRef.current.click();
      return;
    }

    setCameraError(null);

    void navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      })
      .then((stream) => {
        stopCameraStream();
        cameraStreamRef.current = stream;
        setIsCameraOpen(true);
      })
      .catch(() => {
        setCameraError("Camera access was denied. Please allow permission and retry.");
      });
  };

  const handleCapturePhoto = async () => {
    const video = cameraVideoRef.current;

    if (!video) {
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setCameraError("Camera is not ready yet. Try again in a moment.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("Unable to capture photo right now.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      setCameraError("Unable to capture photo right now.");
      return;
    }

    const capturedFile = new File([blob], `photo-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    setPendingFiles((current) => [...current, capturedFile]);
    closeCameraModal();
  };

  const removePendingFile = (name: string, size: number) => {
    setPendingFiles((current) =>
      current.filter((file) => file.name !== name || file.size !== size),
    );
  };

  const uploadFile = async (file: File) => {
    const uploadUrl = await generateUploadUrl({});
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Upload failed.");
    }

    const payload = (await response.json()) as { storageId: string };
    return payload.storageId as Id<"_storage">;
  };

  const handleSend = async () => {
    if (!draft.trim() && pendingFiles.length === 0) {
      return;
    }

    const body = draft;
    setDraft("");
    setIsUploading(true);

    try {
      if (body.trim()) {
        await sendMessage({ conversationId, body });
      }

      for (const file of pendingFiles) {
        const storageId = await uploadFile(file);
        await sendFileMessage({
          conversationId,
          storageId,
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        });
      }

      if (isTypingActiveRef.current) {
        await setTyping({ conversationId, isTyping: false });
        isTypingActiveRef.current = false;
      }

      setPendingFiles([]);
      setSendError(null);
      setFailedDraft(null);
      scrollToBottom();
    } catch {
      setDraft(body);
      setSendError(
        "Message failed to send. Check your connection and retry.",
      );
      setFailedDraft(body);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const handleComposerEnter = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey) {
        return;
      }

      const activeElement = document.activeElement;
      if (
        composerRef.current &&
        activeElement &&
        composerRef.current.contains(activeElement)
      ) {
        event.preventDefault();
        void handleSend();
      }
    };

    window.addEventListener("keydown", handleComposerEnter);
    return () => window.removeEventListener("keydown", handleComposerEnter);
  }, [handleSend]);

  useEffect(() => {
    if (!isCameraOpen || !cameraVideoRef.current || !cameraStreamRef.current) {
      return;
    }

    cameraVideoRef.current.srcObject = cameraStreamRef.current;
    void cameraVideoRef.current.play();
  }, [isCameraOpen]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

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
    : conversation.otherMember?.name ?? "Conversation";

  return (
    <section className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-muted/20">
      <header className="shrink-0 flex items-center gap-2 border-b border-border/60 bg-card px-3 py-3">
        {isMobile ? (
          <Button
            size="icon"
            variant="ghost"
            onClick={onBack}
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : null}

        <div className="relative">
          <Avatar className="h-9 w-9 ring-1 ring-border/60">
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
              : conversation.otherMember?.isOnline
                ? "Online"
                : "Offline"}
          </p>
        </div>
      </header>

      <div
        ref={containerRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/10 p-3 lg:p-4"
      >
        {messages === undefined ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-2/3" />
            <Skeleton className="h-16 w-1/2 ml-auto" />
            <Skeleton className="h-16 w-3/5" />
          </div>
        ) : safeMessages.length ? (
          safeMessages.map((message) => {
            const isMine =
              String(message.senderId) === String(currentUserId);
            const senderName = message.sender?.name ?? "User";

            return (
              <article
                key={message._id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-2xl border text-sm shadow-sm transition-all duration-200 hover:shadow ${
                    isMine
                      ? [
                          "max-w-[60%] lg:max-w-[40%]",
                          "rounded-br-md",
                          "border-primary/20 bg-primary text-primary-foreground",
                          "px-3 py-1.5",
                        ].join(" ")
                      : [
                          "max-w-[70%] lg:max-w-[55%]",
                          "rounded-bl-md",
                          "border-border/70 bg-card",
                          "px-3 py-1.5",
                          "text-card-foreground",
                        ].join(" ")
                  }`}
                >
                  {!isMine ? (
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">
                      {senderName}
                    </p>
                  ) : null}
                  {message.deletedAt ? (
                    <p className="italic opacity-70">Message deleted</p>
                  ) : (
                    <>
                      {message.fileUrl ? (
                        message.fileType?.startsWith("image/") ? (
                          <img
                            src={message.fileUrl}
                            alt={message.fileName ?? "Attachment"}
                            className="mb-2 max-h-64 rounded-lg border object-cover"
                          />
                        ) : (
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mb-2 inline-flex items-center gap-2 rounded-md border bg-background/70 px-2 py-1 text-xs text-muted-foreground"
                          >
                            {message.fileName ?? "Attachment"}
                          </a>
                        )
                      ) : null}

                      {message.body ? (
                        <p className="whitespace-pre-wrap wrap-break-word">
                          {message.body}
                        </p>
                      ) : null}
                    </>
                  )}
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <span className="text-[10px] opacity-70">
                      {formatChatTimestamp(message.createdAt)}
                    </span>
                    {isMine && !message.deletedAt ? (
                      <button
                        type="button"
                        onClick={() =>
                          void softDeleteMessage({ messageId: message._id })
                        }
                        className="rounded p-0.5 opacity-70 transition hover:opacity-100"
                        aria-label="Delete message"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>

                  {!message.deletedAt ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {quickReactions.map((emoji) => (
                        <button
                          key={`${message._id}-${emoji}-picker`}
                          type="button"
                          onClick={() =>
                            void toggleReaction({
                              messageId: message._id,
                              emoji,
                            })
                          }
                          className="rounded-full border border-border/70 bg-background/70 px-1.5 py-0.5 text-xs transition hover:bg-muted"
                          aria-label={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}

                      {overflowReactions.length ? (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenReactionPickerId((current) =>
                                current === message._id ? null : message._id,
                              )
                            }
                            className="rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-xs transition hover:bg-muted"
                            aria-label="More reactions"
                          >
                            <Plus className="h-3 w-3" />
                          </button>

                          {openReactionPickerId === message._id ? (
                            <div className="absolute right-0 z-10 mt-1 grid w-32 grid-cols-4 gap-1 rounded-lg border border-border bg-card p-2 shadow-lg">
                              {overflowReactions.map((emoji) => (
                                <button
                                  key={`${message._id}-${emoji}-overflow`}
                                  type="button"
                                  onClick={() => {
                                    void toggleReaction({
                                      messageId: message._id,
                                      emoji,
                                    });
                                    setOpenReactionPickerId(null);
                                  }}
                                  className="rounded-md border border-border/70 px-1 py-1 text-xs transition hover:bg-muted"
                                  aria-label={`React with ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

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
                              ? "border-primary/40 bg-primary/10"
                              : "border-border/70 bg-background/50"
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
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
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

      <footer className="shrink-0 border-t border-border/60 bg-card p-3">
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

        {pendingFiles.length ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {pendingFiles.map((file) => (
              <div
                key={`${file.name}-${file.size}`}
                className="flex items-center gap-2 rounded-full border border-border/70 bg-background px-2 py-1 text-xs"
              >
                <span className="max-w-40 truncate">{file.name}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                  onClick={() => removePendingFile(file.name, file.size)}
                  aria-label="Remove attachment"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div
          ref={composerRef}
          className="flex items-end gap-2 rounded-2xl border border-border/70 bg-background p-2 shadow-sm"
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen((value) => !value)}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-muted/70"
              aria-label="Open emoji picker"
            >
              <Smile className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-muted/70"
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleCameraClick}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-muted/70"
              aria-label="Attach photo"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => handleTyping(event.target.value)}
            placeholder="Type a message..."
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            disabled={isUploading}
            className="max-h-36 min-h-11 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button
            onClick={() => void handleSend()}
            aria-label="Send message"
            className="h-10 rounded-full px-3"
            disabled={isUploading}
          >
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        </div>

        {isEmojiPickerOpen ? (
          <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-border/70 bg-card p-2 shadow-sm">
            {composerEmojis.map((emoji) => (
              <button
                key={`composer-${emoji}`}
                type="button"
                onClick={() => handleAddEmoji(emoji)}
                className="rounded-lg border border-border/70 px-2 py-1 text-base transition hover:bg-muted"
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}

        {isCameraOpen ? (
          <div className="mx-auto mt-2 w-full max-w-md rounded-xl border border-border/70 bg-card p-2 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Camera preview</p>
              <button
                type="button"
                onClick={closeCameraModal}
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted"
                aria-label="Close camera"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <video
              ref={cameraVideoRef}
              autoPlay
              playsInline
              muted
              className="aspect-4/3 w-full rounded-lg border bg-black object-contain"
            />

            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                className="flex-1"
                onClick={() => void handleCapturePhoto()}
              >
                Capture photo
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={closeCameraModal}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {cameraError ? (
          <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1 text-xs text-destructive">
            {cameraError}
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          aria-label="Attach files"
          onChange={(event) => handleFilesSelected(event.target.files)}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Attach photo"
          onChange={(event) => handleFilesSelected(event.target.files)}
        />
      </footer>
    </section>
  );
}
