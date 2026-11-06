import Image from "next/image";
import { requireRole } from "@/lib/security/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { saveHoursAction, saveSettingsAction, uploadHeroAction } from "@/actions/admin";
import { ImageInput } from "@/components/ui/image-input";
import { TIMEZONES } from "@/lib/validations/admin";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
type Hours = { day_of_week: number; opening_time: string; closing_time: string; is_open: boolean; break_start: string | null; break_end: string | null };
const hm = (t: string | null) => (t ? t.slice(0, 5) : "");

export default async function SettingsAdmin() {
  await requireRole(["admin"]);
  const s = await getSettings();
  const supabase = await createClient();
  const { data } = await supabase.from("business_hours").select("*").order("day_of_week");
  const hours = new Map(((data ?? []) as Hours[]).map((h) => [h.day_of_week, h]));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl">Ajustes</h1>

      <section className="card p-5 sm:p-6">
        <h2 className="text-2xl">Imagen principal de la página</h2>
        {s.hero_image_url && <Image src={s.hero_image_url} alt="" width={240} height={160} className="mt-3 h-32 w-48 rounded-xl object-cover" />}
        <form action={uploadHeroAction} className="mt-3 space-y-3">
          <ImageInput name="image" required />
          <button className="btn-primary">{s.hero_image_url ? "Reemplazar imagen" : "Subir imagen"}</button>
        </form>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-2xl">Datos del negocio</h2>
        <form action={saveSettingsAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="businessName">Nombre del negocio</label><input id="businessName" name="businessName" required defaultValue={s.business_name} className="input" /></div>
          <div><label className="label" htmlFor="phone">Teléfono</label><input id="phone" name="phone" type="tel" defaultValue={s.phone ?? ""} className="input" /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="address">Dirección</label><input id="address" name="address" defaultValue={s.address ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="whatsapp">WhatsApp (con código de país)</label><input id="whatsapp" name="whatsapp" inputMode="tel" placeholder="13055551234" defaultValue={s.whatsapp ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="instagram">Instagram (sin @)</label><input id="instagram" name="instagram" defaultValue={s.instagram ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="email">Correo de contacto</label><input id="email" name="email" type="email" defaultValue={s.email ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="mapsUrl">Enlace de Google Maps</label><input id="mapsUrl" name="mapsUrl" placeholder="https://maps.google.com/..." defaultValue={s.maps_url ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="aboutEn">Sobre el estudio (inglés)</label><textarea id="aboutEn" name="aboutEn" rows={4} defaultValue={s.about_en ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="aboutEs">Sobre el estudio (español)</label><textarea id="aboutEs" name="aboutEs" rows={4} defaultValue={s.about_es ?? ""} className="input" /></div>

          <div><label className="label" htmlFor="timezone">Zona horaria</label>
            <select id="timezone" name="timezone" defaultValue={s.timezone} className="input">{TIMEZONES.map((z) => <option key={z}>{z}</option>)}</select></div>
          <div><label className="label" htmlFor="slotInterval">Intervalo entre horarios (min)</label>
            <select id="slotInterval" name="slotInterval" defaultValue={s.slot_interval_min} className="input">{[10, 15, 20, 30, 60].map((n) => <option key={n}>{n}</option>)}</select></div>
          <div><label className="label" htmlFor="minNotice">Anticipación mínima (horas)</label><input id="minNotice" name="minNotice" type="number" min="0" max="168" defaultValue={s.min_notice_hours} className="input" /></div>
          <div><label className="label" htmlFor="maxAdvance">Reservas hasta (días adelante)</label><input id="maxAdvance" name="maxAdvance" type="number" min="1" max="365" defaultValue={s.max_advance_days} className="input" /></div>
          <div><label className="label" htmlFor="buffer">Descanso entre citas (min)</label><input id="buffer" name="buffer" type="number" min="0" max="120" defaultValue={s.buffer_minutes} className="input" /></div>
          <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" name="allowMulti" defaultChecked={s.allow_multi_service} className="h-4 w-4 accent-[#C9A99B]" /> Permitir varios servicios en una cita</label>
          <div className="sm:col-span-2"><button className="btn-primary">Guardar datos</button></div>
        </form>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-2xl">Horario de atención</h2>
        <p className="mt-1 text-sm text-stone">Marca los días que abres. El descanso (almuerzo) es opcional.</p>
        <form action={saveHoursAction} className="mt-4 space-y-3">
          {DAYS.map((name, d) => {
            const h = hours.get(d);
            return (
              <div key={d} className="grid items-center gap-2 rounded-lg border border-sand p-3 sm:grid-cols-[130px_1fr]">
                <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name={`isOpen_${d}`} defaultChecked={h?.is_open ?? false} className="h-4 w-4 accent-[#C9A99B]" />{name}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div><span className="label">Abre</span><input type="time" name={`open_${d}`} required defaultValue={hm(h?.opening_time ?? "09:00")} className="input" /></div>
                  <div><span className="label">Cierra</span><input type="time" name={`close_${d}`} required defaultValue={hm(h?.closing_time ?? "18:00")} className="input" /></div>
                  <div><span className="label">Descanso desde</span><input type="time" name={`bs_${d}`} defaultValue={hm(h?.break_start ?? null)} className="input" /></div>
                  <div><span className="label">Hasta</span><input type="time" name={`be_${d}`} defaultValue={hm(h?.break_end ?? null)} className="input" /></div>
                </div>
              </div>
            );
          })}
          <button className="btn-primary">Guardar horario</button>
        </form>
      </section>
    </div>
  );
}
