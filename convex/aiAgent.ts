import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";

const SYSTEM_PROMPT = `Você é o assistente do Tucano Finanças, um app de gestão financeira pessoal.

O usuário pode pedir para:

1. **Criar lista de compras**: "cria lista de compras de abril", "nova lista de compras", "lista de maio"
2. **Adicionar item à lista**: "adiciona arroz à lista", "compra arroz 5kg", "põe leite na lista"
3. **Adicionar transação**: "gastei 50 de alimentação", "recebi 3000 de salário", "comprei café por 15 reais"
4. **Consultar informações**: "quanto gastei esse mês?", "mostra minhas listas", "qual meu saldo?"

Sempre responda em português brasileiro de forma concisa.

Retorne APENAS JSON válido com este formato:
{"action": "tipo", "params": {...}, "userMessage": "sua resposta ao usuário"}

Tipos de action:
- "shopping_list_create": {"name": string, "month"?: number, "year"?: number, "budgetCents"?: number}
- "shopping_item_add": {"listName"?: string, "name": string, "quantity"?: number, "unit"?: string, "unitPriceCents"?: number}
- "transaction_add": {"type": "income"|"expense", "amountCents": number, "name": string, "description"?: string}
- "query_month_summary": {}
- "query_active_lists": {}
- "unknown": {}

Regras:
- Para transações: "gastei", "comprei", "paguei" = expense; "recebi", "ganhei" = income
- Para quantias: "50 reais" = 5000 centavos, "1.5 mil" = 150000 centavos
- Se não tem mês/ano explícito, use o mês/ano atual
- Se não conseguir entender, retorne action "unknown" com userMessage explicando`;

export const processMessage = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { message, userId } = body as {
      message: string;
      userId: Id<"users">;
    };

    if (!message || !userId) {
      return new Response("Mensagem ou userId ausente", { status: 400 });
    }

    let response: Response;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://tucano-finas.app",
              "X-Title": "Tucano Finanças",
            },
            body: JSON.stringify({
              model: "qwen/qwen3.5-9b",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: message },
              ],
              temperature: 0.3,
              max_tokens: 500,
            }),
          },
        );

        if (response.ok) break;

        const errorText = await response.text();
        lastError = new Error(`OpenRouter error: ${response.status}`);

        if (response.status === 503) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }

        return new Response(
          JSON.stringify({
            error: "Erro na API OpenRouter",
            details: errorText,
          }),
          { status: 500 },
        );
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    if (!response!) {
      return new Response(
        JSON.stringify({
          error: "Serviço de IA indisponível",
          details: lastError?.message ?? "Erro desconhecido",
        }),
        { status: 500 },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "Sem resposta da IA" }), {
        status: 500,
      });
    }

    let parsed: {
      action: string;
      params: Record<string, unknown>;
      userMessage: string;
    };

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found");
      }
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      parsed = {
        action: "unknown",
        params: {},
        userMessage: "Não consegui entender sua solicitação. Pode reformular?",
      };
    }

    let actionResult = "";

    if (parsed.action === "shopping_list_create") {
      const now = new Date();
      const month = (parsed.params.month as number) ?? now.getMonth() + 1;
      const year = (parsed.params.year as number) ?? now.getFullYear();
      const name = (parsed.params.name as string) ?? `Lista ${month}/${year}`;
      const budgetCents = (parsed.params.budgetCents as number) ?? 0;

      const listId = await ctx.runMutation(
        internal.telegramHelpers.createShoppingListInternal,
        {
          userId,
          name,
          month,
          year,
          budgetCents,
        },
      );

      actionResult = `Lista "${name}" criada com sucesso!`;
    } else if (parsed.action === "shopping_item_add") {
      const listName = parsed.params.listName as string | undefined;
      const itemName = parsed.params.name as string;
      const quantity = (parsed.params.quantity as number) ?? 1;
      const unit = (parsed.params.unit as string) ?? "un";
      const unitPriceCents = (parsed.params.unitPriceCents as number) ?? 0;

      const listId = await ctx.runQuery(
        internal.telegramHelpers.findActiveShoppingListInternal,
        {
          userId,
          listName: listName ?? undefined,
        },
      );

      if (!listId) {
        actionResult =
          "Nenhuma lista de compras ativa encontrada. Crie uma primeiro!";
      } else {
        await ctx.runMutation(
          internal.telegramHelpers.addShoppingItemInternal,
          {
            userId,
            listId,
            name: itemName,
            unit,
            quantity,
            unitPriceCents,
          },
        );

        actionResult = `"${itemName}" adicionado à lista!`;
      }
    } else if (parsed.action === "transaction_add") {
      const type = parsed.params.type as "income" | "expense";
      const amountCents = parsed.params.amountCents as number;
      const name = (parsed.params.name as string) ?? "Transação";
      const description = parsed.params.description as string | undefined;

      await ctx.runMutation(internal.telegramHelpers.addTransactionInternal, {
        userId,
        type,
        name,
        amountCents,
        date: Date.now(),
        description,
      });

      const typeText = type === "income" ? "receita" : "despesa";
      actionResult = `${typeText} de R$ ${(amountCents / 100).toFixed(2)} adicionada!`;
    } else if (parsed.action === "query_month_summary") {
      const now = new Date();
      const summary = await ctx.runQuery(
        internal.telegramHelpers.getMonthSummaryInternal,
        {
          userId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      );

      actionResult =
        `📊 Resumo do mês:\n` +
        `💰 Receitas: R$ ${(summary.totalIncome / 100).toFixed(2)}\n` +
        `💸 Despesas: R$ ${(summary.totalExpense / 100).toFixed(2)}\n` +
        `📈 Saldo: R$ ${(summary.balance / 100).toFixed(2)}\n` +
        `⏳ Pendente: R$ ${(summary.pending / 100).toFixed(2)}`;
    } else if (parsed.action === "query_active_lists") {
      const lists = await ctx.runQuery(
        internal.telegramHelpers.getUserActiveListsInternal,
        { userId },
      );

      if (lists.length === 0) {
        actionResult = "Nenhuma lista de compras ativa.";
      } else {
        actionResult =
          "📝 Listas ativas:\n" +
          lists
            .map(
              (l: Doc<"shoppingLists">) =>
                `• ${l.name} - R$ ${(l.totalCents / 100).toFixed(2)} (${l.month}/${l.year})`,
            )
            .join("\n");
      }
    }

    const finalMessage = parsed.userMessage || actionResult;

    return new Response(
      JSON.stringify({
        success: true,
        action: parsed.action,
        userMessage: actionResult
          ? `${finalMessage}\n\n✅ ${actionResult}`
          : finalMessage,
      }),
      { status: 200 },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Erro interno",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 },
    );
  }
});
