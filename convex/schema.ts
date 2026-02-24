import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Mirrors Clerk identity and stores app profile fields.
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_name", ["name"]),

  // Stores conversation metadata and membership.
  conversations: defineTable({
    isGroup: v.boolean(),
    title: v.optional(v.string()),
    memberIds: v.array(v.id("users")),
    directKey: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastMessageId: v.optional(v.id("messages")),
  })
    .index("by_directKey", ["directKey"])
    .index("by_updatedAt", ["updatedAt"]),

  // Message records; supports soft delete.
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    body: v.string(),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("by_conversation", ["conversationId"]),

  // Presence stream used to show online/offline indicators.
  presence: defineTable({
    userId: v.id("users"),
    isOnline: v.boolean(),
    lastSeen: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Typing indicators auto-expire from query logic based on expiresAt.
  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    updatedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_user", ["conversationId", "userId"]),

  // Denormalized unread counters for fast sidebar badges.
  unreadCounts: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    count: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_conversation_user", ["conversationId", "userId"]),

  // Lightweight emoji reactions per message.
  messageReactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_message_user_emoji", ["messageId", "userId", "emoji"]),
});