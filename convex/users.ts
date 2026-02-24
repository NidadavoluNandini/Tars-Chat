import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireCurrentUser } from "./lib/auth";

export const syncCurrentUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUsers = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .collect();

    const existing =
      existingUsers.sort((left, right) => right._creationTime - left._creationTime)[0] ?? null;

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        image: args.image,
        isOnline: true,
        lastSeen: now,
      });

      const existingPresence = await ctx.db
        .query("presence")
        .withIndex("by_userId", (query) => query.eq("userId", existing._id))
        .unique();

      if (existingPresence) {
        await ctx.db.patch(existingPresence._id, {
          isOnline: true,
          lastSeen: now,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("presence", {
          userId: existing._id,
          isOnline: true,
          lastSeen: now,
          updatedAt: now,
        });
      }

      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      image: args.image,
      isOnline: true,
      lastSeen: now,
    });

    await ctx.db.insert("presence", {
      userId,
      isOnline: true,
      lastSeen: now,
      updatedAt: now,
    });

    return userId;
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);

    const presence = await ctx.db
      .query("presence")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .unique();

    return {
      ...user,
      isOnline: presence?.isOnline ?? user.isOnline,
      lastSeen: presence?.lastSeen ?? user.lastSeen,
    };
  },
});

export const getAuthState = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return {
        isAuthenticated: false,
        hasProfile: false,
      };
    }

    const users = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (query) => query.eq("clerkId", identity.subject))
      .collect();

    return {
      isAuthenticated: true,
      hasProfile: users.length > 0,
    };
  },
});

export const searchUsers = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await requireCurrentUser(ctx);
    const search = args.search;

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

    const allUsers = await ctx.db.query("users").collect();
    const filtered = allUsers.filter((user) => {
      if (user._id === me._id || user.clerkId === me.clerkId) {
        return false;
      }
      if (!search?.trim()) {
        return true;
      }

      const normalizedSearch = search.trim();
      return (
        matchesSearch(normalizedSearch, user.name) ||
        matchesSearch(normalizedSearch, user.email)
      );
    });

    const usersWithPresence = await Promise.all(
      filtered.map(async (user) => {
        const presence = await ctx.db
          .query("presence")
          .withIndex("by_userId", (query) => query.eq("userId", user._id))
          .unique();

        return {
          ...user,
          isOnline: presence?.isOnline ?? user.isOnline,
          lastSeen: presence?.lastSeen ?? user.lastSeen,
        };
      }),
    );

    usersWithPresence.sort((left, right) => left.name.localeCompare(right.name));

    return usersWithPresence;
  },
});