"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/security/auth";
import { logAudit } from "@/lib/security/audit";
import { removeImageByUrl, uploadImage, UploadError } from "@/lib/security/upload";
import { bookingStatusSchema, serviceSchema, settingsSchema } from "@/lib/validations/admin";

const done = (path: string, msg: string): never => redirect(`${path}?msg=${encodeURIComponent(msg)}`);
const fail = (path: string, msg: string): never => redirect(`${path}?err=${encodeURIComponent(msg)}`);
const isFile = (v: FormDataEntryValue | null): v is File => v instanceof File && v.size > 0;

// Every action re-checks the admin role on the server. Hiding buttons is never enough.

/* ---------------- Bookings ---------------- */
export async function updateBookingStatusAction(formData: FormData) {
  const { user } = await requireRole(["admin"]);
  const p = bookingStatusSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!p.success) return fail("/admin/bookings", "Datos inválidos");
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").update({ status: p.data.status }).eq("id", p.data.id);
  if (error) return fail("/admin/bookings", "No se pudo actualizar la reserva");
  await logAudit(user.id, "booking_status", "bookings", p.data.id, { status: p.data.status });
  return done("/admin/bookings", "Reserva actualizada");
}

/* ---------------- Services ---------------- */
export async function saveServiceAction(formData: FormData) {
  const { user } = await requireRole(["admin"]);
  const p = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) return fail("/admin/services", p.error.issues[0]?.message ?? "Datos inválidos");
  const d = p.data;
  const supabase = await createClient();

  let imageUrl: string | undefined;
  const file = formData.get("image");
  if (isFile(file)) {
    try { imageUrl = (await uploadImage(supabase, file, "services")).url; }
    catch (e) { return fail("/admin/services", e instanceof UploadError ? e.message : "Error al subir la imagen"); }
  }

  const row = {
    name: d.name, name_es: d.nameEs || null, description: d.description || null, description_es: d.descriptionEs || null,
    category: d.category, price: d.price, duration_minutes: d.duration,
    active: formData.get("active") === "on",
    ...(imageUrl ? { image_url: imageUrl } : {}),
  };

  if (d.id) {
    if (imageUrl) {
      const { data: old } = await supabase.from("services").select("image_url").eq("id", d.id).single();
      await removeImageByUrl(supabase, old?.image_url);
    }
    const { error } = await supabase.from("services").update(row).eq("id", d.id);
    if (error) return fail("/admin/services", "No se pudo guardar el servicio");
    await logAudit(user.id, "update", "services", d.id, { price: d.price });
  } else {
    const { data, error } = await supabase.from("services").insert(row).select("id").single();
    if (error || !data) return fail("/admin/services", "No se pudo crear el servicio");
    // Personal business: link the new service to every active artist so it can be booked right away.
    const { data: pros } = await supabase.from("professionals").select("id").eq("active", true);
    if (pros?.length) await supabase.from("professional_services").insert(pros.map((x: { id: string }) => ({ professional_id: x.id, service_id: data.id })));
    await logAudit(user.id, "create", "services", data.id);
  }
  return done("/admin/services", "Servicio guardado");
}

export async function deleteServiceAction(formData: FormData) {
  const { user } = await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail("/admin/services", "Datos inválidos");
  const supabase = await createClient();
  const { data: svc } = await supabase.from("services").select("image_url").eq("id", id).single();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) {
    // Services used by past bookings can't be deleted (history must stay intact): deactivate instead.
    await supabase.from("services").update({ active: false }).eq("id", id);
    await logAudit(user.id, "deactivate", "services", id);
    return done("/admin/services", "Tenía reservas, así que se desactivó (ya no se muestra en la página)");
  }
  await removeImageByUrl(supabase, svc?.image_url);
  await logAudit(user.id, "delete", "services", id);
  return done("/admin/services", "Servicio eliminado");
}

/* ---------------- Gallery ---------------- */
export async function uploadGalleryAction(formData: FormData) {
  const { user } = await requireRole(["admin"]);
  const files = formData.getAll("images").filter(isFile).slice(0, 6);
  if (files.length === 0) return fail("/admin/gallery", "Selecciona al menos una imagen");
  const supabase = await createClient();
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 200).replace(/[<>]/g, "");
  let count = 0;
  for (const f of files) {
    try {
      const up = await uploadImage(supabase, f, "gallery");
      const { error } = await supabase.from("gallery_images").insert({ image_url: up.url, storage_path: up.path, caption: caption || null, sort_order: Date.now() % 2_000_000_000 });
      if (!error) count++;
    } catch (e) {
      if (e instanceof UploadError && files.length === 1) return fail("/admin/gallery", e.message);
    }
  }
  if (count === 0) return fail("/admin/gallery", "No se pudo subir ninguna imagen (máx. 5 MB, JPG/PNG/WebP)");
  await logAudit(user.id, "upload", "gallery_images", undefined, { count });
  return done("/admin/gallery", `${count} imagen(es) subida(s)`);
}

export async function deleteGalleryImageAction(formData: FormData) {
  const { user } = await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail("/admin/gallery", "Datos inválidos");
  const supabase = await createClient();
  const { data } = await supabase.from("gallery_images").select("image_url").eq("id", id).single();
  const { error } = await supabase.from("gallery_images").delete().eq("id", id);
  if (error) return fail("/admin/gallery", "No se pudo eliminar");
  await removeImageByUrl(supabase, data?.image_url);
  await logAudit(user.id, "delete", "gallery_images", id);
  return done("/admin/gallery", "Imagen eliminada");
}

/* ---------------- Reviews ---------------- */
export async function moderateReviewAction(formData: FormData) {
  const { user } = await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const op = String(formData.get("op") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["approve", "hide", "delete"].includes(op)) return fail("/admin/reviews", "Datos inválidos");
  const supabase = await createClient();
  const { error } = op === "delete"
    ? await supabase.from("reviews").delete().eq("id", id)
    : await supabase.from("reviews").update({ approved: op === "approve" }).eq("id", id);
  if (error) return fail("/admin/reviews", "No se pudo actualizar");
  await logAudit(user.id, op, "reviews", id);
  return done("/admin/reviews", "Listo");
}

/* ---------------- Settings ---------------- */
export async function saveSettingsAction(formData: FormData) {
  const { user } = await requireRole(["admin"]);
  const p = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) return fail("/admin/settings", p.error.issues[0]?.message ?? "Datos inválidos");
  const d = p.data;
  const supabase = await createClient();
  const { error } = await supabase.from("business_settings").update({
    business_name: d.businessName, address: d.address || null, phone: d.phone || null, email: d.email || null,
    instagram: d.instagram || null, whatsapp: d.whatsapp || null, maps_url: d.mapsUrl || null,
    about_en: d.aboutEn || null, about_es: d.aboutEs || null, timezone: d.timezone,
    min_notice_hours: d.minNotice, max_advance_days: d.maxAdvance, buffer_minutes: d.buffer,
    slot_interval_min: d.slotInterval, allow_multi_service: d.allowMulti === "on",
  }).eq("id", 1);
  if (error) return fail("/admin/settings", "No se pudieron guardar los ajustes");
  await logAudit(user.id, "update", "business_settings", "1");
  return done("/admin/settings", "Ajustes guardados");
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
export async function saveHoursAction(formData: FormData) {
  const { user } = await requireRole(["admin"]);
  const rows = [];
  for (let d = 0; d < 7; d++) {
    const open = String(formData.get(`open_${d}`) ?? "");
    const close = String(formData.get(`close_${d}`) ?? "");
    const bs = String(formData.get(`bs_${d}`) ?? "");
    const be = String(formData.get(`be_${d}`) ?? "");
    if (!TIME.test(open) || !TIME.test(close) || close <= open) return fail("/admin/settings", "Revisa las horas de apertura y cierre");
    if ((bs && !be) || (!bs && be) || (bs && be && (!TIME.test(bs) || !TIME.test(be) || bs >= be))) return fail("/admin/settings", "Revisa los descansos");
    rows.push({ day_of_week: d, opening_time: open, closing_time: close, is_open: formData.get(`isOpen_${d}`) === "on", break_start: bs || null, break_end: be || null });
  }
  const supabase = await createClient();
  const { error } = await supabase.from("business_hours").upsert(rows, { onConflict: "day_of_week" });
  if (error) return fail("/admin/settings", "No se pudo guardar el horario");
  await logAudit(user.id, "update", "business_hours");
  return done("/admin/settings", "Horario guardado");
}

export async function uploadHeroAction(formData: FormData) {
  const { user } = await requireRole(["admin"]);
  const file = formData.get("image");
  if (!isFile(file)) return fail("/admin/settings", "Selecciona una imagen");
  const supabase = await createClient();
  try {
    const up = await uploadImage(supabase, file, "site");
    const { data: old } = await supabase.from("business_settings").select("hero_image_url").eq("id", 1).single();
    const { error } = await supabase.from("business_settings").update({ hero_image_url: up.url }).eq("id", 1);
    if (error) return fail("/admin/settings", "No se pudo guardar la imagen");
    await removeImageByUrl(supabase, old?.hero_image_url);
  } catch (e) {
    return fail("/admin/settings", e instanceof UploadError ? e.message : "Error al subir la imagen");
  }
  await logAudit(user.id, "update", "hero_image");
  return done("/admin/settings", "Imagen principal actualizada");
}
