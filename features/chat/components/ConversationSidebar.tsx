"use client";

import { UserButton } from "@clerk/nextjs";
import { MessageCircleMore } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatChatTimestamp } from "@/lib/date";
import { ConversationId, ConversationListItem, User } from "@/types/chat";
import { UserSearchList } from "@/features/users/components/UserSearchList";

type ConversationSidebarProps = {
  currentUser: User;
  conversations: ConversationListItem[];
  searchedUsers: User[];
  search: string;
  actionError: string | null;
  activeConversationId: ConversationId | null;
  onSearchChange: (value: string) => void;
  onUserSelect: (userId: User["_id"]) => void;
  onCreateGroup: (title: string, memberIds: User["_id"][]) => Promise<void>;
  onConversationSelect: (conversationId: ConversationId) => void;
};

export function ConversationSidebar({
  currentUser,
  conversations,
  searchedUsers,
  search,
  actionError,
  activeConversationId,
  onSearchChange,
  onUserSelect,
  onCreateGroup,
  onConversationSelect,
}: ConversationSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-border/60 bg-card lg:w-90">
      <header className="flex items-center justify-between border-b border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser.image} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">
              {currentUser.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <UserButton />
        </div>
      </header>

      <UserSearchList
        search={search}
        users={searchedUsers}
        onSearchChange={onSearchChange}
        onUserSelect={onUserSelect}
        onCreateGroup={onCreateGroup}
      />

      {actionError ? (
        <div className="mx-3 mt-2 rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          {actionError}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3">
        <p className="mb-2 px-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Recent Chats
        </p>

        {conversations.length ? (
          <ul className="space-y-1">
            {conversations.map((conversation) => {
              const isActive = activeConversationId === conversation._id;
              const title =
                conversation.isGroup
                  ? conversation.title ?? "Group"
                  : (conversation.otherMember?.name ?? "Conversation");
              const preview = conversation.typingUsers.length
                ? `${conversation.typingUsers[0]} is typing...`
                : conversation.lastMessage
                  ? conversation.lastMessage.deletedAt
                    ? "Message deleted"
                    : conversation.lastMessage.body
                  : "No messages yet";

              return (
                <li key={conversation._id}>
                  <Button
                    variant="ghost"
                    className={`h-auto w-full justify-start gap-3 rounded-xl border px-3 py-2.5 transition-all hover:border-border hover:bg-muted/50 ${
                      isActive
                        ? "border-primary/30 bg-primary/10 shadow-sm"
                        : "border-transparent"
                    }`}
                    onClick={() => onConversationSelect(conversation._id)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 ring-1 ring-border/60">
                        <AvatarImage
                          src={conversation.otherMember?.image}
                          alt={title}
                        />
                        <AvatarFallback>{title.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {!conversation.isGroup && conversation.otherMember?.isOnline ? (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-card bg-emerald-500" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{title}</p>
                        {conversation.lastMessage ? (
                          <span className="text-[11px] text-muted-foreground">
                            {formatChatTimestamp(conversation.lastMessage.createdAt)}
                          </span>
                        ) : null}
                      </div>

                      <p className="truncate text-xs text-muted-foreground">
                        {conversation.isGroup
                          ? `${conversation.groupOnlineCount}/${conversation.groupMembers.length} online · ${preview}`
                          : preview}
                      </p>
                    </div>

                    {conversation.unreadCount > 0 ? (
                      <Badge className="min-w-6 justify-center rounded-full px-1.5">
                        {conversation.unreadCount}
                      </Badge>
                    ) : null}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed bg-background p-6 text-center">
            <MessageCircleMore className="mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">No conversations yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Search another registered user (not your own account) and start chatting.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
