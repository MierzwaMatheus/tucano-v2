# Telegram Bot Integration — Melhorias Futuras

## Visão Geral

Este documento lista as melhorias identificadas durante o code review da integração Telegram Bot que podem ser aplicadas post-implementação.

---

## Melhorias Identificadas

### 1. Constants Não Extraídas

**Localização:** `convex/aiAgent.ts` e `convex/telegramWebhook.ts`

**Problema:** Magic numbers e valores repetidos sem constants nomeadas.

**Implementação Sugerida:**

```typescript
// convex/constants.ts (novo arquivo)

// AI Retry Configuration
export const MAX_AI_RETRIES = 3;
export const RETRY_BASE_DELAY_MS = 1000;

// Telegram Configuration
export const TELEGRAM_API_BASE_URL = "https://api.telegram.org";
export const TELEGRAM_SEND_MESSAGE_ENDPOINT = "/sendMessage";

// AI Model Configuration
export const DEFAULT_AI_MODEL = "qwen/qwen3.5-9b";
export const DEFAULT_TEMPERATURE = 0.3;
export const DEFAULT_MAX_TOKENS = 500;
```

**Aplicar em:**

```typescript
// aiAgent.ts
// Substituir:
for (let attempt = 0; attempt < 3; attempt++) {
// Por:
for (let attempt = 0; attempt < MAX_AI_RETRIES; attempt++) {
```

---

### 2. Separar Variáveis de Ambiente

**Localização:** `convex/telegramWebhook.ts`

**Problema:** `TELEGRAM_SECRET` tem duplo propósito (secret token + user ID autorizado).

**Implementação Sugerida:**

```typescript
// .env.local (atualizar)
# Webhook security
TELEGRAM_WEBHOOK_SECRET=random_secret_token

# Authorized users (comma-separated for future multi-user support)
AUTHORIZED_TELEGRAM_USER_IDS=1372537938

# telegramWebhook.ts
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const AUTHORIZED_TELEGRAM_USER_IDS = process.env.AUTHORIZED_TELEGRAM_USER_IDS;

// Authorization check
const telegramId = String(update.message.from.id);
if (!AUTHORIZED_TELEGRAM_USER_IDS.includes(telegramId)) {
  await sendTelegramMessage(update.message.chat.id, "⛔ Acesso não autorizado.");
  return new Response("Proibido", { status: 403 });
}
```

---

### 3. Modularização do aiAgent.ts

**Localização:** `convex/aiAgent.ts`

**Problema:** Handler HTTP com múltiplas responsabilidades (260 linhas).

**Implementação Sugerida:**

```typescript
// convex/aiAgent/ (novo diretório)

// convex/aiAgent/types.ts
export interface ParsedAction {
  action: string;
  params: Record<string, unknown>;
  userMessage: string;
}

export interface ActionParams {
  shoppingListCreate?: { name: string; month: number; year: number; budgetCents: number };
  shoppingItemAdd?: { listName?: string; name: string; quantity: number; unit: string; unitPriceCents: number };
  transactionAdd?: { type: "income" | "expense"; amountCents: number; name: string; description?: string };
}

// convex/aiAgent/prompt.ts
export const SYSTEM_PROMPT = `...`;

// convex/aiAgent/parser.ts
export function parseAIResponse(content: string): ParsedAction { ... }

// convex/aiAgent/dispatcher.ts
export async function dispatchAction(ctx, parsed: ParsedAction, userId) { ... }

// convex/aiAgent/index.ts (HTTP action wrapper)
export const processMessage = httpAction(async (ctx, request) => {
  const body = await request.json();
  const { message, userId } = validateRequest(body);
  const response = await callOpenRouter(message);
  const parsed = parseAIResponse(response);
  const result = await dispatchAction(ctx, parsed, userId);
  return formatResponse(result);
});
```

---

### 4. Action Interna para AI Processing

**Localização:** `convex/telegramWebhook.ts`

**Problema:** HTTP call interna ao invés de usar `ctx.runAction`.

**Implementação Sugerida:**

```typescript
// convex/aiAgent.ts
// Adicionar internal action
export const processMessageInternal = internalAction(
  async (ctx, args: { message: string; userId: Id<"users"> }) => {
    // mesma lógica atual, mas sem Request/Response
  },
);

// convex/telegramWebhook.ts
// Substituir fetch por:
const aiResult = await ctx.runAction(internal.aiAgent.processMessageInternal, {
  message: update.message.text,
  userId: user._id,
});
```

---

## Priorização

| Melhoria                | Esforço | Impacto | Prioridade     |
| ----------------------- | ------- | ------- | -------------- |
| Constants não extraídas | Baixo   | Baixo   | 🔵 Pós-MVP     |
| Separar env vars        | Baixo   | Médio   | 🟡 Pós-feature |
| Modularização aiAgent   | Médio   | Médio   | 🔵 Pós-MVP     |
| Action interna AI       | Médio   | Médio   | 🟡 Pós-feature |

---

## Notas

- Todas as melhorias são **opcionais** e **não bloqueiam** a funcionalidade atual
- O código atual funciona corretamente e segue as práticas arquiteturais do projeto
- Estas melhorias podem ser aplicadas conforme a codebase crescer e a necessidade de manutenção aumentar
