import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth";
import { Id } from "./_generated/dataModel";

function notNull<T>(value: T | null): value is T {
  return value !== null;
}

function getDirectConversationKey(left: Id<"users">, right: Id<"users">) {
  const [first, second] = [left, right].map(String).sort();
  return `${first}:${second}`;
}

export const startOrCreateDirectConversation = mutation({
  args: {
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const me = await requireCurrentUser(ctx);

    if (args.otherUserId === me._id) {
      throw new Error("You cannot start a chat with yourself.");
    }

    const directKey = getDirectConversationKey(me._id, args.otherUserId);
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_directKey", (query) => query.eq("directKey", directKey))
      .unique();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      isGroup: false,
      memberIds: [me._id, args.otherUserId],
      directKey,
      createdAt: now,
      updatedAt: now,
    });

    await Promise.all([
      ctx.db.insert("unreadCounts", {
        conversationId,
        userId: me._id,
        count: 0,
        updatedAt: now,
      }),
      ctx.db.insert("unreadCounts", {
        conversationId,
        userId: args.otherUserId,
        count: 0,
        updatedAt: now,
      }),
    ]);

    return conversationId;
  },
});

export const createGroupConversation = mutation({
  args: {
    title: v.string(),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const me = await requireCurrentUser(ctx);
    const title = args.title.trim();

    if (!title) {
      throw new Error("Group name is required.");
    }

    const uniqueMemberIds = Array.from(new Set(args.memberIds.map(String))).map(
      (memberId) => memberId as Id<"users">,
    );

    const groupMemberIds = Array.from(new Set([me._id, ...uniqueMemberIds]));

    if (groupMemberIds.length < 3) {
      throw new Error("Please add at least 2 teammates to create a group.");
    }

    const validMembers = await Promise.all(
      groupMemberIds.map(async (memberId) => ctx.db.get(memberId)),
    );

    if (validMembers.some((member) => !member)) {
      throw new Error("One or more members were not found.");
    }

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      isGroup: true,
      title,
      memberIds: groupMemberIds,
      createdAt: now,
      updatedAt: now,
    });

    await Promise.all(
      groupMemberIds.map((userId) =>
        ctx.db.insert("unreadCounts", {
          conversationId,
          userId,
          count: 0,
          updatedAt: now,
        }),
      ),
    );

    return conversationId;
  },
});

export const listConversations = query({
  handler: async (ctx) => {
    const me = await requireCurrentUser(ctx);
    const now = Date.now();

    const allConversations = await ctx.db.query("conversations").collect();
    const myConversations = allConversations
      .filter((conversation) => conversation.memberIds.includes(me._id))
      .sort((left, right) => right.updatedAt - left.updatedAt);

    const unreadRows = await ctx.db
      .query("unreadCounts")
      .withIndex("by_user", (query) => query.eq("userId", me._id))
      .collect();

    const unreadCountByConversation = new Map(
      unreadRows.map((row) => [row.conversationId, row.count]),
    );

    const mappedConversations = await Promise.all(
      myConversations.map(async (conversation) => {
        const lastMessage = conversation.lastMessageId
          ? await ctx.db.get(conversation.lastMessageId)
          : null;

        const otherMemberId = conversation.memberIds.find((id) => id !== me._id);
        const otherMember = otherMemberId ? await ctx.db.get(otherMemberId) : null;
        const otherMemberPresence = otherMemberId
          ? await ctx.db
              .query("presence")
              .withIndex("by_userId", (query) => query.eq("userId", otherMemberId))
              .unique()
          : null;

        const activeTypingRows = (await ctx.db
          .query("typingIndicators")
          .withIndex("by_conversation", (query) =>
            query.eq("conversationId", conversation._id),
          )
          .collect())
          .filter((typing) => typing.expiresAt > now && typing.userId !== me._id);

        const typingUsers = await Promise.all(
          activeTypingRows.map(async (typing) => {
            const user = await ctx.db.get(typing.userId);
            return user?.name;
          }),
        );

        const memberProfiles = await Promise.all(
          conversation.memberIds
            .filter((memberId) => memberId !== me._id)
            .map(async (memberId) => {
              const user = await ctx.db.get(memberId);
              if (!user) {
                return null;
              }

              const presence = await ctx.db
                .query("presence")
                .withIndex("by_userId", (query) => query.eq("userId", memberId))
                .unique();

              return {
                ...user,
                isOnline: presence?.isOnline ?? user.isOnline,
                lastSeen: presence?.lastSeen ?? user.lastSeen,
              };
            }),
        );

        const validMemberProfiles = memberProfiles.filter(notNull);

        return {
          ...conversation,
          lastMessage,
          otherMember: otherMember
            ? {
                ...otherMember,
                isOnline: otherMemberPresence?.isOnline ?? otherMember.isOnline,
                lastSeen: otherMemberPresence?.lastSeen ?? otherMember.lastSeen,
              }
            : null,
          unreadCount: unreadCountByConversation.get(conversation._id) ?? 0,
          typingUsers: typingUsers.filter(Boolean),
          groupMembers: validMemberProfiles,
          groupOnlineCount: validMemberProfiles.filter((member) => member.isOnline).length,
        };
      }),
    );

    return mappedConversations;
  },
});

export const getConversation = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const me = await requireCurrentUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation || !conversation.memberIds.includes(me._id)) {
      return null;
    }

    const otherMemberId = conversation.memberIds.find((id) => id !== me._id);
    const otherMember = otherMemberId ? await ctx.db.get(otherMemberId) : null;

    const otherPresence = otherMemberId
      ? await ctx.db
          .query("presence")
          .withIndex("by_userId", (query) => query.eq("userId", otherMemberId))
          .unique()
      : null;

    const groupMembers = await Promise.all(
      conversation.memberIds
        .filter((memberId) => memberId !== me._id)
        .map(async (memberId) => {
          const user = await ctx.db.get(memberId);
          if (!user) {
            return null;
          }

          const presence = await ctx.db
            .query("presence")
            .withIndex("by_userId", (query) => query.eq("userId", memberId))
            .unique();

          return {
            ...user,
            isOnline: presence?.isOnline ?? user.isOnline,
            lastSeen: presence?.lastSeen ?? user.lastSeen,
          };
        }),
    );

    const validGroupMembers = groupMembers.filter(notNull);

    return {
      ...conversation,
      otherMember: otherMember
        ? {
            ...otherMember,
            isOnline: otherPresence?.isOnline ?? otherMember.isOnline,
            lastSeen: otherPresence?.lastSeen ?? otherMember.lastSeen,
          }
        : null,
      groupMembers: validGroupMembers,
      groupOnlineCount: validGroupMembers.filter((member) => member.isOnline).length,
    };
  },
});
