"use client";

import { useMemo, useState } from "react";
import { Check, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@/types/chat";

type GroupCreatorProps = {
  users: User[];
  onCreateGroup: (title: string, memberIds: User["_id"][]) => Promise<void>;
};

export function GroupCreator({ users, onCreateGroup }: GroupCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState<User["_id"][]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = useMemo(
    () => title.trim().length > 0 && selectedIds.length >= 2 && !isSubmitting,
    [isSubmitting, selectedIds.length, title],
  );

  const toggleUser = (id: User["_id"]) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  };

  const handleCreate = async () => {
    if (!canCreate) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateGroup(title, selectedIds);
      setTitle("");
      setSelectedIds([]);
      setIsOpen(false);
    } catch {
      setError("Failed to create group. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-2 rounded-lg border bg-background p-2 transition-all duration-200 hover:shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">Group chat</p>
        <Button size="sm" variant="secondary" onClick={() => setIsOpen((value) => !value)}>
          <UsersRound className="mr-1 h-3.5 w-3.5" />
          {isOpen ? "Close" : "New group"}
        </Button>
      </div>

      {isOpen ? (
        <div className="space-y-2 animate-in fade-in-0 duration-200">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Group name"
          />

          <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-1">
            {users.map((user) => {
              const selected = selectedIds.includes(user._id);
              return (
                <button
                  key={user._id}
                  type="button"
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition ${
                    selected ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                  onClick={() => toggleUser(user._id)}
                >
                  <span className="truncate">{user.name}</span>
                  {selected ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                </button>
              );
            })}

            {!users.length ? (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                No users available in current search.
              </p>
            ) : null}
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <Button size="sm" onClick={() => void handleCreate()} disabled={!canCreate}>
            {isSubmitting ? "Creating..." : "Create group"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
