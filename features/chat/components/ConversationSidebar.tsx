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
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden border-r border-border/60 bg-linear-to-b from-card via-card to-muted/20 lg:w-90">
      <div className="shrink-0">
        <header className="flex items-center justify-between border-b border-border/60 bg-card/95 px-4 py-3.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-9 w-9 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all hover:ring-primary/40">
              <AvatarImage src={currentUser.image} alt={currentUser.name} />
              <AvatarFallback className="bg-linear-to-br from-primary to-primary/70 text-primary-foreground">{currentUser.name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            {currentUser.isOnline ? (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500 animate-pulse" />
            ) : null}
          </div>
          <div>
            <p className="text-sm font-semibold">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${currentUser.isOnline ? "bg-emerald-500" : "bg-gray-400"}`} />
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
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3">
        <p className="mb-3 px-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/80">
          Recent Chats
        </p>

        {conversations.length ? (
          <ul className="space-y-1.5">
            {conversations.map((conversation, index) => {
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
                <li key={conversation._id} className="animate-slide-in-right">
                  <Button
                    variant="ghost"
                    className={`group h-auto w-full justify-start gap-3 rounded-xl border px-3 py-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                      isActive
                        ? "border-primary/40 bg-linear-to-br from-primary/15 to-primary/5 shadow-md shadow-primary/10 glow"
                        : "border-transparent hover:border-border/50 hover:bg-muted/60"
                    }`}
                    onClick={() => onConversationSelect(conversation._id)}
                  >
                    <div className="relative">
                      <Avatar className={`h-11 w-11 ring-2 transition-all ${isActive ? "ring-primary/30" : "ring-border/40 group-hover:ring-border/60"}`}>
                        <AvatarImage
                          src={conversation.otherMember?.image}
                          alt={title}
                        />
                        <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/10">{title.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {!conversation.isGroup && conversation.otherMember?.isOnline ? (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500 shadow-sm animate-pulse" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-sm font-semibold transition-colors ${isActive ? "text-foreground" : "text-foreground/90"}`}>{title}</p>
                        {conversation.lastMessage ? (
                          <span className="text-[11px] font-medium text-muted-foreground/80">
                            {formatChatTimestamp(conversation.lastMessage.createdAt)}
                          </span>
                        ) : null}
                      </div>

                      <p className={`truncate text-xs transition-colors ${conversation.typingUsers.length ? "italic text-primary font-medium" : "text-muted-foreground"}`}>
                        {conversation.isGroup
                          ? `${conversation.groupOnlineCount}/${conversation.groupMembers.length} online · ${preview}`
                          : preview}
                      </p>
                    </div>

                    {conversation.unreadCount > 0 ? (
                      <Badge className="min-w-6 justify-center rounded-full px-2 py-0.5 bg-linear-to-br from-primary to-primary/80 shadow-md animate-scale-in">
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
