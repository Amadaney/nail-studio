import Link from "next/link";
import Image from "next/image";
import { Clock, Footprints, Hand, Layers, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { Reveal } from "@/components/ui/reveal";
import { formatUSD } from "@/lib/utils";
import type { Service } from "@/types/database";

const ICONS = { manicure: Hand, pedicure: Footprints, combo: Layers, design: Sparkles } as const;

export async function Services() {
  const { t, locale } = await getT();
  let services: Service[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("services").select("*").eq("active", true).order("sort_order").order("created_at");
    services = (data as Service[] | null) ?? [];
  } catch { /* not configured yet */ }

  return (
    <section id="services" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.25em] text-cocoa">{t("services.eyebrow")}</p>
        <h2 className="mt-3 max-w-xl text-3xl sm:text-4xl">{t("services.title")}</h2>
      </Reveal>

      {services.length === 0 ? (
        <p className="mt-8 text-stone">{t("services.empty")}</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const Icon = ICONS[s.category];
            const name = locale === "es" && s.name_es ? s.name_es : s.name;
            const desc = locale === "es" && s.description_es ? s.description_es : s.description;
            return (
              <Reveal key={s.id} delay={Math.min(i, 5) * 0.05}>
                <article className="card flex h-full flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1">
                  {s.image_url && (
                    <div className="relative aspect-[16/10] w-full">
                      <Image src={s.image_url} alt={name} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    {!s.image_url && <span className="grid h-11 w-11 place-items-center rounded-full bg-sand text-cocoa"><Icon className="h-5 w-5" aria-hidden /></span>}
                    <h3 className="mt-3 text-2xl">{name}</h3>
                    {desc && <p className="mt-2 flex-1 text-sm text-stone">{desc}</p>}
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="font-medium">{formatUSD(s.price)}</span>
                      <span className="flex items-center gap-1 text-stone"><Clock className="h-4 w-4" aria-hidden />{s.duration_minutes} {t("services.min")}</span>
                    </div>
                    <Link href={`/book?service=${s.id}`} className="btn-outline mt-4">{t("services.book")}</Link>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}
