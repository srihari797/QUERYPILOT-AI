const webhookUrl = (process.env.REACT_APP_N8N_WEBHOOK_URL || "").trim();

if (process.env.NODE_ENV === "development") {
  console.log("Webhook URL:", webhookUrl || "(not set — add REACT_APP_N8N_WEBHOOK_URL to frontend/.env)");
}

export const N8N_WEBHOOK_URL = webhookUrl;
export const WEBHOOK_ERROR_MESSAGE =
  "Webhook URL is not configured. Set REACT_APP_N8N_WEBHOOK_URL in frontend/.env and restart the dev server.";
