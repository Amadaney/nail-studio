import "server-only";
import { formatInTimeZone } from "date-fns-tz";
import { createAdminClient } from "@/lib/supabase/admin";

const toMin = (t: string) => { const [h = "0", m = "0"] = t.split(":"); return Number(h) * 60 + Number(m); };
const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

type Pro = { id: string; professional_services: { service_id: string }[] };

// Active professionals that offer ALL the selected services.
export async function getCandidateProfessionals(serviceIds: string[]): Promise<string[]> {
  const sb = createAdminClient();
  const { data } = await sb.from("professionals").select("id, professional_services(service_id)").eq("active", true);
  return ((data ?? []) as Pro[])
    .filter((p) => serviceIds.every((id) => p.professional_services.some((ps) => ps.service_id === id)))
    .map((p) => p.id);
}

// Server-side availability. The DB (create_booking + exclusion constraint) re-checks everything at booking time.
export async function getAvailableSlots(date: string, serviceIds: string[]): Promise<string[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || serviceIds.length === 0) return [];
  const sb = createAdminClient();

  const [{ data: s }, { data: svcs }, pros] = await Promise.all([
    sb.from("business_settings").select("*").eq("id", 1).single(),
    sb.from("services").select("duration_minutes").in("id", serviceIds).eq("active", true),
    getCandidateProfessionals(serviceIds),
  ]);
  if (!s || !svcs || svcs.length !== serviceIds.length || pros.length === 0) return [];

  const duration = svcs.reduce((a: number, x: { duration_minutes: number }) => a + x.duration_minutes, 0);
  const tz: string = s.timezone;
  const today = formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
  const diffDays = (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000;
  if (Number.isNaN(diffDays) || diffDays < 0 || diffDays > s.max_advance_days) return [];

  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  const [{ data: hours }, { data: blocked }, { data: bookings }] = await Promise.all([
    sb.from("business_hours").select("*").eq("day_of_week", dow).maybeSingle(),
    sb.from("blocked_dates").select("professional_id,start_time,end_time").eq("date", date),
    sb.from("bookings").select("professional_id,start_time,end_time").eq("booking_date", date)
      .in("status", ["pending", "confirmed"]).in("professional_id", pros),
  ]);
  if (!hours || !hours.is_open) return [];

  // Earliest allowed start, in the studio's local time
  const [nowDate = "", nowTime = "00:00"] = formatInTimeZone(
    new Date(Date.now() + s.min_notice_hours * 3_600_000), tz, "yyyy-MM-dd HH:mm").split(" ");
  const earliest = date > nowDate ? 0 : date === nowDate ? toMin(nowTime) : Infinity;

  const open = toMin(hours.opening_time), close = toMin(hours.closing_time);
  const bs = hours.break_start ? toMin(hours.break_start) : null;
  const be = hours.break_end ? toMin(hours.break_end) : null;
  const buffer: number = s.buffer_minutes;
  const out: string[] = [];

  for (let start = open; start + duration <= close; start += s.slot_interval_min) {
    const end = start + duration;
    if (start < earliest) continue;
    if (bs !== null && be !== null && start < be && end > bs) continue;

    const free = pros.some((pid) => {
      const isBlocked = (blocked ?? []).some((b: { professional_id: string | null; start_time: string | null; end_time: string | null }) =>
        (b.professional_id === null || b.professional_id === pid) &&
        (b.start_time === null || b.end_time === null || (start < toMin(b.end_time) && end > toMin(b.start_time))));
      if (isBlocked) return false;
      return !(bookings ?? []).some((b: { professional_id: string; start_time: string; end_time: string }) =>
        b.professional_id === pid && start < toMin(b.end_time) + buffer && end + buffer > toMin(b.start_time));
    });
    if (free) out.push(toHHMM(start));
  }
  return out;
}
