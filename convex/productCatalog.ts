import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const search = query({
  args: { term: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    if (args.term.length < 2) return [];

    const termLower = args.term.toLowerCase();

    return await ctx.db
      .query("productCatalog")
      .withIndex("by_user_name", (q) =>
        q
          .eq("userId", userId)
          .gte("nameLower", termLower)
          .lt("nameLower", termLower + "\uffff")
      )
      .take(10);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("productCatalog")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const remove = mutation({
  args: { id: v.id("productCatalog") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    await ctx.db.delete(args.id);
  },
});
