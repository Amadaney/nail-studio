export const SITE = {
  // Fallback only. The real name/contact live in the `business_settings` table (editable in /admin/settings).
  name: "Nude Atelier",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
