import { z } from "zod";

// Accepts "(305) 555-1234", "305-555-1234", "+1 305 555 1234" -> "+13055551234"
export const usPhone = z
  .string().trim().max(25)
  .transform((v) => v.replace(/[^\d+]/g, ""))
  .transform((v) => (v.startsWith("+") ? v : v.length === 10 ? `+1${v}` : v.length === 11 && v.startsWith("1") ? `+${v}` : v))
  .refine((v) => /^\+1[2-9]\d{9}$/.test(v), "Enter a valid US phone number");

const plain = (max: number) => z.string().trim().min(2).max(max).regex(/^[^<>]*$/, "Invalid characters");

export const bookingSchema = z.object({
  customerName: plain(120),
  customerEmail: z.string().trim().toLowerCase().email().max(254),
  customerPhone: usPhone,
  professionalId: z.string().uuid().optional(), // omitted = automatic assignment
  serviceIds: z.array(z.string().uuid()).min(1).max(5),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time"),
  notes: z.string().trim().max(500).regex(/^[^<>]*$/, "Invalid characters").optional().or(z.literal("")),
  consent: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
  website: z.string().max(0).optional(), // honeypot
});
export type BookingInput = z.infer<typeof bookingSchema>;
