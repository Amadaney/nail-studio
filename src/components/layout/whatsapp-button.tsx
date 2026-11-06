import { MessageCircle } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { waLink } from "@/lib/utils";

// Floating WhatsApp button (only shown once a WhatsApp number is saved in /admin/settings).
export async function WhatsAppButton({ number }: { number: string | null }) {
  if (!number) return null;
  const { t } = await getT();
  return (
    <a
      href={waLink(number, t("contact.waMessage"))} target="_blank" rel="noopener noreferrer"
      aria-label={t("cta.whatsapp")}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-medium text-white shadow-soft transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <MessageCircle className="h-5 w-5" aria-hidden /> <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
