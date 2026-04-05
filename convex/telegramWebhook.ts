import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_SECRET = process.env.TELEGRAM_SECRET;

interface TelegramMessage {
  from: {
    id: number;
    first_name?: string;
    username?: string;
  };
  chat: {
    id: number;
  };
  text?: string;
}

interface TelegramUpdate {
  message: TelegramMessage;
}

export const telegramWebhook = httpAction(async (ctx, request) => {
  try {
    const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (secret !== TELEGRAM_SECRET) {
      return new Response("Não autorizado", { status: 401 });
    }

    const body = await request.json();
    const update = body as TelegramUpdate;

    if (!update.message || !update.message.text) {
      return new Response("OK");
    }

    const telegramId = String(update.message.from.id);

    if (telegramId !== TELEGRAM_SECRET) {
      await sendTelegramMessage(
        update.message.chat.id,
        "⛔ Acesso não autorizado.",
      );
      return new Response("Proibido", { status: 403 });
    }

    const user = await ctx.runQuery(
      internal.telegramHelpers.findUserByTelegramIdInternal,
      {
        telegramId,
      },
    );

    if (!user) {
      await sendTelegramMessage(
        update.message.chat.id,
        "⚠️ Usuário não vinculado. Faça login no app primeiro.",
      );
      return new Response("OK");
    }

    const aiResponse = await fetch(
      `${process.env.CONVEX_SITE_URL || ""}/aiAgent/processMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: update.message.text,
          userId: user._id,
        }),
      },
    );

    if (!aiResponse.ok) {
      const aiResult = await aiResponse.json();
      await sendTelegramMessage(
        update.message.chat.id,
        `⚠️ Erro: ${aiResult.error ?? "Serviço indisponível"}`,
      );
      return new Response("OK");
    }

    const aiResult = await aiResponse.json();

    if (aiResult.userMessage) {
      await sendTelegramMessage(update.message.chat.id, aiResult.userMessage);
    }

    return new Response("OK");
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

async function sendTelegramMessage(
  chatId: number,
  text: string,
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}
