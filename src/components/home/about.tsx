import { getT } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { Reveal } from "@/components/ui/reveal";

export async function About() {
  const { t, locale } = await getT();
  const s = await getSettings();
  const custom = locale === "es" ? s.about_es : s.about_en;
  return (
    <section id="about" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-14 text-center sm:px-6">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.25em] text-cocoa">{t("about.eyebrow")}</p>
        <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">{t("about.title")}</h2>
        <p className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-stone">{custom || t("about.text")}</p>
      </Reveal>
    </section>
  );
}
