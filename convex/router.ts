import { httpRouter } from "convex/server";
import { telegramWebhook } from "./telegramWebhook";
import { processMessage } from "./aiAgent";

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

export default http;
