import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth";

export const setOnlineStatus = mutation({
  args: {
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const me = await requireCurrentUser(ctx);
    const now = Date.now();

    await ctx.db.patch(me._id, {
      isOnline: args.isOnline,
      lastSeen: now,
    });

    const existingPresence = await ctx.db
      .query("presence")
      .withIndex("by_userId", (query) => query.eq("userId", me._id))
      .unique();

    if (existingPresence) {
      await ctx.db.patch(existingPresence._id, {
        isOnline: args.isOnline,
        lastSeen: now,
        updatedAt: now,
      });
      return;
    }

    await ctx.db.insert("presence", {
      userId: me._id,
      isOnline: args.isOnline,
      lastSeen: now,
      updatedAt: now,
    });
  },
});
