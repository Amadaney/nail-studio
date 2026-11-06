"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { bookingSchema } from "@/lib/validations/booking";
import { rateLimit } from "@/lib/security/rate-limit";
import { generateToken } from "@/lib/security/tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots, getCandidateProfessionals } from "@/services/availability";

export type BookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

// Maps internal DB exceptions to safe messages (never leak PostgreSQL text to the user).
const MESSAGES: Record<string, string> = {
  slot_unavailable: "That time was just taken. Please choose another slot. / Ese horario ya fue tomado, elige otro.",
  outside_hours: "That time is outside our business hours. / Ese horario está fuera de nuestro horario.",
  during_break: "That time falls during a break. / Ese horario cae en un descanso.",
  blocked: "We're not available then. / No estamos disponibles en ese horario.",
  too_soon: "Please book a little further in advance. / Reserva con un poco más de anticipación.",
  too_far: "That date is too far ahead. / Esa fecha está muy lejos.",
  invalid_services: "A selected service is not available. / Un servicio seleccionado no está disponible.",
  invalid_professional: "No artist available for those services. / No hay profesional disponible para esos servicios.",
  multi_service_disabled: "Please select a single service. / Selecciona un solo servicio.",
};

async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function getSlotsAction(date: string, serviceIds: string[]): Promise<string[]> {
  const parsed = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), ids: z.array(z.string().uuid()).min(1).max(5) })
    .safeParse({ date, ids: serviceIds });
  if (!parsed.success) return [];
  if (!rateLimit(`slots:${await clientIp()}`, 60, 10 * 60_000)) return [];
  try {
    return await getAvailableSlots(parsed.data.date, parsed.data.ids);
  } catch {
    return [];
  }
}

export async function createBookingAction(input: unknown): Promise<BookingResult> {
  if (!rateLimit(`booking:${await clientIp()}`, 5, 10 * 60_000)) {
    return { ok: false, error: "Too many attempts. Try again in a few minutes. / Demasiados intentos, espera unos minutos." };
  }

  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields. / Revisa los campos marcados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  if (d.website) return { ok: false, error: "Request rejected." }; // honeypot

  try {
    const candidates = d.professionalId ? [d.professionalId] : await getCandidateProfessionals(d.serviceIds);
    if (candidates.length === 0) return { ok: false, error: MESSAGES.invalid_professional! };

    const supabase = createAdminClient();
    let lastError = "slot_unavailable";
    for (const professionalId of candidates) {
      const { token, hash } = generateToken();
      const { data, error } = await supabase.rpc("create_booking", {
        p_name: d.customerName, p_email: d.customerEmail, p_phone: d.customerPhone,
        p_professional_id: professionalId, p_service_ids: d.serviceIds,
        p_date: d.date, p_start: d.startTime, p_notes: d.notes || null, p_token_hash: hash,
      });
      if (!error) {
        void token; // TODO (email module): send confirmation with a cancellation link containing `token`.
        return { ok: true, bookingId: data as string };
      }
      lastError = error.message;
      if (!error.message.includes("slot_unavailable")) break; // try the next artist only when this one is busy
    }
    const key = Object.keys(MESSAGES).find((k) => lastError.includes(k));
    return { ok: false, error: key ? MESSAGES[key]! : "We couldn't complete your booking. Please try again. / No pudimos completar tu reserva." };
  } catch {
    return { ok: false, error: "We couldn't complete your booking. Please try again. / No pudimos completar tu reserva." };
  }
}
