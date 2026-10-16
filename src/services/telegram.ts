import type { Env } from "../types";
import { recordRuntimeEventLimited } from "../runtime-events";

async function recordDeliveryFailure(env: Env, message: string) {
  await recordRuntimeEventLimited(env, "telegram_delivery", "telegram_delivery_failed", message);
}

export async function notify(env: Env, message: string): Promise<boolean> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    await recordDeliveryFailure(env, "Telegram is not configured: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.");
    return false;
  }
  try {
    const response = await fetch(
      "https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: message.slice(0, 4000),
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(7000),
      },
    );
    if (response.ok) return true;
    const detail = (await response.text().catch(async error => { await recordRuntimeEventLimited(env, "telegram_response_body", "telegram_response_read_failed", error); return ""; })).slice(0, 250);
    await recordDeliveryFailure(env, "Telegram HTTP " + response.status + ": " + detail);
    return false;
  } catch (error) {
    await recordDeliveryFailure(env, "Telegram request failed: " + String(error).slice(0, 350));
    return false;
  }
}
