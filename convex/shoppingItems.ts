import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const addItem = mutation({
  args: {
    listId: v.id("shoppingLists"),
    catalogItemId: v.optional(v.id("productCatalog")),
    name: v.string(),
    unit: v.string(),
    quantity: v.number(),
    unitPriceCents: v.number(),
    brand: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const totalCents = Math.round(args.unitPriceCents * args.quantity);
    let finalCatalogItemId = args.catalogItemId;

    if (args.catalogItemId && args.brand) {
      const catalogItem = await ctx.db.get(args.catalogItemId);
      if (catalogItem && catalogItem.defaultBrand !== args.brand) {
        const newCatalogId = await ctx.db.insert("productCatalog", {
          userId,
          name: args.name,
          nameLower: args.name.toLowerCase(),
          defaultUnit: args.unit,
          defaultBrand: args.brand,
          categoryId: args.categoryId,
          lastPriceCents: args.unitPriceCents,
          priceHistory: [
            {
              priceCents: args.unitPriceCents,
              date: Date.now(),
              listId: args.listId,
            },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        finalCatalogItemId = newCatalogId;
      }
    }

    await ctx.db.insert("shoppingItems", {
      listId: args.listId,
      userId,
      catalogItemId: finalCatalogItemId,
      name: args.name,
      unit: args.unit,
      quantity: args.quantity,
      unitPriceCents: args.unitPriceCents,
      totalCents,
      brand: args.brand,
      categoryId: args.categoryId,
      isPurchased: false,
      createdAt: Date.now(),
    });

    const list = await ctx.db.get(args.listId);
    if (list) {
      await ctx.db.patch(args.listId, {
        totalCents: list.totalCents + totalCents,
      });
    }

    if (finalCatalogItemId) {
      const catalogItemToUpdate = await ctx.db.get(finalCatalogItemId);
      if (
        catalogItemToUpdate &&
        catalogItemToUpdate.lastPriceCents !== args.unitPriceCents
      ) {
        await ctx.db.patch(finalCatalogItemId, {
          lastPriceCents: args.unitPriceCents,
          priceHistory: [
            ...catalogItemToUpdate.priceHistory,
            {
              priceCents: args.unitPriceCents,
              date: Date.now(),
              listId: args.listId,
            },
          ],
          updatedAt: Date.now(),
        });
      }
    } else if (!args.catalogItemId && args.brand) {
      await ctx.db.insert("productCatalog", {
        userId,
        name: args.name,
        nameLower: args.name.toLowerCase(),
        defaultUnit: args.unit,
        defaultBrand: args.brand,
        categoryId: args.categoryId,
        lastPriceCents: args.unitPriceCents,
        priceHistory: [
          {
            priceCents: args.unitPriceCents,
            date: Date.now(),
            listId: args.listId,
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const togglePurchased = mutation({
  args: { itemId: v.id("shoppingItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item não encontrado");

    const newState = !item.isPurchased;
    const purchasedAt = newState ? Date.now() : undefined;

    await ctx.db.patch(args.itemId, {
      isPurchased: newState,
      purchasedAt,
    });

    const remaining = await ctx.db
      .query("shoppingItems")
      .withIndex("by_list_purchased", (q) =>
        q.eq("listId", item.listId).eq("isPurchased", false),
      )
      .first();

    const list = await ctx.db.get(item.listId);
    if (!list) return;

    if (!remaining) {
      const completedAt = Date.now();
      await ctx.db.patch(list._id, {
        status: "completed",
        completedAt,
      });

      const txId = await ctx.db.insert("transactions", {
        userId,
        type: "expense",
        name: list.name,
        amountCents: list.totalCents,
        date: completedAt,
        status: "paid",
        isCredit: false,
        isRecurring: false,
        includeInStats: true,
        competenceMonth: list.month,
        competenceYear: list.year,
        createdAt: completedAt,
      });

      await ctx.db.patch(list._id, {
        transactionId: txId,
      });
    } else {
      if (list.status === "completed") {
        if (list.transactionId) {
          await ctx.db.delete(list.transactionId);
        }

        await ctx.db.patch(list._id, {
          status: "active",
          completedAt: undefined,
          transactionId: undefined,
        });
      }
    }
  },
});

export const updateItem = mutation({
  args: {
    id: v.id("shoppingItems"),
    quantity: v.optional(v.number()),
    unitPriceCents: v.optional(v.number()),
    brand: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item não encontrado");

    const newQty = args.quantity ?? item.quantity;
    const newPrice = args.unitPriceCents ?? item.unitPriceCents;
    const newTotal = Math.round(newQty * newPrice);
    const delta = newTotal - item.totalCents;

    await ctx.db.patch(args.id, {
      quantity: newQty,
      unitPriceCents: newPrice,
      totalCents: newTotal,
      brand: args.brand ?? item.brand,
      categoryId: args.categoryId ?? item.categoryId,
    });

    const list = await ctx.db.get(item.listId);
    if (list) {
      await ctx.db.patch(item.listId, {
        totalCents: list.totalCents + delta,
      });
    }
  },
});

export const deleteItem = mutation({
  args: { id: v.id("shoppingItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item não encontrado");

    await ctx.db.delete(args.id);

    const list = await ctx.db.get(item.listId);
    if (list) {
      await ctx.db.patch(item.listId, {
        totalCents: Math.max(0, list.totalCents - item.totalCents),
      });
    }
  },
});
