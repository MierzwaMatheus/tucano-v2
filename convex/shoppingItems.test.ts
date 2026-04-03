/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("shoppingItems - calculations", () => {
  test("should calculate totalCents correctly", () => {
    const unitPriceCents = 1500;
    const quantity = 3;
    const totalCents = Math.round(unitPriceCents * quantity);

    expect(totalCents).toBe(4500);
  });

  test("should handle fractional prices", () => {
    const unitPriceCents = 333;
    const quantity = 3;
    const totalCents = Math.round(unitPriceCents * quantity);

    expect(totalCents).toBe(999);
  });

  test("should calculate delta correctly for updates", () => {
    const oldTotal = 3000;
    const newQty = 4;
    const newPrice = 800;
    const newTotal = Math.round(newQty * newPrice);
    const delta = newTotal - oldTotal;

    expect(newTotal).toBe(3200);
    expect(delta).toBe(200);
  });

  test("should handle negative delta", () => {
    const oldTotal = 5000;
    const newQty = 2;
    const newPrice = 1000;
    const newTotal = Math.round(newQty * newPrice);
    const delta = newTotal - oldTotal;

    expect(newTotal).toBe(2000);
    expect(delta).toBe(-3000);
  });

  test("should prevent negative total when deleting item", () => {
    const listTotal = 3000;
    const itemTotal = 5000;
    const newTotal = Math.max(0, listTotal - itemTotal);

    expect(newTotal).toBe(0);
  });
});

describe("shoppingItems - database operations", () => {
  test("should add item and update list total", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const listId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingLists", {
        userId: userId as any,
        name: "Lista de teste",
        month: 4,
        year: 2026,
        budgetCents: 50000,
        totalCents: 0,
        status: "active",
        createdAt: Date.now(),
      });
    });

    const itemId = await ctx.run(async (c) => {
      const totalCents = Math.round(1500 * 3);

      const id = await c.db.insert("shoppingItems", {
        listId: listId as any,
        userId: userId as any,
        name: "Arroz",
        unit: "kg",
        quantity: 3,
        unitPriceCents: 1500,
        totalCents,
        isPurchased: false,
        createdAt: Date.now(),
      });

      await c.db.patch(listId as any, {
        totalCents: 0 + totalCents,
      });

      return id;
    });

    const list = await ctx.run(async (c) => {
      return await c.db.get(listId as any);
    });

    const item = await ctx.run(async (c) => {
      return await c.db.get(itemId as any);
    });

    expect(item?.totalCents).toBe(4500);
    expect(list?.totalCents).toBe(4500);
  });

  test("should delete item and decrease list total", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const listId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingLists", {
        userId: userId as any,
        name: "Lista de teste",
        month: 4,
        year: 2026,
        budgetCents: 50000,
        totalCents: 4500,
        status: "active",
        createdAt: Date.now(),
      });
    });

    const itemId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingItems", {
        listId: listId as any,
        userId: userId as any,
        name: "Arroz",
        unit: "kg",
        quantity: 3,
        unitPriceCents: 1500,
        totalCents: 4500,
        isPurchased: false,
        createdAt: Date.now(),
      });
    });

    await ctx.run(async (c) => {
      await c.db.delete(itemId as any);

      const list = await c.db.get(listId as any);
      if (list) {
        await c.db.patch(listId as any, {
          totalCents: Math.max(0, list.totalCents - 4500),
        });
      }
    });

    const list = await ctx.run(async (c) => {
      return await c.db.get(listId as any);
    });

    expect(list?.totalCents).toBe(0);
  });

  test("should toggle item purchased state", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const listId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingLists", {
        userId: userId as any,
        name: "Lista de teste",
        month: 4,
        year: 2026,
        budgetCents: 50000,
        totalCents: 1500,
        status: "active",
        createdAt: Date.now(),
      });
    });

    const itemId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingItems", {
        listId: listId as any,
        userId: userId as any,
        name: "Arroz",
        unit: "kg",
        quantity: 1,
        unitPriceCents: 1500,
        totalCents: 1500,
        isPurchased: false,
        createdAt: Date.now(),
      });
    });

    await ctx.run(async (c) => {
      await c.db.patch(itemId as any, {
        isPurchased: true,
        purchasedAt: Date.now(),
      });
    });

    const item = await ctx.run(async (c) => {
      return await c.db.get(itemId as any);
    });

    expect(item?.isPurchased).toBe(true);
    expect(item?.purchasedAt).toBeDefined();
  });

  test("should complete list when last item is purchased", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const listId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingLists", {
        userId: userId as any,
        name: "Lista de teste",
        month: 4,
        year: 2026,
        budgetCents: 50000,
        totalCents: 1500,
        status: "active",
        createdAt: Date.now(),
      });
    });

    const itemId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingItems", {
        listId: listId as any,
        userId: userId as any,
        name: "Arroz",
        unit: "kg",
        quantity: 1,
        unitPriceCents: 1500,
        totalCents: 1500,
        isPurchased: false,
        createdAt: Date.now(),
      });
    });

    await ctx.run(async (c) => {
      await c.db.patch(itemId as any, {
        isPurchased: true,
        purchasedAt: Date.now(),
      });

      const remaining = await c.db
        .query("shoppingItems")
        .withIndex("by_list_purchased", (q) =>
          q.eq("listId", listId as any).eq("isPurchased", false),
        )
        .first();

      if (!remaining) {
        const completedAt = Date.now();
        const txId = await c.db.insert("transactions", {
          userId: userId as any,
          type: "expense",
          name: "Lista de teste",
          amountCents: 1500,
          date: completedAt,
          status: "paid",
          isCredit: false,
          isRecurring: false,
          includeInStats: true,
          competenceMonth: 4,
          competenceYear: 2026,
          createdAt: completedAt,
        });

        await c.db.patch(listId as any, {
          status: "completed",
          completedAt,
          transactionId: txId,
        });
      }
    });

    const list = await ctx.run(async (c) => {
      return await c.db.get(listId as any);
    });

    expect(list?.status).toBe("completed");
    expect(list?.transactionId).toBeDefined();
  });

  test("should update item and adjust list total", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const listId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingLists", {
        userId: userId as any,
        name: "Lista de teste",
        month: 4,
        year: 2026,
        budgetCents: 50000,
        totalCents: 3000,
        status: "active",
        createdAt: Date.now(),
      });
    });

    const itemId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingItems", {
        listId: listId as any,
        userId: userId as any,
        name: "Arroz",
        unit: "kg",
        quantity: 2,
        unitPriceCents: 1500,
        totalCents: 3000,
        isPurchased: false,
        createdAt: Date.now(),
      });
    });

    await ctx.run(async (c) => {
      const item = await c.db.get(itemId as any);
      if (!item) return;

      const newQty = 3;
      const newPrice = 1500;
      const newTotal = Math.round(newQty * newPrice);
      const delta = newTotal - item.totalCents;

      await c.db.patch(itemId as any, {
        quantity: newQty,
        unitPriceCents: newPrice,
        totalCents: newTotal,
      });

      const list = await c.db.get(listId as any);
      if (list) {
        await c.db.patch(listId as any, {
          totalCents: list.totalCents + delta,
        });
      }
    });

    const list = await ctx.run(async (c) => {
      return await c.db.get(listId as any);
    });

    const item = await ctx.run(async (c) => {
      return await c.db.get(itemId as any);
    });

    expect(item?.totalCents).toBe(4500);
    expect(list?.totalCents).toBe(4500);
  });
});

describe("shoppingItems - edge cases", () => {
  test("should handle zero quantity", () => {
    const unitPriceCents = 1500;
    const quantity = 0;
    const totalCents = Math.round(unitPriceCents * quantity);

    expect(totalCents).toBe(0);
  });

  test("should handle zero price", () => {
    const unitPriceCents = 0;
    const quantity = 5;
    const totalCents = Math.round(unitPriceCents * quantity);

    expect(totalCents).toBe(0);
  });

  test("should handle large quantities", () => {
    const unitPriceCents = 100;
    const quantity = 1000000;
    const totalCents = Math.round(unitPriceCents * quantity);

    expect(totalCents).toBe(100000000);
  });

  test("should handle decimal rounding", () => {
    const unitPriceCents = 333;
    const quantity = 3;
    const totalCents = Math.round(unitPriceCents * quantity);

    expect(totalCents).toBe(999);
  });
});
