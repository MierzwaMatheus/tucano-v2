import { httpRouter } from "convex/server";
import { telegramWebhook } from "./telegramWebhook";
import { processMessage } from "./aiAgent";
import { transcribe } from "./telegramAudio";

const http = httpRouter();

http.route({
  path: "/telegram/webhook",
  method: "POST",
  handler: telegramWebhook,
});

http.route({
  path: "/aiAgent/processMessage",
  method: "POST",
  handler: processMessage,
});

http.route({
  path: "/telegramAudio/transcribe",
  method: "POST",
  handler: transcribe,
});

export default http;
