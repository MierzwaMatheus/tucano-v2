// @ts-nocheck
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe, vi, beforeEach } from "vitest";
import schema from "../../convex/schema";
import { validateActionParams, parseActionParams } from "../../convex/aiAgent";
import * as useCases from "../../convex/telegramUseCases";
import { internal } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const modules = import.meta.glob("../../convex/**/*.ts");

describe("aiAgent - validateActionParams", () => {
  describe("transaction_add", () => {
    test("should accept valid transaction_add params", () => {
      const params = {
        type: "expense" as const,
        amountCents: 5000,
        name: "Alimentação",
      };

      expect(() =>
        validateActionParams("transaction_add", params),
      ).not.toThrow();
    });

    test("should accept income type", () => {
      const params = {
        type: "income" as const,
        amountCents: 300000,
        name: "Salário",
      };

      expect(() =>
        validateActionParams("transaction_add", params),
      ).not.toThrow();
    });

    test("should reject invalid type", () => {
      const params = {
        type: "invalid",
        amountCents: 5000,
        name: "Test",
      };

      expect(() => validateActionParams("transaction_add", params)).toThrow(
        "transaction_add: type is required and must be income or expense",
      );
    });

    test("should reject missing type", () => {
      const params = {
        amountCents: 5000,
        name: "Test",
      };

      expect(() => validateActionParams("transaction_add", params)).toThrow(
        "transaction_add: type is required and must be income or expense",
      );
    });

    test("should reject zero amountCents", () => {
      const params = {
        type: "expense" as const,
        amountCents: 0,
        name: "Test",
      };

      expect(() => validateActionParams("transaction_add", params)).toThrow(
        "transaction_add: amountCents must be a positive number",
      );
    });

    test("should reject negative amountCents", () => {
      const params = {
        type: "expense" as const,
        amountCents: -100,
        name: "Test",
      };

      expect(() => validateActionParams("transaction_add", params)).toThrow(
        "transaction_add: amountCents must be a positive number",
      );
    });

    test("should reject missing name", () => {
      const params = {
        type: "expense" as const,
        amountCents: 5000,
      };

      expect(() => validateActionParams("transaction_add", params)).toThrow(
        "transaction_add: name must be a string",
      );
    });

    test("should reject non-string name", () => {
      const params = {
        type: "expense" as const,
        amountCents: 5000,
        name: 123,
      };

      expect(() => validateActionParams("transaction_add", params)).toThrow(
        "transaction_add: name must be a string",
      );
    });
  });

  describe("transaction_add_credit", () => {
    test("should accept valid transaction_add_credit params", () => {
      const params = {
        type: "expense" as const,
        amountCents: 20000,
        name: "Compra Nubank",
        cardName: "Nubank",
      };

      expect(() =>
        validateActionParams("transaction_add_credit", params),
      ).not.toThrow();
    });

    test("should accept with installments", () => {
      const params = {
        type: "expense" as const,
        amountCents: 300000,
        name: "TV",
        cardName: "Itaú",
        installments: 10,
      };

      expect(() =>
        validateActionParams("transaction_add_credit", params),
      ).not.toThrow();
    });

    test("should reject missing cardName", () => {
      const params = {
        type: "expense" as const,
        amountCents: 5000,
        name: "Test",
      };

      expect(() =>
        validateActionParams("transaction_add_credit", params),
      ).toThrow("transaction_add_credit: cardName is required");
    });

    test("should reject invalid type", () => {
      const params = {
        type: "invalid",
        amountCents: 5000,
        name: "Test",
        cardName: "Nubank",
      };

      expect(() =>
        validateActionParams("transaction_add_credit", params),
      ).toThrow(
        "transaction_add_credit: type is required and must be income or expense",
      );
    });

    test("should reject negative amountCents", () => {
      const params = {
        type: "expense" as const,
        amountCents: -100,
        name: "Test",
        cardName: "Nubank",
      };

      expect(() =>
        validateActionParams("transaction_add_credit", params),
      ).toThrow(
        "transaction_add_credit: amountCents must be a positive number",
      );
    });
  });

  describe("transaction_add_recurring", () => {
    test("should accept valid transaction_add_recurring params", () => {
      const params = {
        type: "expense" as const,
        amountCents: 5500,
        name: "Netflix",
        isSubscription: true,
      };

      expect(() =>
        validateActionParams("transaction_add_recurring", params),
      ).not.toThrow();
    });

    test("should accept isSubscription false", () => {
      const params = {
        type: "income" as const,
        amountCents: 100000,
        name: "Aluguel recorrente",
        isSubscription: false,
      };

      expect(() =>
        validateActionParams("transaction_add_recurring", params),
      ).not.toThrow();
    });

    test("should reject missing isSubscription", () => {
      const params = {
        type: "expense" as const,
        amountCents: 5000,
        name: "Test",
      };

      expect(() =>
        validateActionParams("transaction_add_recurring", params),
      ).toThrow(
        "transaction_add_recurring: isSubscription is required and must be boolean",
      );
    });

    test("should reject non-boolean isSubscription", () => {
      const params = {
        type: "expense" as const,
        amountCents: 5000,
        name: "Test",
        isSubscription: "true",
      };

      expect(() =>
        validateActionParams("transaction_add_recurring", params),
      ).toThrow(
        "transaction_add_recurring: isSubscription is required and must be boolean",
      );
    });

    test("should reject invalid type", () => {
      const params = {
        type: "invalid",
        amountCents: 5000,
        name: "Test",
        isSubscription: true,
      };

      expect(() =>
        validateActionParams("transaction_add_recurring", params),
      ).toThrow(
        "transaction_add_recurring: type is required and must be income or expense",
      );
    });
  });

  describe("shopping_item_add", () => {
    test("should accept valid shopping_item_add params", () => {
      const params = {
        name: "Arroz",
        quantity: 2,
        unitPriceCents: 1500,
      };

      expect(() =>
        validateActionParams("shopping_item_add", params),
      ).not.toThrow();
    });

    test("should accept minimal params", () => {
      const params = {
        name: "Leite",
      };

      expect(() =>
        validateActionParams("shopping_item_add", params),
      ).not.toThrow();
    });

    test("should reject missing name", () => {
      const params = {
        quantity: 2,
        unitPriceCents: 1500,
      };

      expect(() => validateActionParams("shopping_item_add", params)).toThrow(
        "shopping_item_add: name is required",
      );
    });

    test("should reject non-string name", () => {
      const params = {
        name: 123,
      };

      expect(() => validateActionParams("shopping_item_add", params)).toThrow(
        "shopping_item_add: name is required",
      );
    });
  });

  describe("query_card_transactions", () => {
    test("should accept valid query_card_transactions params", () => {
      const params = {
        cardName: "Nubank",
        month: 3,
        year: 2026,
      };

      expect(() =>
        validateActionParams("query_card_transactions", params),
      ).not.toThrow();
    });

    test("should accept minimal params", () => {
      const params = {
        cardName: "Itaú",
      };

      expect(() =>
        validateActionParams("query_card_transactions", params),
      ).not.toThrow();
    });

    test("should reject missing cardName", () => {
      const params = {
        month: 3,
        year: 2026,
      };

      expect(() =>
        validateActionParams("query_card_transactions", params),
      ).toThrow("query_card_transactions: cardName is required");
    });
  });

  describe("unknown actions", () => {
    test("should not throw for unknown action", () => {
      const params = {};

      expect(() => validateActionParams("unknown", params)).not.toThrow();
    });

    test("should not throw for completely unknown action", () => {
      const params = { foo: "bar" };

      expect(() => validateActionParams("random_action", params)).not.toThrow();
    });
  });
});

describe("aiAgent - parseActionParams", () => {
  describe("transaction amount conversion", () => {
    test("should convert string amount with comma decimal", () => {
      const rawParams = { amountCents: "50,00" };

      const result = parseActionParams("transaction_add", rawParams);

      expect(result.amountCents).toBe(5000);
    });

    test("should convert string amount with dot decimal", () => {
      const rawParams = { amountCents: "50.00" };

      const result = parseActionParams("transaction_add", rawParams);

      expect(result.amountCents).toBe(5000);
    });

    test("should convert string amount without decimal", () => {
      const rawParams = { amountCents: "100" };

      const result = parseActionParams("transaction_add", rawParams);

      expect(result.amountCents).toBe(10000);
    });

    test("should keep numeric amount unchanged", () => {
      const rawParams = { amountCents: 5000 };

      const result = parseActionParams("transaction_add", rawParams);

      expect(result.amountCents).toBe(5000);
    });

    test("should not convert invalid string", () => {
      const rawParams = { amountCents: "abc" };

      const result = parseActionParams("transaction_add", rawParams);

      expect(result.amountCents).toBe("abc");
    });

    test("should convert for transaction_add_credit", () => {
      const rawParams = { amountCents: "1500,50" };

      const result = parseActionParams("transaction_add_credit", rawParams);

      expect(result.amountCents).toBe(150050);
    });

    test("should convert for transaction_add_recurring", () => {
      const rawParams = { amountCents: "99.90" };

      const result = parseActionParams("transaction_add_recurring", rawParams);

      expect(result.amountCents).toBe(9990);
    });

    test("should not convert for non-transaction actions", () => {
      const rawParams = { amountCents: "50,00" };

      const result = parseActionParams("shopping_list_create", rawParams);

      expect(result.amountCents).toBe("50,00");
    });
  });

  describe("immutability", () => {
    test("should not mutate original params", () => {
      const rawParams = { amountCents: "50,00", name: "Test" };
      const original = { ...rawParams };

      parseActionParams("transaction_add", rawParams);

      expect(rawParams).toEqual(original);
    });

    test("should return new object with other params preserved", () => {
      const rawParams = {
        amountCents: "50,00",
        name: "Alimentação",
        type: "expense",
        description: "Teste",
      };

      const result = parseActionParams("transaction_add", rawParams);

      expect(result.name).toBe("Alimentação");
      expect(result.type).toBe("expense");
      expect(result.description).toBe("Teste");
      expect(result.amountCents).toBe(5000);
    });
  });
});
