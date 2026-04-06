import { httpAction } from "./_generated/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const transcribe = httpAction(async (_, request) => {
  try {
    const body = await request.json();
    const { audioBase64, format } = body as {
      audioBase64: string;
      format: string;
    };

    if (!audioBase64 || !format) {
      return new Response(
        JSON.stringify({ error: "audioBase64 and format are required" }),
        { status: 400 },
      );
    }

    const audioBlob = base64ToBlob(audioBase64, `audio/${format}`);
    const formData = new FormData();
    formData.append("model", "gpt-4o-mini-transcribe");
    formData.append("file", audioBlob, `audio.${format}`);
    formData.append("response_format", "json");
    formData.append("language", "pt");

    console.log("[Telegram Audio] Iniciando transcrição com OpenAI");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[Telegram Audio] Erro na transcrição:",
        response.status,
        errorText,
      );
      return new Response(
        JSON.stringify({
          error: "Transcription failed",
          details: errorText,
        }),
        { status: response.status },
      );
    }

    const data = await response.json();
    const transcription = data.text;

    if (!transcription) {
      console.error("[Telegram Audio] Transcrição vazia");
      return new Response(
        JSON.stringify({ error: "No transcription received" }),
        { status: 500 },
      );
    }

    console.log("[Telegram Audio] Transcrição concluída:", transcription);
    return new Response(JSON.stringify({ transcription }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Telegram Audio] Erro interno:", error);
    return new Response(
      JSON.stringify({
        error: "Internal error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 },
    );
  }
});

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
