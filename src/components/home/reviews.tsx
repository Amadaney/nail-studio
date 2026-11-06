import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { Reveal } from "@/components/ui/reveal";
import { ReviewForm } from "./review-form";
import type { Review } from "@/types/database";

export async function Reviews() {
  const { t } = await getT();
  let reviews: Review[] = [];
  try {
    const supabase = await createClient(); // RLS: only approved reviews are visible to the public
    const { data } = await supabase.from("reviews").select("*").eq("approved", true).order("created_at", { ascending: false }).limit(12);
    reviews = (data as Review[] | null) ?? [];
  } catch { /* not configured yet */ }

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return (
    <section id="reviews" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.25em] text-cocoa">{t("reviews.eyebrow")}</p>
        <h2 className="mt-3 text-3xl sm:text-4xl">{t("reviews.title")}</h2>
        {reviews.length > 0 && (
          <p className="mt-3 flex items-center gap-2 text-sm text-stone">
            <Star className="h-4 w-4 fill-blush text-blush" aria-hidden /> <strong className="text-ink">{avg.toFixed(1)}</strong> {t("reviews.average")} · {reviews.length}
          </p>
        )}
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        {reviews.length === 0 ? (
          <p className="text-stone">{t("reviews.empty")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <figure key={r.id} className="card p-5">
                <div className="flex gap-0.5" aria-label={`${r.rating}/5`}>
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-blush text-blush" : "text-sand"}`} />)}
                </div>
                {r.comment && <blockquote className="mt-3 text-sm text-ink/90">{r.comment}</blockquote>}
                <figcaption className="mt-3 text-xs text-stone">{r.customer_name}</figcaption>
              </figure>
            ))}
          </div>
        )}
        <ReviewForm />
      </div>
    </section>
  );
}
