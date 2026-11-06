import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { requireRole } from "@/lib/security/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { fmtDate, fmtTime, formatUSD } from "@/lib/utils";

export default async function AdminHome() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const s = await getSettings();
  const today = formatInTimeZone(new Date(), s.timezone, "yyyy-MM-dd");

  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
  const [todayN, pendingN, confirmedN, completedN, reviewsN, paid, upcoming] = await Promise.all([
    count(supabase.from("bookings").select("id", { count: "exact", head: true }).eq("booking_date", today).in("status", ["pending", "confirmed"])),
    count(supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending")),
    count(supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed").gte("booking_date", today)),
    count(supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed")),
    count(supabase.from("reviews").select("id", { count: "exact", head: true }).eq("approved", false)),
    supabase.from("bookings").select("total_price").eq("status", "completed"),
    supabase.from("bookings").select("id,customer_name,booking_date,start_time,status").in("status", ["pending", "confirmed"])
      .gte("booking_date", today).order("booking_date").order("start_time").limit(8),
  ]);
  const revenue = ((paid.data ?? []) as { total_price: number }[]).reduce((a, b) => a + Number(b.total_price), 0);

  const cards = [
    { label: "Citas de hoy", value: todayN, href: "/admin/bookings" },
    { label: "Pendientes por confirmar", value: pendingN, href: "/admin/bookings?status=pending" },
    { label: "Confirmadas próximas", value: confirmedN, href: "/admin/bookings?status=confirmed" },
    { label: "Completadas", value: completedN, href: "/admin/bookings?status=completed" },
    { label: "Ingresos (completadas)", value: formatUSD(revenue), href: "/admin/bookings?status=completed" },
    { label: "Reseñas por aprobar", value: reviewsN, href: "/admin/reviews" },
  ];

  return (
    <>
      <h1 className="text-3xl sm:text-4xl">Resumen</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card p-4 transition-shadow hover:shadow-lg sm:p-5">
            <p className="text-xs text-stone">{c.label}</p>
            <p className="mt-1 font-serif text-3xl">{c.value}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-2xl">Próximas citas</h2>
      <div className="card mt-3 divide-y divide-sand">
        {((upcoming.data ?? []) as { id: string; customer_name: string; booking_date: string; start_time: string; status: string }[]).map((b) => (
          <Link key={b.id} href="/admin/bookings" className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-sand/50">
            <span className="font-medium">{b.customer_name}</span>
            <span className="capitalize text-stone">{fmtDate(b.booking_date, "es", "short")} · {fmtTime(b.start_time)}</span>
          </Link>
        ))}
        {(upcoming.data ?? []).length === 0 && <p className="px-4 py-6 text-sm text-stone">No hay citas próximas.</p>}
      </div>
    </>
  );
}
