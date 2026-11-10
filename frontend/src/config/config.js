const webhookUrl = (
  process.env.REACT_APP_N8N_WEBHOOK_URL ||
  "https://hari8888.app.n8n.cloud/webhook/eaa03846-5945-467d-9538-67699c4d6384"
).trim();

if (process.env.NODE_ENV === "development") {
  console.log("Webhook URL:", webhookUrl || "(not set — add REACT_APP_N8N_WEBHOOK_URL to frontend/.env)");
}

export const N8N_WEBHOOK_URL = webhookUrl;
export const WEBHOOK_ERROR_MESSAGE =
  "Webhook URL is not configured. Set REACT_APP_N8N_WEBHOOK_URL in frontend/.env and restart the dev server.";
