import { z } from "zod";

const text = (max: number) => z.string().trim().max(max).regex(/^[^<>]*$/, "Caracteres no permitidos");
const optionalText = (max: number) => text(max).optional().default("");

export const serviceSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: text(120).min(2, "El nombre es muy corto"),
  nameEs: optionalText(120),
  description: optionalText(1000),
  descriptionEs: optionalText(1000),
  category: z.enum(["manicure", "pedicure", "combo", "design"]),
  price: z.coerce.number().min(0, "Precio inválido").max(10000),
  duration: z.coerce.number().int().min(5, "Mínimo 5 minutos").max(480),
});

export const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Phoenix",
  "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu",
] as const;

export const settingsSchema = z.object({
  businessName: text(120).min(2, "Nombre del negocio requerido"),
  address: optionalText(200),
  phone: optionalText(30),
  email: z.string().trim().max(254).default("").refine((v) => v === "" || z.string().email().safeParse(v).success, "Correo inválido"),
  instagram: z.string().trim().max(40).default("").transform((v) => v.replace(/^@/, ""))
    .refine((v) => /^[A-Za-z0-9._]{0,30}$/.test(v), "Usuario de Instagram inválido"),
  whatsapp: z.string().trim().max(30).default("").transform((v) => v.replace(/\D/g, ""))
    .transform((v) => (v.length === 10 ? `1${v}` : v))
    .refine((v) => v === "" || /^\d{10,15}$/.test(v), "WhatsApp inválido (incluye el código de país)"),
  mapsUrl: z.string().trim().max(500).default("").refine((v) => v === "" || v.startsWith("https://"), "El enlace de Maps debe empezar con https://"),
  aboutEn: optionalText(1500),
  aboutEs: optionalText(1500),
  timezone: z.enum(TIMEZONES),
  minNotice: z.coerce.number().int().min(0).max(168),
  maxAdvance: z.coerce.number().int().min(1).max(365),
  buffer: z.coerce.number().int().min(0).max(120),
  slotInterval: z.coerce.number().int().refine((v) => [5, 10, 15, 20, 30, 60].includes(v), "Intervalo inválido"),
  allowMulti: z.string().optional(),
});

export const bookingStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
});

export const reviewSchema = z.object({
  customerName: text(80).min(2),
  rating: z.coerce.number().int().min(1).max(5),
  comment: optionalText(600),
  website: z.string().max(0).optional(), // honeypot
});
