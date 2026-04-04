// @ts-nocheck
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.ts");

describe("categories - operations", () => {
  test("should create category with all fields", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const categoryId = await ctx.run(async (c) => {
      return await c.db.insert("categories", {
        userId: userId as any,
        name: "Alimentação",
        type: "expense",
        color: "#FF0000",
        icon: "utensils",
        isActive: true,
        createdAt: Date.now(),
      });
    });

    const category = await ctx.run(async (c) => {
      return await c.db.get(categoryId as any);
    });

    expect(category?.name).toBe("Alimentação");
    expect(category?.type).toBe("expense");
    expect(category?.color).toBe("#FF0000");
    expect(category?.icon).toBe("utensils");
    expect(category?.isActive).toBe(true);
  });

  test("should create category with minimal fields", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const categoryId = await ctx.run(async (c) => {
      return await c.db.insert("categories", {
        userId: userId as any,
        name: "Transporte",
        type: "expense",
        isActive: true,
        createdAt: Date.now(),
      });
    });

    const category = await ctx.run(async (c) => {
      return await c.db.get(categoryId as any);
    });

    expect(category?.name).toBe("Transporte");
    expect(category?.type).toBe("expense");
    expect(category?.color).toBeUndefined();
    expect(category?.icon).toBeUndefined();
  });

  test("should deactivate category", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const categoryId = await ctx.run(async (c) => {
      return await c.db.insert("categories", {
        userId: userId as any,
        name: "Lazer",
        type: "expense",
        isActive: true,
        createdAt: Date.now(),
      });
    });

    await ctx.run(async (c) => {
      await c.db.patch(categoryId as any, { isActive: false });
    });

    const category = await ctx.run(async (c) => {
      return await c.db.get(categoryId as any);
    });

    expect(category?.isActive).toBe(false);
  });

  test("should filter categories by type", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    await ctx.run(async (c) => {
      await c.db.insert("categories", {
        userId: userId as any,
        name: "Salário",
        type: "income",
        isActive: true,
        createdAt: Date.now(),
      });

      await c.db.insert("categories", {
        userId: userId as any,
        name: "Alimentação",
        type: "expense",
        isActive: true,
        createdAt: Date.now(),
      });

      await c.db.insert("categories", {
        userId: userId as any,
        name: "Mercado",
        type: "shopping",
        isActive: true,
        createdAt: Date.now(),
      });
    });

    const incomeCategories = await ctx.run(async (c) => {
      return await c.db
        .query("categories")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", userId as any).eq("type", "income"),
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    });

    const expenseCategories = await ctx.run(async (c) => {
      return await c.db
        .query("categories")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", userId as any).eq("type", "expense"),
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    });

    expect(incomeCategories.length).toBe(1);
    expect(incomeCategories[0].name).toBe("Salário");

    expect(expenseCategories.length).toBe(1);
    expect(expenseCategories[0].name).toBe("Alimentação");
  });

  test("should update category fields", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const categoryId = await ctx.run(async (c) => {
      return await c.db.insert("categories", {
        userId: userId as any,
        name: "Original",
        type: "expense",
        color: "#000000",
        icon: "star",
        isActive: true,
        createdAt: Date.now(),
      });
    });

    await ctx.run(async (c) => {
      await c.db.patch(categoryId as any, {
        name: "Editado",
        color: "#FFFFFF",
        icon: "heart",
      });
    });

    const category = await ctx.run(async (c) => {
      return await c.db.get(categoryId as any);
    });

    expect(category?.name).toBe("Editado");
    expect(category?.color).toBe("#FFFFFF");
    expect(category?.icon).toBe("heart");
    expect(category?.type).toBe("expense");
  });
});

describe("categories - type validation", () => {
  test("should accept income type", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const categoryId = await ctx.run(async (c) => {
      return await c.db.insert("categories", {
        userId: userId as any,
        name: "Investimentos",
        type: "income",
        isActive: true,
        createdAt: Date.now(),
      });
    });

    const category = await ctx.run(async (c) => {
      return await c.db.get(categoryId as any);
    });

    expect(category?.type).toBe("income");
  });

  test("should accept expense type", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const categoryId = await ctx.run(async (c) => {
      return await c.db.insert("categories", {
        userId: userId as any,
        name: "Moradia",
        type: "expense",
        isActive: true,
        createdAt: Date.now(),
      });
    });

    const category = await ctx.run(async (c) => {
      return await c.db.get(categoryId as any);
    });

    expect(category?.type).toBe("expense");
  });

  test("should accept shopping type", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const categoryId = await ctx.run(async (c) => {
      return await c.db.insert("categories", {
        userId: userId as any,
        name: "Supermercado",
        type: "shopping",
        isActive: true,
        createdAt: Date.now(),
      });
    });

    const category = await ctx.run(async (c) => {
      return await c.db.get(categoryId as any);
    });

    expect(category?.type).toBe("shopping");
  });

  test("should accept all type", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const categoryId = await ctx.run(async (c) => {
      return await c.db.insert("categories", {
        userId: userId as any,
        name: "Geral",
        type: "all",
        isActive: true,
        createdAt: Date.now(),
      });
    });

    const category = await ctx.run(async (c) => {
      return await c.db.get(categoryId as any);
    });

    expect(category?.type).toBe("all");
  });
});
