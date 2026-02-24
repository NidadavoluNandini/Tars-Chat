import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth";

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const me = await requireCurrentUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation || !conversation.memberIds.includes(me._id)) {
      return;
    }

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (query) =>
        query.eq("conversationId", args.conversationId).eq("userId", me._id),
      )
      .unique();

    if (!args.isTyping) {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return;
    }

    const now = Date.now();
    const expiresAt = now + 2000;

    if (existing) {
      await ctx.db.patch(existing._id, {
        updatedAt: now,
        expiresAt,
      });
      return;
    }

    await ctx.db.insert("typingIndicators", {
      conversationId: args.conversationId,
      userId: me._id,
      updatedAt: now,
      expiresAt,
    });
  },
});

export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const me = await requireCurrentUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation || !conversation.memberIds.includes(me._id)) {
      return [];
    }

    const now = Date.now();
    const rows = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (query) =>
        query.eq("conversationId", args.conversationId),
      )
      .collect();

    const activeRows = rows.filter(
      (row) => row.userId !== me._id && row.expiresAt > now,
    );

    const typingUsers = await Promise.all(
      activeRows.map(async (row) => {
        const user = await ctx.db.get(row.userId);
        return user?.name;
      }),
    );

    return typingUsers.filter(Boolean);
  },
});
