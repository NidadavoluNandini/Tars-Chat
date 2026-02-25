"use client";

import { Search, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, UserId } from "@/types/chat";
import { GroupCreator } from "@/features/users/components/GroupCreator";

type UserSearchListProps = {
  search: string;
  users: User[];
  onSearchChange: (value: string) => void;
  onUserSelect: (userId: UserId) => void;
  onCreateGroup: (title: string, memberIds: UserId[]) => Promise<void>;
};

export function UserSearchList({
  search,
  users,
  onSearchChange,
  onUserSelect,
  onCreateGroup,
}: UserSearchListProps) {
  const hasSearch = Boolean(search.trim());

  return (
    <section className="space-y-3 border-b bg-card/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Start New Chat
      </p>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search users or chats"
          className="rounded-full border bg-background pl-9 shadow-sm"
        />
      </div>

      <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border bg-background/70 p-1">
        {users.map((user) => (
          <Button
            key={user._id}
            variant="ghost"
            className="h-auto w-full justify-start gap-2 rounded-lg px-2 py-2"
            onClick={() => onUserSelect(user._id)}
          >
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-card ${
                  user.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
                }`}
              />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                {user.isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </Button>
        ))}

        {!users.length ? (
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            <div className="mb-1 flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              {hasSearch ? "No matching users." : "No users found."}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasSearch
                ? "If this is an existing chat, check the conversation list below."
                : "Create a second account (incognito window) so users can discover each other."}
            </p>
          </div>
        ) : null}
      </div>

      <GroupCreator users={users} onCreateGroup={onCreateGroup} />
    </section>
  );
}
