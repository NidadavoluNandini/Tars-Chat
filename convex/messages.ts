import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth";

const ALLOWED_REACTIONS = [
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

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireCurrentUser(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const listMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const me = await requireCurrentUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation || !conversation.memberIds.includes(me._id)) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (query) =>
        query.eq("conversationId", args.conversationId),
      )
      .collect();

    messages.sort((left, right) => left.createdAt - right.createdAt);

    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        const reactions = await ctx.db
          .query("messageReactions")
          .withIndex("by_message", (query) => query.eq("messageId", message._id))
          .collect();

        const reactionCounts = new Map<
          string,
          { emoji: string; count: number; reactedByMe: boolean }
        >();

        for (const reaction of reactions) {
          const existing = reactionCounts.get(reaction.emoji);
          if (existing) {
            existing.count += 1;
            if (reaction.userId === me._id) {
              existing.reactedByMe = true;
            }
            continue;
          }

          reactionCounts.set(reaction.emoji, {
            emoji: reaction.emoji,
            count: 1,
            reactedByMe: reaction.userId === me._id,
          });
        }

        const fileUrl = message.fileId ? await ctx.storage.getUrl(message.fileId) : null;

        return {
          ...message,
          sender,
          fileUrl,
          reactions: Array.from(reactionCounts.values()).sort((left, right) =>
            left.emoji.localeCompare(right.emoji),
          ),
        };
      }),
    );

    return messagesWithSender;
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await requireCurrentUser(ctx);
    const trimmed = args.body.trim();

    if (!trimmed) {
      throw new Error("Message cannot be empty.");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.memberIds.includes(me._id)) {
      throw new Error("Conversation not found.");
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: me._id,
      body: trimmed,
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
      updatedAt: now,
    });

    const unreadRows = await Promise.all(
      conversation.memberIds.map((userId) =>
        ctx.db
          .query("unreadCounts")
          .withIndex("by_conversation_user", (query) =>
            query.eq("conversationId", args.conversationId).eq("userId", userId),
          )
          .unique(),
      ),
    );

    await Promise.all(
      conversation.memberIds.map(async (userId, index) => {
        const row = unreadRows[index];
        const nextCount = userId === me._id ? 0 : (row?.count ?? 0) + 1;

        if (row) {
          await ctx.db.patch(row._id, {
            count: nextCount,
            updatedAt: now,
          });
          return;
        }

        await ctx.db.insert("unreadCounts", {
          conversationId: args.conversationId,
          userId,
          count: nextCount,
          updatedAt: now,
        });
      }),
    );

    const myTyping = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (query) =>
        query.eq("conversationId", args.conversationId).eq("userId", me._id),
      )
      .unique();

    if (myTyping) {
      await ctx.db.delete(myTyping._id);
    }

    return messageId;
  },
});

export const sendFileMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const me = await requireCurrentUser(ctx);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.memberIds.includes(me._id)) {
      throw new Error("Conversation not found.");
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: me._id,
      body: "",
      fileId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
      updatedAt: now,
    });

    const unreadRows = await Promise.all(
      conversation.memberIds.map((userId) =>
        ctx.db
          .query("unreadCounts")
          .withIndex("by_conversation_user", (query) =>
            query.eq("conversationId", args.conversationId).eq("userId", userId),
          )
          .unique(),
      ),
    );

    await Promise.all(
      conversation.memberIds.map(async (userId, index) => {
        const row = unreadRows[index];
        const nextCount = userId === me._id ? 0 : (row?.count ?? 0) + 1;

        if (row) {
          await ctx.db.patch(row._id, {
            count: nextCount,
            updatedAt: now,
          });
          return;
        }

        await ctx.db.insert("unreadCounts", {
          conversationId: args.conversationId,
          userId,
          count: nextCount,
          updatedAt: now,
        });
      }),
    );

    const myTyping = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (query) =>
        query.eq("conversationId", args.conversationId).eq("userId", me._id),
      )
      .unique();

    if (myTyping) {
      await ctx.db.delete(myTyping._id);
    }

    return messageId;
  },
});

export const markConversationRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const me = await requireCurrentUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation || !conversation.memberIds.includes(me._id)) {
      return;
    }

    const unreadRow = await ctx.db
      .query("unreadCounts")
      .withIndex("by_conversation_user", (query) =>
        query.eq("conversationId", args.conversationId).eq("userId", me._id),
      )
      .unique();

    const now = Date.now();

    if (unreadRow) {
      await ctx.db.patch(unreadRow._id, {
        count: 0,
        updatedAt: now,
      });
      return;
    }

    await ctx.db.insert("unreadCounts", {
      conversationId: args.conversationId,
      userId: me._id,
      count: 0,
      updatedAt: now,
    });
  },
});

export const softDeleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const me = await requireCurrentUser(ctx);
    const message = await ctx.db.get(args.messageId);

    if (!message || message.senderId !== me._id) {
      throw new Error("You can only delete your own message.");
    }

    await ctx.db.patch(args.messageId, {
      deletedAt: Date.now(),
    });
  },
});

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await requireCurrentUser(ctx);
    if (!ALLOWED_REACTIONS.includes(args.emoji)) {
      throw new Error("Unsupported reaction.");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found.");
    }

    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation || !conversation.memberIds.includes(me._id)) {
      throw new Error("Conversation not found.");
    }

    const existing = await ctx.db
      .query("messageReactions")
      .withIndex("by_message_user_emoji", (query) =>
        query
          .eq("messageId", args.messageId)
          .eq("userId", me._id)
          .eq("emoji", args.emoji),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return;
    }

    await ctx.db.insert("messageReactions", {
      messageId: args.messageId,
      userId: me._id,
      emoji: args.emoji,
      createdAt: Date.now(),
    });
  },
});
