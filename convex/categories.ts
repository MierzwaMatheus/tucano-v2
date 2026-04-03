import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    type: v.optional(
      v.union(
        v.literal("shopping"),
        v.literal("income"),
        v.literal("expense"),
        v.literal("all")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (args.type) {
      return await ctx.db
        .query("categories")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", userId).eq("type", args.type!)
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }

    return await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("shopping"),
      v.literal("income"),
      v.literal("expense"),
      v.literal("all")
    ),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    return await ctx.db.insert("categories", {
      userId,
      name: args.name,
      type: args.type,
      color: args.color,
      icon: args.icon,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const deactivate = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    await ctx.db.patch(args.id, { isActive: false });
  },
});
