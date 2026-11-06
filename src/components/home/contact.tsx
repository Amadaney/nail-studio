import Link from "next/link";
import { Clock, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { fmtTime, waLink } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";

type Hours = { day_of_week: number; opening_time: string; closing_time: string; is_open: boolean };

export async function Contact() {
  const { t, locale } = await getT();
  const s = await getSettings();
  let hours: Hours[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("business_hours").select("day_of_week,opening_time,closing_time,is_open").order("day_of_week");
    hours = (data as Hours[] | null) ?? [];
  } catch { /* not configured yet */ }

  // Monday first
  const ordered = [...hours].sort((a, b) => ((a.day_of_week + 6) % 7) - ((b.day_of_week + 6) % 7));
  const dayName = (d: number) => new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + d)));

  return (
    <section id="contact" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8">
      <div className="card grid gap-8 bg-gradient-to-br from-white/80 to-sand/60 p-6 sm:p-8 lg:grid-cols-2">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.25em] text-cocoa">{t("contact.eyebrow")}</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">{t("contact.title")}</h2>
          <ul className="mt-6 space-y-4 text-sm">
            {s.address && (
              <li className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cocoa" aria-hidden />
                <span>{s.address}{s.maps_url && <> · <a href={s.maps_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{t("contact.maps")}</a></>}</span></li>
            )}
            {s.phone && (
              <li className="flex gap-3"><Phone className="h-5 w-5 shrink-0 text-cocoa" aria-hidden />
                <a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`}>{s.phone}</a></li>
            )}
            {s.instagram && (
              <li className="flex gap-3"><Instagram className="h-5 w-5 shrink-0 text-cocoa" aria-hidden />
                <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener noreferrer">@{s.instagram}</a></li>
            )}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/book" className="btn-primary">{t("cta.book")}</Link>
            {s.whatsapp && (
              <a href={waLink(s.whatsapp, t("contact.waMessage"))} target="_blank" rel="noopener noreferrer" className="btn-outline gap-2">
                <MessageCircle className="h-4 w-4" aria-hidden /> {t("cta.whatsapp")}
              </a>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h3 className="flex items-center gap-2 text-2xl"><Clock className="h-5 w-5 text-cocoa" aria-hidden /> {t("contact.hours")}</h3>
          <dl className="mt-4 divide-y divide-sand text-sm">
            {ordered.map((h) => (
              <div key={h.day_of_week} className="flex justify-between gap-4 py-2.5">
                <dt className="capitalize">{dayName(h.day_of_week)}</dt>
                <dd className="text-stone">{h.is_open ? `${fmtTime(h.opening_time)} – ${fmtTime(h.closing_time)}` : t("contact.closed")}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
