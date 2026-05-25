import { N8N_WEBHOOK_URL, WEBHOOK_ERROR_MESSAGE } from "../config/config";

export const callQueryPilotWebhook = async (payload, timeoutMs = 25000) => {
  if (!N8N_WEBHOOK_URL) {
    throw new Error(WEBHOOK_ERROR_MESSAGE);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      text,
      data: text,
    };
  } finally {
    clearTimeout(timer);
  }
};
