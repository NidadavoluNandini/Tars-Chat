import { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const users = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (query) => query.eq("clerkId", identity.subject))
    .collect();

  const user = users.sort((left, right) => right._creationTime - left._creationTime)[0] ?? null;

  if (!user) {
    throw new Error("User profile not found. Sync user first.");
  }

  return user;
}
