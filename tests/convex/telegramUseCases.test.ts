// @ts-nocheck
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe, vi, beforeEach } from "vitest";
import schema from "../../convex/schema";
import * as useCases from "../../convex/telegramUseCases";
import { internal } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const modules = import.meta.glob("../../convex/**/*.ts");

describe("telegramUseCases", () => {
  describe("executeTransactionAdd", () => {
    test("should add expense transaction without category", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeTransactionAdd(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            type: "expense",
            amountCents: 5000,
            name: "Alimentação",
          },
        );
      });

      expect(result).toBe("despesa de R$ 50.00 adicionada!");

      const transactions = await t.query(
        internal.telegramHelpers.getTransactionsInternal,
        { userId },
      );
      expect(transactions.length).toBe(1);
      expect(transactions[0].type).toBe("expense");
      expect(transactions[0].amountCents).toBe(5000);
      expect(transactions[0].name).toBe("Alimentação");
      expect(transactions[0].status).toBe("pending");
    });

    test("should add income transaction", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeTransactionAdd(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            type: "income",
            amountCents: 300000,
            name: "Salário",
          },
        );
      });

      expect(result).toBe("receita de R$ 3000.00 adicionada!");

      const transactions = await t.query(
        internal.telegramHelpers.getTransactionsInternal,
        { userId },
      );
      expect(transactions.length).toBe(1);
      expect(transactions[0].type).toBe("income");
      expect(transactions[0].amountCents).toBe(300000);
    });

    test("should add transaction with category", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });

        await ctx.db.insert("categories", {
          userId: uid,
          name: "Alimentação",
          type: "expense",
          isActive: true,
          createdAt: Date.now(),
        });

        return uid;
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeTransactionAdd(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            type: "expense",
            amountCents: 5000,
            name: "Supermercado",
            categoryName: "Alimentação",
          },
        );
      });

      expect(result).toContain('na categoria "Alimentação"');

      const transactions = await t.query(
        internal.telegramHelpers.getTransactionsInternal,
        { userId },
      );
      expect(transactions[0].categoryId).toBeDefined();
    });

    test("should add transaction as paid when isPaid=true", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeTransactionAdd(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            type: "expense",
            amountCents: 5000,
            name: "Conta Luz",
            isPaid: true,
          },
        );
      });

      const transactions = await t.query(
        internal.telegramHelpers.getTransactionsInternal,
        { userId },
      );
      expect(transactions[0].status).toBe("paid");
    });

    test("should add transaction as pending when isPaid=false", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });
      });

      await t.run(async (ctx) => {
        return await useCases.executeTransactionAdd(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            type: "expense",
            amountCents: 5000,
            name: "Conta Luz",
            isPaid: false,
          },
        );
      });

      const transactions = await t.query(
        internal.telegramHelpers.getTransactionsInternal,
        { userId },
      );
      expect(transactions[0].status).toBe("pending");
    });
  });

  describe("executeTransactionAddCredit", () => {
    test("should add credit card transaction", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });

        await ctx.db.insert("creditCards", {
          userId: uid,
          name: "Nubank",
          closingDay: 15,
          paymentDay: 25,
          isEnabled: true,
          createdAt: Date.now(),
        });

        return uid;
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeTransactionAddCredit(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            type: "expense",
            amountCents: 20000,
            name: "Compra Online",
            cardName: "Nubank",
          },
        );
      });

      expect(result).toContain("no Nubank");

      const transactions = await t.query(
        internal.telegramHelpers.getTransactionsInternal,
        { userId },
      );
      expect(transactions.length).toBe(1);
      expect(transactions[0].isCredit).toBe(true);
    });

    test("should return error when card not found", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeTransactionAddCredit(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            type: "expense",
            amountCents: 20000,
            name: "Compra",
            cardName: "Cartão Inexistente",
          },
        );
      });

      expect(result).toContain('Cartão "Cartão Inexistente" não encontrado');
    });

    test("should add installment transaction", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });

        await ctx.db.insert("creditCards", {
          userId: uid,
          name: "Itaú",
          closingDay: 10,
          paymentDay: 20,
          isEnabled: true,
          createdAt: Date.now(),
        });

        return uid;
      });

      await t.run(async (ctx) => {
        return await useCases.executeTransactionAddCredit(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            type: "expense",
            amountCents: 100000,
            name: "TV",
            cardName: "Itaú",
            installments: 10,
          },
        );
      });

      const transactions = await t.query(
        internal.telegramHelpers.getTransactionsInternal,
        { userId },
      );
      expect(transactions.length).toBe(10);
      expect(transactions[0].installmentNumber).toBe(1);
      expect(transactions[0].totalInstallments).toBe(10);
    });

    test("should include category in response message", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });

        await ctx.db.insert("creditCards", {
          userId: uid,
          name: "Nubank",
          closingDay: 15,
          paymentDay: 25,
          isEnabled: true,
          createdAt: Date.now(),
        });

        await ctx.db.insert("categories", {
          userId: uid,
          name: "Compras",
          type: "expense",
          isActive: true,
          createdAt: Date.now(),
        });

        return uid;
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeTransactionAddCredit(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            type: "expense",
            amountCents: 50000,
            name: "Roupas",
            cardName: "Nubank",
            categoryName: "Compras",
          },
        );
      });

      expect(result).toContain('em "Compras"');
    });
  });

  describe("executeShoppingListCreate", () => {
    test("should create shopping list with provided name", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeShoppingListCreate(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            name: "Lista de Abril",
            month: 4,
            year: 2026,
          },
        );
      });

      expect(result).toBe('Lista "Lista de Abril" criada com sucesso!');

      const lists = await t.query(
        internal.telegramHelpers.getAllShoppingListsInternal,
        { userId },
      );
      expect(lists.length).toBe(1);
      expect(lists[0].name).toBe("Lista de Abril");
      expect(lists[0].month).toBe(4);
      expect(lists[0].year).toBe(2026);
    });

    test("should use current month/year when not provided", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });
      });

      await t.run(async (ctx) => {
        return await useCases.executeShoppingListCreate(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            name: "Lista Atual",
          },
        );
      });

      const lists = await t.query(
        internal.telegramHelpers.getAllShoppingListsInternal,
        { userId },
      );
      const now = new Date();
      const expectedMonth = now.getMonth() + 1;
      const expectedYear = now.getFullYear();

      expect(lists[0].month).toBe(expectedMonth);
      expect(lists[0].year).toBe(expectedYear);
    });

    test("should create list with budget", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });
      });

      await t.run(async (ctx) => {
        return await useCases.executeShoppingListCreate(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            name: "Lista com Orçamento",
            budgetCents: 50000,
          },
        );
      });

      const lists = await t.query(
        internal.telegramHelpers.getAllShoppingListsInternal,
        { userId },
      );
      expect(lists[0].budgetCents).toBe(50000);
    });
  });

  describe("executeShoppingItemAdd", () => {
    test("should add item to active list", async () => {
      const t = convexTest(schema, modules);

      let listId: Id<"shoppingLists">;

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });

        listId = await ctx.db.insert("shoppingLists", {
          userId: uid,
          name: "Lista de Compras",
          month: 4,
          year: 2026,
          budgetCents: 0,
          totalCents: 0,
          status: "active",
          createdAt: Date.now(),
        });

        return uid;
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeShoppingItemAdd(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            name: "Arroz",
            quantity: 2,
            unit: "kg",
            unitPriceCents: 1500,
          },
        );
      });

      expect(result).toBe('"Arroz" adicionado à lista!');

      const items = await t.query(
        internal.telegramHelpers.getShoppingListItemsInternal,
        { listId: listId! },
      );
      expect(items.length).toBeGreaterThanOrEqual(1);
    });

    test("should return error when no active list exists", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeShoppingItemAdd(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            name: "Arroz",
          },
        );
      });

      expect(result).toBe(
        "Nenhuma lista de compras ativa encontrada. Crie uma primeiro!",
      );
    });

    test("should use default unit and quantity", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });

        await ctx.db.insert("shoppingLists", {
          userId: uid,
          name: "Lista",
          month: 4,
          year: 2026,
          budgetCents: 0,
          totalCents: 0,
          status: "active",
          createdAt: Date.now(),
        });

        return uid;
      });

      await t.run(async (ctx) => {
        return await useCases.executeShoppingItemAdd(
          {
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
          },
          userId,
          {
            name: "Leite",
          },
        );
      });

      const lists = await t.query(
        internal.telegramHelpers.getAllShoppingListsInternal,
        { userId },
      );
      const items = await t.query(
        internal.telegramHelpers.getShoppingListItemsInternal,
        { listId: lists[0]._id },
      );
      expect(items[0].quantity).toBe(1);
      expect(items[0].unit).toBe("un");
    });
  });

  describe("executeQueryMonthSummary", () => {
    test("should return formatted summary with zero values", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeQueryMonthSummary(
          { runQuery: ctx.runQuery.bind(ctx) },
          userId,
        );
      });

      expect(result).toContain("📊 Resumo do mês:");
      expect(result).toContain("💰 Receitas: R$ 0.00");
      expect(result).toContain("💸 Despesas: R$ 0.00");
      expect(result).toContain("📈 Saldo: R$ 0.00");
      expect(result).toContain("⏳ Pendente: R$ 0.00");
    });

    test("should return summary with actual transactions", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        await ctx.db.insert("transactions", {
          userId: uid,
          type: "income",
          name: "Salário",
          amountCents: 300000,
          date: Date.now(),
          categoryId: undefined,
          status: "paid",
          isCredit: false,
          isRecurring: false,
          includeInStats: true,
          competenceMonth: month,
          competenceYear: year,
          createdAt: Date.now(),
        });

        await ctx.db.insert("transactions", {
          userId: uid,
          type: "expense",
          name: "Aluguel",
          amountCents: 150000,
          date: Date.now(),
          categoryId: undefined,
          status: "paid",
          isCredit: false,
          isRecurring: false,
          includeInStats: true,
          competenceMonth: month,
          competenceYear: year,
          createdAt: Date.now(),
        });

        return uid;
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeQueryMonthSummary(
          { runQuery: ctx.runQuery.bind(ctx) },
          userId,
        );
      });

      expect(result).toContain("💰 Receitas: R$ 3000.00");
      expect(result).toContain("💸 Despesas: R$ 1500.00");
      expect(result).toContain("📈 Saldo: R$ 1500.00");
    });
  });

  describe("executeQueryCreditCards", () => {
    test("should return message when no cards", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeQueryCreditCards(
          { runQuery: ctx.runQuery.bind(ctx) },
          userId,
        );
      });

      expect(result).toBe("Nenhum cartão cadastrado.");
    });

    test("should return formatted cards list", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });

        await ctx.db.insert("creditCards", {
          userId: uid,
          name: "Nubank",
          closingDay: 15,
          paymentDay: 25,
          isEnabled: true,
          createdAt: Date.now(),
        });

        await ctx.db.insert("creditCards", {
          userId: uid,
          name: "Itaú",
          closingDay: 10,
          paymentDay: 20,
          isEnabled: true,
          createdAt: Date.now(),
        });

        return uid;
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeQueryCreditCards(
          { runQuery: ctx.runQuery.bind(ctx) },
          userId,
        );
      });

      expect(result).toContain("💳 Meus cartões:");
      expect(result).toContain("Nubank");
      expect(result).toContain("Itaú");
      expect(result).toContain("Fechamento: 15");
      expect(result).toContain("Vencimento: 25");
    });

    test("should only show enabled cards", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });

        await ctx.db.insert("creditCards", {
          userId: uid,
          name: "Nubank",
          closingDay: 15,
          paymentDay: 25,
          isEnabled: true,
          createdAt: Date.now(),
        });

        await ctx.db.insert("creditCards", {
          userId: uid,
          name: "Bradesco",
          closingDay: 5,
          paymentDay: 15,
          isEnabled: false,
          createdAt: Date.now(),
        });

        return uid;
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeQueryCreditCards(
          { runQuery: ctx.runQuery.bind(ctx) },
          userId,
        );
      });

      expect(result).toContain("Nubank");
      expect(result).not.toContain("Bradesco");
    });
  });

  describe("executeQueryCategories", () => {
    test("should return message when no categories", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeQueryCategories(
          { runQuery: ctx.runQuery.bind(ctx) },
          userId,
        );
      });

      expect(result).toBe("Nenhuma categoria cadastrada.");
    });

    test("should return formatted categories list", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });

        await ctx.db.insert("categories", {
          userId: uid,
          name: "Alimentação",
          type: "expense",
          isActive: true,
          createdAt: Date.now(),
        });

        await ctx.db.insert("categories", {
          userId: uid,
          name: "Transporte",
          type: "expense",
          isActive: true,
          createdAt: Date.now(),
        });

        return uid;
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeQueryCategories(
          { runQuery: ctx.runQuery.bind(ctx) },
          userId,
        );
      });

      expect(result).toContain("🏷️ Minhas categorias:");
      expect(result).toContain("• Alimentação");
      expect(result).toContain("• Transporte");
    });

    test("should only show active categories", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert("users", {
          email: "test@example.com",
          telegramId: "123",
          createdAt: Date.now(),
        });

        await ctx.db.insert("categories", {
          userId: uid,
          name: "Ativa",
          type: "expense",
          isActive: true,
          createdAt: Date.now(),
        });

        await ctx.db.insert("categories", {
          userId: uid,
          name: "Inativa",
          type: "expense",
          isActive: false,
          createdAt: Date.now(),
        });

        return uid;
      });

      const result = await t.run(async (ctx) => {
        return await useCases.executeQueryCategories(
          { runQuery: ctx.runQuery.bind(ctx) },
          userId,
        );
      });

      expect(result).toContain("Ativa");
      expect(result).not.toContain("Inativa");
    });
  });
});
