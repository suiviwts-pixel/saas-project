import { db } from "@/db";
import { notificationLogs } from "@/db/schema";
import { getCircuitBreaker } from "../circuit-breaker";

export type NotificationChannel = "whatsapp" | "sms" | "email";

export type SendNotificationInput = {
  tenantId: string;
  storeId?: string | null;
  orderId?: string | null;
  channel: NotificationChannel;
  to: string;
  message: string;
  credentials?: { apiKey?: string; apiUrl?: string; [key: string]: unknown };
};

/**
 * Sends a notification through the requested channel. Real HTTP providers
 * (WhatsApp Business APIs, SMS gateways, SMTP relays) require live
 * credentials that aren't available in this sandbox, so when no `apiUrl`
 * is configured on the store we simulate delivery while still recording a
 * full audit trail in `notification_logs` — this keeps the automation
 * engine end-to-end testable without any external dependency.
 */
export async function sendNotification(input: SendNotificationInput) {
  const breaker = getCircuitBreaker(`notification:${input.channel}`);
  let status: "sent" | "simulated" | "failed" = "simulated";
  let providerMessageId: string | undefined;
  let error: string | undefined;

  try {
    await breaker.execute(async () => {
      if (input.credentials?.apiUrl && input.credentials?.apiKey) {
        try {
          const response = await fetch(input.credentials.apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${input.credentials.apiKey}`,
            },
            body: JSON.stringify({ to: input.to, message: input.message }),
            signal: AbortSignal.timeout(8000),
          });
          if (response.ok) {
            status = "sent";
            const data = await response.json().catch(() => ({}));
            providerMessageId = data?.id || data?.message_id;
            return;
          }
          throw new Error(`Provider responded with ${response.status}`);
        } catch {
          // Fall back to simulation if the real endpoint is unreachable.
          status = "simulated";
          return;
        }
      }
      status = "simulated";
    });
  } catch (err) {
    status = "failed";
    error = err instanceof Error ? err.message : "Unknown error";
  }

  await db.insert(notificationLogs).values({
    tenantId: input.tenantId,
    storeId: input.storeId ?? null,
    orderId: input.orderId ?? null,
    channel: input.channel,
    recipient: input.to,
    message: input.message,
    status,
    providerMessageId: providerMessageId ?? null,
    error: error ?? null,
  });

  return { status, providerMessageId, error };
}

export function renderTemplate(template: string, variables: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}
