import { Star } from "lucide-react";
import { requireRole } from "@/lib/security/auth";
import { createClient } from "@/lib/supabase/server";
import { moderateReviewAction } from "@/actions/admin";
import { ConfirmButton } from "@/components/ui/confirm-button";
import type { Review } from "@/types/database";

export default async function ReviewsAdmin() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select("*").order("approved").order("created_at", { ascending: false }).limit(100);
  const reviews = (data ?? []) as Review[];

  return (
    <>
      <h1 className="text-3xl sm:text-4xl">Reseñas</h1>
      <p className="mt-2 text-sm text-stone">Lo que envían tus clientas no se publica hasta que lo apruebes.</p>
      <div className="mt-6 space-y-3">
        {reviews.map((r) => (
          <article key={r.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{r.customer_name}</p>
              <span className={`badge ${r.approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{r.approved ? "Publicada" : "Pendiente"}</span>
            </div>
            <div className="mt-1 flex gap-0.5" aria-label={`${r.rating} de 5`}>
              {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-blush text-blush" : "text-sand"}`} />)}
            </div>
            {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
            <form action={moderateReviewAction} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={r.id} />
              {r.approved
                ? <button name="op" value="hide" className="btn-sm border border-sand hover:bg-sand">Ocultar</button>
                : <button name="op" value="approve" className="btn-sm bg-emerald-600 text-white hover:bg-emerald-700">Aprobar</button>}
              <ConfirmButton message="¿Eliminar esta reseña?" name="op" value="delete" className="btn-sm border border-red-200 text-red-700 hover:bg-red-50">
                Eliminar
              </ConfirmButton>
            </form>
          </article>
        ))}
        {reviews.length === 0 && <p className="py-8 text-center text-stone">Todavía no hay reseñas.</p>}
      </div>
    </>
  );
}
