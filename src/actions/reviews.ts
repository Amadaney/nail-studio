"use server";

import { headers } from "next/headers";
import { reviewSchema } from "@/lib/validations/admin";
import { rateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

// Public reviews are saved as NOT approved. They only show on the site after the owner approves them.
export async function submitReviewAction(input: unknown): Promise<{ ok: boolean }> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`review:${ip}`, 3, 60 * 60_000)) return { ok: false };
  const p = reviewSchema.safeParse(input);
  if (!p.success || p.data.website) return { ok: false };
  try {
    const { error } = await createAdminClient().from("reviews").insert({
      customer_name: p.data.customerName, rating: p.data.rating, comment: p.data.comment || null, approved: false,
    });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}
