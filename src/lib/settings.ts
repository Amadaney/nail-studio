import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { BusinessSettings } from "@/types/database";
import { SITE } from "@/lib/config";

const DEFAULTS: BusinessSettings = {
  business_name: SITE.name, address: null, phone: null, email: null, instagram: null, whatsapp: null,
  hero_image_url: null, maps_url: null, about_en: null, about_es: null, timezone: "America/New_York",
  min_notice_hours: 2, max_advance_days: 60, buffer_minutes: 10, slot_interval_min: 15, allow_multi_service: true,
};

// Cached per request. Falls back to defaults if Supabase isn't configured yet.
export const getSettings = cache(async (): Promise<BusinessSettings> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("business_settings").select("*").eq("id", 1).maybeSingle();
    return { ...DEFAULTS, ...(data ?? {}) } as BusinessSettings;
  } catch {
    return DEFAULTS;
  }
});
