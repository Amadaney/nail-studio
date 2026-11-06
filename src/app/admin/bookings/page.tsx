import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireRole } from "@/lib/security/auth";
import { createClient } from "@/lib/supabase/server";
import { updateBookingStatusAction } from "@/actions/admin";
import { fmtDate, fmtTime, formatUSD, waLink } from "@/lib/utils";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmada", cls: "bg-emerald-100 text-emerald-800" },
  completed: { label: "Completada", cls: "bg-sky-100 text-sky-800" },
  cancelled: { label: "Cancelada", cls: "bg-stone-200 text-stone-700" },
  no_show: { label: "No asistió", cls: "bg-red-100 text-red-800" },
};
const PAGE = 20;

type Row = {
  id: string; customer_name: string; customer_email: string; customer_phone: string; booking_date: string; start_time: string;
  total_price: number; status: string; notes: string | null; booking_services: { services: { name: string } | null }[];
};

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").replace(/[^\p{L}\p{N}\s+@.-]/gu, "").slice(0, 40).trim(); // strip chars that could alter the filter
  const supabase = await createClient();

  let query = supabase.from("bookings")
    .select("id,customer_name,customer_email,customer_phone,booking_date,start_time,total_price,status,notes,booking_services(services(name))", { count: "exact" })
    .order("booking_date", { ascending: false }).order("start_time", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (sp.status && STATUS[sp.status]) query = query.eq("status", sp.status);
  if (q) query = query.or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);
  const { data, count } = await query;
  const rows = (data ?? []) as unknown as Row[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.status ? { status: sp.status } : {}), ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <>
      <h1 className="text-3xl sm:text-4xl">Reservas</h1>
      <form className="mt-5 flex flex-col gap-2 sm:flex-row" role="search">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre o teléfono" className="input sm:max-w-xs" />
        <select name="status" defaultValue={sp.status ?? ""} className="input sm:max-w-[200px]">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button className="btn-primary !py-2.5">Filtrar</button>
      </form>

      <div className="mt-5 space-y-3">
        {rows.map((b) => {
          const st = STATUS[b.status]!;
          const names = b.booking_services.map((x) => x.services?.name).filter(Boolean).join(", ");
          const digits = b.customer_phone.replace(/\D/g, "");
          return (
            <article key={b.id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{b.customer_name}</p>
                  <p className="text-sm capitalize text-stone">{fmtDate(b.booking_date, "es")} · {fmtTime(b.start_time)}</p>
                </div>
                <span className={`badge ${st.cls}`}>{st.label}</span>
              </div>
              <p className="mt-2 text-sm">{names} · <strong>{formatUSD(Number(b.total_price))}</strong></p>
              <p className="mt-1 break-all text-sm text-stone">{b.customer_phone} · {b.customer_email}</p>
              {b.notes && <p className="mt-1 text-sm italic text-stone">“{b.notes}”</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <form action={updateBookingStatusAction} className="flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={b.id} />
                  {b.status === "pending" && <button name="status" value="confirmed" className="btn-sm bg-emerald-600 text-white hover:bg-emerald-700">Confirmar</button>}
                  {["pending", "confirmed"].includes(b.status) && <>
                    <button name="status" value="completed" className="btn-sm bg-sky-600 text-white hover:bg-sky-700">Completada</button>
                    <button name="status" value="no_show" className="btn-sm border border-sand hover:bg-sand">No asistió</button>
                    <button name="status" value="cancelled" className="btn-sm border border-red-200 text-red-700 hover:bg-red-50">Cancelar</button>
                  </>}
                  {["cancelled", "no_show"].includes(b.status) && <button name="status" value="pending" className="btn-sm border border-sand hover:bg-sand">Reabrir</button>}
                </form>
                <a href={waLink(digits.length === 10 ? `1${digits}` : digits, `Hola ${b.customer_name.split(" ")[0]}, te escribimos sobre tu cita del ${fmtDate(b.booking_date, "es")} a las ${fmtTime(b.start_time)}.`)}
                  target="_blank" rel="noopener noreferrer" className="btn-sm gap-1 border border-sand hover:bg-sand">
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden /> WhatsApp
                </a>
              </div>
            </article>
          );
        })}
        {rows.length === 0 && <p className="py-10 text-center text-stone">No hay reservas con esos filtros.</p>}
      </div>

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-3 text-sm" aria-label="Paginación">
          {page > 1 && <Link href={qs(page - 1)} className="btn-sm border border-sand">← Anterior</Link>}
          <span className="text-stone">Página {page} de {pages}</span>
          {page < pages && <Link href={qs(page + 1)} className="btn-sm border border-sand">Siguiente →</Link>}
        </nav>
      )}
    </>
  );
}
