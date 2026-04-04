import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    return user;
  },
});

export const updateProfile = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(userId, {
      name: args.name,
    });

    return { success: true };
  },
});

export const updatePhotoUrl = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const existingPhotos = await ctx.db
      .query("userPhotos")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const photo of existingPhotos) {
      await ctx.db.delete(photo._id);
      await ctx.storage.delete(photo.storageId);
    }

    const photoUrl = await ctx.storage.getUrl(args.storageId);

    await ctx.db.patch(userId, {
      photoUrl: photoUrl ?? undefined,
    });

    await ctx.db.insert("userPhotos", {
      userId,
      storageId: args.storageId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const removePhoto = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const existingPhotos = await ctx.db
      .query("userPhotos")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const photo of existingPhotos) {
      await ctx.db.delete(photo._id);
      await ctx.storage.delete(photo.storageId);
    }

    await ctx.db.patch(userId, {
      photoUrl: undefined,
    });

    return { success: true };
  },
});
