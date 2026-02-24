import { Doc, Id } from "@/convex/_generated/dataModel";

export type User = Doc<"users">;
export type Conversation = Doc<"conversations">;
export type Message = Doc<"messages">;

export type ConversationListItem = Conversation & {
  unreadCount: number;
  typingUsers: string[];
  lastMessage: Doc<"messages"> | null;
  otherMember: (Doc<"users"> & { isOnline: boolean; lastSeen: number }) | null;
  groupMembers: Array<Doc<"users"> & { isOnline: boolean; lastSeen: number }>;
  groupOnlineCount: number;
};

export type ConversationDetails = Conversation & {
  otherMember: (Doc<"users"> & { isOnline: boolean; lastSeen: number }) | null;
  groupMembers: Array<Doc<"users"> & { isOnline: boolean; lastSeen: number }>;
  groupOnlineCount: number;
};

export type MessageWithSender = Message & {
  sender: Doc<"users"> | null;
  fileUrl?: string | null;
  reactions?: Array<{
    emoji: string;
    count: number;
    reactedByMe: boolean;
  }>;
};

export type ConversationId = Id<"conversations">;
export type UserId = Id<"users">;
