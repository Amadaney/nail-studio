import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { getT } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Terms / Términos" };

const COPY = {
  en: {
    h: "Terms & Conditions",
    p: [
      "Bookings are confirmed by the studio. Your appointment is pending until we confirm it.",
      "Please arrive on time. Late arrivals may require a shorter service or rescheduling.",
      "Please let us know at least 24 hours in advance if you need to cancel or reschedule.",
      "Prices shown are in US dollars and may vary depending on the design or extra services requested.",
      "We may decline or reschedule a service if there is a health concern with the nails or skin.",
    ],
  },
  es: {
    h: "Términos y condiciones",
    p: [
      "Las reservas son confirmadas por el estudio. Tu cita queda pendiente hasta que la confirmemos.",
      "Por favor llega a tiempo. Si llegas tarde, quizá debamos acortar el servicio o reprogramar.",
      "Avísanos con al menos 24 horas de anticipación si necesitas cancelar o cambiar tu cita.",
      "Los precios están en dólares estadounidenses y pueden variar según el diseño o servicios extra.",
      "Podemos rechazar o reprogramar un servicio si hay algún problema de salud en las uñas o la piel.",
    ],
  },
} as const;

export default async function TermsPage() {
  const { locale } = await getT();
  const s = await getSettings();
  const c = COPY[locale];
  return (
    <PublicShell>
      <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl">{c.h}</h1>
        <p className="mt-2 text-sm text-stone">{s.business_name}</p>
        <div className="mt-6 space-y-4 text-stone">{c.p.map((x) => <p key={x}>{x}</p>)}</div>
      </article>
    </PublicShell>
  );
}
