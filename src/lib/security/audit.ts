import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Append-only audit trail. Written with the service role (no client can write to audit_logs).
export async function logAudit(userId: string | null, action: string, entity: string, entityId?: string, details?: Record<string, unknown>) {
  try {
    await createAdminClient().from("audit_logs").insert({ user_id: userId, action, entity, entity_id: entityId ?? null, details: details ?? null });
  } catch {
    /* never block the user because logging failed */
  }
}
