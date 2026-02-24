"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { usePresence } from "@/hooks/use-presence";
import { ConversationSidebar } from "@/features/chat/components/ConversationSidebar";
import { ChatPanel } from "@/features/chat/components/ChatPanel";
import { ConversationId, ConversationListItem, User } from "@/types/chat";

export function ChatShell() {
  const authState = useQuery(api.users.getAuthState);

  if (authState === undefined) {
    return (
      <div className="grid h-dvh grid-cols-1 overflow-hidden lg:grid-cols-[360px_1fr]">
        <div className="space-y-3 border-r p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="hidden p-4 lg:block">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <main className="flex h-dvh items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Connect Clerk to Convex</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Clerk login is active, but Convex is not receiving an auth token yet.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Create a Clerk JWT template named convex.</li>
            <li>Set issuer to your Clerk domain used in .env.local.</li>
            <li>Restart both Next.js and Convex dev servers.</li>
          </ol>
          <Button className="mt-4" asChild>
            <a
              href="https://dashboard.clerk.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Clerk Dashboard
            </a>
          </Button>
        </div>
      </main>
    );
  }

  if (!authState.hasProfile) {
    return (
      <main className="flex h-dvh items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Setting up your chat profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We are syncing your Clerk profile to Convex. This usually takes a few seconds.
          </p>
        </div>
      </main>
    );
  }

  return <AuthenticatedChatShell />;
}

function AuthenticatedChatShell() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const [search, setSearch] = useState("");
  const searchedUsers = useQuery(api.users.searchUsers, { search });
  const conversations = useQuery(api.conversations.listConversations);
  const startOrCreateDirectConversation = useMutation(
    api.conversations.startOrCreateDirectConversation,
  );
  const createGroupConversation = useMutation(api.conversations.createGroupConversation);

  const [activeConversationId, setActiveConversationId] =
    useState<ConversationId | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const isMobile = useMobile();

  usePresence(Boolean(currentUser));

  const typedConversations = useMemo(
    () => ((conversations ?? []) as ConversationListItem[]),
    [conversations],
  );

  const normalizeText = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

  const isSubsequence = (needle: string, haystack: string) => {
    if (!needle) {
      return true;
    }

    let index = 0;
    for (const char of haystack) {
      if (char === needle[index]) {
        index += 1;
      }
      if (index === needle.length) {
        return true;
      }
    }
    return false;
  };

  const matchesSearch = (needle: string, haystack: string) => {
    const normalizedNeedle = normalizeText(needle);
    const normalizedHaystack = normalizeText(haystack);
    return (
      normalizedHaystack.includes(normalizedNeedle) ||
      isSubsequence(normalizedNeedle, normalizedHaystack)
    );
  };

  const filteredConversations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return typedConversations;
    }

    return typedConversations.filter((conversation) => {
      const title = conversation.isGroup
        ? (conversation.title ?? "group")
        : (conversation.otherMember?.name ?? "conversation");

      const preview = conversation.lastMessage?.body ?? "";

      if (matchesSearch(normalizedSearch, title) || matchesSearch(normalizedSearch, preview)) {
        return true;
      }

      if (!conversation.isGroup) {
        const otherMember = conversation.otherMember;
        if (!otherMember) {
          return false;
        }

        return (
          matchesSearch(normalizedSearch, otherMember.name) ||
          matchesSearch(normalizedSearch, otherMember.email)
        );
      }

      return conversation.groupMembers.some((member) =>
        matchesSearch(normalizedSearch, `${member.name} ${member.email}`),
      );
    });
  }, [typedConversations, search]);

  const selectedConversationId =
    activeConversationId ?? typedConversations[0]?._id ?? null;

  if (!currentUser) {
    return (
      <div className="grid h-dvh grid-cols-1 overflow-hidden lg:grid-cols-[360px_1fr]">
        <div className="space-y-3 border-r p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="hidden p-4 lg:block">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  const showSidebar = !isMobile || !isMobileChatOpen;
  const showChatPanel = !isMobile || isMobileChatOpen;

  const handleStartConversation = async (userId: User["_id"]) => {
    try {
      setActionError(null);
      const conversationId = await startOrCreateDirectConversation({
        otherUserId: userId,
      });

      setActiveConversationId(conversationId);
      if (isMobile) {
        setIsMobileChatOpen(true);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to open conversation.");
    }
  };

  const handleSelectConversation = (conversationId: ConversationId) => {
    setActiveConversationId(conversationId);
    if (isMobile) {
      setIsMobileChatOpen(true);
    }
  };

  const handleCreateGroupConversation = async (
    title: string,
    memberIds: User["_id"][],
  ) => {
    try {
      setActionError(null);
      const conversationId = await createGroupConversation({ title, memberIds });
      setActiveConversationId(conversationId);
      if (isMobile) {
        setIsMobileChatOpen(true);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to create group.");
    }
  };

  return (
    <div className="grid h-dvh min-h-0 grid-cols-1 overflow-hidden bg-muted/25 lg:grid-cols-[360px_1fr]">
      {showSidebar ? (
        <ConversationSidebar
          currentUser={currentUser as User}
          conversations={filteredConversations}
          searchedUsers={(searchedUsers ?? []) as User[]}
          search={search}
          actionError={actionError}
          activeConversationId={selectedConversationId}
          onSearchChange={setSearch}
          onUserSelect={handleStartConversation}
          onCreateGroup={handleCreateGroupConversation}
          onConversationSelect={handleSelectConversation}
        />
      ) : null}

      {showChatPanel ? (
        selectedConversationId ? (
          <ChatPanel
            conversationId={selectedConversationId}
            currentUserId={(currentUser as User)._id}
            isMobile={isMobile}
            onBack={() => setIsMobileChatOpen(false)}
          />
        ) : (
          <section className="hidden h-full min-h-0 items-center justify-center p-6 text-center lg:flex">
            <div className="rounded-2xl border bg-card/80 px-10 py-12 shadow-sm backdrop-blur">
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Start from the sidebar or search for a teammate.
              </p>
            </div>
          </section>
        )
      ) : null}
    </div>
  );
}
