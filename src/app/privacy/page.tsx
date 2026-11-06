import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { getT } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Privacy Policy / Privacidad" };

const COPY = {
  en: {
    h: "Privacy Policy",
    p: [
      "We collect only what we need to manage your appointment: your name, email, phone number and any note you add.",
      "We use this information to confirm, change or cancel your appointment and to contact you about it. We do not sell your data.",
      "We never collect or store payment card information on this website.",
      "Your data is stored with Supabase (hosted in the United States) and is only visible to the studio owner.",
      "You can ask us to access, correct or delete your information at any time (California residents have additional rights under the CCPA/CPRA). Contact us at the email or phone listed on this site.",
      "Reviews you submit are published only after we approve them.",
    ],
  },
  es: {
    h: "Política de privacidad",
    p: [
      "Solo recopilamos lo necesario para gestionar tu cita: tu nombre, correo, teléfono y la nota que quieras agregar.",
      "Usamos esta información para confirmar, cambiar o cancelar tu cita y para contactarte sobre ella. No vendemos tus datos.",
      "Nunca recopilamos ni guardamos datos de tarjetas de pago en este sitio.",
      "Tus datos se almacenan en Supabase (alojado en Estados Unidos) y solo los ve la dueña del estudio.",
      "Puedes pedirnos acceder, corregir o eliminar tu información en cualquier momento (los residentes de California tienen derechos adicionales bajo la CCPA/CPRA). Escríbenos al correo o teléfono de este sitio.",
      "Las opiniones que envíes se publican solo después de que las aprobemos.",
    ],
  },
} as const;

export default async function PrivacyPage() {
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
