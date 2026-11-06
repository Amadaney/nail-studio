export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface Service {
  id: string;
  name: string;
  name_es: string | null;
  description: string | null;
  description_es: string | null;
  category: "manicure" | "pedicure" | "combo" | "design";
  price: number;
  duration_minutes: number;
  image_url: string | null;
  active: boolean;
  sort_order: number;
}

export interface BusinessSettings {
  business_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  whatsapp: string | null;
  hero_image_url: string | null;
  maps_url: string | null;
  about_en: string | null;
  about_es: string | null;
  timezone: string;
  min_notice_hours: number;
  max_advance_days: number;
  buffer_minutes: number;
  slot_interval_min: number;
  allow_multi_service: boolean;
}

export interface GalleryImage { id: string; image_url: string; storage_path: string | null; caption: string | null; }
export interface Review { id: string; customer_name: string; rating: number; comment: string | null; approved: boolean; created_at: string; }
