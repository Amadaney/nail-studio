import Image from "next/image";
import Link from "next/link";
import { requireRole } from "@/lib/security/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteServiceAction, saveServiceAction } from "@/actions/admin";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ImageInput } from "@/components/ui/image-input";
import { formatUSD } from "@/lib/utils";
import type { Service } from "@/types/database";

const CATS = { manicure: "Manicure", pedicure: "Pedicure", combo: "Combo", design: "Diseño" } as const;

export default async function ServicesAdmin({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireRole(["admin"]);
  const { edit } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("services").select("*").order("sort_order").order("created_at");
  const services = (data ?? []) as Service[];
  const current = edit ? services.find((s) => s.id === edit) : undefined;

  return (
    <>
      <h1 className="text-3xl sm:text-4xl">Servicios</h1>

      <section className="card mt-6 p-5 sm:p-6" aria-labelledby="form-title">
        <h2 id="form-title" className="text-2xl">{current ? `Editar: ${current.name}` : "Nuevo servicio"}</h2>
        <form key={current?.id ?? "new"} action={saveServiceAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={current?.id ?? ""} />
          <div><label className="label" htmlFor="name">Nombre (inglés)</label><input id="name" name="name" required defaultValue={current?.name} className="input" /></div>
          <div><label className="label" htmlFor="nameEs">Nombre (español)</label><input id="nameEs" name="nameEs" defaultValue={current?.name_es ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="description">Descripción (inglés)</label><textarea id="description" name="description" rows={2} defaultValue={current?.description ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="descriptionEs">Descripción (español)</label><textarea id="descriptionEs" name="descriptionEs" rows={2} defaultValue={current?.description_es ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="category">Categoría</label>
            <select id="category" name="category" defaultValue={current?.category ?? "manicure"} className="input">
              {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="price">Precio (USD)</label><input id="price" name="price" type="number" step="0.01" min="0" required defaultValue={current?.price} className="input" /></div>
            <div><label className="label" htmlFor="duration">Duración (min)</label><input id="duration" name="duration" type="number" min="5" step="5" required defaultValue={current?.duration_minutes ?? 60} className="input" /></div>
          </div>
          <div className="sm:col-span-2">
            <label className="label">{current?.image_url ? "Reemplazar imagen" : "Imagen (opcional)"}</label>
            {current?.image_url && <Image src={current.image_url} alt="" width={96} height={64} className="mb-2 h-16 w-24 rounded-lg object-cover" />}
            <ImageInput name="image" />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="active" defaultChecked={current ? current.active : true} className="h-4 w-4 accent-[#C9A99B]" /> Visible en la página
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button className="btn-primary">{current ? "Guardar cambios" : "Crear servicio"}</button>
            {current && <Link href="/admin/services" className="btn-outline">Cancelar</Link>}
          </div>
        </form>
      </section>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {services.map((s) => (
          <article key={s.id} className="card flex gap-3 p-4">
            {s.image_url
              ? <Image src={s.image_url} alt="" width={80} height={80} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
              : <div className="h-20 w-20 shrink-0 rounded-lg bg-sand" aria-hidden />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{s.name} {!s.active && <span className="badge bg-stone-200 text-stone-700">Oculto</span>}</p>
              <p className="text-sm text-stone">{formatUSD(Number(s.price))} · {s.duration_minutes} min · {CATS[s.category]}</p>
              <div className="mt-2 flex gap-2">
                <Link href={`/admin/services?edit=${s.id}#form-title`} className="btn-sm border border-sand hover:bg-sand">Editar</Link>
                <form action={deleteServiceAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <ConfirmButton message={`¿Eliminar "${s.name}"?`} className="btn-sm border border-red-200 text-red-700 hover:bg-red-50">Eliminar</ConfirmButton>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
