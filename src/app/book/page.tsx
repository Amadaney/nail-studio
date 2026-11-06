import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { BookingForm, type BookableService } from "@/components/booking/booking-form";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n/server";
import type { Service } from "@/types/database";

export const metadata: Metadata = { title: "Book / Reservar" };

export default async function BookPage({ searchParams }: { searchParams: Promise<{ service?: string | string[] }> }) {
  const sp = await searchParams;
  const { t, locale } = await getT();
  const settings = await getSettings();
  let services: BookableService[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("services").select("*").eq("active", true).order("sort_order").order("created_at");
    services = ((data as Service[] | null) ?? []).map((s) => ({
      id: s.id, price: Number(s.price), duration: s.duration_minutes,
      name: locale === "es" && s.name_es ? s.name_es : s.name,
      description: locale === "es" && s.description_es ? s.description_es : s.description,
    }));
  } catch { /* not configured yet */ }

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl">{t("book.title")}</h1>
        <p className="mb-8 mt-3 text-stone">{t("book.subtitle")}</p>
        {services.length === 0 ? <p className="text-stone">{t("services.empty")}</p> : (
          <BookingForm services={services} allowMulti={settings.allow_multi_service} maxDays={settings.max_advance_days}
            whatsapp={settings.whatsapp} preselect={typeof sp.service === "string" ? sp.service : undefined} />
        )}
      </div>
    </PublicShell>
  );
}
