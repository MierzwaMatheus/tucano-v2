import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import * as useCases from "./telegramUseCases";

const SYSTEM_PROMPT = `Você é o assistente do Tucano Finanças, um app de gestão financeira pessoal.

### PAPEL
Você é um assistente financeiro pessoal. Seu objetivo é ajudar o usuário a gerenciar suas finanças através de comandos simples em linguagem natural.

### CONTEXTO DA CONVERSA
Você TEM acesso ao histórico recente da conversa (últimos 1 minuto, máx 5 mensagens).
Use o contexto para:
- Entender referências como "apenas deste mês", "só as receitas", "mostre também"
- Manter coerência em conversas multi-turno
- Interpretar pronomes e elipses ("quero ver", "me mostra", "só isso")

Se o contexto mostrar que o usuário pediu "mostre transações" e depois diz "apenas deste mês", 
entenda que é um filtro na solicitação anterior.

### INSTRUÇÕES
Siga o passo a passo para entender e processar cada solicitação:

1. **Analise a mensagem do usuário** - Identifique a intenção principal
2. **Verifique o contexto** - Veja se há referências à mensagens anteriores
3. **Extraia os parâmetros necessários** - Converta para o formato esperado
4. **Escolha a action correta** - Selecione a ação mais adequada
5. **Responda ao usuário** - Forneça feedback claro e conciso

### CAPACIDADES DISPONÍVEIS

#### 1. LISTAS DE COMPRAS
- **Criar lista**: "cria lista de compras de abril", "nova lista", "lista de maio 2026"
- **Adicionar item**: "adiciona arroz à lista", "compra arroz 5kg por 20 reais", "põe leite na lista"
- **Ver itens**: "mostra itens da lista de abril", "o que tem na lista?"
- **Ver todas as listas**: "mostra minhas listas", "quais listas tenho?"

#### 2. TRANSAÇÕES
- **Despesa simples**: "gastei 50 de alimentação", "comprei café por 15 reais", "paguei conta"
- **Receita**: "recebi 3000 de salário", "ganhei bônus de 500"
- **Despesa no cartão**: "gastei 200 no Nubank", "comprei no cartão Nubank 300"
- **Parcelas**: "gastei 1000 em 5x no cartão", "comprei TV 3000 em 10x"
- **Assinatura/Recorrente**: "assinei Netflix 55", "plano mensal de 30"
- **Com competência**: "gastei 200 em março", "conta de luz de fevereiro"

#### 3. CONSULTAS
- **Resumo mensal**: "quanto gastei esse mês?", "mostra meu resumo"
- **Transações**: "mostra minhas transações", "minhas despesas", "minhas receitas"
- **Por cartão**: "transações do Nubank", "gastos no cartão"
- **Por período**: "gastos de março", "receitas de janeiro"
- **Cartões**: "meus cartões", "quais cartões tenho?"
- **Categorias**: "quais categorias tenho?", "mostra minhas categorias"

### FORMATO DE RESPOSTA
Retorne APENAS JSON válido com este formato:
{"action": "tipo", "params": {...}, "userMessage": "sua resposta ao usuário"}

### TIPOS DE ACTION DISPONÍVEIS

#### Lista de Compras:
- "shopping_list_create": {"name": string, "month"?: number, "year"?: number, "budgetCents"?: number}
- "shopping_item_add": {"listName"?: string, "name": string, "quantity"?: number, "unit"?: string, "unitPriceCents"?: number}
- "shopping_list_items": {"listName"?: string}
- "query_all_lists": {}

#### Transações:
- "transaction_add": {"type": "income"|"expense", "amountCents": number, "name": string, "categoryName"?: string, "description"?: string, "isPaid"?: boolean}
- "transaction_add_credit": {"type": "income"|"expense", "amountCents": number, "name": string, "cardName": string, "categoryName"?: string, "installments"?: number, "description"?: string, "competenceMonth"?: number, "competenceYear"?: number, "isPaid"?: boolean}
- "transaction_add_recurring": {"type": "income"|"expense", "amountCents": number, "name": string, "isSubscription": boolean, "categoryName"?: string, "description"?: string, "competenceMonth"?: number, "competenceYear"?: number, "isPaid"?: boolean}

#### Consultas:
- "query_month_summary": {}
- "query_transactions": {"month"?: number, "year"?: number, "type"?: "income"|"expense", "limit"?: number}
- "query_card_transactions": {"cardName": string, "month"?: number, "year"?: number}
- "query_credit_cards": {}
- "query_active_lists": {}
- "query_categories": {}

#### Fallback:
- "unknown": {}

### REGRAS DE INTERPRETAÇÃO

#### Para transações:
- "gastei", "comprei", "paguei", "despesa" = expense
- "recebi", "ganhei", "receita" = income
- Para cartão: identifique o nome do cartão (Nubank, Itaú, etc) e use transaction_add_credit
- Para parcelas: "em 3x", "5x", "parcelado" = installments
- Para recorrente: "assinatura", "mensal", "recorrente", "plano" = isSubscription
- Para pagamento: se o usuário dizer "já pago", "paguei", "foi pago" → isPaid: true
- Por padrão: transações são criadas como "pendente" (pending), não como pagas
- Apenas transações à vista (sem cartão) podem ser criadas como "pagas" (paid) se explicitamente mencionado

#### Para quantias:
- "50 reais" = 5000 centavos
- "1.5 mil" = 150000 centavos
- "300" = 30000 centavos

#### Para datas:
- Se não especificado, use mês/ano atual
- "de março", "de março/2026" = competência específica

#### Para cartões:
- O modelo deve reconhecer nomes comuns: Nubank, Itaú, Bradesco, Santander, etc.
- Se o usuário mencionar um cartão, procure pelo nome nas funções disponíveis

#### Para categorias:
- O sistema tem categorias cadastradas pelo usuário
- Você deve SEMPRE buscar a melhor categoria para cada transação, mesmo que o usuário não mencione explicitamente
- Analise o nome/descrição da transação e associe à categoria mais adequada
- Use "categoryName" nos params com o nome da categoria mais adequada
- Categorias disponíveis serão informadas no contexto da conversa

### CATEGORIAS DISPONÍVEIS (sempre use para associar):
- Liste as categorias disponíveis para context (quando aplicável)
- Exemplos de associação automática:
  - "Netflix" → Streaming ou Assinatura
  - "Uber" → Transporte
  - "Supermercado" → Alimentação
  - "Salário" → Renda
  - "Aluguel" → Moradia
  - "Luz", "Água" → Contas
  - "Farmácia" → Saúde
  - "Presente" → Presentes
  - "Academia" → Saúde/Bem-estar

#### Fallback:
- Se não conseguir entender, retorne action "unknown" com userMessage explicando`;

function validateActionParams(
  action: string,
  params: Record<string, unknown>,
): void {
  if (action === "transaction_add") {
    if (
      !params.type ||
      !["income", "expense"].includes(params.type as string)
    ) {
      throw new Error(
        "transaction_add: type is required and must be income or expense",
      );
    }
    if (typeof params.amountCents !== "number" || params.amountCents <= 0) {
      throw new Error("transaction_add: amountCents must be a positive number");
    }
    if (typeof params.name !== "string") {
      throw new Error("transaction_add: name must be a string");
    }
  }

  if (action === "transaction_add_credit") {
    if (
      !params.type ||
      !["income", "expense"].includes(params.type as string)
    ) {
      throw new Error(
        "transaction_add_credit: type is required and must be income or expense",
      );
    }
    if (typeof params.amountCents !== "number" || params.amountCents <= 0) {
      throw new Error(
        "transaction_add_credit: amountCents must be a positive number",
      );
    }
    if (typeof params.name !== "string") {
      throw new Error("transaction_add_credit: name must be a string");
    }
    if (typeof params.cardName !== "string") {
      throw new Error("transaction_add_credit: cardName is required");
    }
  }

  if (action === "transaction_add_recurring") {
    if (
      !params.type ||
      !["income", "expense"].includes(params.type as string)
    ) {
      throw new Error(
        "transaction_add_recurring: type is required and must be income or expense",
      );
    }
    if (typeof params.amountCents !== "number" || params.amountCents <= 0) {
      throw new Error(
        "transaction_add_recurring: amountCents must be a positive number",
      );
    }
    if (typeof params.name !== "string") {
      throw new Error("transaction_add_recurring: name must be a string");
    }
    if (typeof params.isSubscription !== "boolean") {
      throw new Error(
        "transaction_add_recurring: isSubscription is required and must be boolean",
      );
    }
  }

  if (action === "shopping_item_add") {
    if (typeof params.name !== "string") {
      throw new Error("shopping_item_add: name is required");
    }
  }

  if (action === "query_card_transactions") {
    if (typeof params.cardName !== "string") {
      throw new Error("query_card_transactions: cardName is required");
    }
  }
}

export function parseActionParams(
  action: string,
  rawParams: Record<string, unknown>,
): Record<string, unknown> {
  const params: Record<string, unknown> = { ...rawParams };

  if (
    action === "transaction_add" ||
    action === "transaction_add_credit" ||
    action === "transaction_add_recurring"
  ) {
    if (typeof params.amountCents === "string") {
      const parsed = parseFloat(params.amountCents.replace(",", "."));
      if (!isNaN(parsed)) {
        params.amountCents = Math.round(parsed * 100);
      }
    }
  }

  return params;
}

export { validateActionParams };

export const processMessage = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { message, userId, transcription } = body as {
      message?: string;
      userId: Id<"users">;
      transcription?: string;
    };

    const messageText = transcription || message;

    if (!messageText || !userId) {
      return new Response("Mensagem ou userId ausente", { status: 400 });
    }

    await ctx.runMutation(
      internal.telegramHelpers.addMessageToContextInternal,
      {
        userId,
        role: "user",
        content: messageText,
      },
    );

    const categories = await ctx.runQuery(
      internal.telegramHelpers.getCategoriesInternal,
      { userId },
    );

    const cards = await ctx.runQuery(
      internal.telegramHelpers.getCreditCardsInternal,
      { userId },
    );

    const conversationHistory = await ctx.runQuery(
      internal.telegramHelpers.getUserConversationContextInternal,
      { userId },
    );

    const categoryList = categories.map((c) => c.name).join(", ");
    const cardList = cards.map((c) => c.name).join(", ");

    const historyContext =
      conversationHistory.length > 0
        ? `\n\n### HISTÓRICO RECENTE (últimas ${conversationHistory.length} mensagens):\n${conversationHistory.map((m) => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`).join("\n")}`
        : "";

    let response: Response;
    let lastError: Error | null = null;

    const enrichedPrompt = `${SYSTEM_PROMPT}\n\n### CATEGORIAS CADASTRADAS DO USUÁRIO:\n${categoryList || "Nenhuma categoria cadastrada"}\n\n### CARTÕES CADASTRADOS DO USUÁRIO:\n${cardList || "Nenhum cartão cadastrado"}\n\n_use estes nomes de cartões para buscar o cardName correto_${historyContext}`;

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
                { role: "system", content: enrichedPrompt },
                { role: "user", content: messageText },
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
      console.error("[AI Agent] Resposta vazia da IA");
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
      console.log("[AI Agent] Ação parseada:", parsed.action);
    } catch (e) {
      console.error("[AI Agent] Erro ao parsear JSON:", e);
      parsed = {
        action: "unknown",
        params: {},
        userMessage: "Não consegui entender sua solicitação. Pode reformular?",
      };
    }

    const rawParams = parsed.params;
    const params = parseActionParams(parsed.action, rawParams);

    try {
      validateActionParams(parsed.action, params);
    } catch (validationError) {
      console.error("[AI Agent] Erro de validação:", validationError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Parâmetros inválidos",
          details:
            validationError instanceof Error
              ? validationError.message
              : String(validationError),
        }),
        { status: 400 },
      );
    }

    let actionResult = "";

    if (parsed.action === "shopping_list_create") {
      actionResult = await useCases.executeShoppingListCreate(ctx, userId, {
        name: params.name as string,
        month: params.month as number | undefined,
        year: params.year as number | undefined,
        budgetCents: params.budgetCents as number | undefined,
      });
    } else if (parsed.action === "shopping_item_add") {
      actionResult = await useCases.executeShoppingItemAdd(ctx, userId, {
        listName: params.listName as string | undefined,
        name: params.name as string,
        quantity: params.quantity as number | undefined,
        unit: params.unit as string | undefined,
        unitPriceCents: params.unitPriceCents as number | undefined,
      });
    } else if (parsed.action === "transaction_add") {
      actionResult = await useCases.executeTransactionAdd(ctx, userId, {
        type: params.type as "income" | "expense",
        amountCents: params.amountCents as number,
        name: params.name as string,
        categoryName: params.categoryName as string | undefined,
        description: params.description as string | undefined,
        isPaid: params.isPaid as boolean | undefined,
      });
    } else if (parsed.action === "query_month_summary") {
      actionResult = await useCases.executeQueryMonthSummary(ctx, userId);
    } else if (parsed.action === "query_active_lists") {
      actionResult = await useCases.executeQueryActiveLists(ctx, userId);
    } else if (parsed.action === "query_credit_cards") {
      actionResult = await useCases.executeQueryCreditCards(ctx, userId);
    } else if (parsed.action === "query_categories") {
      actionResult = await useCases.executeQueryCategories(ctx, userId);
    } else if (parsed.action === "transaction_add_credit") {
      actionResult = await useCases.executeTransactionAddCredit(ctx, userId, {
        type: params.type as "income" | "expense",
        amountCents: params.amountCents as number,
        name: params.name as string,
        cardName: params.cardName as string,
        installments: params.installments as number | undefined,
        description: params.description as string | undefined,
        categoryName: params.categoryName as string | undefined,
        competenceMonth: params.competenceMonth as number | undefined,
        competenceYear: params.competenceYear as number | undefined,
        isPaid: params.isPaid as boolean | undefined,
      });
    } else if (parsed.action === "transaction_add_recurring") {
      actionResult = await useCases.executeTransactionAddRecurring(
        ctx,
        userId,
        {
          type: params.type as "income" | "expense",
          amountCents: params.amountCents as number,
          name: params.name as string,
          isSubscription: params.isSubscription as boolean,
          description: params.description as string | undefined,
          categoryName: params.categoryName as string | undefined,
          competenceMonth: params.competenceMonth as number | undefined,
          competenceYear: params.competenceYear as number | undefined,
          isPaid: params.isPaid as boolean | undefined,
        },
      );
    } else if (parsed.action === "query_transactions") {
      actionResult = await useCases.executeQueryTransactions(ctx, userId, {
        month: params.month as number | undefined,
        year: params.year as number | undefined,
        type: params.type as "income" | "expense" | undefined,
        limit: params.limit as number | undefined,
      });
    } else if (parsed.action === "query_card_transactions") {
      actionResult = await useCases.executeQueryCardTransactions(ctx, userId, {
        cardName: params.cardName as string,
        month: params.month as number | undefined,
        year: params.year as number | undefined,
      });
    } else if (parsed.action === "shopping_list_items") {
      actionResult = await useCases.executeQueryShoppingListItems(
        ctx,
        userId,
        params.listName as string | undefined,
      );
    } else if (parsed.action === "query_all_lists") {
      actionResult = await useCases.executeQueryAllLists(ctx, userId);
    } else if (parsed.action === "unknown") {
      actionResult =
        parsed.userMessage ||
        "Não consegui entender sua solicitação. Pode reformular?";
    } else {
      actionResult = `Ação "${parsed.action}" não reconhecida.`;
    }

    const finalMessage = actionResult || parsed.userMessage;

    await ctx.runMutation(
      internal.telegramHelpers.addMessageToContextInternal,
      {
        userId,
        role: "assistant",
        content: finalMessage,
      },
    );

    return new Response(
      JSON.stringify({
        success: true,
        action: parsed.action,
        userMessage: finalMessage,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("[AI Agent] Erro interno:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 },
    );
  }
});
