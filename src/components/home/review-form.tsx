"use client";
import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { submitReviewAction } from "@/actions/reviews";
import { useT } from "@/lib/i18n/client";

export function ReviewForm() {
  const { t } = useT();
  const [rating, setRating] = useState(5);
  const [pending, start] = useTransition();

  return (
    <form
      className="card space-y-4 p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const r = await submitReviewAction({
            customerName: fd.get("name"), rating, comment: fd.get("comment"), website: fd.get("website"),
          });
          if (r.ok) { toast.success(t("reviews.thanks")); form.reset(); setRating(5); } else toast.error(t("reviews.error"));
        });
      }}
    >
      <h3 className="text-2xl">{t("reviews.leave")}</h3>
      <div>
        <label htmlFor="r-name" className="label">{t("reviews.name")}</label>
        <input id="r-name" name="name" required minLength={2} maxLength={80} className="input" autoComplete="given-name" />
      </div>
      <div>
        <span className="label">{t("reviews.rating")}</span>
        <div className="flex gap-1" role="radiogroup" aria-label={t("reviews.rating")}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n}`} onClick={() => setRating(n)} className="rounded p-1">
              <Star className={`h-7 w-7 ${n <= rating ? "fill-blush text-blush" : "text-sand"}`} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="r-comment" className="label">{t("reviews.comment")}</label>
        <textarea id="r-comment" name="comment" rows={3} maxLength={600} className="input" />
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px]" />
      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">{t("reviews.send")}</button>
    </form>
  );
}
