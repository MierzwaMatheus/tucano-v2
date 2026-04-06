import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_SECRET = process.env.TELEGRAM_SECRET;

interface TelegramVoice {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

interface TelegramAudio {
  file_id: string;
  file_unique_id: string;
  duration?: number;
  performer?: string;
  title?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

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
  voice?: TelegramVoice;
  audio?: TelegramAudio;
}

interface TelegramUpdate {
  message: TelegramMessage;
}

export const telegramWebhook = httpAction(async (ctx, request) => {
  try {
    const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");

    if (secret !== TELEGRAM_SECRET) {
      console.log("[Telegram Webhook] Token secreto inválido");
      return new Response("Não autorizado", { status: 401 });
    }

    const body = await request.json();
    const update = body as TelegramUpdate;

    if (!update.message) {
      return new Response("OK");
    }

    const telegramId = String(update.message.from.id);

    if (telegramId !== TELEGRAM_SECRET) {
      console.log("[Telegram Webhook] Telegram ID não autorizado:", telegramId);
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
      console.log("[Telegram Webhook] Usuário não encontrado");
      await sendTelegramMessage(
        update.message.chat.id,
        "⚠️ Usuário não vinculado. Faça login no app primeiro.",
      );
      return new Response("OK");
    }

    let messageText: string | undefined;
    let audioTranscription: string | undefined;

    if (update.message.voice || update.message.audio) {
      console.log("[Telegram Webhook] Processando mensagem de áudio");
      const audioFile = update.message.voice || update.message.audio;
      if (!audioFile) {
        await sendTelegramMessage(
          update.message.chat.id,
          "⚠️ Erro ao processar áudio.",
        );
        return new Response("OK");
      }

      try {
        const audioBase64 = await downloadTelegramFile(audioFile.file_id);
        const mimeType = audioFile.mime_type || "";
        const format = getAudioFormatFromMimeType(mimeType);

        console.log("[Telegram Webhook] Chamando endpoint de transcrição");
        const transcriptionResponse = await fetch(
          `${process.env.CONVEX_SITE_URL || ""}/telegramAudio/transcribe`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              audioBase64,
              format,
            }),
          },
        );

        if (!transcriptionResponse.ok) {
          const errorText = await transcriptionResponse.text();
          console.error(
            "[Telegram Webhook] Erro na transcrição:",
            transcriptionResponse.status,
            errorText,
          );
          throw new Error(
            `Transcription failed: ${transcriptionResponse.status} - ${errorText}`,
          );
        }

        const transcriptionResult = await transcriptionResponse.json();
        audioTranscription = transcriptionResult.transcription;
        messageText = audioTranscription;
      } catch (error) {
        console.error("[Telegram Webhook] Erro ao processar áudio:", error);
        await sendTelegramMessage(
          update.message.chat.id,
          "⚠️ Erro ao transcrever áudio. Tente novamente ou envie uma mensagem de texto.",
        );
        return new Response("OK");
      }
    } else if (update.message.text) {
      messageText = update.message.text;
    } else {
      return new Response("OK");
    }

    if (!messageText) {
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
          message: messageText,
          userId: user._id,
          transcription: audioTranscription,
        }),
      },
    );

    if (!aiResponse.ok) {
      const aiResult = await aiResponse.json();
      console.error("[Telegram Webhook] Erro na IA:", aiResult);
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

    console.log("[Telegram Webhook] Mensagem processada com sucesso");
    return new Response("OK");
  } catch (error) {
    console.error("[Telegram Webhook] Erro interno:", error);
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

async function downloadTelegramFile(fileId: string): Promise<string> {
  const getFileResponse = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`,
  );

  if (!getFileResponse.ok) {
    throw new Error(`Failed to get file info: ${getFileResponse.status}`);
  }

  const fileData = (await getFileResponse.json()) as {
    ok: boolean;
    result?: { file_path: string };
  };

  if (!fileData.ok || !fileData.result?.file_path) {
    throw new Error("File path not found");
  }

  const filePath = fileData.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

  const downloadResponse = await fetch(downloadUrl);

  if (!downloadResponse.ok) {
    throw new Error(`Failed to download file: ${downloadResponse.status}`);
  }

  const arrayBuffer = await downloadResponse.arrayBuffer();
  const base64 = arrayBufferToBase64(arrayBuffer);
  return base64;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function getAudioFormatFromMimeType(mimeType: string): string {
  const formats: Record<string, string> = {
    "audio/ogg": "ogg",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/flac": "flac",
    "audio/x-flac": "flac",
    "audio/m4a": "m4a",
    "audio/aac": "aac",
    "audio/mp4": "m4a",
  };

  return formats[mimeType.toLowerCase()] || "ogg";
}
